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

const mk = (n: number, w: `${number} ${"s" | "m" | "h"}`, p: string) =>
  redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(n, w), prefix: `pyqp:${p}` }) : null;

const limiters = {
  login: mk(10, "15 m", "login"),
  reset: mk(3, "1 h", "reset"),
  assistant: mk(20, "1 m", "assistant"),
  papers: mk(60, "1 m", "papers"),
};

// In-memory fallback if Redis is not configured or throws
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function pruneMemoryBuckets() {
  const now = Date.now();
  for (const [k, v] of memoryBuckets.entries()) {
    if (v.resetAt <= now) memoryBuckets.delete(k);
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  );
}

export async function allow(
  kind: keyof typeof limiters,
  key: string,
  maxInMemory = 20,
  windowMs = 60000
): Promise<boolean> {
  const l = limiters[kind];
  if (l) {
    try {
      const res = await l.limit(key);
      return res.success;
    } catch (e) {
      console.error("Upstash ratelimit error, falling back to memory:", e);
    }
  }

  // Graceful bounded in-memory fallback
  if (memoryBuckets.size > 2000) {
    pruneMemoryBuckets();
  }
  const now = Date.now();
  const bucketKey = `${kind}:${key}`;
  const bucket = memoryBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= maxInMemory;
}
