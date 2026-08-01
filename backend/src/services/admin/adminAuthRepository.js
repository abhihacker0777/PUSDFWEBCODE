const {
  ADMIN_DISPLAY_NAME,
  ADMIN_EMAIL_ADDRESS,
  ADMIN_LOGIN_IDENTIFIER,
  SUPABASE_ADMIN_USERS_TABLE
} = require("../../config/env");
const {
  normalizeAuthIdentifier,
  safeCompare
} = require("../../utils/helpers");
const {
  supabaseRequest,
  postgrestUuidEqFilter
} = require("../supabaseService");
const { toPublicAdminUser } = require("./adminAuthMapper");

const ADMIN_AUTH_COLUMNS = "id,email,auth_email,login_identifier,auth_user_id,display_name,role,is_active,reset_token_hash,reset_token_expires_at,created_at,updated_at";
const ADMIN_PUBLIC_COLUMNS = "id,email,login_identifier,auth_user_id,display_name,role,is_active,created_at,updated_at";

async function selectAdminAuthRows(params) {
  params.set("select", ADMIN_AUTH_COLUMNS);
  return supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, { query: params.toString() });
}

function isOwnerIdentifier(identifier) {
  const cleanIdentifier = normalizeAuthIdentifier(identifier);
  return Boolean(
    cleanIdentifier &&
    (
      safeCompare(cleanIdentifier, ADMIN_EMAIL_ADDRESS) ||
      safeCompare(cleanIdentifier, ADMIN_LOGIN_IDENTIFIER)
    )
  );
}

async function findAdminAuthUser(identifier) {
  const cleanIdentifier = normalizeAuthIdentifier(identifier);
  if (!cleanIdentifier) return null;

  const byEmailParams = new URLSearchParams({ limit: "1" });
  byEmailParams.set("email", `eq.${cleanIdentifier}`);

  const emailRows = await selectAdminAuthRows(byEmailParams);
  if (Array.isArray(emailRows) && emailRows[0]) return emailRows[0];

  const byAuthEmailParams = new URLSearchParams({ limit: "1" });
  byAuthEmailParams.set("auth_email", `eq.${cleanIdentifier}`);

  const authEmailRows = await selectAdminAuthRows(byAuthEmailParams);
  if (Array.isArray(authEmailRows) && authEmailRows[0]) return authEmailRows[0];

  const byLoginParams = new URLSearchParams({ limit: "1" });
  byLoginParams.set("login_identifier", `eq.${cleanIdentifier}`);

  const loginRows = await selectAdminAuthRows(byLoginParams);
  return Array.isArray(loginRows) && loginRows[0] ? loginRows[0] : null;
}

async function createOwnerAdminMetadata(authUserId) {
  if (!authUserId || !ADMIN_EMAIL_ADDRESS) return null;

  const existing = await findAdminAuthUser(ADMIN_EMAIL_ADDRESS);
  if (existing) return attachAdminAuthUserId(existing.id, authUserId);

  const body = {
    email: ADMIN_EMAIL_ADDRESS,
    auth_email: ADMIN_EMAIL_ADDRESS,
    login_identifier: ADMIN_LOGIN_IDENTIFIER || ADMIN_EMAIL_ADDRESS,
    auth_user_id: authUserId,
    display_name: ADMIN_DISPLAY_NAME || ADMIN_EMAIL_ADDRESS,
    role: "full",
    is_active: true
  };

  const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "POST",
    prefer: "return=representation",
    body
  });

  return Array.isArray(rows) && rows[0] ? rows[0] : body;
}

async function attachAdminAuthUserId(id, authUserId) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter || !authUserId) return null;

  const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=representation",
    body: { auth_user_id: authUserId }
  });

  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function getResettableAdminUser(email) {
  const cleanEmail = normalizeAuthIdentifier(email);
  if (!cleanEmail) return null;

  const user = await findAdminAuthUser(cleanEmail);
  if (!user || !safeCompare(user.email, cleanEmail) || user.is_active === false) return null;
  return user.auth_user_id ? user : null;
}

async function listManagedAdminUsers() {
  const params = new URLSearchParams({
    select: ADMIN_PUBLIC_COLUMNS,
    order: "created_at.asc"
  });

  const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    query: params.toString()
  });

  return (Array.isArray(rows) ? rows : []).map(toPublicAdminUser);
}

async function findAdminUserById(id) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return null;
  const params = new URLSearchParams(idFilter);
  params.set("limit", "1");
  const rows = await selectAdminAuthRows(params);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

module.exports = {
  attachAdminAuthUserId,
  createOwnerAdminMetadata,
  findAdminAuthUser,
  findAdminUserById,
  getResettableAdminUser,
  isOwnerIdentifier,
  listManagedAdminUsers,
  selectAdminAuthRows
};
