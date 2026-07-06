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
   *Create A `.env` File In The `backend` Folder And Securely Add Your Supabase Keys, Google OAuth Client ID/Secret/Refresh Token, Google Sign-In Client ID, JWT Secret, `ADMIN_PASSWORD_HASH`, Redis URL, CAPTCHA Secret, And Password Reset Email Settings.*
   Generate The Admin Password Hash With:
   ```Bash
   npm run hash-admin-password -- "your-long-admin-password"
   ```

3. **Setup The Frontend:**
   ```Bash
   cd ../frontend
   npm install
   ```
   *Create A `.env` File In The `frontend` Folder And Set `VITE_API_URL` To Your Backend Server URL. For Cloudflare Turnstile, set `VITE_TURNSTILE_SITE_KEY`; do not commit CAPTCHA keys to git.*

### Authentication Security
Admin login now validates inputs on the server with Zod, verifies bcrypt password hashes, rate-limits login through Redis in production, locks accounts after repeated failures, checks Cloudflare Turnstile after repeated failures, uses CSRF tokens on state-changing admin requests, and returns generic credential errors. Use Render Redis with `REDIS_URL`. Password reset links are emailed through Resend when `ADMIN_EMAIL` or `ADMIN_RESET_EMAIL`, `RESEND_API_KEY`, and `PASSWORD_RESET_FROM` are configured. The reset token itself is never stored, only its HMAC hash in Supabase.

Set `ADMIN_ALLOWED_IPS` in `backend/.env` to restrict admin login and admin APIs to trusted IP addresses, for example `ADMIN_ALLOWED_IPS=127.0.0.1,203.0.113.10`.

For production on the Poornima domain, set `FRONTEND_URL` to the exact deployed frontend origin, set `BASE_URL` and `VITE_API_URL` to the deployed backend origin, and add the same frontend hostname in Cloudflare Turnstile. Keep `frontend/vercel.json` only if deploying the frontend on Vercel; it is not used by Render or Cloudflare Pages.

For admin password reset email, also set:
```env
ADMIN_EMAIL=admin@poornima.edu.in
RESEND_API_KEY=your_resend_api_key
PASSWORD_RESET_FROM=PYQP Admin <noreply@your-verified-domain>
PASSWORD_RESET_URL=https://pyqp.poornima.edu.in/reset-password
```

Run [backend/supabase_schema.sql](backend/supabase_schema.sql) in Supabase so the `admin_users` table exists. On the first reset request for `ADMIN_EMAIL`, the backend seeds `admin_users` from the current `ADMIN_PASSWORD_HASH`.

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

## 📂 Project Structure

```Text
PYQP-Portal/
├── backend/               # Express.js Server & API Routes
│   ├── uploads/           # Ephemeral storage for Multer Parsing
│   ├── server.js          # Core Logic, Google OAuth, And API Integrations
│   └── package.json
├── frontend/              # React.js SPA (Single Page Application)
│   ├── src/               # Components, Pages, And API Services
│   ├── tailwind.config.js # Custom Poornima University Branding Themes
│   └── package.json
└── .gitignore             # Global Security Exclusions
```

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
