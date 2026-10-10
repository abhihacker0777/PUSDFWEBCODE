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

export function clientIp(req: Request): string {
  const ip =
    req.headers.get("cf-connecting-ip")?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    req.headers.get("x-client-ip")?.trim() ??
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1";

  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }
  return ip;
}

export async function allow(
  kind: keyof typeof limiters,
  key: string,
  _limit?: number,
  _windowMs?: number
): Promise<boolean> {
  const l = limiters[kind];
  if (!l) {
    console.error(`Rate limiter for '${kind}' is unavailable: Upstash Redis is not configured.`);
    return false;
  }

  try {
    const res = await l.limit(key);
    return res.success;
  } catch (e) {
    console.error(`Upstash ratelimit error for '${kind}':`, e);
    return false;
  }
}
