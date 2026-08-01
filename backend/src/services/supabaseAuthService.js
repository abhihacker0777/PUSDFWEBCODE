const {
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL
} = require("../config/env");
const { normalizeAuthIdentifier, safeCompare } = require("../utils/helpers");

function isSupabaseAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseAuthUrl(path, query = "") {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return `${SUPABASE_URL}/auth/v1/${cleanPath}${query ? `?${query}` : ""}`;
}

async function supabaseAuthRequest(path, options = {}) {
  if (!isSupabaseAuthConfigured()) {
    throw new Error("Supabase Auth is not configured.");
  }

  const response = await fetch(supabaseAuthUrl(path, options.query || ""), {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${options.authorizationToken || SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.error || `Supabase Auth returned ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function isInvalidCredentialError(error) {
  return error?.status === 400 || error?.status === 401 || error?.status === 422;
}

async function signInAdminWithPassword(email, password) {
  try {
    const data = await supabaseAuthRequest("token", {
      method: "POST",
      query: "grant_type=password",
      body: { email, password }
    });
    return data?.user?.id ? data : null;
  } catch (error) {
    if (isInvalidCredentialError(error)) return null;
    throw error;
  }
}

async function createSupabaseAdminAuthUser({ email, password, displayName, loginIdentifier, role }) {
  const data = await supabaseAuthRequest("admin/users", {
    method: "POST",
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        login_identifier: loginIdentifier,
        role
      }
    }
  });

  return data?.user || data;
}

async function listSupabaseAdminAuthUsers(page = 1, perPage = 200) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage)
  });

  const data = await supabaseAuthRequest("admin/users", {
    query: params.toString()
  });

  return Array.isArray(data) ? data : data?.users || [];
}

async function findSupabaseAuthUserByEmail(email) {
  const cleanEmail = normalizeAuthIdentifier(email);
  if (!cleanEmail) return null;

  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const users = await listSupabaseAdminAuthUsers(page, perPage);
    const match = users.find((user) => safeCompare(normalizeAuthIdentifier(user?.email || ""), cleanEmail));
    if (match) return match;
    if (users.length < perPage) return null;
  }

  return null;
}

async function updateSupabaseAdminAuthUser(authUserId, patch = {}) {
  if (!authUserId) throw new Error("Supabase Auth user is not linked.");

  const body = {};
  if (patch.email) body.email = patch.email;
  if (patch.password) body.password = patch.password;
  if (patch.userMetadata) body.user_metadata = patch.userMetadata;

  if (Object.keys(body).length === 0) return null;

  const data = await supabaseAuthRequest(`admin/users/${encodeURIComponent(authUserId)}`, {
    method: "PUT",
    body
  });

  return data?.user || data;
}

async function deleteSupabaseAdminAuthUser(authUserId) {
  if (!authUserId) return;
  await supabaseAuthRequest(`admin/users/${encodeURIComponent(authUserId)}`, {
    method: "DELETE"
  });
}

module.exports = {
  createSupabaseAdminAuthUser,
  deleteSupabaseAdminAuthUser,
  findSupabaseAuthUserByEmail,
  isSupabaseAuthConfigured,
  signInAdminWithPassword,
  updateSupabaseAdminAuthUser
};
