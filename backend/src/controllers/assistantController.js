const crypto = require("crypto");
const {
  assistantGoogleVerifyBodySchema,
  assistantSearchBodySchema
} = require("../validators/authValidators");
const {
  parseAssistantQuery,
  parseAssistantQueryWithSarvam,
  searchAssistantPapers
} = require("../services/assistantService");
const {
  GOOGLE_SIGNIN_CLIENT_ID,
  ASSISTANT_EMAIL_DOMAIN,
  SARVAM_API_KEY
} = require("../config/env");

function createAssistantController({
  verifyAssistantGoogleCredential,
  getBlockedUsers,
  fetchPublicPapers,
  getCustomReplies,
  findCustomReplyForQuestion,
  saveAssistantRequestLog
}) {
  function config(req, res) {
    res.json({
      success: true,
      googleClientId: GOOGLE_SIGNIN_CLIENT_ID,
      emailDomain: ASSISTANT_EMAIL_DOMAIN,
      aiProvider: "sarvam",
      sarvamEnabled: Boolean(SARVAM_API_KEY)
    });
  }

  async function verifyGoogle(req, res) {
    try {
      const parsed = assistantGoogleVerifyBodySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(401).json({
          success: false,
          code: "INVALID_GOOGLE_TOKEN",
          message: "Please sign in again with your Poornima Google account."
        });
      }

      const user = await verifyAssistantGoogleCredential(parsed.data.credential);

      const blockedUsers = await getBlockedUsers();
      if (blockedUsers.includes(user.email.toLowerCase())) {
        return res.status(403).json({
          success: false,
          code: "BLOCKED_USER",
          message: "Your account has been blocked by the administrator."
        });
      }

      res.json({ success: true, user });
    } catch (err) {
      console.error("Assistant Google sign-in failed:", err.message);
      res.status(401).json({
        success: false,
        code: err.code || "INVALID_GOOGLE_TOKEN",
        message: err.message || "Please sign in again with your Poornima Google account."
      });
    }
  }

  async function search(req, res) {
    try {
      const parsed = assistantSearchBodySchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          code: "INVALID_QUESTION",
          message: "Please type the paper you need."
        });
      }

      const question = parsed.data.question;
      const user = await verifyAssistantGoogleCredential(parsed.data.credential);
      const email = user.email;

      const blockedUsers = await getBlockedUsers();
      if (blockedUsers.includes(email.toLowerCase())) {
        return res.status(403).json({
          success: false,
          code: "BLOCKED_USER",
          message: "Your account has been blocked by the administrator."
        });
      }

      if (question.length < 2) {
        return res.status(400).json({
          success: false,
          code: "INVALID_QUESTION",
          message: "Please type the paper you need."
        });
      }

      let answer = null;
      let papers = [];
      let paperDataUnavailable = false;

      try {
        papers = await fetchPublicPapers();
      } catch (paperErr) {
        paperDataUnavailable = true;
        console.error("Assistant paper data unavailable:", paperErr.message);
      }

      const localPaperQuery = parseAssistantQuery(question, papers);
      const isPaperSearchIntent = Boolean(
        localPaperQuery.course ||
        localPaperQuery.spec ||
        localPaperQuery.year ||
        localPaperQuery.sem ||
        localPaperQuery.exam
      );

      const customReplies = await getCustomReplies();
      const customMatch = findCustomReplyForQuestion(question, customReplies);

      if (customMatch && !isPaperSearchIntent) {
        answer = {
          status: "info",
          results: [],
          message: customMatch.reply
        };
      } else if (paperDataUnavailable) {
        answer = {
          status: "unavailable",
          results: [],
          message: "Paper database is temporarily unavailable. Please try again after some time."
        };
      } else {
        const aiQuery = await parseAssistantQueryWithSarvam(question, papers);
        answer = searchAssistantPapers(papers, question, aiQuery);
      }

      const topResult = answer.results[0] || null;
      const now = new Date();
      const logData = {
        id: `${now.getTime()}-${crypto.randomBytes(4).toString("hex")}`,
        createdAt: now.toISOString(),
        date: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        email,
        name: user.name || "",
        question,
        status: answer.status,
        message: answer.message,
        resultCount: answer.results.length,
        topResult,
        aiProvider: answer.results ? "sarvam" : "local",
        aiUsed: true
      };

      saveAssistantRequestLog(logData);

      res.json({
        success: true,
        status: answer.status,
        message: answer.message,
        results: answer.results,
        feedbackMessage: "Paper not available. Please send feedback to Central Library to add this paper."
      });
    } catch (err) {
      console.error("Assistant search failed:", err.message);
      const isAuthError = [
        "SIGN_IN_REQUIRED",
        "INVALID_GOOGLE_ACCOUNT",
        "INVALID_EMAIL_DOMAIN",
        "INVALID_GOOGLE_TOKEN"
      ].includes(err.code);
      res.status(isAuthError ? 401 : 500).json({
        success: false,
        code: err.code || "ASSISTANT_ERROR",
        message: isAuthError
          ? err.message
          : "Assistant is not available right now. Please try again."
      });
    }
  }

  return {
    config,
    verifyGoogle,
    search
  };
}

module.exports = { createAssistantController };
