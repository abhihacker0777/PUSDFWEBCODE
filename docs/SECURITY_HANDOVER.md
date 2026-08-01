# Security Handover

## Implemented

- Server-side auth validation uses Zod schemas.
- Admin passwords are verified and stored by Supabase Auth.
- Login returns a generic credential error.
- Login timing is equalized with a minimum delay and progressive delay on repeated failures.
- Redis-backed login rate limit, failure tracking, lockout, progressive delay, and CAPTCHA state are supported.
- Cloudflare Turnstile validation is server-side through `CAPTCHA_SECRET`.
- Admin session uses an HTTP-only cookie.
- State-changing frontend requests use CSRF token handling.
- Main admin can be restricted by `ADMIN_ALLOWED_IPS`.
- Managed admins support `Full`, `Editor`, and `View` roles.
- Password reset sends a generic response and stores only reset-token hashes.
- Uploaded files are validated by extension and MIME type before Drive upload.

## Production Requirements

- Rotate any secret that was ever shown in screenshots, chat, git history, or browser devtools.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, Google OAuth secrets, Resend key, Redis URL, JWT secret, and CAPTCHA secret backend-only.
- Use one Poornima-owned Google account or cloud project for Drive/Sheets credentials.
- Verify the email sending domain in Resend before production password reset.
- Set `NODE_ENV=production`.
- Set `ADMIN_ALLOWED_IPS` for the main admin before handover.
- Keep Supabase Row Level Security enabled.

## Recommended Next Step

Keep only non-sensitive admin metadata in `admin_users`: Supabase Auth user id, email, login identifier, display name, role, and active status.
