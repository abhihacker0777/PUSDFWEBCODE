const crypto = require("crypto");

const DEFAULT_TEXT_MAX_LENGTH = 200;

function normalizeText(value, maxLength = DEFAULT_TEXT_MAX_LENGTH) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function stripHtmlAndJs(value, maxLength = DEFAULT_TEXT_MAX_LENGTH) {
  return normalizeText(value, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, " ")
    .replace(/javascript\s*:/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeFreeText(value, maxLength = DEFAULT_TEXT_MAX_LENGTH) {
  return stripHtmlAndJs(value, maxLength)
    .replace(/[^a-zA-Z0-9\s.,!?'"()&:/+\-_@#;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizePaperText(value, maxLength = DEFAULT_TEXT_MAX_LENGTH) {
  return sanitizeFreeText(value, maxLength);
}

function safeHttpUrl(value, maxLength = 500) {
  const text = normalizeText(value, maxLength);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function safePaperUrl(value, maxLength = 500) {
  const href = safeHttpUrl(value, maxLength);
  if (!href) return "";
  try {
    const parsed = new URL(href);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "drive.google.com" || hostname === "docs.google.com" ? parsed.href : "";
  } catch {
    return "";
  }
}

function normalizeAuthIdentifier(value) {
  return normalizeText(value, 254).toLowerCase();
}

function normalizeUuid(value) {
  const text = normalizeText(value, 80).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)
    ? text
    : "";
}

function normalizeIp(value) {
  const ip = normalizeText(value, 100)
    .split(",")[0]
    .trim()
    .replace(/^::ffff:/, "");
  if (!ip) return "";
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

function safeCompare(a, b) {
  const left = crypto.createHash("sha256").update(String(a || "")).digest();
  const right = crypto.createHash("sha256").update(String(b || "")).digest();
  return crypto.timingSafeEqual(left, right);
}

module.exports = {
  normalizeText,
  stripHtmlAndJs,
  sanitizeFreeText,
  sanitizePaperText,
  safeHttpUrl,
  safePaperUrl,
  normalizeAuthIdentifier,
  normalizeUuid,
  normalizeIp,
  safeCompare
};
