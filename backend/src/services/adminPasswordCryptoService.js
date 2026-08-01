const crypto = require("crypto");
const {
  PASSWORD_RESET_URL,
  SECRET
} = require("../config/env");

function hashResetToken(token) {
  return crypto.createHmac("sha256", SECRET).update(String(token || "")).digest("hex");
}

function createPasswordResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function buildPasswordResetUrl(token) {
  const resetUrl = new URL(PASSWORD_RESET_URL);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

module.exports = {
  hashResetToken,
  createPasswordResetToken,
  buildPasswordResetUrl
};
