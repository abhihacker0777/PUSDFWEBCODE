const {
  ADMIN_EMAIL_ADDRESS,
  ADMIN_LOGIN_IDENTIFIER,
  SUPABASE_ADMIN_USERS_TABLE
} = require("../../config/env");
const {
  normalizeAuthIdentifier,
  sanitizeFreeText,
  safeCompare
} = require("../../utils/helpers");
const { normalizeAdminRole } = require("../../config/permissions");
const {
  isSupabaseConfigured,
  supabaseRequest,
  postgrestUuidEqFilter
} = require("../supabaseService");
const {
  createSupabaseAdminAuthUser,
  deleteSupabaseAdminAuthUser,
  findSupabaseAuthUserByEmail,
  updateSupabaseAdminAuthUser
} = require("../supabaseAuthService");
const { clearFailedLoginState } = require("../../middleware/securityMiddleware");
const {
  findAdminUserById,
  listManagedAdminUsers
} = require("./adminAuthRepository");
const { toPublicAdminUser } = require("./adminAuthMapper");

const INTERNAL_AUTH_EMAIL_DOMAIN = "pyqp.local";

function makeInternalAuthEmail(loginIdentifier) {
  return normalizeAuthIdentifier(`${loginIdentifier}@${INTERNAL_AUTH_EMAIL_DOMAIN}`);
}

function resolveAdminEmails(loginIdentifier, email, existingAuthEmail = "") {
  const cleanEmail = normalizeAuthIdentifier(email || "");
  const currentAuthEmail = normalizeAuthIdentifier(existingAuthEmail || "");
  const authEmail = cleanEmail || currentAuthEmail || (loginIdentifier.includes("@") ? loginIdentifier : makeInternalAuthEmail(loginIdentifier));
  return { contactEmail: cleanEmail, authEmail };
}

function buildUserMetadata(displayName, loginIdentifier, role) {
  return {
    display_name: displayName,
    login_identifier: loginIdentifier,
    role
  };
}

async function createManagedAdminUser(data) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const loginIdentifier = normalizeAuthIdentifier(data.loginIdentifier);
  const { contactEmail, authEmail } = resolveAdminEmails(loginIdentifier, data.email);
  if (!authEmail) throw new Error("Unable to create Supabase Auth email for this admin user.");

  if (safeCompare(loginIdentifier, ADMIN_LOGIN_IDENTIFIER) || safeCompare(contactEmail, ADMIN_EMAIL_ADDRESS) || safeCompare(authEmail, ADMIN_EMAIL_ADDRESS)) {
    throw new Error("admin account already exists.");
  }

  const displayName = sanitizeFreeText(data.displayName || loginIdentifier, 80);
  const role = normalizeAdminRole(data.role);
  let authUser = null;

  try {
    authUser = await createSupabaseAdminAuthUser({
      email: authEmail,
      password: data.password,
      displayName,
      loginIdentifier,
      role
    });

    if (!authUser?.id) throw new Error("Supabase Auth did not return a user id.");

    const body = {
      auth_user_id: authUser.id,
      email: contactEmail || null,
      auth_email: authEmail,
      login_identifier: loginIdentifier,
      display_name: displayName,
      role,
      is_active: true
    };

    const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
      method: "POST",
      prefer: "return=representation",
      body
    });

    return toPublicAdminUser(Array.isArray(rows) && rows[0] ? rows[0] : body);
  } catch (error) {
    if (authUser?.id) {
      await deleteSupabaseAdminAuthUser(authUser.id).catch(() => {});
    }
    throw error;
  }
}

async function updateManagedAdminUser(data) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const existing = await findAdminUserById(data.id);
  if (!existing) throw new Error("Admin user not found.");
  if (toPublicAdminUser(existing).isOwner) {
    throw new Error("admin account cannot be changed here.");
  }

  const body = {};
  const nextDisplayName = Object.prototype.hasOwnProperty.call(data, "displayName")
    ? sanitizeFreeText(data.displayName || existing.login_identifier, 80)
    : existing.display_name;
  const nextRole = Object.prototype.hasOwnProperty.call(data, "role")
    ? normalizeAdminRole(data.role)
    : existing.role;
  const nextEmail = Object.prototype.hasOwnProperty.call(data, "email")
    ? normalizeAuthIdentifier(data.email || "")
    : existing.email;
  const { contactEmail: nextContactEmail, authEmail: nextAuthEmail } = resolveAdminEmails(
    existing.login_identifier,
    nextEmail,
    existing.auth_email
  );

  if (!nextAuthEmail) throw new Error("Unable to create Supabase Auth email for this admin user.");

  const authUserId = await resolveLinkedAuthUserId({
    existing,
    password: data.password || "",
    nextDisplayName,
    nextAuthEmail,
    nextRole
  });

  if (Object.prototype.hasOwnProperty.call(data, "email")) body.email = nextContactEmail || null;
  if (!safeCompare(existing.auth_email || "", nextAuthEmail)) body.auth_email = nextAuthEmail;
  if (Object.prototype.hasOwnProperty.call(data, "displayName")) body.display_name = nextDisplayName;
  if (Object.prototype.hasOwnProperty.call(data, "role")) body.role = nextRole;
  if (Object.prototype.hasOwnProperty.call(data, "isActive")) body.is_active = data.isActive !== false;
  if (!existing.auth_user_id) body.auth_user_id = authUserId;

  await updateSupabaseAdminAuthUser(authUserId, {
    email: nextAuthEmail,
    password: data.password || "",
    userMetadata: buildUserMetadata(nextDisplayName, existing.login_identifier, nextRole)
  });

  const idFilter = postgrestUuidEqFilter("id", data.id);
  const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=representation",
    body
  });

  const updated = Array.isArray(rows) && rows[0] ? rows[0] : { ...existing, ...body };
  await clearFailedLoginState(existing.login_identifier);
  if (existing.email) await clearFailedLoginState(existing.email);
  if (existing.auth_email) await clearFailedLoginState(existing.auth_email);
  if (nextContactEmail) await clearFailedLoginState(nextContactEmail);
  if (nextAuthEmail) await clearFailedLoginState(nextAuthEmail);
  return toPublicAdminUser(updated);
}

async function resolveLinkedAuthUserId({ existing, password, nextDisplayName, nextAuthEmail, nextRole }) {
  if (existing.auth_user_id) return existing.auth_user_id;

  const authUser = await findSupabaseAuthUserByEmail(nextAuthEmail);
  if (authUser?.id) return authUser.id;

  if (!password) {
    throw new Error("Set a new password once to link this old admin user to Supabase Auth.");
  }

  const created = await createSupabaseAdminAuthUser({
    email: nextAuthEmail,
    password,
    displayName: nextDisplayName,
    loginIdentifier: existing.login_identifier,
    role: nextRole
  });

  if (!created?.id) throw new Error("Supabase Auth did not return a user id.");
  return created.id;
}

async function deleteManagedAdminUser(id) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const existing = await findAdminUserById(id);
  if (!existing) throw new Error("Admin user not found.");
  if (toPublicAdminUser(existing).isOwner) {
    throw new Error("admin account cannot be deleted.");
  }

  if (existing.auth_user_id) {
    await deleteSupabaseAdminAuthUser(existing.auth_user_id);
  }

  const idFilter = postgrestUuidEqFilter("id", id);
  await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "DELETE",
    query: idFilter,
    prefer: "return=minimal"
  });

  await clearFailedLoginState(existing.login_identifier);
  if (existing.email) await clearFailedLoginState(existing.email);
}

module.exports = {
  createManagedAdminUser,
  deleteManagedAdminUser,
  listManagedAdminUsers,
  updateManagedAdminUser
};
