const express = require("express");
const { createPaperController } = require("../controllers/paperController");
const { publicDataLimiter } = require("../middleware/securityMiddleware");

function createPaperRoutes(dependencies) {
  const router = express.Router();
  const paperController = createPaperController(dependencies);

  router.get("/papers", publicDataLimiter, paperController.listPublicPapers);
  router.get("/paper-options", publicDataLimiter, paperController.listPaperOptions);
  router.get("/papers/search", publicDataLimiter, paperController.searchPapers);

  return router;
}

module.exports = { createPaperRoutes };
