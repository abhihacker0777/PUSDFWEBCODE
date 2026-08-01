const {
  isProduction,
  CAPTCHA_SECRET,
  CAPTCHA_VERIFY_URL,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_FAILURE_WINDOW_SECONDS,
  ACCOUNT_LOCK_SECONDS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  CAPTCHA_AFTER_FAILED_ATTEMPTS,
  LOGIN_MIN_RESPONSE_MS,
  LOGIN_MAX_PROGRESSIVE_DELAY_MS
} = require("../../config/env");
const {
  normalizeText,
  normalizeAuthIdentifier
} = require("../../utils/helpers");
const {
  authStoreKey,
  authStoreIncr,
  authStoreGet,
  authStoreSet,
  authStoreTtl,
  authStoreDel
} = require("../../services/authStore");
const { getClientIp } = require("./ipCsrfSecurity");

function loginFailureKey(identifier) {
  return authStoreKey("auth:login:failures", normalizeAuthIdentifier(identifier));
}

function loginLockKey(identifier) {
  return authStoreKey("auth:login:locked", normalizeAuthIdentifier(identifier));
}

function isCaptchaConfigured() {
  return Boolean(CAPTCHA_SECRET);
}

async function getLoginAccountState(identifier) {
  const failureKey = loginFailureKey(identifier);
  const lockKey = loginLockKey(identifier);
  const [failureValue, retryAfterSeconds] = await Promise.all([
    authStoreGet(failureKey),
    authStoreTtl(lockKey)
  ]);
  const failures = Math.max(0, Number(failureValue) || 0);
  return {
    failures,
    locked: retryAfterSeconds > 0,
    retryAfterSeconds,
    captchaRequired: isCaptchaConfigured() && failures >= CAPTCHA_AFTER_FAILED_ATTEMPTS
  };
}

async function recordFailedLogin(identifier) {
  const failureKey = loginFailureKey(identifier);
  const lockKey = loginLockKey(identifier);
  const { count } = await authStoreIncr(failureKey, LOGIN_FAILURE_WINDOW_SECONDS);
  const locked = count >= MAX_FAILED_LOGIN_ATTEMPTS;
  if (locked) {
    await authStoreSet(lockKey, "1", ACCOUNT_LOCK_SECONDS);
  }

  return {
    failures: count,
    locked,
    retryAfterSeconds: locked ? ACCOUNT_LOCK_SECONDS : 0,
    captchaRequired: isCaptchaConfigured() && count >= CAPTCHA_AFTER_FAILED_ATTEMPTS
  };
}

async function clearFailedLoginState(identifier) {
  await authStoreDel(loginFailureKey(identifier), loginLockKey(identifier));
}

function getProgressiveDelayMs(failures) {
  if (failures <= 1) return 0;
  return Math.min(LOGIN_MAX_PROGRESSIVE_DELAY_MS, 250 * (2 ** Math.min(failures - 2, 5)));
}

async function equalizeLoginTiming(startedAt, extraDelayMs = 0) {
  const elapsed = Date.now() - startedAt;
  const target = LOGIN_MIN_RESPONSE_MS + extraDelayMs;
  const remaining = Math.max(0, target - elapsed);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

function setRetryAfter(res, retryAfterSeconds) {
  res.set("Retry-After", String(Math.max(1, Math.ceil(retryAfterSeconds || 1))));
}

async function verifyCaptchaToken(captchaToken, req) {
  if (!CAPTCHA_SECRET) return false;
  const token = normalizeText(captchaToken, 2048);
  if (!token) return false;

  const body = new URLSearchParams({
    secret: CAPTCHA_SECRET,
    response: token,
    remoteip: getClientIp(req)
  });

  try {
    const response = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const data = await response.json().catch(() => ({}));
    return response.ok && data.success === true;
  } catch (err) {
    console.error("CAPTCHA verification failed:", err.message);
    return false;
  }
}

async function loginLimiter(req, res, next) {
  try {
    const key = authStoreKey("auth:login:ip", getClientIp(req));
    const { count, ttlSeconds } = await authStoreIncr(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
    if (count > LOGIN_RATE_LIMIT_MAX) {
      setRetryAfter(res, ttlSeconds);
      return res.status(429).json({
        success: false,
        code: "LOGIN_RATE_LIMITED",
        retryAfterSeconds: ttlSeconds,
        message: "Too many login attempts. Please wait before trying again."
      });
    }
    return next();
  } catch (err) {
    console.error("Login rate limiter failed:", err.message);
    if (isProduction) {
      return res.status(503).json({ success: false, message: "Authentication is temporarily unavailable." });
    }
    return next();
  }
}

module.exports = {
  isCaptchaConfigured,
  getLoginAccountState,
  recordFailedLogin,
  clearFailedLoginState,
  getProgressiveDelayMs,
  equalizeLoginTiming,
  setRetryAfter,
  verifyCaptchaToken,
  loginLimiter
};
