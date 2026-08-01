const express = require("express");
const { createAdminPaperController } = require("../controllers/adminPaperController");
const {
  requireCsrf,
  adminMutationLimiter
} = require("../middleware/securityMiddleware");

function createAdminPaperRoutes({
  verifyToken,
  requireOwnerAdminIp,
  requirePermission,
  controllerDependencies
}) {
  const router = express.Router();
  const controller = createAdminPaperController(controllerDependencies);

  router.post("/upload", requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("papers:update"), controller.uploadPaper);
  router.delete("/delete", requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("papers:delete"), controller.deletePaper);
  router.get("/admin/papers", adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("papers:read"), controller.listAdminPapers);
  router.post("/sync", requireCsrf, adminMutationLimiter, verifyToken, requireOwnerAdminIp, requirePermission("papers:sync"), controller.syncPapers);

  return router;
}

module.exports = { createAdminPaperRoutes };
