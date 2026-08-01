const { toPublicAdminUser } = require("../../services/adminAuthService");
const {
  cookieOptions,
  CSRF_COOKIE_NAME,
  setCsrfCookie,
  verifyCsrfToken
} = require("../../middleware/securityMiddleware");

function csrfToken(req, res) {
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME] || "";
  const csrfTokenValue = verifyCsrfToken(existingToken) ? existingToken : setCsrfCookie(res);
  res.set("Cache-Control", "no-store");
  res.json({ success: true, csrfToken: csrfTokenValue });
}

function me(req, res) {
  res.json({ success: true, user: toPublicAdminUser(req.admin) });
}

function logout(req, res) {
  res.clearCookie("admin_token", cookieOptions);
  res.clearCookie(CSRF_COOKIE_NAME, { ...cookieOptions, httpOnly: false });
  res.json({ success: true });
}

module.exports = {
  csrfToken,
  logout,
  me
};
