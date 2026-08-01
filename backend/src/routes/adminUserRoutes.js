const express = require("express");
const adminUserController = require("../controllers/adminUserController");
const {
  requireCsrf,
  adminMutationLimiter
} = require("../middleware/securityMiddleware");

function createAdminUserRoutes({ verifyToken, requireOwnerAdminIp, requireOwnerAdmin }) {
  const router = express.Router();
  const ownerOnly = [adminMutationLimiter, verifyToken, requireOwnerAdminIp, requireOwnerAdmin];
  const ownerMutation = [requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requireOwnerAdmin];

  router.get("/admin/users", ownerOnly, adminUserController.listAdminUsers);
  router.post("/admin/users", ownerMutation, adminUserController.createAdminUser);
  router.patch("/admin/users", ownerMutation, adminUserController.updateAdminUser);
  router.delete("/admin/users", ownerMutation, adminUserController.deleteAdminUser);

  return router;
}

module.exports = { createAdminUserRoutes };
