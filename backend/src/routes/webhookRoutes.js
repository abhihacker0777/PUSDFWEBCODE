const express = require("express");
const { createSupabaseWebhookController } = require("../controllers/supabaseWebhookController");
const {
  requireWebhookSecret,
  webhookLimiter
} = require("../middleware/securityMiddleware");

function createWebhookRoutes({ controllerDependencies }) {
  const router = express.Router();
  const controller = createSupabaseWebhookController(controllerDependencies);

  router.post("/webhooks/supabase/papers", webhookLimiter, requireWebhookSecret, controller.handlePapersWebhook);

  return router;
}

module.exports = { createWebhookRoutes };
