const express = require("express");
const { createAdminSettingsController } = require("../controllers/adminSettingsController");
const {
  requireCsrf,
  adminMutationLimiter
} = require("../middleware/securityMiddleware");

function createAdminSettingsRoutes({
  verifyToken,
  requireOwnerAdminIp,
  requirePermission,
  controllerDependencies
}) {
  const router = express.Router();
  const controller = createAdminSettingsController(controllerDependencies);

  router.get(
    "/admin/settings/blocked",
    adminMutationLimiter,
    verifyToken,
    requireOwnerAdminIp,
    requirePermission("assistant:read"),
    controller.listBlockedUsers
  );

  router.post(
    "/admin/settings/block",
    requireCsrf,
    adminMutationLimiter,
    verifyToken,
    requireOwnerAdminIp,
    requirePermission("assistant:block"),
    controller.blockUser
  );

  router.post(
    "/admin/settings/unblock",
    requireCsrf,
    adminMutationLimiter,
    verifyToken,
    requireOwnerAdminIp,
    requirePermission("assistant:block"),
    controller.unblockUser
  );

  router.get(
    "/admin/settings/replies",
    adminMutationLimiter,
    verifyToken,
    requireOwnerAdminIp,
    requirePermission("assistant:read"),
    controller.listReplies
  );

  router.post(
    "/admin/settings/reply",
    requireCsrf,
    adminMutationLimiter,
    verifyToken,
    requireOwnerAdminIp,
    requirePermission("assistant:reply:update"),
    controller.upsertReply
  );

  router.post(
    "/admin/settings/reply/delete",
    requireCsrf,
    adminMutationLimiter,
    verifyToken,
    requireOwnerAdminIp,
    requirePermission("assistant:reply:delete"),
    controller.removeReply
  );

  return router;
}

module.exports = { createAdminSettingsRoutes };
