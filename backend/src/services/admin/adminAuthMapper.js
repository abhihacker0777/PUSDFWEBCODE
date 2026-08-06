const {
  ADMIN_LOGIN_IDENTIFIER,
  ADMIN_EMAIL_ADDRESS,
  ADMIN_DISPLAY_NAME
} = require("../../config/env");
const {
  normalizeAuthIdentifier,
  normalizeUuid,
  sanitizeFreeText,
  safeCompare
} = require("../../utils/helpers");
const {
  normalizeAdminRole,
  getRolePermissions
} = require("../../config/permissions");

function isOwnerAdminRecord(record = {}) {
  const email = normalizeAuthIdentifier(record.email || "");
  const authEmail = normalizeAuthIdentifier(record.auth_email || record.authEmail || "");
  const loginIdentifier = normalizeAuthIdentifier(record.login_identifier || record.loginIdentifier || "");
  return Boolean(
    (ADMIN_EMAIL_ADDRESS && email && safeCompare(email, ADMIN_EMAIL_ADDRESS)) ||
    (ADMIN_EMAIL_ADDRESS && authEmail && safeCompare(authEmail, ADMIN_EMAIL_ADDRESS)) ||
    (ADMIN_LOGIN_IDENTIFIER && loginIdentifier && safeCompare(loginIdentifier, ADMIN_LOGIN_IDENTIFIER))
  );
}

function toPublicAdminUser(record) {
  record = record || {};
  const loginIdentifier = normalizeAuthIdentifier(record.login_identifier || record.loginIdentifier || "");
  const email = normalizeAuthIdentifier(record.email || "");
  const authEmail = normalizeAuthIdentifier(record.auth_email || record.authEmail || "");
  const isOwner = Boolean(record.isOwner || isOwnerAdminRecord({ ...record, login_identifier: loginIdentifier, email, auth_email: authEmail }));
  const role = isOwner ? "full" : normalizeAdminRole(record.role);
  const displayName = sanitizeFreeText(
    record.display_name || record.displayName || email || loginIdentifier || "Admin",
    80
  );

  return {
    id: normalizeUuid(record.id) || "",
    email,
    loginIdentifier,
    displayName,
    role,
    isActive: record.is_active !== false && record.isActive !== false,
    isOwner,
    permissions: getRolePermissions(role, isOwner),
    createdAt: record.created_at || record.createdAt || "",
    updatedAt: record.updated_at || record.updatedAt || ""
  };
}

function hasAdminPermission(admin, permission) {
  if (!admin) return false;
  return toPublicAdminUser(admin).permissions.includes(permission);
}

function getEnvAdminUser() {
  return {
    id: "",
    email: ADMIN_EMAIL_ADDRESS,
    login_identifier: ADMIN_LOGIN_IDENTIFIER,
    display_name: ADMIN_DISPLAY_NAME,
    role: "full",
    is_active: true,
    isOwner: true
  };
}

module.exports = {
  getEnvAdminUser,
  hasAdminPermission,
  isOwnerAdminRecord,
  toPublicAdminUser
};
