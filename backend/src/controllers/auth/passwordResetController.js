const {
  passwordResetBodySchema,
  passwordResetConfirmBodySchema
} = require("../../validators/authValidators");
const {
  buildPasswordResetUrl,
  getResettableAdminUser,
  saveAdminPasswordResetToken,
  sendPasswordResetEmail,
  updateAdminPasswordWithResetToken
} = require("../../services/adminAuthService");
const { equalizeLoginTiming } = require("../../middleware/securityMiddleware");
const {
  PASSWORD_RESET_CONFIRM_ERROR,
  PASSWORD_RESET_RESPONSE
} = require("../../config/env");

async function requestPasswordReset(req, res) {
  const startedAt = Date.now();
  const parsed = passwordResetBodySchema.safeParse(req.body || {});

  if (parsed.success) {
    try {
      const user = await getResettableAdminUser(parsed.data.email);
      if (user) await sendResetEmail(user);
    } catch (err) {
      console.error("Password reset request failed:", err.message);
    }
  }

  await equalizeLoginTiming(startedAt);
  return res.json({ success: true, message: PASSWORD_RESET_RESPONSE });
}

async function sendResetEmail(user) {
  const resetToken = await saveAdminPasswordResetToken(user);
  if (resetToken) {
    await sendPasswordResetEmail(user.email, buildPasswordResetUrl(resetToken));
  }
}

async function confirmPasswordReset(req, res) {
  const startedAt = Date.now();
  const parsed = passwordResetConfirmBodySchema.safeParse(req.body || {});

  if (!parsed.success) {
    await equalizeLoginTiming(startedAt);
    return res.status(400).json({ success: false, message: PASSWORD_RESET_CONFIRM_ERROR });
  }

  try {
    const updated = await updateAdminPasswordWithResetToken(parsed.data.token, parsed.data.password);
    await equalizeLoginTiming(startedAt);
    if (!updated) {
      return res.status(400).json({ success: false, message: PASSWORD_RESET_CONFIRM_ERROR });
    }
    return res.json({ success: true, message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("Password reset confirm failed:", err.message);
    await equalizeLoginTiming(startedAt);
    return res.status(503).json({ success: false, message: "Password reset is temporarily unavailable." });
  }
}

module.exports = {
  confirmPasswordReset,
  requestPasswordReset
};
