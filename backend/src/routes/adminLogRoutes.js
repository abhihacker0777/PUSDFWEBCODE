const express = require("express");
const { createAdminLogController } = require("../controllers/adminLogController");
const {
  requireCsrf,
  adminMutationLimiter
} = require("../middleware/securityMiddleware");

function createAdminLogRoutes({
  verifyToken,
  requireOwnerAdminIp,
  requirePermission,
  controllerDependencies
}) {
  const router = express.Router();
  const controller = createAdminLogController(controllerDependencies);

  router.get("/logs", adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("monitor:read"), controller.listLogs);
  router.get("/admin/queries", adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("monitor:read"), controller.listStudentQueries);
  router.post("/logs", requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("papers:update"), controller.saveLog);
  router.delete("/logs/clear", requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("logs:write"), controller.clearLogs);
  router.post("/logs/delete", requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("logs:write"), controller.deleteLogs);

  return router;
}

module.exports = { createAdminLogRoutes };
