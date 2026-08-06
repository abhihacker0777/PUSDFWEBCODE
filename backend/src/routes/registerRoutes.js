const { createAdminLogRoutes } = require("./adminLogRoutes");
const { createAdminPaperRoutes } = require("./adminPaperRoutes");
const { createAdminSettingsRoutes } = require("./adminSettingsRoutes");
const { createAdminUserRoutes } = require("./adminUserRoutes");
const { createAssistantRoutes } = require("./assistantRoutes");
const { createAuthRoutes } = require("./authRoutes");
const { createPaperRoutes } = require("./paperRoutes");
const { createWebhookRoutes } = require("./webhookRoutes");

function registerRoutes(app, dependencies) {
  const {
    adminLogs,
    adminMiddleware,
    adminSettings,
    auth,
    drive,
    google,
    paper,
    supabase,
    upload
  } = dependencies;
  const { verifyToken, requirePermission, requireOwnerAdmin } = adminMiddleware;
  const { requireOwnerAdminIp, hasAdminPermission } = auth;

  app.use(createAuthRoutes({ verifyToken, requireOwnerAdminIp }));
  app.use(createAdminUserRoutes({ verifyToken, requireOwnerAdminIp, requireOwnerAdmin }));

  app.use(createWebhookRoutes({
    controllerDependencies: {
      mirrorPaperToSheet: paper.mirrorPaperToSheet,
      mirrorDeletePaperFromSheet: paper.mirrorDeletePaperFromSheet,
      paperFromSupabaseRow: paper.paperFromSupabaseRow,
      invalidatePapersCache: paper.invalidatePapersCache
    }
  }));

  app.use(createAdminLogRoutes({
    verifyToken,
    requireOwnerAdminIp,
    requirePermission,
    controllerDependencies: {
      appendAdminLogToSupabase: adminLogs.appendAdminLogToSupabase,
      appendAdminLogToSheet: adminLogs.appendAdminLogToSheet,
      getAdminLogsFromSupabase: adminLogs.getAdminLogsFromSupabase,
      getStudentQueryInsights: adminLogs.getStudentQueryInsights,
      supabaseRequest: supabase.supabaseRequest,
      supabaseSelectAll: supabase.supabaseSelectAll
    }
  }));

  app.use(createAdminSettingsRoutes({
    verifyToken,
    requireOwnerAdminIp,
    requirePermission,
    controllerDependencies: {
      addBlockedUser: adminSettings.addBlockedUser,
      addCustomReply: adminSettings.addCustomReply,
      deleteCustomReply: adminSettings.deleteCustomReply,
      getBlockedUsers: adminSettings.getBlockedUsers,
      getCustomReplies: adminSettings.getCustomReplies,
      hasAdminPermission,
      removeBlockedUser: adminSettings.removeBlockedUser
    }
  }));

  app.use(createAdminPaperRoutes({
    verifyToken,
    requireOwnerAdminIp,
    requirePermission,
    controllerDependencies: {
      deleteSupabasePaper: paper.deleteSupabasePaper,
      extractDriveFileId: drive.extractDriveFileId,
      fetchAdminPapersFromPublishedSheet: paper.fetchAdminPapersFromPublishedSheet,
      fetchSupabasePapers: paper.fetchSupabasePapers,
      getExpectedPaperPayload: paper.getExpectedPaperPayload,
      getPaperPayload: paper.getPaperPayload,
      getSheetRows: paper.getSheetRows,
      getSupabasePaperById: paper.getSupabasePaperById,
      hasAdminPermission,
      hasAllPaperFields: paper.hasAllPaperFields,
      insertSupabasePaper: paper.insertSupabasePaper,
      invalidatePapersCache: paper.invalidatePapersCache,
      isAdminSheetRow: paper.isAdminSheetRow,
      isSupabaseConfigured: supabase.isSupabaseConfigured,
      mirrorDeletePaperFromSheet: paper.mirrorDeletePaperFromSheet,
      mirrorPaperToSheet: paper.mirrorPaperToSheet,
      paperFromSheetRow: paper.paperFromSheetRow,
      paperMatchesExpectedSnapshot: paper.paperMatchesExpectedSnapshot,
      replaceSupabasePapers: paper.replaceSupabasePapers,
      resolveExpectedSheetRowIndex: paper.resolveExpectedSheetRowIndex,
      rowHasBlankPaperData: paper.rowHasBlankPaperData,
      rowMatchesPaper: paper.rowMatchesPaper,
      rowMatchesPaperSlot: paper.rowMatchesPaperSlot,
      updateSupabasePaper: paper.updateSupabasePaper,
      upload,
      uploadFileToDrive: drive.uploadFileToDrive,
      validateUploadedFile: drive.validateUploadedFile
    }
  }));

  app.use(createPaperRoutes({
    fetchPaperOptions: paper.fetchPaperOptions,
    fetchPublicPapers: paper.fetchPublicPapers,
    fetchPublicPapersByFilter: paper.fetchPublicPapersByFilter
  }));

  app.use(createAssistantRoutes({
    fetchPublicPapers: paper.fetchPublicPapers,
    findCustomReplyForQuestion: adminSettings.findCustomReplyForQuestion,
    getBlockedUsers: adminSettings.getBlockedUsers,
    getCustomReplies: adminSettings.getCustomReplies,
    saveAssistantRequestLog: adminLogs.saveAssistantRequestLog,
    verifyAssistantGoogleCredential: google.verifyAssistantGoogleCredential
  }));
}

module.exports = { registerRoutes };
