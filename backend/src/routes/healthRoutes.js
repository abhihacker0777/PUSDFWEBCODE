const express = require("express");
const { createHealthController } = require("../controllers/healthController");
const { publicDataLimiter } = require("../middleware/securityMiddleware");

function createHealthRoutes({ controllerDependencies }) {
  const router = express.Router();
  const controller = createHealthController(controllerDependencies);

  // Deliberately unauthenticated (uptime monitors, load balancers) and
  // deliberately not behind /api - keep it a plain, stable path.
  router.get("/health", publicDataLimiter, controller.getHealth);

  return router;
}

module.exports = { createHealthRoutes };
