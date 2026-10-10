import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis credentials are not configured in environment variables.");
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}


export async function getLoginAttempts(key: string): Promise<number> {
  const redis = getRedisClient();
  const val = await redis.get<number>(`lockout:${key}`);
  return Number(val) || 0;
}

export async function recordFailedLogin(
  key: string,
  limit = 5,
  windowSeconds = 900
): Promise<{ count: number; locked: boolean; remaining: number }> {
  const redis = getRedisClient();
  const lockoutKey = `lockout:${key}`;
  const current = await redis.incr(lockoutKey);
  if (current === 1) {
    await redis.expire(lockoutKey, windowSeconds);
  }
  return {
    count: current,
    locked: current >= limit,
    remaining: Math.max(0, limit - current),
  };
}

export async function resetLoginAttempts(key: string): Promise<void> {
  const lockoutKey = `lockout:${key}`;
  const redis = getRedisClient();
  await redis.del(lockoutKey);
}

export async function getLockoutRemainingSeconds(key: string): Promise<number> {
  const redis = getRedisClient();
  const lockoutKey = `lockout:${key}`;
  const ttl = await redis.ttl(lockoutKey);
  return typeof ttl === "number" && ttl > 0 ? ttl : 0;
}
