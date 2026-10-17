import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

const DEFAULT_POLICIES: Record<string, RateLimitPolicy> = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  reset: { limit: 3, windowMs: 60 * 60 * 1000 },
  assistant: { limit: 20, windowMs: 60 * 1000 },
  papers: { limit: 60, windowMs: 60 * 1000 },
};

// In-memory sliding-window fallback for local development or when Redis is temporarily unconfigured/offline
const memoryStore = new Map<string, number[]>();
let warnedRedisMissing = false;

function checkMemoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = memoryStore.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  memoryStore.set(key, validTimestamps);

  // Prune expired entries if the in-memory map grows large
  if (memoryStore.size > 2000) {
    for (const [k, v] of memoryStore.entries()) {
      const remaining = v.filter((t) => now - t < windowMs);
      if (remaining.length === 0) {
        memoryStore.delete(k);
      } else {
        memoryStore.set(k, remaining);
      }
    }
  }

  return true;
}

const dynamicLimiters = new Map<string, Ratelimit>();

function getRedisLimiter(kind: string, limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${kind}:${limit}:${windowMs}`;
  let limiter = dynamicLimiters.get(cacheKey);
  if (!limiter) {
    const windowSec = Math.max(1, Math.round(windowMs / 1000));
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `pyqp:${kind}`,
    });
    dynamicLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

export function clientIp(req: Request): string {
  const ip =
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    req.headers.get("cf-connecting-ip")?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";

  if (ip === "::1" || ip.endsWith("127.0.0.1")) {
    return "127.0.0.1";
  }
  return ip;
}

export async function allow(
  kind: "login" | "reset" | "assistant" | "papers",
  key: string,
  customLimit?: number,
  customWindowMs?: number
): Promise<boolean> {
  const defaultPolicy = DEFAULT_POLICIES[kind] ?? { limit: 20, windowMs: 60 * 1000 };
  const limit = customLimit && customLimit > 0 ? customLimit : defaultPolicy.limit;
  const windowMs = customWindowMs && customWindowMs > 0 ? customWindowMs : defaultPolicy.windowMs;

  if (redis) {
    try {
      const limiter = getRedisLimiter(kind, limit, windowMs);
      if (limiter) {
        const res = await limiter.limit(key);
        return res.success;
      }
    } catch (e) {
      console.warn(`[RateLimit] Upstash Redis error for '${kind}', falling back to in-memory limiter:`, e);
      return checkMemoryLimit(`${kind}:${key}`, limit, windowMs);
    }
  }

  if (!warnedRedisMissing) {
    warnedRedisMissing = true;
    console.info(`[RateLimit] Upstash Redis not configured. Operating with safe in-memory sliding window rate limiter.`);
  }

  return checkMemoryLimit(`${kind}:${key}`, limit, windowMs);
}
