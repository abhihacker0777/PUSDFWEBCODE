# Deployment Checklist

## Backend

- Run `npm ci` in `backend/`.
- Run `npm run check`.
- Set every variable from `backend/.env.example`.
- Generate `JWT_SECRET` with a cryptographically random 32+ character value.
- Create the main admin account in Supabase Auth with the same email as `ADMIN_EMAIL`.
- Run `backend/supabase_schema.sql` in Supabase SQL Editor.
- Configure Redis and set `REDIS_URL`.
- Configure Cloudflare Turnstile and set `CAPTCHA_SECRET`.
- Configure Resend and set `RESEND_API_KEY` and `PASSWORD_RESET_FROM`.
- Deploy backend and confirm `/csrf-token` returns 200.

## Frontend

- Run `npm ci` in `frontend/`.
- Run `npm run lint`.
- Run `npm run build`.
- Set every variable from `frontend/.env.example`.
- Deploy the built Vite app.
- Confirm login page can call the backend `/csrf-token` endpoint.

## Domain Handover

- Point the frontend domain to the frontend host.
- Point the backend API domain to the backend host.
- Set backend `FRONTEND_URL` to the exact frontend domain.
- Set frontend `VITE_API_URL` to the exact backend domain.
- Add the frontend hostname to Cloudflare Turnstile.
- Retest login, password reset, admin upload, student search, and assistant sign-in.
