const jwt = require("jsonwebtoken");
const { loginBodySchema } = require("../../validators/authValidators");
const { verifyAdminCredentials } = require("../../services/adminAuthService");
const {
  clearFailedLoginState,
  equalizeLoginTiming,
  getLoginAccountState,
  getProgressiveDelayMs,
  isAdminIpAllowed,
  isCaptchaConfigured,
  recordFailedLogin,
  setRetryAfter,
  verifyCaptchaToken
} = require("../../middleware/securityMiddleware");
const {
  ADMIN_SESSION_ID,
  ADMIN_SESSION_MAX_AGE_MS,
  GENERIC_LOGIN_ERROR,
  SECRET
} = require("../../config/env");
const { cookieOptions } = require("../../middleware/securityMiddleware");

async function login(req, res) {
  const startedAt = Date.now();
  const parsed = loginBodySchema.safeParse(req.body || {});

  if (!parsed.success) {
    await equalizeLoginTiming(startedAt);
    return res.status(401).json({ success: false, message: GENERIC_LOGIN_ERROR });
  }

  const { identifier, password, captchaToken } = parsed.data;

  try {
    const accountState = await getLoginAccountState(identifier);
    if (accountState.locked) {
      setRetryAfter(res, accountState.retryAfterSeconds);
      await equalizeLoginTiming(startedAt, getProgressiveDelayMs(accountState.failures));
      return res.status(429).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        retryAfterSeconds: accountState.retryAfterSeconds,
        captchaRequired: isCaptchaConfigured(),
        message: "Too many failed attempts. Try again later."
      });
    }

    if (accountState.captchaRequired) {
      const captchaOk = await verifyCaptchaToken(captchaToken, req);
      if (!captchaOk) {
        await equalizeLoginTiming(startedAt, getProgressiveDelayMs(accountState.failures));
        return res.status(403).json({
          success: false,
          code: "CAPTCHA_REQUIRED",
          captchaRequired: true,
          message: "CAPTCHA verification required."
        });
      }
    }

    const authenticatedUser = await verifyAdminCredentials(identifier, password);
    if (!authenticatedUser) return handleLoginFailure(identifier, startedAt, res);

    if (authenticatedUser.isOwner && !isAdminIpAllowed(req)) {
      await equalizeLoginTiming(startedAt);
      return res.status(403).json({
        success: false,
        code: "ADMIN_IP_RESTRICTED",
        message: "Main admin access is restricted from this IP."
      });
    }

    await clearLoginFailures(authenticatedUser, identifier);
    await equalizeLoginTiming(startedAt);
    setAdminSessionCookie(res, authenticatedUser);
    return res.json({ success: true, user: authenticatedUser });
  } catch (err) {
    console.error("Login failed:", err.message);
    await equalizeLoginTiming(startedAt);
    return res.status(503).json({ success: false, message: "Authentication is temporarily unavailable." });
  }
}

async function clearLoginFailures(authenticatedUser, identifier) {
  await clearFailedLoginState(identifier);
  if (authenticatedUser.loginIdentifier) await clearFailedLoginState(authenticatedUser.loginIdentifier);
  if (authenticatedUser.email) await clearFailedLoginState(authenticatedUser.email);
}

async function handleLoginFailure(identifier, startedAt, res) {
  const failureState = await recordFailedLogin(identifier);
  await equalizeLoginTiming(startedAt, getProgressiveDelayMs(failureState.failures));

  if (failureState.locked) {
    setRetryAfter(res, failureState.retryAfterSeconds);
    return res.status(429).json({
      success: false,
      code: "ACCOUNT_LOCKED",
      retryAfterSeconds: failureState.retryAfterSeconds,
      captchaRequired: isCaptchaConfigured(),
      message: "Too many failed attempts. Try again later."
    });
  }

  return res.status(401).json({
    success: false,
    message: GENERIC_LOGIN_ERROR,
    captchaRequired: failureState.captchaRequired
  });
}

function setAdminSessionCookie(res, authenticatedUser) {
  const token = jwt.sign({
    user: authenticatedUser.loginIdentifier || authenticatedUser.email,
    userId: authenticatedUser.id,
    email: authenticatedUser.email,
    loginIdentifier: authenticatedUser.loginIdentifier,
    displayName: authenticatedUser.displayName,
    role: authenticatedUser.role,
    owner: authenticatedUser.isOwner,
    sessionId: ADMIN_SESSION_ID
  }, SECRET, { expiresIn: "1d" });

  res.cookie("admin_token", token, {
    ...cookieOptions,
    maxAge: ADMIN_SESSION_MAX_AGE_MS
  });
}

module.exports = { login };
