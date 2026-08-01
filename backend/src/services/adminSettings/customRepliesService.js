const { sanitizeFreeText } = require("../../utils/helpers");
const {
  supabaseRequest,
  supabaseSelectAll,
  postgrestEqFilter
} = require("../supabaseService");
const {
  normalizeSearchText,
  compactSearchText,
  getAssistantQueryTokens
} = require("../assistantService");

const ADMIN_SETTINGS_CACHE_MS = 1 * 60 * 1000;

function splitCustomReplyKeywords(keyword) {
  return sanitizeFreeText(keyword, 300)
    .split(/[|,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function customReplyKeywordMatches(question, keyword) {
  const normalizedQuestion = ` ${normalizeSearchText(question)} `;
  const compactQuestion = compactSearchText(question);
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return false;

  if (normalizedQuestion.includes(` ${normalizedKeyword} `)) return true;
  if (compactQuestion.includes(compactSearchText(keyword))) return true;

  const keywordTokens = getAssistantQueryTokens(keyword);
  if (keywordTokens.length === 0) return false;
  return keywordTokens.every((token) => normalizedQuestion.includes(` ${token} `));
}

function findCustomReplyForQuestion(question, replies) {
  let bestMatch = null;
  let bestScore = 0;

  for (const reply of replies || []) {
    for (const keyword of splitCustomReplyKeywords(reply.keyword)) {
      if (!customReplyKeywordMatches(question, keyword)) continue;
      const score = normalizeSearchText(keyword).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = reply;
      }
    }
  }

  return bestMatch;
}

function createCustomRepliesService(sheetService) {
  let customRepliesCache = { expiresAt: 0, data: [] };

  async function getCustomReplies() {
    if (Date.now() < customRepliesCache.expiresAt) return customRepliesCache.data;
    try {
      const rows = await supabaseSelectAll("custom_replies", { select: "keyword,reply" });
      const replies = (rows || []).map((row) => ({
        keyword: sanitizeFreeText(row.keyword, 200).toLowerCase(),
        reply: sanitizeFreeText(row.reply, 1000)
      })).filter((reply) => reply.keyword && reply.reply);
      customRepliesCache = { expiresAt: Date.now() + ADMIN_SETTINGS_CACHE_MS, data: replies };
      return replies;
    } catch (err) {
      console.error("Failed to query custom_replies table:", err.message);
      return customRepliesCache.data;
    }
  }

  async function addCustomReply(keyword, reply) {
    const cleanKeyword = sanitizeFreeText(keyword, 200).toLowerCase();
    const cleanReply = sanitizeFreeText(reply, 1000);

    try {
      try {
        await supabaseRequest("custom_replies", {
          method: "DELETE",
          query: postgrestEqFilter("keyword", cleanKeyword, 200)
        });
      } catch {}
      await supabaseRequest("custom_replies", {
        method: "POST",
        body: { keyword: cleanKeyword, reply: cleanReply }
      });
    } catch (err) {
      console.error("Supabase custom_replies write failed:", err.message);
    }

    try {
      await sheetService.upsertCustomReplyToSheet(cleanKeyword, cleanReply);
    } catch (err) {
      console.error("Sheets custom_replies write failed:", err.message);
    }

    customRepliesCache.expiresAt = 0;
  }

  async function deleteCustomReply(keyword) {
    const cleanKeyword = sanitizeFreeText(keyword, 200).toLowerCase();

    try {
      await supabaseRequest("custom_replies", {
        method: "DELETE",
        query: postgrestEqFilter("keyword", cleanKeyword, 200)
      });
    } catch (err) {
      console.error("Supabase custom_replies delete failed:", err.message);
    }

    try {
      await sheetService.deleteCustomReplyFromSheet(cleanKeyword);
    } catch (err) {
      console.error("Sheets custom_replies delete failed:", err.message);
    }

    customRepliesCache.expiresAt = 0;
  }

  return {
    getCustomReplies,
    addCustomReply,
    deleteCustomReply,
    findCustomReplyForQuestion
  };
}

module.exports = { createCustomRepliesService };
