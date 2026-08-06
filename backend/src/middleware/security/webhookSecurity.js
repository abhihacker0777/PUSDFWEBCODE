const { SUPABASE_WEBHOOK_SECRET } = require("../../config/env");
const { safeCompare } = require("../../utils/helpers");

function requireWebhookSecret(req, res, next) {
  if (!SUPABASE_WEBHOOK_SECRET) {
    return res.status(503).send("Webhook not configured");
  }

  const providedSecret = req.headers["x-webhook-secret"];
  if (!providedSecret || !safeCompare(providedSecret, SUPABASE_WEBHOOK_SECRET)) {
    return res.status(401).send("Invalid webhook secret");
  }

  next();
}

module.exports = { requireWebhookSecret };
