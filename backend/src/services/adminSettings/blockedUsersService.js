const { normalizeText } = require("../../utils/helpers");
const {
  supabaseRequest,
  supabaseSelectAll,
  postgrestEqFilter
} = require("../supabaseService");

const ADMIN_SETTINGS_CACHE_MS = 1 * 60 * 1000;

function createBlockedUsersService(sheetService) {
  let blockedUsersCache = { expiresAt: 0, data: new Set() };

  async function getBlockedUsers() {
    if (Date.now() < blockedUsersCache.expiresAt) return Array.from(blockedUsersCache.data);
    try {
      const rows = await supabaseSelectAll("blocked_users", { select: "email" });
      const emails = (rows || [])
        .map((row) => normalizeText(row.email, 254).toLowerCase())
        .filter(Boolean);
      blockedUsersCache = { expiresAt: Date.now() + ADMIN_SETTINGS_CACHE_MS, data: new Set(emails) };
      return emails;
    } catch (err) {
      console.error("Failed to query blocked_users table:", err.message);
      return Array.from(blockedUsersCache.data);
    }
  }

  async function addBlockedUser(email) {
    const normalized = normalizeText(email, 254).toLowerCase();

    try {
      await supabaseRequest("blocked_users", { method: "POST", body: { email: normalized } });
    } catch (err) {
      console.error("Supabase blocked_users write failed:", err.message);
    }

    try {
      await sheetService.appendBlockedUserToSheet(normalized);
    } catch (err) {
      console.error("Sheets blocked_users write failed:", err.message);
    }

    blockedUsersCache.expiresAt = 0;
  }

  async function removeBlockedUser(email) {
    const normalized = normalizeText(email, 254).toLowerCase();

    try {
      await supabaseRequest("blocked_users", {
        method: "DELETE",
        query: postgrestEqFilter("email", normalized, 254)
      });
    } catch (err) {
      console.error("Supabase blocked_users delete failed:", err.message);
    }

    try {
      await sheetService.removeBlockedUserFromSheet(normalized);
    } catch (err) {
      console.error("Sheets blocked_users delete failed:", err.message);
    }

    blockedUsersCache.expiresAt = 0;
  }

  return {
    getBlockedUsers,
    addBlockedUser,
    removeBlockedUser
  };
}

module.exports = { createBlockedUsersService };
