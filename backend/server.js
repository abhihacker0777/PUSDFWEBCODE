require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const net = require("net");
const tls = require("tls");
const fs = require("fs"); 
const path = require("path"); 
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { google } = require("googleapis");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const SECRET = process.env.JWT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DRIVE_REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;
const SHEET_ID = process.env.SHEET_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SHEET_URL = process.env.SHEET_URL;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const DRIVE_ACCESS_DOMAIN = process.env.DRIVE_ACCESS_DOMAIN || "poornima.edu.in";
const ASSISTANT_EMAIL_DOMAIN = (process.env.ASSISTANT_EMAIL_DOMAIN || "poornima.edu.in").toLowerCase();
const ASSISTANT_REQUESTS_SHEET = process.env.ASSISTANT_REQUESTS_SHEET || "AI Requests";
const GOOGLE_SIGNIN_CLIENT_ID = process.env.GOOGLE_SIGNIN_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || CLIENT_ID;
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";
const SARVAM_MODEL = process.env.SARVAM_MODEL || "sarvam-30b";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_PAPERS_TABLE = process.env.SUPABASE_PAPERS_TABLE || "papers";
const SUPABASE_ADMIN_USERS_TABLE = process.env.SUPABASE_ADMIN_USERS_TABLE || "admin_users";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const PASSWORD_RESET_FROM = process.env.PASSWORD_RESET_FROM || "";
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || `${FRONTEND_URL.replace(/\/$/, "")}/reset-password`;
const SARVAM_TIMEOUT_MS = 5000;
const ASSISTANT_MAX_RESULTS = 25; 
const PUBLIC_PAPERS_CACHE_MS = 30 * 60 * 1000;
const PUBLIC_PAPERS_STALE_CACHE_MS = 5 * 60 * 1000;
const SUPABASE_PAGE_SIZE = 1000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200;
const MAX_ASSISTANT_TEXT_LENGTH = 500;
const ADMIN_LOG_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const SHEET_WRITE_MODE = "RAW";
const isProduction = process.env.NODE_ENV === "production";
const ADMIN_SESSION_ID = String(process.env.ADMIN_SESSION_VERSION || "1").trim().slice(0, 64) || "1";
const ADMIN_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "Incorrect email or password.";
const PASSWORD_RESET_RESPONSE = "If that email is registered, you'll receive a password reset link.";
const PASSWORD_RESET_CONFIRM_ERROR = "Reset link is invalid or expired.";
const ADMIN_LOGIN_IDENTIFIER = normalizeAuthIdentifier(process.env.ADMIN_EMAIL || process.env.ADMIN_USER || "");
const ADMIN_EMAIL_ADDRESS = normalizeAuthIdentifier(process.env.ADMIN_EMAIL || process.env.ADMIN_RESET_EMAIL || "");
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const PASSWORD_BCRYPT_COST = Math.min(14, Math.max(12, Number(process.env.PASSWORD_BCRYPT_COST) || 12));
const PASSWORD_RESET_TOKEN_TTL_SECONDS = 15 * 60;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 60;
const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60;
const ACCOUNT_LOCK_SECONDS = 15 * 60;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const CAPTCHA_AFTER_FAILED_ATTEMPTS = 3;
const LOGIN_MIN_RESPONSE_MS = 450;
const LOGIN_MAX_PROGRESSIVE_DELAY_MS = 4000;
const REDIS_URL = process.env.REDIS_URL || "";
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || "";
const CAPTCHA_VERIFY_URL = process.env.CAPTCHA_VERIFY_URL || "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const ADMIN_ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || "")
  .split(",")
  .map((ip) => normalizeIp(ip))
  .filter(Boolean);

const missingEnv = [
  "JWT_SECRET", "SHEET_ID", "SHEET_URL", "DRIVE_FOLDER_ID",
  "ADMIN_PASSWORD_HASH", "CLIENT_ID", "CLIENT_SECRET", "DRIVE_REFRESH_TOKEN"
].filter((name) => !process.env[name]);

if (!ADMIN_LOGIN_IDENTIFIER) {
  missingEnv.push("ADMIN_EMAIL or ADMIN_USER");
}

if (!GOOGLE_SIGNIN_CLIENT_ID) {
  missingEnv.push("GOOGLE_SIGNIN_CLIENT_ID or GOOGLE_CLIENT_ID or CLIENT_ID");
}

if (isProduction && !REDIS_URL) {
  missingEnv.push("REDIS_URL");
}

if (isProduction && !CAPTCHA_SECRET) {
  missingEnv.push("CAPTCHA_SECRET");
}

if (missingEnv.length > 0) {
  console.error(`FATAL ERROR: Missing required env vars: ${missingEnv.join(", ")}`);
  process.exit(1);
}

if (process.env.ADMIN_PASS) {
  console.warn("SECURITY WARNING: ADMIN_PASS is ignored. Generate and set ADMIN_PASSWORD_HASH instead.");
}

if (!ADMIN_EMAIL_ADDRESS) {
  console.warn("PASSWORD RESET WARNING: Set ADMIN_EMAIL or ADMIN_RESET_EMAIL to send admin reset links.");
}

if (!RESEND_API_KEY || !PASSWORD_RESET_FROM) {
  console.warn("PASSWORD RESET WARNING: Set RESEND_API_KEY and PASSWORD_RESET_FROM to email reset links.");
}

try {
  const passwordHashRounds = bcrypt.getRounds(ADMIN_PASSWORD_HASH);
  if (passwordHashRounds < 12) {
    throw new Error("ADMIN_PASSWORD_HASH must be a bcrypt hash with cost 12 or higher.");
  }
} catch (err) {
  console.error("FATAL ERROR:", err.message || "ADMIN_PASSWORD_HASH must be a valid bcrypt hash.");
  process.exit(1);
}

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-the-real-admin-password", PASSWORD_BCRYPT_COST);

if (SECRET.length < 32) {
  console.error("FATAL ERROR: JWT_SECRET must be at least 32 characters.");
  process.exit(1);
}

try {
  const parsedSheetUrl = new URL(SHEET_URL);
  if (parsedSheetUrl.protocol !== "https:" || parsedSheetUrl.hostname !== "docs.google.com") {
    throw new Error("SHEET_URL must be an https://docs.google.com URL.");
  }
} catch (err) {
  console.error("FATAL ERROR:", err.message);
  process.exit(1);
}

const app = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax"
};
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_MS;

let papersCache = { expiresAt: 0, data: [] };
let paperOptionsCache = { expiresAt: 0, data: [] };
let assistantSheetsAuthClient = null;
let googleServiceAuthClient = null;
let assistantSheetReady = false;
let assistantSheetLogDisabled = false;
const googleSignInClient = new google.auth.OAuth2(GOOGLE_SIGNIN_CLIENT_ID);
const invalidatePapersCache = () => {
  papersCache = { expiresAt: 0, data: [] };
  paperOptionsCache = { expiresAt: 0, data: [] };
};

// --- SETTINGS MEMORY LOCAL CACHES ---
let blockedUsersCache = { expiresAt: 0, data: new Set() };
let customRepliesCache = { expiresAt: 0, data: [] };
const ADMIN_SETTINGS_CACHE_MS = 1 * 60 * 1000;

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseTableUrl(tableName, query = "") {
  return `${SUPABASE_URL}/rest/v1/${encodeURIComponent(tableName)}${query ? `?${query}` : ""}`;
}

function postgrestEqFilter(column, value, maxLength = 500) {
  return `${encodeURIComponent(column)}=eq.${encodeURIComponent(normalizeText(value, maxLength))}`;
}

function normalizeUuid(value) {
  const text = normalizeText(value, 80).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(text)
    ? text
    : "";
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

function toSupabasePaperRow(paper, extras = {}) {
  return {
    course: sanitizePaperText(paper.course, 60),
    year: sanitizePaperText(paper.year, 30),
    specialization: sanitizePaperText(paper.spec || paper.specialization, 100),
    semester: sanitizePaperText(paper.sem || paper.semester, 30),
    exam: sanitizePaperText(paper.exam, 30),
    title: sanitizePaperText(paper.name, 160),
    drive_url: safePaperUrl(extras.link ?? paper.link),
    drive_file_id: normalizeText(extras.driveFileId ?? paper.driveFileId, 160),
    updated_at: new Date().toISOString()
  };
}

function paperFromSupabaseRow(row = {}) {
  const spec = sanitizePaperText(row.specialization || row.spec, 100);
  const sem = sanitizePaperText(row.semester || row.sem, 30);
  return {
    id: row.id,
    index: row.id,
    course: sanitizePaperText(row.course, 60),
    year: sanitizePaperText(row.year, 30),
    spec,
    specialization: spec,
    sem,
    semester: sem,
    exam: sanitizePaperText(row.exam, 30),
    name: sanitizePaperText(row.title || row.name, 160),
    link: safePaperUrl(row.drive_url || row.link),
    driveFileId: normalizeText(row.drive_file_id || row.driveFileId, 160)
  };
}

function paperOptionFromSupabaseRow(row = {}) {
  return {
    course: sanitizePaperText(row.course, 60),
    year: sanitizePaperText(row.year, 30),
    specialization: sanitizePaperText(row.specialization || row.spec, 100),
    sem: sanitizePaperText(row.semester || row.sem, 30),
    semester: sanitizePaperText(row.semester || row.sem, 30),
    exam: sanitizePaperText(row.exam, 30)
  };
}

function optionKey(option = {}) {
  return [
    option.course,
    option.year,
    option.specialization || option.spec || "",
    option.sem || option.semester || "",
    option.exam
  ].join("\u001F");
}

function buildPaperOptions(items = []) {
  const seen = new Set();
  const options = [];

  for (const item of items) {
    const option = {
      course: sanitizePaperText(item.course, 60),
      year: sanitizePaperText(item.year, 30),
      specialization: sanitizePaperText(item.specialization || item.spec, 100),
      sem: sanitizePaperText(item.sem || item.semester, 30),
      semester: sanitizePaperText(item.sem || item.semester, 30),
      exam: sanitizePaperText(item.exam, 30)
    };
    if (!option.course || !option.year || !option.sem || !option.exam) continue;
    const key = optionKey(option);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(option);
  }

  return options.sort((a, b) =>
    `${a.course}-${a.year}-${a.specialization}-${a.sem}-${a.exam}`
      .localeCompare(`${b.course}-${b.year}-${b.specialization}-${b.sem}-${b.exam}`)
  );
}

function normalizeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function stripHtmlAndJs(value, maxLength = MAX_TEXT_LENGTH) {
  return normalizeText(value, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, " ")
    .replace(/javascript\s*:/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeFreeText(value, maxLength = MAX_TEXT_LENGTH) {
  return stripHtmlAndJs(value, maxLength)
    .replace(/[^a-zA-Z0-9\s.,!?'"()&:/+\-_@#;|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizePaperText(value, maxLength = MAX_TEXT_LENGTH) {
  return sanitizeFreeText(value, maxLength);
}

function safeHttpUrl(value, maxLength = 500) {
  const text = normalizeText(value, maxLength);
  if (!text) return "";
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function safePaperUrl(value, maxLength = 500) {
  const href = safeHttpUrl(value, maxLength);
  if (!href) return "";
  try {
    const parsed = new URL(href);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "drive.google.com" || hostname === "docs.google.com" ? parsed.href : "";
  } catch {
    return "";
  }
}

function normalizeAuthIdentifier(value) {
  return normalizeText(value, 254).toLowerCase();
}

function safeCompare(a, b) {
  const left = crypto.createHash("sha256").update(String(a || "")).digest();
  const right = crypto.createHash("sha256").update(String(b || "")).digest();
  return crypto.timingSafeEqual(left, right);
}

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const USERNAME_PATTERN = /^[a-z0-9._@-]+$/i;

const emailSchema = z.preprocess(
  (value) => normalizeAuthIdentifier(value),
  z.string()
    .min(3)
    .max(254)
    .regex(EMAIL_PATTERN)
);

const loginIdentifierSchema = z.preprocess(
  (value) => normalizeAuthIdentifier(value),
  z.string()
    .min(3)
    .max(254)
    .refine((value) => EMAIL_PATTERN.test(value) || USERNAME_PATTERN.test(value))
);

const passwordInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string()
    .min(8)
    .max(128)
    .regex(/^[\x20-\x7E]+$/)
);

const newPasswordInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string()
    .min(10)
    .max(128)
    .regex(/^[\x20-\x7E]+$/)
);

const captchaTokenSchema = z.preprocess(
  (value) => normalizeText(value, 2048),
  z.string()
    .max(2048)
    .regex(/^[a-zA-Z0-9._:-]*$/)
);

function freeTextSchema(maxLength, minLength = 1) {
  return z.preprocess(
    (value) => sanitizeFreeText(value, maxLength),
    z.string()
      .min(minLength)
      .max(maxLength)
      .regex(/^[a-zA-Z0-9\s.,!?'"()&:/+\-_@#;|]*$/)
  );
}

const loginBodySchema = z.object({
  email: loginIdentifierSchema.optional(),
  username: loginIdentifierSchema.optional(),
  password: passwordInputSchema,
  captchaToken: captchaTokenSchema.optional()
}).passthrough().transform((value) => ({
  identifier: value.email || value.username || "",
  password: value.password,
  captchaToken: value.captchaToken || ""
})).refine((value) => Boolean(value.identifier));

const passwordResetBodySchema = z.object({
  email: emailSchema
}).passthrough();

const resetTokenSchema = z.preprocess(
  (value) => normalizeText(value, 160),
  z.string()
    .min(32)
    .max(160)
    .regex(/^[a-zA-Z0-9_-]+$/)
);

const passwordResetConfirmBodySchema = z.object({
  token: resetTokenSchema,
  password: newPasswordInputSchema
}).passthrough();

const emailBodySchema = z.object({
  email: emailSchema
}).passthrough();

const googleCredentialSchema = z.preprocess(
  (value) => normalizeText(value, 3000),
  z.string()
    .min(20)
    .max(3000)
    .regex(/^[a-zA-Z0-9_.=-]+$/)
);

const assistantSearchBodySchema = z.object({
  credential: googleCredentialSchema,
  question: freeTextSchema(MAX_ASSISTANT_TEXT_LENGTH, 2)
}).passthrough();

const customReplyBodySchema = z.object({
  keyword: freeTextSchema(200, 1),
  reply: freeTextSchema(1000, 1)
}).passthrough();

const customReplyDeleteBodySchema = z.object({
  keyword: freeTextSchema(200, 1)
}).passthrough();

function sheetCell(value, maxLength = MAX_TEXT_LENGTH) {
  const text = normalizeText(value, maxLength);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function sheetRange(tabName, range) {
  const safeTabName = String(tabName || "").replace(/'/g, "''");
  return `'${safeTabName}'!${range}`;
}

function normalizeSearchText(value, maxLength = MAX_ASSISTANT_TEXT_LENGTH) {
  return normalizeText(value, maxLength)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function getUniquePaperValues(papers, field) {
  return [...new Set((papers || []).map((paper) => paper?.[field]).filter(Boolean))];
}

const COURSE_QUERY_ALIASES = [
  { value: "B.Arch", terms: ["barch", "b arch", "b.arch", "architecture"] },
  { value: "B.Com", terms: ["bcom", "b com", "b.com"] },
  { value: "B.Des", terms: ["bdes", "b des", "b.des"] },
  { value: "B.Sc", terms: ["bsc", "b sc", "b.sc"] },
  { value: "B.Tech", terms: ["btech", "b tech", "b.tech", "bachelor of technology"] },
  { value: "BBA", terms: ["bba", "b b a", "b.b.a"] },
  { value: "BCA", terms: ["bca", "b c a", "b.c.a"] },
  { value: "BVA", terms: ["bva", "b v a", "b.v.a"] },
  { value: "M.Plan", terms: ["mplan", "m plan", "m.plan"] },
  { value: "M.Tech", terms: ["mtech", "m tech", "m.tech"] },
  { value: "MBA", terms: ["mba", "m b a", "m.b.a"] },
  { value: "MCA", terms: ["mca", "m c a", "m.c.a"] },
  { value: "Ph.D", terms: ["phd", "ph d", "ph.d", "doctorate"] }
];

function findKnownValueInQuery(query, values) {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = compactSearchText(query);

  return [...new Set(values || [])]
    .sort((a, b) => String(b).length - String(a).length)
    .find((value) => {
      const normalizedValue = normalizeSearchText(value);
      if (!normalizedValue) return false;
      return ` ${normalizedQuery} `.includes(` ${normalizedValue} `) ||
        compactQuery.includes(compactSearchText(value));
    }) || "";
}

function findKnownCourseInQuery(query, values) {
  const directMatch = findKnownValueInQuery(query, values);
  if (directMatch) return directMatch;

  const availableCourses = [...new Set(values || [])];
  const normalizedQuery = ` ${normalizeSearchText(query)} `;
  const compactQuery = compactSearchText(query);

  for (const alias of COURSE_QUERY_ALIASES) {
    const course = availableCourses.find((value) => sameSearchValue(value, alias.value) ||
      compactSearchText(value) === compactSearchText(alias.value));
    if (!course) continue;

    const terms = [alias.value, ...(alias.terms || [])];
    if (terms.some((term) => {
      const normalizedTerm = normalizeSearchText(term);
      return normalizedTerm && (
        normalizedQuery.includes(` ${normalizedTerm} `) ||
        compactQuery.includes(compactSearchText(term))
      );
    })) {
      return course;
    }
  }

  return "";
}

function parseNumberedField(query, labelPattern, max) {
  const normalizedQuery = normalizeSearchText(query);
  const numberPattern = max === 10 ? "10|[1-9]" : `[1-${max}]`;
  const match = normalizedQuery.match(new RegExp(`\\b(${numberPattern})(?:st|nd|rd|th)?\\s*(?:${labelPattern})\\b`));
  return match ? Number(match[1]) : null;
}

function getAssistantQueryTokens(query) {
  const ignored = new Set([
    "a", "an", "and", "are", "by", "find", "for", "from", "give", "i", "in", "is", "link",
    "me", "need", "of", "paper", "papers", "pdf", "please", "poornima", "previous", "pu",
    "pyqp", "question", "questions", "semester", "show", "the", "to", "university", "with",
    "year", "yr", "sem", "exam", "assistant", "can", "could", "hello", "help", "hey", "hi",
    "name", "what", "who", "would", "you", "your"
  ]);

  return normalizeSearchText(query)
    .split(" ")
    .filter((token) => token.length > 1 && !ignored.has(token));
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}

function normalizeKnownPaperValue(value, values) {
  const text = normalizeText(value, 160);
  if (!text) return "";
  return findKnownValueInQuery(text, values) || "";
}

function normalizeAssistantYear(value, values) {
  const text = normalizeText(value, 30);
  if (!text) return "";
  const numbered = normalizeSearchText(text).match(/\b([1-5])\b/);
  if (numbered) return `${Number(numbered[1])} Year`;
  return normalizeKnownPaperValue(text, values);
}

function normalizeAssistantSemester(value, values) {
  const text = normalizeText(value, 30);
  if (!text) return "";
  const numbered = normalizeSearchText(text).match(/\b(10|[1-9])\b/);
  if (numbered) return `${Number(numbered[1])} Sem`;
  return normalizeKnownPaperValue(text, values);
}

function getRequiredAssistantTokens(parsedQuery) {
  const required = [];
  if (parsedQuery.course) required.push(...getCourseStructuredTokens(parsedQuery.course));
  if (parsedQuery.year) required.push(...getAssistantQueryTokens(parsedQuery.year));
  if (parsedQuery.sem) required.push(...getAssistantQueryTokens(parsedQuery.sem));
  if (parsedQuery.exam) required.push(...getAssistantQueryTokens(parsedQuery.exam));
  return uniqueStrings(required);
}

function getCourseStructuredTokens(course) {
  if (!course) return [];

  const tokens = new Set([
    ...getAssistantQueryTokens(course),
    compactSearchText(course)
  ].filter((token) => token && token.length > 1));

  const alias = COURSE_QUERY_ALIASES.find((item) => sameSearchValue(item.value, course) ||
    compactSearchText(item.value) === compactSearchText(course));
  if (alias) {
    for (const term of alias.terms || []) {
      tokens.add(compactSearchText(term));
      getAssistantQueryTokens(term).forEach((token) => tokens.add(token));
    }
  }

  return [...tokens];
}

function getAssistantSubjectTokens(tokens, parsedQuery) {
  const structured = new Set([
    ...(parsedQuery.requiredTokens || getRequiredAssistantTokens(parsedQuery)),
    ...getCourseStructuredTokens(parsedQuery.course),
    ...getAssistantQueryTokens(parsedQuery.spec || ""),
    ...getAssistantQueryTokens(parsedQuery.year || ""),
    ...getAssistantQueryTokens(parsedQuery.sem || ""),
    ...getAssistantQueryTokens(parsedQuery.exam || "")
  ]);

  return uniqueStrings(tokens || [])
    .map((token) => normalizeSearchText(token, 40))
    .filter((token) => token && !structured.has(token));
}

function finalizeAssistantQuery(query) {
  const requiredTokens = getRequiredAssistantTokens(query);
  return {
    ...query,
    requiredTokens,
    subjectTokens: getAssistantSubjectTokens(query.tokens || [], { ...query, requiredTokens })
  };
}

function getAssistantTokenVariants(token) {
  const normalized = normalizeSearchText(token, 40);
  const variants = new Set([normalized]);
  if (normalized === "maths") variants.add("math");
  if (normalized === "math") variants.add("mathematics");
  if (normalized.endsWith("s") && normalized.length > 4) variants.add(normalized.slice(0, -1));
  return [...variants].filter(Boolean);
}

function assistantTokenMatches(text, compactText, token) {
  return getAssistantTokenVariants(token).some((variant) =>
    text.includes(variant) || compactText.includes(variant)
  );
}

function parseJsonObjectFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function mergeAssistantQuery(localQuery, aiQuery, papers) {
  if (!aiQuery || typeof aiQuery !== "object") {
    return finalizeAssistantQuery(localQuery);
  }

  const courses = getUniquePaperValues(papers, "course");
  const specs = getUniquePaperValues(papers, "spec");
  const years = getUniquePaperValues(papers, "year");
  const semesters = getUniquePaperValues(papers, "sem");
  const aiTokens = [
    ...getAssistantQueryTokens(aiQuery.paper || ""),
    ...getAssistantQueryTokens(aiQuery.subject || ""),
    ...getAssistantQueryTokens(aiQuery.specialization || aiQuery.spec || "")
  ];

  if (Array.isArray(aiQuery.tokens)) {
    aiTokens.push(...aiQuery.tokens.map((token) => normalizeSearchText(token, 40)).filter(Boolean));
  }

  const merged = {
    course: localQuery.course || findKnownCourseInQuery(aiQuery.course, courses),
    spec: localQuery.spec || normalizeKnownPaperValue(aiQuery.spec || aiQuery.specialization, specs),
    year: localQuery.year || normalizeAssistantYear(aiQuery.year, years),
    sem: localQuery.sem || normalizeAssistantSemester(aiQuery.sem || aiQuery.semester, semesters),
    exam: localQuery.exam, 
    tokens: uniqueStrings([...(localQuery.tokens || []), ...aiTokens])
  };

  return finalizeAssistantQuery(merged);
}

function parseAssistantQuery(query, papers) {
  const course = findKnownCourseInQuery(query, getUniquePaperValues(papers, "course"));
  const spec = findKnownValueInQuery(query, getUniquePaperValues(papers, "spec"));
  const yearNumber = parseNumberedField(query, "year|yr", 5);
  const semNumber = parseNumberedField(query, "sem|semester", 10);
  const examMatch = normalizeSearchText(query).match(/\b(mse|ese)\b/);

  return {
    course,
    spec,
    year: yearNumber ? `${yearNumber} Year` : "",
    sem: semNumber ? `${semNumber} Sem` : "",
    exam: examMatch ? examMatch[1].toUpperCase() : "",
    tokens: getAssistantQueryTokens(query)
  };
}

async function parseAssistantQueryWithSarvam(question, papers) {
  if (!SARVAM_API_KEY) return null;

  const courses = getUniquePaperValues(papers, "course").slice(0, 80);
  const specs = getUniquePaperValues(papers, "spec").slice(0, 80); 
  const years = getUniquePaperValues(papers, "year").slice(0, 20);
  const semesters = getUniquePaperValues(papers, "sem").slice(0, 30);
  const exams = getUniquePaperValues(papers, "exam").slice(0, 10);

  const systemPrompt = [
    "You extract search fields for a Poornima University previous-year question paper finder.",
    "Return only JSON with these keys: course, year, spec, sem, exam, paper, tokens.",
    "CRITICAL: If the user does not explicitly write the semester, year, or exam (MSE/ESE), you MUST leave them empty strings. DO NOT GUESS.",
    "Use empty string for unknown fields. tokens must contain important subject/title words only."
  ].join(" ");

  const userPrompt = [
    `Allowed courses: ${courses.join(", ")}`,
    `Allowed specializations: ${specs.join(", ")}`, 
    `Allowed years: ${years.join(", ")}`,
    `Allowed semesters: ${semesters.join(", ")}`,
    `Allowed exams: ${exams.join(", ")}`,
    `Student query: ${question}`
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: SARVAM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: "json_object" },
        reasoning_effort: null
      })
    });

    if (!response.ok) throw new Error(`Sarvam returned ${response.status}`);

    const data = await response.json();
    const text = normalizeText(data.choices?.[0]?.message?.content || "", 1200);
    const parsed = parseJsonObjectFromText(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    console.error("Sarvam assistant parser skipped:", err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getPaperPayload(body) {
  return {
    course: sanitizePaperText(body.course, 60),
    year: sanitizePaperText(body.year, 30),
    spec: sanitizePaperText(body.spec, 100),
    sem: sanitizePaperText(body.sem, 30),
    exam: sanitizePaperText(body.exam, 30),
    name: sanitizePaperText(body.name, 160)
  };
}

function getExpectedPaperPayload(body) {
  return {
    course: sanitizePaperText(body.expectedCourse, 60),
    year: sanitizePaperText(body.expectedYear, 30),
    spec: sanitizePaperText(body.expectedSpec, 100),
    sem: sanitizePaperText(body.expectedSem, 30),
    exam: sanitizePaperText(body.expectedExam, 30),
    name: sanitizePaperText(body.expectedName, 160)
  };
}

function hasAllPaperFields(paper) {
  return paper.course && paper.year && paper.spec && paper.sem && paper.exam && paper.name;
}

function paperMatchesExpectedSnapshot(existingPaper, expectedPaper) {
  if (!existingPaper || !hasAllPaperFields(expectedPaper)) return false;
  return rowMatchesPaper([
    existingPaper.course,
    existingPaper.year,
    existingPaper.spec || existingPaper.specialization,
    existingPaper.sem || existingPaper.semester,
    existingPaper.exam,
    existingPaper.name
  ], expectedPaper);
}

function hasPaperSlotFields(paper) {
  return paper.course && paper.year && paper.spec && paper.sem && paper.exam;
}

function parseSheetRowIndex(index, rows) {
  const rowIndex = Number(index);
  if (!Number.isSafeInteger(rowIndex) || rowIndex < 2 || rowIndex > rows.length) return null;
  return rowIndex;
}

function parseUpdatedRangeRow(range) {
  const match = String(range || "").match(/![A-Z]+(\d+):/);
  const rowIndex = Number(match?.[1]);
  return Number.isSafeInteger(rowIndex) ? rowIndex : null;
}

function rowMatchesPaper(row = [], paper) {
  return sanitizePaperText(row[0], 60) === paper.course &&
    sanitizePaperText(row[1], 30) === paper.year &&
    sanitizePaperText(row[2], 100) === paper.spec &&
    sanitizePaperText(row[3], 30) === paper.sem &&
    sanitizePaperText(row[4], 30) === paper.exam &&
    sanitizePaperText(row[5], 160) === paper.name;
}

function rowMatchesPaperSlot(row = [], paper) {
  return sanitizePaperText(row[0], 60) === paper.course &&
    sanitizePaperText(row[1], 30) === paper.year &&
    sanitizePaperText(row[2], 100) === paper.spec &&
    sanitizePaperText(row[3], 30) === paper.sem &&
    sanitizePaperText(row[4], 30) === paper.exam;
}

function resolveExpectedSheetRowIndex(index, rows, expectedPaper) {
  if (!hasPaperSlotFields(expectedPaper)) return null;

  const rowIndex = parseSheetRowIndex(index, rows);
  if (rowIndex && rowMatchesPaperSlot(rows[rowIndex - 1], expectedPaper)) return rowIndex;

  if (!hasAllPaperFields(expectedPaper)) return null;
  for (let i = 1; i < rows.length; i++) {
    if (rowMatchesPaper(rows[i], expectedPaper)) return i + 1;
  }

  return null;
}

function rowHasBlankPaperData(row = []) {
  return !sanitizePaperText(row[5], 160) && !safePaperUrl(row[6]);
}

function paperFromSheetRow(row = [], index = null) {
  const spec = sanitizePaperText(row[2], 100);
  const sem = sanitizePaperText(row[3], 30);
  return {
    index,
    course: sanitizePaperText(row[0], 60),
    year: sanitizePaperText(row[1], 30),
    spec,
    specialization: spec,
    sem,
    semester: sem,
    exam: sanitizePaperText(row[4], 30),
    name: sanitizePaperText(row[5], 160),
    link: safePaperUrl(row[6])
  };
}

function isPublicPaper(paper) {
  return paper.course && paper.year && paper.sem && paper.exam && paper.name && paper.link;
}

function isAdminSheetRow(paper) {
  return paper.course && paper.year && paper.sem && paper.exam;
}

function sameSearchValue(left, right) {
  return normalizeSearchText(left) === normalizeSearchText(right);
}

function assistantPaperText(paper) {
  return normalizeSearchText([
    paper.course, paper.year, paper.spec, paper.specialization,
    paper.sem, paper.semester, paper.exam, paper.name
  ].filter(Boolean).join(" "));
}

function scoreAssistantPaper(paper, parsedQuery) {
  if (parsedQuery.course && !sameSearchValue(paper.course, parsedQuery.course)) return 0;
  if (parsedQuery.spec && !sameSearchValue(paper.spec, parsedQuery.spec)) return 0;
  if (parsedQuery.year && !sameSearchValue(paper.year, parsedQuery.year)) return 0;
  if (parsedQuery.sem && !sameSearchValue(paper.sem, parsedQuery.sem)) return 0;
  if (parsedQuery.exam && !sameSearchValue(paper.exam, parsedQuery.exam)) return 0;

  let score = 0;
  if (parsedQuery.course) score += 40;
  if (parsedQuery.spec) score += 30;
  if (parsedQuery.year) score += 16;
  if (parsedQuery.sem) score += 14;
  if (parsedQuery.exam) score += 14;

  const text = assistantPaperText(paper);
  const compactText = compactSearchText(text);
  const subjectText = normalizeSearchText([paper.spec, paper.specialization, paper.name].filter(Boolean).join(" "));
  const compactSubjectText = compactSearchText(subjectText);
  const tokens = parsedQuery.tokens || [];
  const requiredTokens = parsedQuery.requiredTokens || [];
  const subjectTokens = parsedQuery.subjectTokens || [];
  let matchedTokens = 0;
  let matchedRequiredTokens = 0;
  let matchedSubjectTokens = 0;

  for (const token of tokens) {
    if (assistantTokenMatches(text, compactText, token)) {
      score += token.length > 3 ? 6 : 3;
      matchedTokens++;
      if (requiredTokens.includes(token)) matchedRequiredTokens++;
    }

    if (subjectTokens.includes(token) && assistantTokenMatches(subjectText, compactSubjectText, token)) {
      matchedSubjectTokens++;
    }
  }

  if (requiredTokens.length > 0 && matchedRequiredTokens === 0) return 0;
  if (subjectTokens.length > 0 && matchedSubjectTokens === 0) return 0;
  if (tokens.length > 0 && matchedTokens === 0 && score === 0) return 0;
  return score;
}

function formatAssistantResult(paper) {
  return {
    course: sanitizePaperText(paper.course, 60),
    year: sanitizePaperText(paper.year, 30),
    specialization: sanitizePaperText(paper.spec || paper.specialization || "", 100),
    sem: sanitizePaperText(paper.sem || paper.semester || "", 30),
    exam: sanitizePaperText(paper.exam, 30),
    name: sanitizePaperText(paper.name, 160),
    link: safePaperUrl(paper.link)
  };
}

function publicPaperDedupeKey(paper) {
  return [
    normalizeSearchText(paper.course),
    normalizeSearchText(paper.year),
    normalizeSearchText(paper.spec || paper.specialization),
    normalizeSearchText(paper.sem || paper.semester),
    normalizeSearchText(paper.exam),
    normalizeSearchText(paper.name),
    safePaperUrl(paper.link).toLowerCase()
  ].join("|");
}

function assistantPaperDedupeKey(paper) {
  return [
    normalizeSearchText(paper.course),
    normalizeSearchText(paper.year),
    normalizeSearchText(paper.spec || paper.specialization), 
    normalizeSearchText(paper.sem || paper.semester),
    normalizeSearchText(paper.exam), 
    normalizeSearchText(paper.name)
  ].join("|");
}

function dedupePapers(papers, getKey = publicPaperDedupeKey) {
  const seen = new Set();
  const result = [];

  for (const paper of papers || []) {
    const key = getKey(paper);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(paper);
  }

  return result;
}

function dedupeScoredAssistantPapers(items) {
  const seen = new Set();
  const result = [];

  for (const item of items || []) {
    const key = assistantPaperDedupeKey(item.paper);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function searchAssistantPapers(papers, question, aiQuery = null) {
  const parsedQuery = mergeAssistantQuery(parseAssistantQuery(question, papers), aiQuery, papers);
  const hasStructuredHint = Boolean(parsedQuery.course || parsedQuery.spec || parsedQuery.year || parsedQuery.sem || parsedQuery.exam);
  const hasUsefulText = parsedQuery.tokens.length > 0;

  if (!hasStructuredHint && !hasUsefulText) {
    return {
      status: "need_more",
      results: [],
      message: "Please type course, year, semester, exam, or paper name."
    };
  }

  const scoredResults = (papers || [])
    .map((paper) => ({ paper, score: scoreAssistantPaper(paper, parsedQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.paper.name.localeCompare(b.paper.name));

  const results = dedupeScoredAssistantPapers(scoredResults)
    .slice(0, ASSISTANT_MAX_RESULTS)
    .map((item) => formatAssistantResult(item.paper));

  if (results.length === 0) {
    return {
      status: "not_found",
      results,
      message: "Paper not available. Please send feedback to Central Library to add this paper."
    };
  }

  return {
    status: "found",
    results,
    message: results.length === 1 ? "I found this paper." : `I found ${results.length} matching papers.`
  };
}

// --- UPGRADED DUAL-WRITE SETTINGS LOGIC (Supabase + Google Sheets Backup) ---

async function ensureAdminSettingsSheets(sheets) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties.title"
  });
  const existsBlocked = spreadsheet.data.sheets.some(s => s.properties.title === "Blocked Users");
  const existsReplies = spreadsheet.data.sheets.some(s => s.properties.title === "Custom Replies");

  const requests = [];
  if (!existsBlocked) requests.push({ addSheet: { properties: { title: "Blocked Users" } } });
  if (!existsReplies) requests.push({ addSheet: { properties: { title: "Custom Replies" } } });

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests }
    });
    
    if (!existsBlocked) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID, range: "'Blocked Users'!A1:B1", valueInputOption: "RAW",
        requestBody: { values: [["Email", "Date"]] }
      });
    }
    if (!existsReplies) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID, range: "'Custom Replies'!A1:B1", valueInputOption: "RAW",
        requestBody: { values: [["Keyword", "Reply"]] }
      });
    }
  }
}

async function getBlockedUsers() {
  if (Date.now() < blockedUsersCache.expiresAt) return Array.from(blockedUsersCache.data);
  try {
    const rows = await supabaseSelectAll('blocked_users', { select: 'email' });
    const emails = (rows || []).map(r => normalizeText(r.email, 254).toLowerCase()).filter(Boolean);
    blockedUsersCache = { expiresAt: Date.now() + ADMIN_SETTINGS_CACHE_MS, data: new Set(emails) };
    return emails;
  } catch (e) {
    console.error("Failed to query blocked_users table:", e.message);
    return Array.from(blockedUsersCache.data);
  }
}

async function addBlockedUser(email) {
  const normalized = normalizeText(email, 254).toLowerCase();
  
  // 1. Save to Supabase (Primary)
  try {
    await supabaseRequest('blocked_users', { method: "POST", body: { email: normalized } });
  } catch (e) { console.error("Supabase blocked_users write failed:", e.message); }

  // 2. Backup to Google Sheets
  try {
    const sheets = await getServiceSheets();
    await ensureAdminSettingsSheets(sheets);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: "'Blocked Users'!A:B", valueInputOption: "RAW",
      requestBody: { values: [[normalized, new Date().toLocaleString()]] }
    });
  } catch (e) { console.error("Sheets blocked_users write failed:", e.message); }

  blockedUsersCache.expiresAt = 0;
}

async function removeBlockedUser(email) {
  const normalized = normalizeText(email, 254).toLowerCase();
  
  // 1. Delete from Supabase (Primary)
  try {
    await supabaseRequest('blocked_users', { method: "DELETE", query: postgrestEqFilter("email", normalized, 254) });
  } catch (e) { console.error("Supabase blocked_users delete failed:", e.message); }

  // 2. Delete from Google Sheets Backup
  try {
    const sheets = await getServiceSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "'Blocked Users'!A:A" });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(r => (r[0]||"").toLowerCase() === normalized);
    
    if (rowIndex > 0) { 
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === "Blocked Users").properties.sheetId;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 } } }] }
      });
    }
  } catch (e) { console.error("Sheets blocked_users delete failed:", e.message); }

  blockedUsersCache.expiresAt = 0;
}

async function getCustomReplies() {
  if (Date.now() < customRepliesCache.expiresAt) return customRepliesCache.data;
  try {
    const rows = await supabaseSelectAll('custom_replies', { select: 'keyword,reply' });
    const replies = (rows || []).map(r => ({
      keyword: sanitizeFreeText(r.keyword, 200).toLowerCase(),
      reply: sanitizeFreeText(r.reply, 1000)
    })).filter(r => r.keyword && r.reply);
    customRepliesCache = { expiresAt: Date.now() + ADMIN_SETTINGS_CACHE_MS, data: replies };
    return replies;
  } catch (e) {
    console.error("Failed to query custom_replies table:", e.message);
    return customRepliesCache.data;
  }
}

function splitCustomReplyKeywords(keyword) {
  return sanitizeFreeText(keyword, 300)
    .split(/[|,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function customReplyKeywordMatches(question, keyword) {
  const normalizedQuestion = ` ${normalizeSearchText(question)} `;
  const compactQuestion = compactSearchText(question);
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return false;

  if (normalizedQuestion.includes(` ${normalizedKeyword} `)) return true;
  if (compactQuestion.includes(compactSearchText(keyword))) return true;

  const keywordTokens = getAssistantQueryTokens(keyword);
  if (keywordTokens.length === 0) return false;
  return keywordTokens.every((token) => normalizedQuestion.includes(` ${token} `));
}

function findCustomReplyForQuestion(question, replies) {
  let bestMatch = null;
  let bestScore = 0;

  for (const reply of replies || []) {
    for (const keyword of splitCustomReplyKeywords(reply.keyword)) {
      if (!customReplyKeywordMatches(question, keyword)) continue;
      const score = normalizeSearchText(keyword).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = reply;
      }
    }
  }

  return bestMatch;
}

async function addCustomReply(keyword, reply) {
  const k = sanitizeFreeText(keyword, 200).toLowerCase();
  const r = sanitizeFreeText(reply, 1000);
  
  // 1. Save to Supabase (Primary)
  try {
    try { await supabaseRequest('custom_replies', { method: "DELETE", query: postgrestEqFilter("keyword", k, 200) }); } catch(err) {}
    await supabaseRequest('custom_replies', { method: "POST", body: { keyword: k, reply: r } });
  } catch (e) { console.error("Supabase custom_replies write failed:", e.message); }

  // 2. Backup to Google Sheets
  try {
    const sheets = await getServiceSheets();
    await ensureAdminSettingsSheets(sheets);
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "'Custom Replies'!A:A" });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(row => (row[0]||"").toLowerCase() === k);
    
    if (rowIndex > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID, range: `'Custom Replies'!A${rowIndex+1}:B${rowIndex+1}`, valueInputOption: "RAW",
        requestBody: { values: [[k, r]] }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: "'Custom Replies'!A:B", valueInputOption: "RAW",
        requestBody: { values: [[k, r]] }
      });
    }
  } catch (e) { console.error("Sheets custom_replies write failed:", e.message); }

  customRepliesCache.expiresAt = 0;
}

async function deleteCustomReply(keyword) {
  const k = sanitizeFreeText(keyword, 200).toLowerCase();
  
  // 1. Delete from Supabase (Primary)
  try {
    await supabaseRequest('custom_replies', { method: "DELETE", query: postgrestEqFilter("keyword", k, 200) });
  } catch (e) { console.error("Supabase custom_replies delete failed:", e.message); }

  // 2. Delete from Google Sheets Backup
  try {
    const sheets = await getServiceSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "'Custom Replies'!A:A" });
    const rows = res.data.values || [];
    const rowIndex = rows.findIndex(row => (row[0]||"").toLowerCase() === k);
    
    if (rowIndex > 0) {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === "Custom Replies").properties.sheetId;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 } } }] }
      });
    }
  } catch (e) { console.error("Sheets custom_replies delete failed:", e.message); }

  customRepliesCache.expiresAt = 0;
}

async function saveAssistantRequestLog(logData) {
  // 1. Save to Supabase (Primary Fast Querying)
  try {
    await supabaseRequest('student_queries', {
      method: "POST",
      body: {
        email: normalizeText(logData.email, 254),
        question: sanitizeFreeText(logData.question, 500),
        status: normalizeText(logData.status, 30),
        message: normalizeText(logData.message, 200),
        paper_name: normalizeText(logData.topResult?.name || "", 160)
      }
    });
  } catch (err) { console.error("Supabase student_queries logging write crash:", err.message); }

  // 2. Backup to Google Sheets
  if (!assistantSheetLogDisabled) {
    appendAssistantRequestToSheet(logData).catch((err) => {
      console.error("Assistant sheet append failed:", err.message);
      if (/permission|forbidden|403/i.test(err.message || "")) assistantSheetLogDisabled = true;
    });
  }
}

// --- UPGRADED SUPABASE LOGGING HELPERS ---
async function getAdminLogsFromSupabase() {
  try {
    const cutoffId = Date.now() - ADMIN_LOG_RETENTION_MS;
    supabaseRequest('admin_logs', { method: "DELETE", query: `id=lt.${cutoffId}` })
      .catch((err) => console.error("Old Supabase log cleanup failed:", err.message));

    const rows = await supabaseSelectAll('admin_logs', {
      select: '*',
      query: `id=gte.${cutoffId}`,
      order: 'id.desc'
    });
    return (rows || []).map((row) => ({
      id: Number(row.id) || 0,
      index: row.index || null, // 🔥 Crucial field populated here to fix the "Removed" display
      date: normalizeText(row.date, 40),
      status: normalizeText(row.status, 30),
      course: normalizeText(row.course, 60),
      year: normalizeText(row.year, 30),
      spec: normalizeText(row.spec, 100),
      semester: normalizeText(row.semester, 30),
      exam: normalizeText(row.exam, 30),
      name: normalizeText(row.name, 160)
    }));
  } catch (err) {
    console.error("Supabase logs fetch failed:", err.message);
    return [];
  }
}

async function appendAdminLogToSupabase(logData) {
  try {
    await supabaseRequest('admin_logs', {
      method: "POST",
      body: {
        id: logData.id,
        index: logData.index ? String(logData.index) : null, // 🔥 Connects log row to paper ID
        date: normalizeText(logData.date, 40),
        status: normalizeText(logData.status, 30),
        course: normalizeText(logData.course || "-", 60),
        year: normalizeText(logData.year || "-", 30),
        spec: normalizeText(logData.spec || "-", 100),
        semester: normalizeText(logData.semester || "-", 30),
        exam: normalizeText(logData.exam || "-", 30),
        name: normalizeText(logData.name || "-", 160)
      }
    });
  } catch (err) {
    console.error("Supabase log insert crash:", err.message);
  }
}

// --- MISSING GOOGLE SHEETS BACKUP FUNCTIONS ---
async function getSheetRows() {
  const sheets = await getServiceSheets();
  const sheetData = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Sheet1!A:G" });
  return { sheets, rows: sheetData.data.values || [] };
}

async function mirrorPaperToSheet(paper, expectedPaper = null) {
  if (!paper) return; // Prevents the 'reading course of null' crash
  const { sheets, rows } = await getSheetRows();
  const rowValues = [paper.course, paper.year, paper.spec || paper.specialization, paper.sem || paper.semester, paper.exam, paper.name || "", paper.link || ""];
  await sheets.spreadsheets.values.append({ spreadsheetId: SHEET_ID, range: "Sheet1!A:G", valueInputOption: SHEET_WRITE_MODE, requestBody: { values: [rowValues] } });
}

async function mirrorDeletePaperFromSheet(expectedPaper) {
  if (!hasPaperSlotFields(expectedPaper)) return;
  const { sheets, rows } = await getSheetRows();
  const rowIndex = resolveExpectedSheetRowIndex(null, rows, expectedPaper);
  if (!rowIndex) return;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId;
  if (sheetId === undefined) return;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowIndex - 1, endIndex: rowIndex } } }] } });
}

async function fetchAdminPapersFromPublishedSheet() {
  const { rows } = await getSheetRows();
  return sortPublicPapers(rows.slice(1).map((row, i) => paperFromSheetRow(row, i + 2)).filter(isAdminSheetRow));
}

async function ensureAssistantSheetTab(sheets) {
  if (assistantSheetReady) return;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: "sheets.properties.title" });
  const exists = (spreadsheet.data.sheets || []).some((sheet) => sheet.properties?.title === ASSISTANT_REQUESTS_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: ASSISTANT_REQUESTS_SHEET } } }] } });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: sheetRange(ASSISTANT_REQUESTS_SHEET, "A1:J1"), valueInputOption: SHEET_WRITE_MODE,
    requestBody: { values: [["Date", "Email", "Question", "Status", "Message", "Paper Name", "Course", "Year", "Semester", "Link"]] }
  });
  assistantSheetReady = true;
}

async function appendAssistantRequestToSheet(logData) {
  const authClient = await getAssistantSheetsAuthClient();
  if (!authClient) return;
  const sheets = google.sheets({ version: "v4", auth: authClient });
  await ensureAssistantSheetTab(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: sheetRange(ASSISTANT_REQUESTS_SHEET, "A:J"), valueInputOption: SHEET_WRITE_MODE,
    requestBody: { values: [[ sheetCell(logData.date, 40), sheetCell(logData.email, 254), sheetCell(sanitizeFreeText(logData.question, 500), 500), sheetCell(logData.status, 30), sheetCell(logData.message, 200), sheetCell(logData.topResult?.name || "", 160), sheetCell(logData.course || logData.topResult?.course || "", 60), sheetCell(logData.year || logData.topResult?.year || "", 30), sheetCell(logData.semester || logData.topResult?.sem || "", 30), sheetCell(logData.topResult?.link || "", 500) ]] }
  });
}

async function clearAdminLogsSheet() {
  const sheets = await getServiceSheets();
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: "Logs!A2:I" });
}

async function deleteAdminLogsFromSheet(ids) {
  const safeIds = new Set(ids.map((id) => Number(id)).filter((id) => Number.isSafeInteger(id) && id > 0).map(String));
  if (safeIds.size === 0) return;
  const sheets = await getServiceSheets();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Logs!A2:I" });
  const remainingRows = (response.data.values || []).filter((row) => !safeIds.has(String(Number(row[0]) || 0)));
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: "Logs!A2:I" });
  if (remainingRows.length > 0) {
    await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: "Logs!A2", valueInputOption: SHEET_WRITE_MODE, requestBody: { values: remainingRows } });
  }
}

// ----------------------------------------------------------------------

function isAllowedAssistantEmail(email) {
  const normalizedEmail = normalizeText(email, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) &&
    normalizedEmail.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`);
}

async function fetchPublicPapers() {
  if (Date.now() < papersCache.expiresAt) return papersCache.data;

  if (isSupabaseConfigured()) {
    try {
      const data = await fetchSupabasePapers({ publicOnly: true });
      papersCache = { expiresAt: Date.now() + PUBLIC_PAPERS_CACHE_MS, data };
      return data;
    } catch (supabaseErr) {
      console.error("Supabase papers fetch failed:", supabaseErr.message);
      if (papersCache.data.length > 0) {
        papersCache.expiresAt = Date.now() + PUBLIC_PAPERS_STALE_CACHE_MS;
        return papersCache.data;
      }
      papersCache = { expiresAt: Date.now() + PUBLIC_PAPERS_STALE_CACHE_MS, data: [] };
      return [];
    }
  }

  try {
    const data = await fetchPublicPapersFromSheet();
    papersCache = { expiresAt: Date.now() + PUBLIC_PAPERS_CACHE_MS, data };
    return data;
  } catch (sheetErr) {
    console.error("Sheet papers fetch failed:", sheetErr.message);
    if (papersCache.data.length > 0) {
      papersCache.expiresAt = Date.now() + PUBLIC_PAPERS_STALE_CACHE_MS;
      return papersCache.data;
    }
  }

  papersCache = { expiresAt: Date.now() + PUBLIC_PAPERS_STALE_CACHE_MS, data: [] };
  return [];
}

async function fetchPaperOptions() {
  if (Date.now() < paperOptionsCache.expiresAt) return paperOptionsCache.data;

  if (isSupabaseConfigured()) {
    try {
      const params = new URLSearchParams({
        select: "course,year,specialization,semester,exam"
      });
      params.set("title", "neq.");
      params.set("drive_url", "neq.");

      const rows = await supabaseSelectAll(SUPABASE_PAPERS_TABLE, {
        query: params.toString()
      });
      const data = buildPaperOptions((Array.isArray(rows) ? rows : []).map(paperOptionFromSupabaseRow));
      paperOptionsCache = { expiresAt: Date.now() + PUBLIC_PAPERS_CACHE_MS, data };
      return data;
    } catch (supabaseErr) {
      console.error("Supabase paper options fetch failed:", supabaseErr.message);
      if (paperOptionsCache.data.length > 0) {
        paperOptionsCache.expiresAt = Date.now() + PUBLIC_PAPERS_STALE_CACHE_MS;
        return paperOptionsCache.data;
      }
      paperOptionsCache = { expiresAt: Date.now() + PUBLIC_PAPERS_STALE_CACHE_MS, data: [] };
      return [];
    }
  }

  const papers = await fetchPublicPapers();
  const data = buildPaperOptions(papers);
  paperOptionsCache = { expiresAt: Date.now() + PUBLIC_PAPERS_CACHE_MS, data };
  return data;
}

function normalizePaperFilters(source = {}) {
  return {
    course: sanitizePaperText(source.course, 60),
    year: sanitizePaperText(source.year, 30),
    specialization: sanitizePaperText(source.specialization || source.spec, 100),
    sem: sanitizePaperText(source.sem || source.semester, 30),
    exam: sanitizePaperText(source.exam, 30)
  };
}

async function fetchPublicPapersByFilter(filters = {}) {
  const cleanFilters = normalizePaperFilters(filters);

  if (!cleanFilters.course || !cleanFilters.year || !cleanFilters.sem || !cleanFilters.exam) {
    return [];
  }

  if (isSupabaseConfigured()) {
    const params = new URLSearchParams({
      select: "id,course,year,specialization,semester,exam,title,drive_url,drive_file_id"
    });
    params.set("title", "neq.");
    params.set("drive_url", "neq.");

    if (cleanFilters.course) params.set("course", `eq.${cleanFilters.course}`);
    if (cleanFilters.year) params.set("year", `eq.${cleanFilters.year}`);
    if (cleanFilters.specialization) params.set("specialization", `eq.${cleanFilters.specialization}`);
    if (cleanFilters.sem) params.set("semester", `eq.${cleanFilters.sem}`);
    if (cleanFilters.exam) params.set("exam", `eq.${cleanFilters.exam}`);

    const rows = await supabaseSelectAll(SUPABASE_PAPERS_TABLE, {
      query: params.toString(),
      order: "title.asc"
    });

    return sortPublicPapers(dedupePapers((Array.isArray(rows) ? rows : [])
      .map(paperFromSupabaseRow)
      .filter(isPublicPaper)));
  }

  const papers = await fetchPublicPapers();
  return papers.filter((paper) =>
    Object.entries(cleanFilters).every(([key, value]) => {
      if (!value) return true;
      const paperValue = key === "specialization"
        ? paper.specialization || paper.spec
        : key === "sem"
        ? paper.sem || paper.semester
        : paper[key];
      return sanitizePaperText(paperValue, 160) === value;
    })
  );
}

function sortPublicPapers(papers) {
  return [...papers].sort((a, b) =>
    `${a.course}-${a.year}-${a.spec}-${a.sem}-${a.exam}-${a.name}`
      .localeCompare(`${b.course}-${b.year}-${b.spec}-${b.sem}-${b.exam}-${b.name}`)
  );
}

function parsePublishedSheetRows(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start < 0 || end <= start) throw new Error("Missing sheet JSON wrapper");
  const json = JSON.parse(text.slice(start, end));
  return Array.isArray(json.table?.rows) ? json.table.rows : [];
}

async function fetchPublicPapersFromSheet() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(SHEET_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);
    const text = await response.text();
    if (text.length > 5 * 1024 * 1024) throw new Error("Sheet response too large");

    const rows = parsePublishedSheetRows(text);
    return sortPublicPapers(dedupePapers(rows
      .map((row) => paperFromSheetRow((row.c || []).map((cell) => cell?.v || "")))
      .filter(isPublicPaper)));
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSupabasePapers({ publicOnly = false } = {}) {
  const params = new URLSearchParams({
    select: "id,course,year,specialization,semester,exam,title,drive_url,drive_file_id"
  });
  if (publicOnly) {
    params.set("title", "neq.");
    params.set("drive_url", "neq.");
  }

  const rows = await supabaseSelectAll(SUPABASE_PAPERS_TABLE, {
    query: params.toString(),
    order: "course.asc,year.asc,specialization.asc,semester.asc,exam.asc,title.asc"
  });
  const papers = (Array.isArray(rows) ? rows : [])
    .map(paperFromSupabaseRow)
    .filter(publicOnly ? isPublicPaper : isAdminSheetRow);

  return sortPublicPapers(dedupePapers(papers));
}

async function getSupabasePaperById(id) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return null;

  const rows = await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    query: `select=*&${idFilter}&limit=1`
  });
  return Array.isArray(rows) && rows[0] ? paperFromSupabaseRow(rows[0]) : null;
}

async function insertSupabasePaper(paper, extras = {}) {
  const rows = await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "POST",
    prefer: "return=representation",
    body: [toSupabasePaperRow(paper, extras)]
  });
  return Array.isArray(rows) && rows[0] ? paperFromSupabaseRow(rows[0]) : null;
}

async function updateSupabasePaper(id, paper, extras = {}) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return null;

  const body = toSupabasePaperRow(paper, extras);
  const rows = await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=representation",
    body
  });
  return Array.isArray(rows) && rows[0] ? paperFromSupabaseRow(rows[0]) : null;
}

async function deleteSupabasePaper(id) {
  const idFilter = postgrestUuidEqFilter("id", id);
  if (!idFilter) return;

  await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "DELETE",
    query: idFilter
  });
}

async function replaceSupabasePapers(papers) {
  await supabaseRequest(SUPABASE_PAPERS_TABLE, {
    method: "DELETE",
    query: "id=not.is.null"
  });

  const rows = (papers || [])
    .filter(isAdminSheetRow)
    .map((paper) => toSupabasePaperRow(paper, {
      link: paper.link || null,
      driveFileId: extractDriveFileId(paper.link)
    }));

  for (let i = 0; i < rows.length; i += 500) {
    await supabaseRequest(SUPABASE_PAPERS_TABLE, {
      method: "POST",
      prefer: "return=minimal",
      body: rows.slice(i, i + 500)
    });
  }

  invalidatePapersCache();
  return rows.length;
}

async function verifyAssistantGoogleCredential(credential) {
  const parsedCredential = googleCredentialSchema.safeParse(credential);
  const idToken = parsedCredential.success ? parsedCredential.data : "";
  if (!idToken) {
    const err = new Error("Please Sign In With Your Poornima Google Account.");
    err.code = "SIGN_IN_REQUIRED";
    throw err;
  }

  let ticket;
  try {
    ticket = await googleSignInClient.verifyIdToken({
      idToken,
      audience: GOOGLE_SIGNIN_CLIENT_ID
    });
  } catch (verifyErr) {
    const err = new Error("Please sign in again with your Poornima Google account.");
    err.code = "INVALID_GOOGLE_TOKEN";
    throw err;
  }

  const payload = ticket.getPayload() || {};
  const email = normalizeText(payload.email, 254).toLowerCase();
  const name = normalizeText(payload.name, 120);
  const picture = normalizeText(payload.picture, 500);

  if (!payload.email_verified) {
    const err = new Error("Google email is not verified.");
    err.code = "INVALID_GOOGLE_ACCOUNT";
    throw err;
  }

  if (!isAllowedAssistantEmail(email)) {
    const err = new Error(`Please Sign In With Your ${ASSISTANT_EMAIL_DOMAIN} Google Account.`);
    err.code = "INVALID_EMAIL_DOMAIN";
    throw err;
  }

  return { email, name, picture };
}

async function getGoogleOAuthClient() {
  if (googleServiceAuthClient) return googleServiceAuthClient;

  if (!CLIENT_ID || !CLIENT_SECRET || !DRIVE_REFRESH_TOKEN) {
    throw new Error("Missing OAuth2 credentials in .env");
  }

  googleServiceAuthClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  googleServiceAuthClient.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });
  return googleServiceAuthClient;
}

async function getAssistantSheetsAuthClient() {
  if (assistantSheetsAuthClient) return assistantSheetsAuthClient;
  assistantSheetsAuthClient = await getGoogleOAuthClient();
  return assistantSheetsAuthClient;
}

async function getServiceSheets() {
  const authClient = await getGoogleOAuthClient();
  return google.sheets({ version: "v4", auth: authClient });
}

async function getServiceDrive() {
  const authClient = await getGoogleOAuthClient();
  return google.drive({ version: "v3", auth: authClient });
}

function getRetryAfterSeconds(req, fallbackMs) {
  const resetTime = req.rateLimit?.resetTime;
  const resetAt = resetTime instanceof Date ? resetTime.getTime() : Number(resetTime);
  const fallbackAt = Date.now() + fallbackMs;
  const retryAfterMs = Math.max(1000, (Number.isFinite(resetAt) ? resetAt : fallbackAt) - Date.now());
  return Math.ceil(retryAfterMs / 1000);
}

function safeDriveFileName(originalName, mimeType) {
  const fallbackExt = mimeType === "application/pdf" ? ".pdf" : ".docx";
  const parsed = path.parse(path.basename(originalName || `paper${fallbackExt}`));
  const ext = parsed.ext.toLowerCase() || fallbackExt;
  const base = parsed.name
    .replace(/[\u0000-\u001F\u007F<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "paper";
  return `${base}${ext}`;
}

function extractDriveFileId(link = "") {
  const text = normalizeText(link, 500);
  return text.match(/\/file\/d\/([^/]+)/)?.[1] || text.match(/[?&]id=([^&]+)/)?.[1] || "";
}

async function uploadFileToDrive(file) {
  const drive = await getServiceDrive();
  const driveRes = await drive.files.create({
    resource: { name: safeDriveFileName(file.originalname, file.mimetype), parents: [DRIVE_FOLDER_ID] },
    media: { mimeType: file.mimetype, body: fs.createReadStream(file.path) },
    fields: "id"
  });

  await drive.permissions.create({
    fileId: driveRes.data.id,
    requestBody: { role: "reader", type: "domain", domain: DRIVE_ACCESS_DOMAIN, allowFileDiscovery: false }
  });

  return {
    id: driveRes.data.id,
    link: `https://drive.google.com/file/d/${driveRes.data.id}/view`
  };
}

function isAllowedFileExtension(fileName = "") {
  const ext = path.extname(fileName).toLowerCase();
  return ext === ".pdf" || ext === ".docx";
}

function hasMatchingFileType(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  return (file.mimetype === "application/pdf" && ext === ".pdf") ||
    (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && ext === ".docx");
}

function validateUploadedFile(file) {
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(file.path, "r");
  try {
    fs.readSync(fd, buffer, 0, 4, 0);
  } finally {
    fs.closeSync(fd);
  }

  if (file.mimetype === "application/pdf" && buffer.subarray(0, 4).toString() === "%PDF") return;
  if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04
  ) return;

  throw new Error("INVALID_FILE_SIGNATURE");
}

const authMemoryStore = new Map();

function isRedisUrlConfigured() {
  return Boolean(REDIS_URL);
}

function isCaptchaConfigured() {
  return Boolean(CAPTCHA_SECRET);
}

function normalizeIp(value) {
  const ip = normalizeText(value, 100)
    .split(",")[0]
    .trim()
    .replace(/^::ffff:/, "");
  if (!ip) return "";
  if (ip === "::1") return "127.0.0.1";
  return ip;
}

function getClientIp(req) {
  return normalizeIp(req.ip || String(req.headers["x-forwarded-for"] || "").split(",")[0] || req.socket?.remoteAddress || "unknown");
}

function isAdminIpAllowed(req) {
  if (ADMIN_ALLOWED_IPS.length === 0) return true;
  return ADMIN_ALLOWED_IPS.includes(getClientIp(req));
}

function requireAdminIp(req, res, next) {
  if (isAdminIpAllowed(req)) return next();
  return res.status(404).json({ success: false, message: "Not found" });
}

function csrfSignature(value) {
  return crypto.createHmac("sha256", SECRET).update(String(value || "")).digest("base64url");
}

function createCsrfToken() {
  const value = crypto.randomBytes(32).toString("base64url");
  return `${value}.${csrfSignature(value)}`;
}

function verifyCsrfToken(token) {
  const text = normalizeText(token, 200);
  const [value, signature, ...extra] = text.split(".");
  if (!value || !signature || extra.length > 0) return false;
  const expected = csrfSignature(value);
  return safeCompare(signature, expected);
}

function setCsrfCookie(res, token = createCsrfToken()) {
  res.cookie(CSRF_COOKIE_NAME, token, {
    ...cookieOptions,
    httpOnly: false,
    maxAge: CSRF_MAX_AGE_MS
  });
  return token;
}

function isTrustedRequestOrigin(req) {
  const source = req.get("origin") || req.get("referer") || "";
  if (!source) return !isProduction;

  try {
    const sourceOrigin = new URL(source).origin;
    return sourceOrigin === FRONTEND_URL;
  } catch {
    return false;
  }
}

function requireCsrf(req, res, next) {
  if (!isTrustedRequestOrigin(req)) {
    return res.status(403).json({ success: false, code: "BAD_ORIGIN", message: "Request rejected." });
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] || "";
  const headerToken = req.get(CSRF_HEADER_NAME) || "";
  const hasValidHeaderToken = headerToken && verifyCsrfToken(headerToken);
  const cookieMatchesHeader = cookieToken && headerToken && safeCompare(cookieToken, headerToken);

  if (!hasValidHeaderToken || (cookieToken && !cookieMatchesHeader)) {
    return res.status(403).json({ success: false, code: "CSRF_REQUIRED", message: "Security token expired. Refresh and try again." });
  }

  return next();
}

function authStoreKey(prefix, value) {
  const digest = crypto.createHash("sha256").update(String(value || "")).digest("hex");
  return `${prefix}:${digest}`;
}

function encodeRedisCommand(command) {
  const parts = command.map((part) => Buffer.from(String(part)));
  const chunks = [Buffer.from(`*${parts.length}\r\n`)];
  for (const part of parts) {
    chunks.push(Buffer.from(`$${part.length}\r\n`), part, Buffer.from("\r\n"));
  }
  return Buffer.concat(chunks);
}

function parseRedisResponse(buffer, offset = 0) {
  if (offset >= buffer.length) return null;
  const type = String.fromCharCode(buffer[offset]);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd === -1) return null;
  const line = buffer.subarray(offset + 1, lineEnd).toString();
  const nextOffset = lineEnd + 2;

  if (type === "+") return { value: line, offset: nextOffset };
  if (type === ":") return { value: Number(line), offset: nextOffset };
  if (type === "-") throw new Error(`Redis command failed: ${line}`);

  if (type === "$") {
    const length = Number(line);
    if (length === -1) return { value: null, offset: nextOffset };
    const end = nextOffset + length;
    if (buffer.length < end + 2) return null;
    return {
      value: buffer.subarray(nextOffset, end).toString(),
      offset: end + 2
    };
  }

  if (type === "*") {
    const count = Number(line);
    if (count === -1) return { value: null, offset: nextOffset };
    const values = [];
    let cursor = nextOffset;
    for (let i = 0; i < count; i += 1) {
      const parsed = parseRedisResponse(buffer, cursor);
      if (!parsed) return null;
      values.push(parsed.value);
      cursor = parsed.offset;
    }
    return { value: values, offset: cursor };
  }

  throw new Error("Unsupported Redis response.");
}

async function redisUrlPipeline(commands) {
  const redisUrl = new URL(REDIS_URL);
  const useTls = redisUrl.protocol === "rediss:";
  const port = Number(redisUrl.port || (useTls ? 6380 : 6379));
  const host = redisUrl.hostname;
  const username = decodeURIComponent(redisUrl.username || "");
  const password = decodeURIComponent(redisUrl.password || "");
  const db = redisUrl.pathname && redisUrl.pathname !== "/" ? redisUrl.pathname.slice(1) : "";
  const setupCommands = [];

  if (password) {
    setupCommands.push(username ? ["AUTH", username, password] : ["AUTH", password]);
  }
  if (/^\d+$/.test(db)) {
    setupCommands.push(["SELECT", db]);
  }

  const allCommands = [...setupCommands, ...commands];
  const request = Buffer.concat(allCommands.map(encodeRedisCommand));

  return new Promise((resolve, reject) => {
    const socket = useTls
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });
    let buffer = Buffer.alloc(0);
    let settled = false;

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(value);
    };

    socket.setTimeout(5000);
    if (useTls) socket.once("secureConnect", () => socket.write(request));
    else socket.once("connect", () => socket.write(request));
    socket.on("timeout", () => finish(new Error("Redis connection timed out.")));
    socket.on("error", (err) => finish(err));
    socket.on("data", (chunk) => {
      try {
        buffer = Buffer.concat([buffer, chunk]);
        const results = [];
        let offset = 0;
        while (results.length < allCommands.length) {
          const parsed = parseRedisResponse(buffer, offset);
          if (!parsed) return;
          results.push(parsed.value);
          offset = parsed.offset;
        }
        finish(null, results.slice(setupCommands.length));
      } catch (err) {
        finish(err);
      }
    });
  });
}

function getMemoryItem(key) {
  const item = authMemoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt <= Date.now()) {
    authMemoryStore.delete(key);
    return null;
  }
  return item;
}

async function authStoreIncr(key, ttlSeconds) {
  if (isRedisUrlConfigured()) {
    const result = await redisUrlPipeline([
      ["INCR", key],
      ["EXPIRE", key, ttlSeconds],
      ["TTL", key]
    ]);
    if (result) {
      const [count, , ttl] = result;
      return {
        count: Number(count) || 0,
        ttlSeconds: Math.max(1, Number(ttl) || ttlSeconds)
      };
    }
  }

  const current = getMemoryItem(key);
  const count = Number(current?.value || 0) + 1;
  authMemoryStore.set(key, {
    value: String(count),
    expiresAt: Date.now() + ttlSeconds * 1000
  });
  return { count, ttlSeconds };
}

async function authStoreGet(key) {
  if (isRedisUrlConfigured()) {
    const [value] = await redisUrlPipeline([["GET", key]]);
    return value;
  }

  return getMemoryItem(key)?.value || null;
}

async function authStoreSet(key, value, ttlSeconds) {
  if (isRedisUrlConfigured()) {
    await redisUrlPipeline([["SET", key, value, "EX", ttlSeconds]]);
    return;
  }

  authMemoryStore.set(key, {
    value: String(value),
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function authStoreTtl(key) {
  if (isRedisUrlConfigured()) {
    const [ttl] = await redisUrlPipeline([["TTL", key]]);
    return Math.max(0, Number(ttl) || 0);
  }

  const item = getMemoryItem(key);
  return item ? Math.max(1, Math.ceil((item.expiresAt - Date.now()) / 1000)) : 0;
}

async function authStoreDel(...keys) {
  if (keys.length === 0) return;
  if (isRedisUrlConfigured()) {
    await redisUrlPipeline([["DEL", ...keys]]);
    return;
  }

  keys.forEach((key) => authMemoryStore.delete(key));
}

function loginFailureKey(identifier) {
  return authStoreKey("auth:login:failures", normalizeAuthIdentifier(identifier));
}

function loginLockKey(identifier) {
  return authStoreKey("auth:login:locked", normalizeAuthIdentifier(identifier));
}

async function getLoginAccountState(identifier) {
  const failureKey = loginFailureKey(identifier);
  const lockKey = loginLockKey(identifier);
  const [failureValue, retryAfterSeconds] = await Promise.all([
    authStoreGet(failureKey),
    authStoreTtl(lockKey)
  ]);
  const failures = Math.max(0, Number(failureValue) || 0);
  return {
    failures,
    locked: retryAfterSeconds > 0,
    retryAfterSeconds,
    captchaRequired: isCaptchaConfigured() && failures >= CAPTCHA_AFTER_FAILED_ATTEMPTS
  };
}

async function recordFailedLogin(identifier) {
  const failureKey = loginFailureKey(identifier);
  const lockKey = loginLockKey(identifier);
  const { count } = await authStoreIncr(failureKey, LOGIN_FAILURE_WINDOW_SECONDS);
  const locked = count >= MAX_FAILED_LOGIN_ATTEMPTS;
  if (locked) {
    await authStoreSet(lockKey, "1", ACCOUNT_LOCK_SECONDS);
  }

  return {
    failures: count,
    locked,
    retryAfterSeconds: locked ? ACCOUNT_LOCK_SECONDS : 0,
    captchaRequired: isCaptchaConfigured() && count >= CAPTCHA_AFTER_FAILED_ATTEMPTS
  };
}

async function clearFailedLoginState(identifier) {
  await authStoreDel(loginFailureKey(identifier), loginLockKey(identifier));
}

function getProgressiveDelayMs(failures) {
  if (failures <= 1) return 0;
  return Math.min(LOGIN_MAX_PROGRESSIVE_DELAY_MS, 250 * (2 ** Math.min(failures - 2, 5)));
}

async function equalizeLoginTiming(startedAt, extraDelayMs = 0) {
  const elapsed = Date.now() - startedAt;
  const target = LOGIN_MIN_RESPONSE_MS + extraDelayMs;
  const remaining = Math.max(0, target - elapsed);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

function setRetryAfter(res, retryAfterSeconds) {
  res.set("Retry-After", String(Math.max(1, Math.ceil(retryAfterSeconds || 1))));
}

async function verifyCaptchaToken(captchaToken, req) {
  if (!CAPTCHA_SECRET) return false;
  const token = normalizeText(captchaToken, 2048);
  if (!token) return false;

  const body = new URLSearchParams({
    secret: CAPTCHA_SECRET,
    response: token,
    remoteip: getClientIp(req)
  });

  try {
    const response = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const data = await response.json().catch(() => ({}));
    return response.ok && data.success === true;
  } catch (err) {
    console.error("CAPTCHA verification failed:", err.message);
    return false;
  }
}

const ADMIN_AUTH_COLUMNS = "id,email,login_identifier,password_hash,reset_token_hash,reset_token_expires_at";

function isUsableBcryptHash(hash) {
  try {
    return bcrypt.getRounds(hash) >= 12;
  } catch {
    return false;
  }
}

function hashResetToken(token) {
  return crypto.createHmac("sha256", SECRET).update(String(token || "")).digest("hex");
}

function createPasswordResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function buildPasswordResetUrl(token) {
  const resetUrl = new URL(PASSWORD_RESET_URL);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

async function findAdminAuthUser(identifier) {
  if (!isSupabaseConfigured()) return null;
  const cleanIdentifier = normalizeAuthIdentifier(identifier);
  if (!cleanIdentifier) return null;

  try {
    const byEmailParams = new URLSearchParams({
      select: ADMIN_AUTH_COLUMNS,
      limit: "1"
    });
    byEmailParams.set("email", `eq.${cleanIdentifier}`);

    const emailRows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
      query: byEmailParams.toString()
    });
    if (Array.isArray(emailRows) && emailRows[0]) return emailRows[0];

    const byLoginParams = new URLSearchParams({
      select: ADMIN_AUTH_COLUMNS,
      limit: "1"
    });
    byLoginParams.set("login_identifier", `eq.${cleanIdentifier}`);

    const loginRows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
      query: byLoginParams.toString()
    });

    return Array.isArray(loginRows) && loginRows[0] ? loginRows[0] : null;
  } catch (err) {
    console.error("Supabase admin auth lookup failed:", err.message);
    return null;
  }
}

async function createAdminAuthUserFromEnv(email = ADMIN_EMAIL_ADDRESS) {
  const cleanEmail = normalizeAuthIdentifier(email);
  if (!isSupabaseConfigured() || !cleanEmail || !ADMIN_LOGIN_IDENTIFIER || !isUsableBcryptHash(ADMIN_PASSWORD_HASH)) {
    return null;
  }

  try {
    const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
      method: "POST",
      prefer: "return=representation",
      body: {
        email: cleanEmail,
        login_identifier: ADMIN_LOGIN_IDENTIFIER,
        password_hash: ADMIN_PASSWORD_HASH
      }
    });
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (err) {
    console.error("Supabase admin auth seed failed:", err.message);
    return null;
  }
}

async function getResettableAdminUser(email) {
  const cleanEmail = normalizeAuthIdentifier(email);
  if (!cleanEmail) return null;

  const userByEmail = await findAdminAuthUser(cleanEmail);
  if (userByEmail && safeCompare(userByEmail.email, cleanEmail)) return userByEmail;

  if (!ADMIN_EMAIL_ADDRESS || !safeCompare(cleanEmail, ADMIN_EMAIL_ADDRESS)) return null;

  const userByLogin = await findAdminAuthUser(ADMIN_LOGIN_IDENTIFIER);
  if (userByLogin) {
    return safeCompare(userByLogin.email, cleanEmail) ? userByLogin : null;
  }

  return createAdminAuthUserFromEnv(cleanEmail);
}

async function saveAdminPasswordResetToken(user) {
  if (!isSupabaseConfigured() || !user?.id) return null;
  const idFilter = postgrestUuidEqFilter("id", user.id);
  if (!idFilter) return null;

  const token = createPasswordResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_SECONDS * 1000).toISOString();

  await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=minimal",
    body: {
      reset_token_hash: tokenHash,
      reset_token_expires_at: expiresAt,
      reset_requested_at: new Date().toISOString()
    }
  });

  return token;
}

async function findAdminUserByResetToken(token) {
  if (!isSupabaseConfigured()) return null;

  const tokenHash = hashResetToken(token);
  const params = new URLSearchParams({
    select: ADMIN_AUTH_COLUMNS,
    reset_token_hash: `eq.${tokenHash}`,
    limit: "1"
  });

  const rows = await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    query: params.toString()
  });

  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function updateAdminPasswordWithResetToken(token, password) {
  const user = await findAdminUserByResetToken(token);
  const expiresAt = user?.reset_token_expires_at ? new Date(user.reset_token_expires_at).getTime() : 0;
  if (!user || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const idFilter = postgrestUuidEqFilter("id", user.id);
  if (!idFilter) return false;

  const passwordHash = await bcrypt.hash(password, PASSWORD_BCRYPT_COST);
  await supabaseRequest(SUPABASE_ADMIN_USERS_TABLE, {
    method: "PATCH",
    query: idFilter,
    prefer: "return=minimal",
    body: {
      password_hash: passwordHash,
      reset_token_hash: null,
      reset_token_expires_at: null,
      reset_requested_at: null
    }
  });

  await clearFailedLoginState(user.login_identifier || user.email);
  if (user.email) await clearFailedLoginState(user.email);
  return true;
}

async function sendPasswordResetEmail(to, resetUrl) {
  if (!RESEND_API_KEY || !PASSWORD_RESET_FROM) {
    console.warn("Password reset email not sent: set RESEND_API_KEY and PASSWORD_RESET_FROM.");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: PASSWORD_RESET_FROM,
      to: [to],
      subject: "Reset your PYQP admin password",
      html: `
        <p>You requested a PYQP admin password reset.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>
      `,
      text: `Reset your PYQP admin password: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request this, ignore this email.`
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Resend returned ${response.status}`);
  }

  return true;
}

async function verifyAdminCredentials(identifier, password) {
  const cleanIdentifier = normalizeAuthIdentifier(identifier);
  const adminUser = await findAdminAuthUser(cleanIdentifier);
  const identifierMatches = Boolean(adminUser) || safeCompare(cleanIdentifier, ADMIN_LOGIN_IDENTIFIER);
  const passwordHash = adminUser?.password_hash || (identifierMatches ? ADMIN_PASSWORD_HASH : DUMMY_PASSWORD_HASH);
  const passwordMatches = await bcrypt.compare(password, passwordHash);
  return identifierMatches && passwordMatches;
}

async function loginLimiter(req, res, next) {
  try {
    const key = authStoreKey("auth:login:ip", getClientIp(req));
    const { count, ttlSeconds } = await authStoreIncr(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
    if (count > LOGIN_RATE_LIMIT_MAX) {
      setRetryAfter(res, ttlSeconds);
      return res.status(429).json({
        success: false,
        code: "LOGIN_RATE_LIMITED",
        retryAfterSeconds: ttlSeconds,
        message: "Too many login attempts. Please wait before trying again."
      });
    }
    return next();
  } catch (err) {
    console.error("Login rate limiter failed:", err.message);
    if (isProduction) {
      return res.status(503).json({ success: false, message: "Authentication is temporarily unavailable." });
    }
    return next();
  }
}

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true 
}));

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "script-src": ["'self'"],
    "img-src": ["'self'", "data:", "https://*.googleusercontent.com", "https://*.gstatic.com", "https://*.google.com"], 
  }
}));

app.use(express.json({ limit: "25kb" }));
app.use(cookieParser());
app.use(express.static('public'));

const adminMutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests." }
});

const publicDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests." }
});

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many assistant requests. Please wait a minute." }
});

const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ 
  dest: uploadDir,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 20, fieldSize: 1024 },
  fileFilter: (req, file, cb) => {
    if (isAllowedFileExtension(file.originalname) && hasMatchingFileType(file)) cb(null, true);
    else cb(new Error("INVALID_TYPE"), false);
  }
});

function verifyAdminToken(token) {
  const decoded = jwt.verify(token, SECRET);
  if (decoded.sessionId !== ADMIN_SESSION_ID) {
    throw new Error("STALE_ADMIN_SESSION");
  }
  return decoded;
}

function verifyToken(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).send("❌ No Token Provided");

  try {
    const decoded = verifyAdminToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('admin_token', cookieOptions);
    return res.status(403).send("❌ Invalid Token");
  }
}

app.get("/csrf-token", requireAdminIp, (req, res) => {
  const existingToken = req.cookies?.[CSRF_COOKIE_NAME] || "";
  const csrfToken = verifyCsrfToken(existingToken) ? existingToken : setCsrfCookie(res);
  res.set("Cache-Control", "no-store");
  res.json({ success: true, csrfToken });
});

app.post("/login", requireAdminIp, requireCsrf, loginLimiter, async (req, res) => {
  const startedAt = Date.now();
  const parsed = loginBodySchema.safeParse(req.body || {});

  if (!parsed.success) {
    await bcrypt.compare("invalid-login-input", DUMMY_PASSWORD_HASH);
    await equalizeLoginTiming(startedAt);
    return res.status(401).json({ success: false, message: GENERIC_LOGIN_ERROR });
  }

  const { identifier, password, captchaToken } = parsed.data;

  try {
    const accountState = await getLoginAccountState(identifier);
    if (accountState.locked) {
      setRetryAfter(res, accountState.retryAfterSeconds);
      await equalizeLoginTiming(startedAt, getProgressiveDelayMs(accountState.failures));
      return res.status(429).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        retryAfterSeconds: accountState.retryAfterSeconds,
        captchaRequired: isCaptchaConfigured(),
        message: "Too many failed attempts. Try again later."
      });
    }

    if (accountState.captchaRequired) {
      const captchaOk = await verifyCaptchaToken(captchaToken, req);
      if (!captchaOk) {
        await equalizeLoginTiming(startedAt, getProgressiveDelayMs(accountState.failures));
        return res.status(403).json({
          success: false,
          code: "CAPTCHA_REQUIRED",
          captchaRequired: true,
          message: "CAPTCHA verification required."
        });
      }
    }

    const authenticated = await verifyAdminCredentials(identifier, password);
    if (authenticated) {
      await clearFailedLoginState(identifier);
      await equalizeLoginTiming(startedAt);
      const token = jwt.sign({ user: ADMIN_LOGIN_IDENTIFIER, sessionId: ADMIN_SESSION_ID }, SECRET, { expiresIn: "1d" });

      res.cookie('admin_token', token, {
        ...cookieOptions,
        maxAge: ADMIN_SESSION_MAX_AGE_MS
      });

      return res.json({ success: true });
    }

    const failureState = await recordFailedLogin(identifier);
    await equalizeLoginTiming(startedAt, getProgressiveDelayMs(failureState.failures));

    if (failureState.locked) {
      setRetryAfter(res, failureState.retryAfterSeconds);
      return res.status(429).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        retryAfterSeconds: failureState.retryAfterSeconds,
        captchaRequired: isCaptchaConfigured(),
        message: "Too many failed attempts. Try again later."
      });
    }

    return res.status(401).json({
      success: false,
      message: GENERIC_LOGIN_ERROR,
      captchaRequired: failureState.captchaRequired
    });
  } catch (err) {
    console.error("Login failed:", err.message);
    await equalizeLoginTiming(startedAt);
    return res.status(503).json({ success: false, message: "Authentication is temporarily unavailable." });
  }
});

app.post("/password-reset", requireAdminIp, requireCsrf, loginLimiter, async (req, res) => {
  const startedAt = Date.now();
  const parsed = passwordResetBodySchema.safeParse(req.body || {});

  if (parsed.success) {
    try {
      const user = await getResettableAdminUser(parsed.data.email);
      if (user) {
        const resetToken = await saveAdminPasswordResetToken(user);
        if (resetToken) {
          await sendPasswordResetEmail(user.email, buildPasswordResetUrl(resetToken));
        }
      }
    } catch (err) {
      console.error("Password reset request failed:", err.message);
    }
  } else {
    await bcrypt.compare("invalid-password-reset-input", DUMMY_PASSWORD_HASH);
  }

  await equalizeLoginTiming(startedAt);
  return res.json({ success: true, message: PASSWORD_RESET_RESPONSE });
});

app.post("/password-reset/confirm", requireAdminIp, requireCsrf, loginLimiter, async (req, res) => {
  const startedAt = Date.now();
  const parsed = passwordResetConfirmBodySchema.safeParse(req.body || {});

  if (!parsed.success) {
    await bcrypt.compare("invalid-password-reset-confirm", DUMMY_PASSWORD_HASH);
    await equalizeLoginTiming(startedAt);
    return res.status(400).json({ success: false, message: PASSWORD_RESET_CONFIRM_ERROR });
  }

  try {
    const updated = await updateAdminPasswordWithResetToken(parsed.data.token, parsed.data.password);
    await equalizeLoginTiming(startedAt);
    if (!updated) {
      return res.status(400).json({ success: false, message: PASSWORD_RESET_CONFIRM_ERROR });
    }
    return res.json({ success: true, message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("Password reset confirm failed:", err.message);
    await equalizeLoginTiming(startedAt);
    return res.status(503).json({ success: false, message: "Password reset is temporarily unavailable." });
  }
});

app.get("/me", requireAdminIp, verifyToken, (req, res) => {
  res.json({ success: true });
});

app.post("/logout", requireAdminIp, requireCsrf, (req, res) => {
  res.clearCookie('admin_token', cookieOptions);
  res.clearCookie(CSRF_COOKIE_NAME, { ...cookieOptions, httpOnly: false });
  res.json({ success: true });
});

app.get('/logs', requireAdminIp, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    res.json(await getAdminLogsFromSupabase());
  } catch (err) {
    console.error("Log fetch failed:", err.message);
    res.json([]);
  }
});

app.get('/admin/queries', requireAdminIp, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const rows = await supabaseSelectAll('student_queries', { select: 'id,email,question,status,message,paper_name,created_at', order: 'created_at.desc' });
    const queries = (rows || []).map((row) => ({ id: row.id, date: row.created_at ? new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "-", email: row.email, question: sanitizeFreeText(row.question, 500), status: row.status, paperName: row.paper_name }));
    res.json(queries);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.get('/admin/settings/blocked', requireAdminIp, adminMutationLimiter, verifyToken, async (req, res) => {
  try { res.json(await getBlockedUsers()); } catch (err) { res.status(500).json([]); }
});

app.post('/admin/settings/block', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const parsed = emailBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false });
    await addBlockedUser(parsed.data.email);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/admin/settings/unblock', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const parsed = emailBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false });
    await removeBlockedUser(parsed.data.email);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/admin/settings/replies', requireAdminIp, adminMutationLimiter, verifyToken, async (req, res) => {
  try { res.json(await getCustomReplies()); } catch (err) { res.status(500).json([]); }
});

app.post('/admin/settings/reply', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const parsed = customReplyBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false });
    await addCustomReply(parsed.data.keyword, parsed.data.reply);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/admin/settings/reply/delete', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const parsed = customReplyDeleteBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false });
    await deleteCustomReply(parsed.data.keyword);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/logs', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const id = Number(req.body.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).send("Invalid log id");
    }

    const allowedStatuses = new Set(["Uploaded", "Updated", "Deleted"]);
    const logData = {
      id,
      index: req.body.index ? String(req.body.index) : null,
      date: normalizeText(req.body.date, 40),
      status: allowedStatuses.has(req.body.status) ? req.body.status : "Updated",
      course: normalizeText(req.body.course, 60),
      year: normalizeText(req.body.year, 30),
      spec: normalizeText(req.body.spec, 100),
      semester: normalizeText(req.body.semester, 30),
      exam: normalizeText(req.body.exam, 30),
      name: normalizeText(req.body.name, 160)
    };

    // 1. Save to Supabase (Primary)
    await appendAdminLogToSupabase(logData);
    
    // 2. Backup to Google Sheets
    const sheetRowData = [
      logData.id, 
      sheetCell(logData.date, 40), 
      sheetCell(logData.status, 30), 
      sheetCell(logData.course || "-", 60),
      sheetCell(logData.year || "-", 30), 
      sheetCell(logData.spec || "-", 100), 
      sheetCell(logData.semester || "-", 30),
      sheetCell(logData.exam || "-", 30), 
      sheetCell(logData.name || "-", 160)
    ];

    try {
      const sheets = await getServiceSheets();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Logs!A:I",
        valueInputOption: SHEET_WRITE_MODE,
        requestBody: { values: [sheetRowData] }
      });
    } catch (sheetErr) {
      console.error("Sheet backup failed:", sheetErr.message);
    }

    res.status(200).send("Log Saved Successfully");
  } catch (err) {
    console.error("Log save failed:", err.message);
    res.status(500).send("Error saving log");
  }
});

app.delete('/logs/clear', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    res.send("✅ Processing log clear in background...");
    
    (async () => {
      try {
        await supabaseRequest('admin_logs', { method: "DELETE", query: "id=not.is.null" });
      } catch (error) {
        console.error("Background log clear failed:", error.message);
      }
    })();
  } catch (error) {
    res.status(500).send("Server failed to wipe database");
  }
});

app.post('/logs/delete', requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return res.status(400).send("❌ Invalid ID array");
    }
    const cleanIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);

    if (cleanIds.length !== ids.length) {
      return res.status(400).send("❌ Invalid ID array");
    }

    res.send("✅ Processing deletion in background...");

    (async () => {
      try {
        for (const id of cleanIds) {
          await supabaseRequest('admin_logs', { method: "DELETE", query: `id=eq.${id}` });
        }
      } catch (error) {
        console.error("Background log delete failed:", error.message);
      }
    })();
  } catch (error) {
    res.status(500).send("Server failed to delete specific logs");
  }
});

app.post("/upload", requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return res.status(400).send("Upload Error");

    try {
      if (req.file) validateUploadedFile(req.file);
      const { index } = req.body;
      const paper = getPaperPayload(req.body);
      const expectedPaper = getExpectedPaperPayload(req.body);

      if (index && isSupabaseConfigured()) {
        const existingPaper = await getSupabasePaperById(index);
        if (!existingPaper) return res.status(404).send("Paper Not Found");
        if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
          return res.status(409).send("Paper changed. Refresh and try again.");
        }
      }

      // 🔥 INSTANT RESPONSE TO UNLOCK UI IN < 1 SECOND
      res.status(202).send("Background Processing Started");

      // 🔥 BACKGROUND EXECUTION
      (async () => {
        try {
          let fileLink = null;
          let driveFileId = null;

          if (req.file) {
            const uploadedDriveFile = await uploadFileToDrive(req.file);
            fileLink = uploadedDriveFile.link;
            driveFileId = uploadedDriveFile.id;
          }

          if (isSupabaseConfigured()) {
            let savedPaper = null;
            const allPapers = await fetchSupabasePapers({ publicOnly: false });

            if (index) {
              const existingPaper = await getSupabasePaperById(index);
              if (!existingPaper) return;
              if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
                console.warn("Rejected stale or mismatched paper update request.");
                return;
              }
              
              savedPaper = await updateSupabasePaper(index, paper, {
                link: fileLink || existingPaper.link || "",
                driveFileId: driveFileId || existingPaper.driveFileId || extractDriveFileId(existingPaper.link)
              });
            } else {
              const exactPaper = allPapers.find((item) => rowMatchesPaper([
                item.course, item.year, item.spec, item.sem, item.exam, item.name, item.link
              ], paper));
              const blankSlot = allPapers.find((item) => rowMatchesPaperSlot([
                item.course, item.year, item.spec, item.sem, item.exam
              ], paper) && !item.name && !item.link);

              if (exactPaper) {
                savedPaper = await updateSupabasePaper(exactPaper.id, paper, {
                  link: fileLink || exactPaper.link || "",
                  driveFileId: driveFileId || exactPaper.driveFileId || extractDriveFileId(exactPaper.link)
                });
              } else if (blankSlot) {
                savedPaper = await updateSupabasePaper(blankSlot.id, paper, {
                  link: fileLink || "",
                  driveFileId: driveFileId || ""
                });
              } else {
                savedPaper = await insertSupabasePaper(paper, {
                  link: fileLink || "",
                  driveFileId: driveFileId || ""
                });
              }
            }

            invalidatePapersCache();
            const paperToMirror = savedPaper || { ...paper, link: fileLink || "", driveFileId: driveFileId || "" };
            mirrorPaperToSheet(paperToMirror, index ? expectedPaper : null).catch(console.error);
            return;
          }

          const { sheets, rows } = await getSheetRows();

          if (index) {
            const rowIndex = resolveExpectedSheetRowIndex(index, rows, expectedPaper);
            if (!rowIndex) return;

            await sheets.spreadsheets.values.update({
              spreadsheetId: SHEET_ID, range: `Sheet1!A${rowIndex}:G${rowIndex}`, valueInputOption: SHEET_WRITE_MODE,
              requestBody: { values: [[paper.course, paper.year, paper.spec, paper.sem, paper.exam, paper.name, fileLink || rows[rowIndex - 1][6] || ""]] }
            });
            invalidatePapersCache();
            return;
          }

          let found = false;
          const blankSlotExists = rows.some((row, i) => i > 0 && rowMatchesPaperSlot(row, paper) && rowHasBlankPaperData(row));
          const duplicateRowIndexes = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (rowMatchesPaper(row, paper)) {
              if (blankSlotExists) {
                duplicateRowIndexes.push(i + 1);
                continue;
              }
              await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID, range: `Sheet1!G${i + 1}`, valueInputOption: SHEET_WRITE_MODE,
                requestBody: { values: [[fileLink || row[6]]] }
              });
              found = true;
              break;
            }
          }

          if (!found) {
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (rowMatchesPaperSlot(row, paper) && rowHasBlankPaperData(row)) {
                await sheets.spreadsheets.values.update({
                  spreadsheetId: SHEET_ID, range: `Sheet1!A${i + 1}:G${i + 1}`, valueInputOption: SHEET_WRITE_MODE,
                  requestBody: { values: [[paper.course, paper.year, paper.spec, paper.sem, paper.exam, paper.name, fileLink || ""]] }
                });
                for (const duplicateRowIndex of duplicateRowIndexes) {
                  await sheets.spreadsheets.values.clear({
                    spreadsheetId: SHEET_ID,
                    range: `Sheet1!A${duplicateRowIndex}:G${duplicateRowIndex}`
                  });
                }
                found = true;
                break;
              }
            }
          }

          if (!found) {
            await sheets.spreadsheets.values.append({
              spreadsheetId: SHEET_ID, range: "Sheet1!A:G", valueInputOption: SHEET_WRITE_MODE,
              requestBody: { values: [[paper.course, paper.year, paper.spec, paper.sem, paper.exam, paper.name, fileLink || ""]] }
            });
          }
          invalidatePapersCache();

        } catch (err) {
          console.error("Background Upload failed:", err.message);
        } finally {
          if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }
      })();
    } catch (err) {
      console.error("Upload validation failed:", err.message);
      res.status(400).send("Upload Error");
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
  });
});

app.delete("/delete", requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const { index } = req.body;
    if (!index) return res.status(400).send("No Index Provided");

    const expectedPaper = getExpectedPaperPayload(req.body);

    if (isSupabaseConfigured()) {
      const existingPaper = await getSupabasePaperById(index);
      if (!existingPaper) return res.status(404).send("Paper Not Found");
      if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
        return res.status(409).send("Paper changed. Refresh and try again.");
      }
    }

    // 🔥 INSTANT RESPONSE TO UNLOCK UI
    res.status(202).send("Background Deletion Started");

    // 🔥 BACKGROUND EXECUTION
    (async () => {
      try {
        if (isSupabaseConfigured()) {
          const existingPaper = await getSupabasePaperById(index);
          if (!existingPaper) return;
          if (!paperMatchesExpectedSnapshot(existingPaper, expectedPaper)) {
            console.warn("Rejected stale or mismatched paper delete request.");
            return;
          }
          
          await deleteSupabasePaper(index);
          mirrorDeletePaperFromSheet(expectedPaper).catch(console.error);
          invalidatePapersCache();
          return;
        }

        const { sheets, rows } = await getSheetRows();
        const rowIndex = resolveExpectedSheetRowIndex(index, rows, expectedPaper);
        if (!rowIndex) return;

        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
        const sheetId = spreadsheet.data.sheets[0].properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: [{ deleteDimension: { range: { sheetId: sheetId, dimension: "ROWS", startIndex: rowIndex - 1, endIndex: rowIndex } } }]
          }
        });
        invalidatePapersCache();
      } catch (err) {
        console.error("Background Delete failed:", err.message);
      }
    })();
  } catch (err) {
    console.error("Delete failed:", err.message);
    res.status(500).send("Delete Failed");
  }
});

app.get("/admin/papers", requireAdminIp, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      return res.json(await fetchSupabasePapers({ publicOnly: false }));
    }

    const { rows } = await getSheetRows();
    const data = rows
      .slice(1)
      .map((row, i) => paperFromSheetRow(row, i + 2))
      .filter(isAdminSheetRow);

    res.json(data);
  } catch (err) {
    console.error("Admin papers fetch failed:", err.message);
    res.status(500).json([]);
  }
});

app.get("/papers", publicDataLimiter, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(await fetchPublicPapers());
  } catch (err) {
    console.error("Papers fetch failed:", err.message);
    res.json([]);
  }
});

app.get("/paper-options", publicDataLimiter, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json(await fetchPaperOptions());
  } catch (err) {
    console.error("Paper options fetch failed:", err.message);
    res.json([]);
  }
});

app.get("/papers/search", publicDataLimiter, async (req, res) => {
  try {
    res.json(await fetchPublicPapersByFilter(req.query || {}));
  } catch (err) {
    console.error("Filtered papers fetch failed:", err.message);
    res.json([]);
  }
});

app.get("/assistant/config", publicDataLimiter, (req, res) => {
  res.json({
    success: true,
    googleClientId: GOOGLE_SIGNIN_CLIENT_ID,
    emailDomain: ASSISTANT_EMAIL_DOMAIN,
    aiProvider: "sarvam",
    sarvamEnabled: Boolean(SARVAM_API_KEY)
  });
});

app.post("/assistant/google/verify", assistantLimiter, async (req, res) => {
  try {
    const parsed = z.object({ credential: googleCredentialSchema }).passthrough().safeParse(req.body || {});
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
});

app.post("/assistant/search", assistantLimiter, async (req, res) => {
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
    const customReplies = await getCustomReplies();
    const customMatch = findCustomReplyForQuestion(question, customReplies);

    if (customMatch) {
      answer = {
        status: "info",
        results: [],
        message: customMatch.reply
      };
    } else {
      let papers = [];
      try {
        papers = await fetchPublicPapers();
      } catch (paperErr) {
        console.error("Assistant paper data unavailable:", paperErr.message);
        answer = {
          status: "unavailable",
          results: [],
          message: "Paper database is temporarily unavailable. Please try again after some time."
        };
      }

      if (!answer) {
        const aiQuery = await parseAssistantQueryWithSarvam(question, papers);
        answer = searchAssistantPapers(papers, question, aiQuery);
      }
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
});

app.post("/sync", requireAdminIp, requireCsrf, adminMutationLimiter, verifyToken, async (req, res) => {
  try {
    const papers = await fetchAdminPapersFromPublishedSheet();

    if (!isSupabaseConfigured()) {
      return res.status(503).json({ success: false, message: "Supabase is not configured." });
    }

    const updatedCount = await replaceSupabasePapers(papers);
    res.json({ success: true, message: `Data Imported From Google Sheet. ${updatedCount}` });
  } catch (err) { res.status(500).json({ success: false, message: "❌ Sync Failed." }); }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`🚀 Server Started On Port ${PORT}`));
server.timeout = 300000;
