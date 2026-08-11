const {
  PASSWORD_RESET_TOKEN_TTL_SECONDS,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  PASSWORD_RESET_FROM,
  SUPABASE_ADMIN_USERS_TABLE
} = require("../../config/env");
const nodemailer = require("nodemailer");
const {
  hashResetToken,
  createPasswordResetToken
} = require("../adminPasswordCryptoService");
const {
  supabaseRequest,
  postgrestUuidEqFilter
} = require("../supabaseService");
const { updateSupabaseAdminAuthUser } = require("../supabaseAuthService");
const { clearFailedLoginState } = require("../../middleware/securityMiddleware");
const {
  getResettableAdminUser,
  selectAdminAuthRows
} = require("./adminAuthRepository");

async function saveAdminPasswordResetToken(user) {
  const idFilter = postgrestUuidEqFilter("id", user?.id);
  if (!idFilter) return null;

  const token = createPasswordResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_SECONDS * 1000).toISOString();

  await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=minimal",
    body: {
      reset_token_hash: tokenHash,
      reset_token_expires_at: expiresAt,
      reset_requested_at: new Date().toISOString()
    }
  });

  return token;
}

async function findAdminUserByResetToken(token) {
  const tokenHash = hashResetToken(token);
  const params = new URLSearchParams({
    reset_token_hash: `eq.${tokenHash}`,
    limit: "1"
  });

  const rows = await selectAdminAuthRows(params);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function updateAdminPasswordWithResetToken(token, password) {
  const user = await findAdminUserByResetToken(token);
  const expiresAt = user?.reset_token_expires_at ? new Date(user.reset_token_expires_at).getTime() : 0;
  if (!user || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const idFilter = postgrestUuidEqFilter("id", user.id);
  if (!idFilter || !user.auth_user_id) return false;

  await updateSupabaseAdminAuthUser(user.auth_user_id, { password });

  await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=minimal",
    body: {
    reset_token_hash: null,
    reset_token_expires_at: null,
    reset_requested_at: null
    }
  });

  await clearFailedLoginState(user.login_identifier || user.email);
  if (user.email) await clearFailedLoginState(user.email);
  return true;
}

let cachedTransporter = null;

function getSmtpTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
    });
  }
  return cachedTransporter;
}

async function sendPasswordResetEmail(to, resetUrl) {
  const transporter = getSmtpTransporter();
  if (!transporter || !PASSWORD_RESET_FROM) {
    console.warn("Password reset email not sent: set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and PASSWORD_RESET_FROM.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: PASSWORD_RESET_FROM,
      to,
      subject: "Reset your PYQP admin password",
      html: `
        <p>You requested a PYQP admin password reset.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>
      `,
      text: `Reset your PYQP admin password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`
    });
  } catch (err) {
    throw new Error(err.message || "SMTP send failed");
  }

  return true;
}

module.exports = {
  getResettableAdminUser,
  saveAdminPasswordResetToken,
  sendPasswordResetEmail,
  updateAdminPasswordWithResetToken
};