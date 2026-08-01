# Architecture

## Runtime Shape

- `frontend/` is the React/Vite single-page app.
- `backend/` is the Express API.
- Supabase stores paper metadata and managed admin users.
- Google Drive stores uploaded paper files.
- Google Sheets is used for admin logs, assistant logs, and backup/import flows.
- Redis stores rate-limit, login-failure, lockout, and CAPTCHA state.
- Resend sends password reset emails.

## Backend Structure

- `server.js` starts the API.
- `src/app.js` creates the Express app and mounts all middleware/routes.
- `src/bootstrap/` wires middleware, upload handling, and shared dependencies.
- `src/routes/` defines endpoint groups.
- `src/controllers/` handles HTTP request/response behavior.
- `src/services/` holds integrations and business logic.
- `src/models/` maps data between API, Sheets, Supabase, and internal objects.
- `src/middleware/` contains authentication, authorization, CSRF, IP, CAPTCHA, and rate-limit checks.
- `src/validators/` contains Zod schemas for server-side input validation.

## Frontend Structure

- `src/pages/` contains route-level pages.
- `src/pages/admin/` contains the admin dashboard panels, hooks, and shared admin UI.
- `src/pages/login/` contains login form UI, Turnstile handling, session check, and auth requests.
- `src/components/paperAssistant/` contains assistant UI and assistant-specific hooks.
- `src/services/api/` contains browser API clients and cache handling.
- `src/styles/` contains global and assistant CSS split by purpose.

## Deployment Notes

- Backend secrets must stay only in backend environment variables.
- Frontend variables prefixed with `VITE_` are public in browser bundles.
- `VITE_API_URL` must point to the backend origin, unless using a same-origin proxy.
- `FRONTEND_URL` must exactly match the deployed frontend origin for CORS and cookies.
- Cloudflare Turnstile hostnames must include the final frontend domain.
