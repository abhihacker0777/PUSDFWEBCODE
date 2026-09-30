import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisClient && url && token) {
    try {
      redisClient = new Redis({ url, token });
    } catch {
      redisClient = null;
    }
  }
  return redisClient;
}

// In-memory fallback rate-limiter
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      return {
        success: current <= limit,
        remaining: Math.max(0, limit - current),
      };
    } catch {
      // Fallback to in-memory on redis failure
    }
  }

  // Memory fallback
  const now = Date.now();
  const entry = memoryRateLimits.get(key);
  if (!entry || entry.expiresAt <= now) {
    memoryRateLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1 };
  }

  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
  };
}
