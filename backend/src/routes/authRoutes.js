const express = require("express");
const authController = require("../controllers/authController");
const {
  requireCsrf,
  loginLimiter
} = require("../middleware/securityMiddleware");

function createAuthRoutes({ verifyToken, requireOwnerAdminIp }) {
  const router = express.Router();

  router.get("/csrf-token", authController.csrfToken);
  router.post("/login", requireCsrf, loginLimiter, authController.login);
  router.post("/password-reset", requireCsrf, loginLimiter, authController.requestPasswordReset);
  router.post("/password-reset/confirm", requireCsrf, loginLimiter, authController.confirmPasswordReset);
  router.get("/me", verifyToken, requireOwnerAdminIp, authController.me);
  router.post("/logout", requireCsrf, authController.logout);

  return router;
}

module.exports = { createAuthRoutes };
