const crypto = require("crypto");
const net = require("net");
const tls = require("tls");
const { REDIS_URL } = require("../config/env");

function isRedisUrlConfigured() {
  return Boolean(REDIS_URL);
}

function authStoreKey(prefix, value) {
  const digest = crypto.createHash("sha256").update(String(value || "")).digest("hex");
  return `${prefix}:${digest}`;
}

function encodeRedisCommand(command) {
  const parts = command.map((part) => Buffer.from(String(part)));
  const chunks = [Buffer.from(`*${parts.length}\r\n`)];
  for (const part of parts) {
    chunks.push(Buffer.from(`$${part.length}\r\n`), part, Buffer.from("\r\n"));
  }
  return Buffer.concat(chunks);
}

function parseRedisResponse(buffer, offset = 0) {
  if (offset >= buffer.length) return null;
  const type = String.fromCharCode(buffer[offset]);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd === -1) return null;
  const line = buffer.subarray(offset + 1, lineEnd).toString();
  const nextOffset = lineEnd + 2;

  if (type === "+") return { value: line, offset: nextOffset };
  if (type === ":") return { value: Number(line), offset: nextOffset };
  if (type === "-") throw new Error(`Redis command failed: ${line}`);

  if (type === "$") {
    const length = Number(line);
    if (length === -1) return { value: null, offset: nextOffset };
    const end = nextOffset + length;
    if (buffer.length < end + 2) return null;
    return {
      value: buffer.subarray(nextOffset, end).toString(),
      offset: end + 2
    };
  }

  if (type === "*") {
    const count = Number(line);
    if (count === -1) return { value: null, offset: nextOffset };
    const values = [];
    let cursor = nextOffset;
    for (let i = 0; i < count; i += 1) {
      const parsed = parseRedisResponse(buffer, cursor);
      if (!parsed) return null;
      values.push(parsed.value);
      cursor = parsed.offset;
    }
    return { value: values, offset: cursor };
  }

  throw new Error("Unsupported Redis response.");
}

async function redisUrlPipeline(commands) {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL is required for auth rate limiting and account lockout.");
  }

  const redisUrl = new URL(REDIS_URL);
  const useTls = redisUrl.protocol === "rediss:";
  const port = Number(redisUrl.port || (useTls ? 6380 : 6379));
  const host = redisUrl.hostname;
  const username = decodeURIComponent(redisUrl.username || "");
  const password = decodeURIComponent(redisUrl.password || "");
  const db = redisUrl.pathname && redisUrl.pathname !== "/" ? redisUrl.pathname.slice(1) : "";
  const setupCommands = [];

  if (password) {
    setupCommands.push(username ? ["AUTH", username, password] : ["AUTH", password]);
  }
  if (/^\d+$/.test(db)) {
    setupCommands.push(["SELECT", db]);
  }

  const allCommands = [...setupCommands, ...commands];
  const request = Buffer.concat(allCommands.map(encodeRedisCommand));

  return new Promise((resolve, reject) => {
    const socket = useTls
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });
    let buffer = Buffer.alloc(0);
    let settled = false;

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(value);
    };

    socket.setTimeout(5000);
    if (useTls) socket.once("secureConnect", () => socket.write(request));
    else socket.once("connect", () => socket.write(request));
    socket.on("timeout", () => finish(new Error("Redis connection timed out.")));
    socket.on("error", (err) => finish(err));
    socket.on("data", (chunk) => {
      try {
        buffer = Buffer.concat([buffer, chunk]);
        const results = [];
        let offset = 0;
        while (results.length < allCommands.length) {
          const parsed = parseRedisResponse(buffer, offset);
          if (!parsed) return;
          results.push(parsed.value);
          offset = parsed.offset;
        }
        finish(null, results.slice(setupCommands.length));
      } catch (err) {
        finish(err);
      }
    });
  });
}

async function authStoreIncr(key, ttlSeconds) {
  const [count, , ttl] = await redisUrlPipeline([
    ["INCR", key],
    ["EXPIRE", key, ttlSeconds],
    ["TTL", key]
  ]);
  return {
    count: Number(count) || 0,
    ttlSeconds: Math.max(1, Number(ttl) || ttlSeconds)
  };
}

async function authStoreGet(key) {
  const [value] = await redisUrlPipeline([["GET", key]]);
  return value;
}

async function authStoreSet(key, value, ttlSeconds) {
  await redisUrlPipeline([["SET", key, value, "EX", ttlSeconds]]);
}

async function authStoreTtl(key) {
  const [ttl] = await redisUrlPipeline([["TTL", key]]);
  return Math.max(0, Number(ttl) || 0);
}

async function authStoreDel(...keys) {
  if (keys.length === 0) return;
  await redisUrlPipeline([["DEL", ...keys]]);
}

module.exports = {
  isRedisUrlConfigured,
  authStoreKey,
  authStoreIncr,
  authStoreGet,
  authStoreSet,
  authStoreTtl,
  authStoreDel
};
