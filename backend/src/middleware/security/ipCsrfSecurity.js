const crypto = require("crypto");
const {
  SECRET,
  FRONTEND_URL,
  isProduction,
  ADMIN_SESSION_MAX_AGE_MS,
  ADMIN_ALLOWED_IPS
} = require("../../config/env");
const {
  normalizeText,
  normalizeIp,
  safeCompare
} = require("../../utils/helpers");

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax"
};
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_MS;

function getRetryAfterSeconds(req, windowMs) {
  const resetTime = req.rateLimit?.resetTime;
  const resetAt = resetTime instanceof Date ? resetTime.getTime() : Number(resetTime);
  const windowEndsAt = Date.now() + windowMs;
  const retryAfterMs = Math.max(1000, (Number.isFinite(resetAt) ? resetAt : windowEndsAt) - Date.now());
  return Math.ceil(retryAfterMs / 1000);
}

function getClientIp(req) {
  // req.ip is trust-proxy aware (see app.set("trust proxy", ...) in
  // appMiddleware.js) and correctly walks X-Forwarded-For from the trusted
  // side, so a client can't get themselves treated as a different IP by
  // simply sending their own X-Forwarded-For header. This must stay the
  // primary source - do not reintroduce raw header parsing above it.
  const trustedIp = normalizeIp(req.ip);
  if (trustedIp) return trustedIp;

  // Last-resort fallback only if Express couldn't resolve anything (should
  // not normally happen once trust proxy is configured for the real
  // deployment topology).
  const candidates = [
    req.headers["cf-connecting-ip"],
    req.headers["x-real-ip"],
    req.socket?.remoteAddress
  ];

  for (const candidate of candidates) {
    const ip = normalizeIp(Array.isArray(candidate) ? candidate[0] : candidate);
    if (ip) return ip;
  }

  return "unknown";
}

function isAdminIpAllowed(req) {
  if (ADMIN_ALLOWED_IPS.length === 0) return true;
  return ADMIN_ALLOWED_IPS.includes(getClientIp(req));
}

function createRequireOwnerAdminIp(toPublicAdminUser) {
  return (req, res, next) => {
    const admin = toPublicAdminUser(req.admin);
    if (!admin.isOwner) return next();
    if (isAdminIpAllowed(req)) return next();
    return res.status(403).json({
      success: false,
      code: "ADMIN_IP_RESTRICTED",
      message: "Main admin access is restricted from this IP."
    });
  };
}

function csrfSignature(value) {
  return crypto.createHmac("sha256", SECRET).update(String(value || "")).digest("base64url");
}

function createCsrfToken() {
  const value = crypto.randomBytes(32).toString("base64url");
  return `${value}.${csrfSignature(value)}`;
}

function verifyCsrfToken(token) {
  const text = normalizeText(token, 200);
  const [value, signature, ...extra] = text.split(".");
  if (!value || !signature || extra.length > 0) return false;
  const expected = csrfSignature(value);
  return safeCompare(signature, expected);
}

function setCsrfCookie(res, token = createCsrfToken()) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    ...cookieOptions,
    httpOnly: false,
    maxAge: CSRF_MAX_AGE_MS
  });
  return token;
}

function isTrustedRequestOrigin(req) {
  const source = req.get("origin") || req.get("referer") || "";
  if (!source) return !isProduction;

  try {
    const sourceOrigin = new URL(source).origin;
    return sourceOrigin === FRONTEND_URL;
  } catch {
    return false;
  }
}

function requireCsrf(req, res, next) {
  if (!isTrustedRequestOrigin(req)) {
    return res.status(403).json({ success: false, code: "BAD_ORIGIN", message: "Request rejected." });
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] || "";
  const headerToken = req.get(CSRF_HEADER_NAME) || "";
  const hasValidHeaderToken = headerToken && verifyCsrfToken(headerToken);
  const cookieMatchesHeader = cookieToken && headerToken && safeCompare(cookieToken, headerToken);

  if (!hasValidHeaderToken || (cookieToken && !cookieMatchesHeader)) {
    return res.status(403).json({ success: false, code: "CSRF_REQUIRED", message: "Security token expired. Refresh and try again." });
  }

  return next();
}

module.exports = {
  cookieOptions,
  CSRF_COOKIE_NAME,
  getRetryAfterSeconds,
  getClientIp,
  isAdminIpAllowed,
  createRequireOwnerAdminIp,
  verifyCsrfToken,
  setCsrfCookie,
  requireCsrf
};
