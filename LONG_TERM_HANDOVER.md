# Poornima PYQP Long-Term Handover

## Final Architecture

- Supabase is the main production database for paper metadata only.
- Google Drive stores only the uploaded PDF/DOCX files.
- Google Sheets is a backup/import/export layer and the readable archive for admin logs and assistant requests.
- Public users read papers from the backend without login.
- The assistant requires Poornima Google Sign-In before answering.
- Admin uses the normal admin login only. Admin does not need Google OAuth.
- Backend uses Google OAuth refresh-token access for Drive and Sheets.

## Why This Is Better

- Admin does not need to re-authorize Google after server restart, redeploy, laptop shutdown, or maintenance as long as the stored refresh token remains valid.
- Paper list is fast because Supabase is queried directly instead of repeatedly reading Google Sheets.
- Google Sheets remains useful as backup and reporting, but it is not the live database.
- Google Drive permissions stay centralized in one Poornima-owned folder.
- The university can hand over one Google OAuth client/refresh token and one Supabase project.

## Backend Environment

Required:

```env
JWT_SECRET=at-least-32-characters
ADMIN_EMAIL=admin@example.com
ADMIN_ALLOWED_IPS=127.0.0.1,203.0.113.10
FRONTEND_URL=https://your-frontend-domain
BASE_URL=https://your-backend-domain
PASSWORD_RESET_URL=https://your-frontend-domain/reset-password
REDIS_URL=redis://...
CAPTCHA_SECRET=...
CAPTCHA_PROVIDER=turnstile
RESEND_API_KEY=...
PASSWORD_RESET_FROM=PYQP Admin <noreply@your-verified-domain>

CLIENT_ID=...
CLIENT_SECRET=...
DRIVE_REFRESH_TOKEN=...
GOOGLE_SIGNIN_CLIENT_ID=...
SHEET_ID=...
SHEET_URL=https://docs.google.com/spreadsheets/d/...
DRIVE_FOLDER_ID=...

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

SARVAM_API_KEY=...
```

Optional:

```env
SUPABASE_PAPERS_TABLE=papers
ASSISTANT_EMAIL_DOMAIN=poornima.edu.in
ASSISTANT_REQUESTS_SHEET=AI Requests
SARVAM_MODEL=sarvam-30b
PASSWORD_BCRYPT_COST=12
SUPABASE_ADMIN_USERS_TABLE=admin_users
CAPTCHA_VERIFY_URL=https://challenges.cloudflare.com/turnstile/v0/siteverify
```

Use Render Redis by setting `REDIS_URL`.

The owner admin's password lives in Supabase Auth, not in an env var or a locally stored hash - create/set it via the Supabase dashboard (Authentication → Users) for the account matching `ADMIN_EMAIL`, or use the password reset flow. On first login, the matching `admin_users` row is linked to that Supabase Auth user automatically. Password reset links go through Supabase Auth as well; there is no `hash-admin-password` script or `ADMIN_PASSWORD_HASH` env var in the current codebase.

Set `ADMIN_ALLOWED_IPS` to a comma-separated list of IP addresses allowed to use admin login and admin APIs. Leave it empty only during unrestricted local development.

What remains custom on top of Supabase Auth is session issuance (JWT + cookie), rate limiting, CAPTCHA, account lockout, and the owner IP allow-list - that's intentional hardening, not a migration that still needs to happen.

## One-Time Setup

1. Create the Supabase project.
2. Run [backend/supabase_schema.sql](backend/supabase_schema.sql) in Supabase SQL Editor.
3. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to backend `.env`.
4. Create or choose a Google OAuth client.
5. Generate a refresh token with Drive and Sheets scopes.
6. Add `CLIENT_ID`, `CLIENT_SECRET`, and `DRIVE_REFRESH_TOKEN` to backend `.env`.
7. Add Render Redis `REDIS_URL` to backend `.env`.
8. Restart/redeploy the backend.

## Backup And Restore Flow

- Admin upload/update/delete writes to Supabase first.
- Uploaded files go to Google Drive.
- The matching Google Sheet row is updated in place in the background (course/year/spec/sem/exam identify which row to update).
- Admin action logs are saved to the Supabase `admin_logs` table (the source for the "Recent Action" panel), with a Google Sheets copy as a secondary backup.
- If Supabase data is lost, use the admin "Restore From Sheet Backup" action to import rows from the Google Sheet back into Supabase. This is destructive - it replaces the entire live paper list - so only use it for actual recovery.

## Important Security Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Keep Supabase Row Level Security enabled.
- Do not create public Supabase policies unless the architecture changes.
- The browser should call only the backend API.
- Keep Google Drive and Google Sheet owned by Poornima, not a personal Gmail.
