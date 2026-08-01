const { normalizeAuthIdentifier, safeCompare } = require("../utils/helpers");
const {
  ADMIN_EMAIL_ADDRESS
} = require("../config/env");
const {
  getEnvAdminUser,
  hasAdminPermission,
  toPublicAdminUser
} = require("./admin/adminAuthMapper");
const {
  attachAdminAuthUserId,
  createOwnerAdminMetadata,
  findAdminAuthUser,
  getResettableAdminUser,
  isOwnerIdentifier
} = require("./admin/adminAuthRepository");
const {
  createManagedAdminUser,
  deleteManagedAdminUser,
  listManagedAdminUsers,
  updateManagedAdminUser
} = require("./admin/adminManagedUserService");
const {
  saveAdminPasswordResetToken,
  sendPasswordResetEmail,
  updateAdminPasswordWithResetToken
} = require("./admin/adminPasswordResetService");
const { buildPasswordResetUrl } = require("./adminPasswordCryptoService");
const { signInAdminWithPassword } = require("./supabaseAuthService");

async function verifyAdminCredentials(identifier, password) {
  const cleanIdentifier = normalizeAuthIdentifier(identifier);
  let adminUser = await findAdminAuthUser(cleanIdentifier);
  const ownerLogin = isOwnerIdentifier(cleanIdentifier);
  const loginEmail = resolveLoginEmail(adminUser, cleanIdentifier, ownerLogin);
  if (!loginEmail) return null;

  const authSession = await signInAdminWithPassword(loginEmail, password);
  const authUserId = authSession?.user?.id || "";
  if (!authUserId) return null;

  if (!adminUser && ownerLogin) {
    adminUser = await createOwnerAdminMetadata(authUserId);
  } else if (adminUser?.auth_user_id && !safeCompare(adminUser.auth_user_id, authUserId)) {
    return null;
  } else if (adminUser && !adminUser.auth_user_id) {
    adminUser = await attachAdminAuthUserId(adminUser.id, authUserId);
  }

  const publicUser = adminUser ? toPublicAdminUser(adminUser) : null;
  return publicUser?.isActive ? publicUser : null;
}

function resolveLoginEmail(adminUser, cleanIdentifier, ownerLogin) {
  if (adminUser?.auth_email) return adminUser.auth_email;
  if (adminUser?.email) return adminUser.email;
  if (ownerLogin) return ADMIN_EMAIL_ADDRESS;
  return cleanIdentifier.includes("@") ? cleanIdentifier : "";
}

module.exports = {
  toPublicAdminUser,
  hasAdminPermission,
  getEnvAdminUser,
  findAdminAuthUser,
  getResettableAdminUser,
  saveAdminPasswordResetToken,
  updateAdminPasswordWithResetToken,
  listManagedAdminUsers,
  createManagedAdminUser,
  updateManagedAdminUser,
  deleteManagedAdminUser,
  sendPasswordResetEmail,
  buildPasswordResetUrl,
  verifyAdminCredentials
};
