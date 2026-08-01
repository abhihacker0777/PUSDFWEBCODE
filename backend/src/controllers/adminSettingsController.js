const {
  emailBodySchema,
  customReplyBodySchema,
  customReplyDeleteBodySchema
} = require("../validators/authValidators");
const { sanitizeFreeText } = require("../utils/helpers");

function createAdminSettingsController({
  getBlockedUsers,
  addBlockedUser,
  removeBlockedUser,
  getCustomReplies,
  addCustomReply,
  deleteCustomReply,
  hasAdminPermission
}) {
  async function listBlockedUsers(req, res) {
    try {
      res.json(await getBlockedUsers());
    } catch {
      res.status(500).json([]);
    }
  }

  async function blockUser(req, res) {
    try {
      const parsed = emailBodySchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ success: false });
      await addBlockedUser(parsed.data.email);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false });
    }
  }

  async function unblockUser(req, res) {
    try {
      const parsed = emailBodySchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ success: false });
      await removeBlockedUser(parsed.data.email);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false });
    }
  }

  async function listReplies(req, res) {
    try {
      res.json(await getCustomReplies());
    } catch {
      res.status(500).json([]);
    }
  }

  async function upsertReply(req, res) {
    try {
      const parsed = customReplyBodySchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ success: false });

      const normalizedKeyword = sanitizeFreeText(parsed.data.keyword, 200).toLowerCase();
      const existingReplies = await getCustomReplies();
      const replyExists = existingReplies.some((item) => item.keyword.toLowerCase() === normalizedKeyword);
      if (!replyExists && !hasAdminPermission(req.admin, "assistant:reply:create")) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      await addCustomReply(parsed.data.keyword, parsed.data.reply);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false });
    }
  }

  async function removeReply(req, res) {
    try {
      const parsed = customReplyDeleteBodySchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ success: false });
      await deleteCustomReply(parsed.data.keyword);
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false });
    }
  }

  return {
    listBlockedUsers,
    blockUser,
    unblockUser,
    listReplies,
    upsertReply,
    removeReply
  };
}

module.exports = { createAdminSettingsController };
