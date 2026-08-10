const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_PAGE_SIZE
} = require("../config/env");
const {
  normalizeText,
  normalizeUuid
} = require("../utils/helpers");
const {
  toSupabasePaperRow,
  paperFromSupabaseRow,
  paperOptionFromSupabaseRow,
  buildPaperOptions
} = require("../models/paperModel");

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseTableUrl(tableName, query = "") {
  return `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}${query ? `?${query}` : ""}`;
}

function postgrestEqFilter(column, value, maxLength = 500) {
  return `${encodeURIComponent(column)}=eq.${encodeURIComponent(normalizeText(value, maxLength))}`;
}

function postgrestUuidEqFilter(column, value) {
  const uuid = normalizeUuid(value);
  return uuid ? `${encodeURIComponent(column)}=eq.${uuid}` : "";
}

async function supabaseRequest(tableName, options = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const response = await fetch(supabaseTableUrl(tableName, options.query || ""), {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase returned ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function supabaseSelectAll(tableName, { select = "*", order = "", query = "" } = {}) {
  const rows = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams(query || "");
    if (!params.has("select")) params.set("select", select);
    params.set("limit", String(SUPABASE_PAGE_SIZE));
    params.set("offset", String(offset));
    if (order) params.set("order", order);

    const page = await supabaseRequest(tableName, {
      query: params.toString()
    });

    const pageRows = Array.isArray(page) ? page : [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
    offset += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

// Lightweight liveness check for /health - cheapest possible authenticated
// read (1 row, 1 column) so it proves the service-role key and network path
// both work without doing real work.
async function pingSupabase(timeoutMs = 2000) {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase not configured" };
  try {
    await Promise.race([
      supabaseRequest("papers", { query: "select=id&limit=1" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase ping timed out")), timeoutMs))
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  isSupabaseConfigured,
  supabaseRequest,
  supabaseSelectAll,
  postgrestEqFilter,
  postgrestUuidEqFilter,
  toSupabasePaperRow,
  paperFromSupabaseRow,
  paperOptionFromSupabaseRow,
  buildPaperOptions,
  pingSupabase
};
