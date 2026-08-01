const express = require("express");
const { createAssistantController } = require("../controllers/assistantController");
const {
  publicDataLimiter,
  assistantLimiter
} = require("../middleware/securityMiddleware");

function createAssistantRoutes(dependencies) {
  const router = express.Router();
  const assistantController = createAssistantController(dependencies);

  router.get("/assistant/config", publicDataLimiter, assistantController.config);
  router.post("/assistant/google/verify", assistantLimiter, assistantController.verifyGoogle);
  router.post("/assistant/search", assistantLimiter, assistantController.search);

  return router;
}

module.exports = { createAssistantRoutes };
