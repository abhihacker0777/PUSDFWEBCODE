# 🎓 Poornima University - Previous Year Question Papers Portal

A Full-Stack Web Application Designed To Help Poornima University Students Easily Find, Filter, And View Previous Year Question Papers (Mse & Ese). Built With A Focus On Speed, Responsive Design, And An Intuitive User Experience.

> Current long-term production handover notes are in [LONG_TERM_HANDOVER.md](LONG_TERM_HANDOVER.md). The current design uses Supabase as the main database and Google OAuth refresh-token access for Drive/Sheets.

## ✨ Key Features

- **Cascading Search Interface**: Dynamic, Real-Time Filtering That Prevents "Dead End" Searches.
- **Automated Cloud Storage**: Direct Integration With Google Drive API For Secure, Permission-controlled PDF Hosting.
- **Google Sheet Audit Trail**: Administrative Actions And Assistant Requests Are Archived To Google Sheets.
- **Long-Term Database**: Supabase Stores Paper Metadata For Fast Public And Admin Queries.
- **Secure Authentication**: Admin Uses Server Cookie Login; Student Assistant Uses Poornima Google Sign-In.
- **Responsive Architecture**: Polished UI Built With React And Tailwind CSS, Fully Optimized For Both Mobile And Desktop.



## 🚀 Technologies Used

**Frontend Ecosystem**
- **Core**: react.js, Vite
- **Styling**: Tailwind CSS
- **State & Routing**: React Hooks, React Router DOM

**Backend Ecosystem**
- **Server**: node.js, express.js
- **Database (Primary)**: Supabase
- **Storage (Files)**: Google Drive API V3
- **Logging (Archive)**: Google Sheets API V4
- **Security**: JWT Cookies, Helmet.js, Google Sign-In For Assistant Verification

## 🛠️ Getting Started

### Prerequisites
- node.js (V18 Or Higher)
- npm Or yarn
- Git

### Installation & Setup

1. **Clone The Repository:**
   ```Bash
   git clone [https://github.com/abhihacker0777/PUSDFWEBCODE.git]
   cd pusdfwebcode
   ```

2. **Setup The Backend:**
   ```Bash
   cd backend
   npm install
   ```
   *Create A `.env` File In The `backend` Folder And Securely Add Your Supabase Keys, Google OAuth Client ID/Secret/Refresh Token, Google Sign-In Client ID, JWT Secret, Redis URL, CAPTCHA Secret, And Password Reset Email Settings.*

3. **Setup The Frontend:**
   ```Bash
   cd ../frontend
   npm install
   ```
   *Create A `.env` File In The `frontend` Folder And Set `VITE_API_URL` To Your Backend Server URL. For Cloudflare Turnstile, set `VITE_TURNSTILE_SITE_KEY`; do not commit CAPTCHA keys to git.*

### Authentication Security
Admin login now validates inputs on the server with Zod, verifies passwords through Supabase Auth, rate-limits login through Redis in production, locks accounts after repeated failures, checks Cloudflare Turnstile after repeated failures, uses CSRF tokens on state-changing admin requests, and returns generic credential errors. Use Redis with `REDIS_URL`. Password reset links are emailed through Resend when `RESEND_API_KEY` and `PASSWORD_RESET_FROM` are configured. The reset token itself is never stored, only its HMAC hash in Supabase; the new password is written to Supabase Auth.

Set `ADMIN_ALLOWED_IPS` in `backend/.env` to restrict admin login and admin APIs to trusted IP addresses, for example `ADMIN_ALLOWED_IPS=127.0.0.1,203.0.113.10`.

For production on the Poornima domain, set `FRONTEND_URL` to the exact deployed frontend origin, set `BASE_URL` and `VITE_API_URL` to the deployed backend origin, and add the same frontend hostname in Cloudflare Turnstile. Keep `frontend/vercel.json` only if deploying the frontend on Vercel; it is not used by Render or Cloudflare Pages.

For admin password reset email, also set:
```env
ADMIN_EMAIL=admin@poornima.edu.in
RESEND_API_KEY=your_resend_api_key
PASSWORD_RESET_FROM=PYQP Admin <noreply@your-verified-domain>
PASSWORD_RESET_URL=https://pyqp.poornima.edu.in/reset-password
```

Create the main admin user in Supabase Auth with the same email as `ADMIN_EMAIL`, then run [backend/supabase_schema.sql](backend/supabase_schema.sql). On first successful main-admin login, the backend links that Supabase Auth user to the `admin_users` metadata table.

4. **Run The Development Servers:**
   *Open Two Terminal Windows.*
   
   **Terminal 1 (Backend):**
   ```Bash
   cd backend
   node server.js
   ```
   **Terminal 2 (Frontend):**
   ```Bash
   cd frontend
   npm run dev
   ```

## Project Structure

```Text
PYQP-Portal/
├── backend/
│   ├── server.js              # Starts the API
│   ├── scripts/               # Utility and validation scripts
│   └── src/
│       ├── bootstrap/         # Express middleware, uploads, dependency wiring
│       ├── config/            # Environment and provider config
│       ├── controllers/       # HTTP request handlers
│       ├── middleware/        # Auth, CSRF, IP, CAPTCHA, rate-limit checks
│       ├── models/            # Data mapping helpers
│       ├── routes/            # API route groups
│       ├── services/          # Supabase, Google, Redis, auth, assistant logic
│       ├── utils/             # Shared helpers
│       └── validators/        # Zod schemas
├── frontend/
│   └── src/
│       ├── components/        # Shared UI and paper assistant
│       ├── pages/             # Route pages and page-specific modules
│       ├── services/          # API clients and browser cache
│       └── styles/            # Global and assistant CSS
├── docs/                      # Architecture, security, deployment handover
└── .github/workflows/ci.yml   # CI validation
```

## Validation Commands

```Bash
cd backend
npm run check

cd ../frontend
npm run lint
npm run build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY_HANDOVER.md](docs/SECURITY_HANDOVER.md), and [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for the production handover.

## 🌟 Features In Detail

### Smart Document Processing
When An Admin Uploads A Document, The Server Temporarily Parses It Via `multer`, Automatically Generates A Secure, View-Only Google Drive Link, Indexes The Metadata (Course, Year, Semester) Into Supabase, And Immediately Deletes The Temporary Local File To Prevent Server Bloat.

### Google OAuth Access
The Backend Uses A Stored Google OAuth Refresh Token To Upload Files To Drive And Mirror Data To Google Sheets, So Restarts, Redeploys, And Maintenance Windows Do Not Break Admin Uploads.

### Long-Term Logging
Admin Logs And Assistant Query Logs Are Stored In Google Sheets For University-Friendly Backup And Review. Supabase Is Kept Focused On Fast Paper Metadata Queries.

---
**Developed By:** Abhishek Sankhla  
*BCA (Cyber Security) Batch 2025-28 | Poornima University | [LinkedIn Profile](https://linkedin.com/in/abhihacker0777)*
