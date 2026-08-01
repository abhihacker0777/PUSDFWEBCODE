const path = require("path");
const { normalizeAuthIdentifier, normalizeIp, sanitizeFreeText } = require("../utils/helpers");

const BACKEND_ROOT = path.resolve(__dirname, "../..");

require("dotenv").config({ path: path.join(BACKEND_ROOT, ".env") });

const SECRET = process.env.JWT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DRIVE_REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;
const SHEET_ID = process.env.SHEET_ID;
const FRONTEND_URL = process.env.FRONTEND_URL;
const SHEET_URL = process.env.SHEET_URL;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const BASE_URL = process.env.BASE_URL;
const DRIVE_ACCESS_DOMAIN = process.env.DRIVE_ACCESS_DOMAIN;
const ASSISTANT_EMAIL_DOMAIN = (process.env.ASSISTANT_EMAIL_DOMAIN || "").toLowerCase();
const ASSISTANT_REQUESTS_SHEET = process.env.ASSISTANT_REQUESTS_SHEET;
const GOOGLE_SIGNIN_CLIENT_ID = process.env.GOOGLE_SIGNIN_CLIENT_ID;
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_MODEL = process.env.SARVAM_MODEL;
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PAPERS_TABLE = process.env.SUPABASE_PAPERS_TABLE;
const SUPABASE_ADMIN_USERS_TABLE = process.env.SUPABASE_ADMIN_USERS_TABLE;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const PASSWORD_RESET_FROM = process.env.PASSWORD_RESET_FROM;
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL;
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
const ADMIN_LOGIN_IDENTIFIER = normalizeAuthIdentifier(process.env.ADMIN_EMAIL || "");
const ADMIN_EMAIL_ADDRESS = normalizeAuthIdentifier(process.env.ADMIN_EMAIL || "");
const ADMIN_DISPLAY_NAME = sanitizeFreeText(process.env.ADMIN_DISPLAY_NAME || "", 80);
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
const CAPTCHA_VERIFY_URL = process.env.CAPTCHA_VERIFY_URL;
const ADMIN_ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || "")
  .split(",")
  .map((ip) => normalizeIp(ip))
  .filter(Boolean);

const missingEnv = [
  "JWT_SECRET",
  "FRONTEND_URL",
  "BASE_URL",
  "SHEET_ID",
  "SHEET_URL",
  "DRIVE_FOLDER_ID",
  "DRIVE_ACCESS_DOMAIN",
  "ADMIN_DISPLAY_NAME",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "DRIVE_REFRESH_TOKEN",
  "GOOGLE_SIGNIN_CLIENT_ID",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PAPERS_TABLE",
  "SUPABASE_ADMIN_USERS_TABLE",
  "REDIS_URL",
  "CAPTCHA_SECRET",
  "CAPTCHA_VERIFY_URL",
  "RESEND_API_KEY",
  "PASSWORD_RESET_FROM",
  "PASSWORD_RESET_URL",
  "ASSISTANT_EMAIL_DOMAIN",
  "ASSISTANT_REQUESTS_SHEET",
  "SARVAM_API_KEY",
  "SARVAM_MODEL",
  "ADMIN_ALLOWED_IPS"
].filter((name) => !process.env[name]);

if (!ADMIN_LOGIN_IDENTIFIER || !ADMIN_EMAIL_ADDRESS) {
  missingEnv.push("ADMIN_EMAIL");
}

if (missingEnv.length > 0) {
  console.error(`FATAL ERROR: Missing required env vars: ${missingEnv.join(", ")}`);
  process.exit(1);
}

if (SECRET.length < 32) {
  console.error("FATAL ERROR: JWT_SECRET must be at least 32 characters.");
  process.exit(1);
}

if (ADMIN_ALLOWED_IPS.length === 0) {
  console.error("FATAL ERROR: ADMIN_ALLOWED_IPS must contain at least one trusted main-admin IP.");
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

for (const [name, value] of [
  ["BASE_URL", BASE_URL],
  ["FRONTEND_URL", FRONTEND_URL],
  ["PASSWORD_RESET_URL", PASSWORD_RESET_URL],
  ["CAPTCHA_VERIFY_URL", CAPTCHA_VERIFY_URL]
]) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error(`${name} must use https in production-style environments.`);
    }
  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
  }
}

module.exports = {
  BACKEND_ROOT,
  SECRET,
  CLIENT_ID,
  CLIENT_SECRET,
  DRIVE_REFRESH_TOKEN,
  SHEET_ID,
  FRONTEND_URL,
  SHEET_URL,
  DRIVE_FOLDER_ID,
  BASE_URL,
  DRIVE_ACCESS_DOMAIN,
  ASSISTANT_EMAIL_DOMAIN,
  ASSISTANT_REQUESTS_SHEET,
  GOOGLE_SIGNIN_CLIENT_ID,
  SARVAM_API_KEY,
  SARVAM_MODEL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_PAPERS_TABLE,
  SUPABASE_ADMIN_USERS_TABLE,
  RESEND_API_KEY,
  PASSWORD_RESET_FROM,
  PASSWORD_RESET_URL,
  SARVAM_TIMEOUT_MS,
  ASSISTANT_MAX_RESULTS,
  PUBLIC_PAPERS_CACHE_MS,
  PUBLIC_PAPERS_STALE_CACHE_MS,
  SUPABASE_PAGE_SIZE,
  MAX_UPLOAD_BYTES,
  MAX_TEXT_LENGTH,
  MAX_ASSISTANT_TEXT_LENGTH,
  ADMIN_LOG_RETENTION_MS,
  SHEET_WRITE_MODE,
  isProduction,
  ADMIN_SESSION_ID,
  ADMIN_SESSION_MAX_AGE_MS,
  GENERIC_LOGIN_ERROR,
  PASSWORD_RESET_RESPONSE,
  PASSWORD_RESET_CONFIRM_ERROR,
  ADMIN_LOGIN_IDENTIFIER,
  ADMIN_EMAIL_ADDRESS,
  ADMIN_DISPLAY_NAME,
  PASSWORD_RESET_TOKEN_TTL_SECONDS,
  LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  LOGIN_RATE_LIMIT_MAX,
  LOGIN_FAILURE_WINDOW_SECONDS,
  ACCOUNT_LOCK_SECONDS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  CAPTCHA_AFTER_FAILED_ATTEMPTS,
  LOGIN_MIN_RESPONSE_MS,
  LOGIN_MAX_PROGRESSIVE_DELAY_MS,
  REDIS_URL,
  CAPTCHA_SECRET,
  CAPTCHA_VERIFY_URL,
  ADMIN_ALLOWED_IPS
};
