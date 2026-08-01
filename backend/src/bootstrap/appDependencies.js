const jwt = require("jsonwebtoken");
const {
  isSupabaseConfigured,
  supabaseRequest,
  supabaseSelectAll
} = require("../services/supabaseService");
const {
  findAdminAuthUser,
  getEnvAdminUser,
  hasAdminPermission,
  toPublicAdminUser
} = require("../services/adminAuthService");
const {
  getServiceSheets,
  verifyAssistantGoogleCredential
} = require("../services/googleService");
const {
  extractDriveFileId,
  uploadFileToDrive,
  validateUploadedFile
} = require("../services/driveService");
const { createPaperService } = require("../services/paperService");
const { createAdminSettingsService } = require("../services/adminSettingsService");
const { createAdminLogService } = require("../services/adminLogService");
const {
  cookieOptions,
  createRequireOwnerAdminIp
} = require("../middleware/securityMiddleware");
const { createAdminMiddleware } = require("../middleware/adminMiddleware");
const { SECRET, ADMIN_SESSION_ID } = require("../config/env");
const { createUploadMiddleware } = require("./uploadMiddleware");

function createAppDependencies() {
  const paper = createPaperService();
  const adminSettings = createAdminSettingsService();
  const adminLogs = createAdminLogService();
  const requireOwnerAdminIp = createRequireOwnerAdminIp(toPublicAdminUser);
  const adminMiddleware = createAdminMiddleware({
    jwt,
    secret: SECRET,
    adminSessionId: ADMIN_SESSION_ID,
    cookieOptions,
    getEnvAdminUser,
    findAdminAuthUser,
    toPublicAdminUser,
    hasAdminPermission
  });

  return {
    adminLogs,
    adminMiddleware,
    adminSettings,
    auth: {
      hasAdminPermission,
      requireOwnerAdminIp
    },
    drive: {
      extractDriveFileId,
      uploadFileToDrive,
      validateUploadedFile
    },
    google: {
      getServiceSheets,
      verifyAssistantGoogleCredential
    },
    paper,
    supabase: {
      isSupabaseConfigured,
      supabaseRequest,
      supabaseSelectAll
    },
    upload: createUploadMiddleware()
  };
}

module.exports = { createAppDependencies };
