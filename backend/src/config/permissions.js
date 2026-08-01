const { normalizeText } = require("../utils/helpers");

const ADMIN_ROLES = ["full", "editor", "view"];

const ROLE_PERMISSIONS = {
  full: [
    "papers:read",
    "papers:create",
    "papers:update",
    "papers:file",
    "papers:delete",
    "papers:sync",
    "assistant:read",
    "assistant:block",
    "assistant:reply:create",
    "assistant:reply:update",
    "assistant:reply:delete",
    "monitor:read",
    "logs:write"
  ],
  editor: ["papers:read", "papers:update", "assistant:read", "assistant:reply:update"],
  view: ["monitor:read"]
};

function normalizeAdminRole(role) {
  const cleanRole = normalizeText(role, 20).toLowerCase();
  return ADMIN_ROLES.includes(cleanRole) ? cleanRole : "view";
}

function getRolePermissions(role, isOwner = false) {
  if (isOwner) return [...ROLE_PERMISSIONS.full, "admins:manage"];
  return ROLE_PERMISSIONS[normalizeAdminRole(role)] || ROLE_PERMISSIONS.view;
}

module.exports = {
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  normalizeAdminRole,
  getRolePermissions
};
