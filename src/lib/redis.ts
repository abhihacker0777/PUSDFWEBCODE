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

export async function getLoginAttempts(key: string): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const val = await redis.get<number>(`lockout:${key}`);
      return Number(val) || 0;
    } catch {
      // fallback
    }
  }
  const now = Date.now();
  const entry = memoryRateLimits.get(`lockout:${key}`);
  if (!entry || entry.expiresAt <= now) return 0;
  return entry.count;
}

export async function recordFailedLogin(
  key: string,
  limit = 5,
  windowSeconds = 900
): Promise<{ count: number; locked: boolean; remaining: number }> {
  const redis = getRedisClient();
  const lockoutKey = `lockout:${key}`;

  if (redis) {
    try {
      const current = await redis.incr(lockoutKey);
      if (current === 1) {
        await redis.expire(lockoutKey, windowSeconds);
      }
      return {
        count: current,
        locked: current >= limit,
        remaining: Math.max(0, limit - current),
      };
    } catch {
      // fallback
    }
  }

  const now = Date.now();
  const entry = memoryRateLimits.get(lockoutKey);
  if (!entry || entry.expiresAt <= now) {
    memoryRateLimits.set(lockoutKey, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { count: 1, locked: false, remaining: limit - 1 };
  }

  entry.count += 1;
  return {
    count: entry.count,
    locked: entry.count >= limit,
    remaining: Math.max(0, limit - entry.count),
  };
}

export async function resetLoginAttempts(key: string): Promise<void> {
  const lockoutKey = `lockout:${key}`;
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(lockoutKey);
    } catch {
      // fallback
    }
  }
  memoryRateLimits.delete(lockoutKey);
}

export async function getLockoutRemainingSeconds(key: string): Promise<number> {
  const redis = getRedisClient();
  const lockoutKey = `lockout:${key}`;
  if (redis) {
    try {
      const ttl = await redis.ttl(lockoutKey);
      if (typeof ttl === "number" && ttl > 0) return ttl;
    } catch {
      // fallback
    }
  }
  const now = Date.now();
  const entry = memoryRateLimits.get(lockoutKey);
  if (!entry || entry.expiresAt <= now) return 0;
  return Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
}

