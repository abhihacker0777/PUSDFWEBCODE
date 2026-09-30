# 🎓 Poornima University — Previous Year Question Papers (PYQP) Portal

An enterprise-grade, high-performance web application designed for Poornima University students and faculty to search, filter, preview, and download Previous Year Question Papers (MSE & ESE). Built with Next.js 15, Turbopack, TypeScript, Tailwind CSS v4, Supabase, and Google Gemini AI.

---

## ✨ Key Features

- **⚡ Blazing Fast Architecture**: Built on Next.js 15 App Router with Turbopack for instant development and sub-second production page loads.
- **🔍 Cascading Instant Search**: Real-time multi-dimensional filtering across Courses, Years, Specializations, Semesters, and Examination types.
- **🤖 Gemini AI Academic Assistant**: Powered by `@google/genai` with intelligent natural language paper discovery, automated custom replies, and query logging.
- **🛡️ Enterprise RBAC Security**: Multi-tier role-based access control (`full`, `editor`, `view`) with session validation, CSRF protection, and audit logging.
- **☁️ Automated Cloud Drive & Sheet Sync**: Direct Google Drive API v3 integration for view-only PDF storage and bidirectional Google Sheets archival.
- **🔒 OWASP Top 10 Hardened**: Server Actions with strict session verification, parameterized PostgREST queries, HSTS, XSS protection, and Cloudflare Turnstile bot deterrence.
- **📱 Fully Responsive**: Fluid UI matching Poornima University brand aesthetics (`#05488B` Blue, `#ffc107` Amber, `#b22222` Crimson).

---

## 🚀 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Full-stack React Server Components & Server Actions |
| **Bundler & Dev** | **Turbopack (`next dev --turbo`)** | Instant Hot Module Replacement (HMR) and optimized compilation |
| **Language** | **TypeScript 5.7** | 100% strict type safety across all components and actions |
| **Styling** | **Tailwind CSS v4** | Modern utility-first CSS engine via `@tailwindcss/postcss` |
| **Database** | **Supabase (PostgreSQL + RLS)** | High-speed paper indexing, user management, and Row-Level Security |
| **Authentication** | **@supabase/ssr** | HttpOnly, Secure, SameSite cookie-based session management |
| **AI Engine** | **Google Gemini (`@google/genai`)** | Natural language student search queries and intent parsing |
| **File Storage** | **Google Drive API v3** | Scalable, view-only examination paper PDF hosting |
| **Backup & Sync** | **Google Sheets API v4** | Real-time administrative action and query archiving |
| **Bot Protection** | **Cloudflare Turnstile** | Non-intrusive CAPTCHA on administrative login |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm** or **pnpm**
- **Git**

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhihacker0777/PUSDFWEBCODE.git
   cd pusdfwebcode
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` template:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials, Google OAuth tokens, and Gemini API keys in `.env.local`.

4. **Initialize Database (Supabase):**
   Copy the SQL script in [supabase/rls_policies.sql](supabase/rls_policies.sql) and execute it in your **Supabase Dashboard ➔ SQL Editor** to activate Row-Level Security (RLS).

5. **Start the Development Server (with Turbopack):**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev --turbo --port 3000` | Starts the Turbopack local development server |
| `npm run build` | `next build` | Compiles optimized static & dynamic production build |
| `npm run start` | `next start --port 3000` | Launches the production server |
| `npm run lint` | `next lint` | Runs Next.js ESLint diagnostics |

---

## 📂 Project Structure

```
PUSDFWEBCODEE/
├── public/                     # Static brand assets (served directly via HTTP cache)
│   ├── logo.png                # Official Poornima University logo
│   ├── pulogo.png              # Crest badge
│   ├── pucoverlogo.webp        # Dashboard hero cover
│   ├── pugeminilogo.svg        # Gemini AI launcher badge
│   └── pugeminifullogo.svg     # Gemini AI brand emblem
├── src/
│   ├── actions/                # Server Actions (Mutations with RBAC verification)
│   │   └── paperActions.ts     # Create, update, delete, sync paper actions
│   ├── app/                    # Next.js App Router routes
│   │   ├── (public)/page.tsx   # Public student portal (Search & Filters)
│   │   ├── (admin)/admin/      # Admin portal (Dashboard, Logs, Users, AI Settings)
│   │   ├── api/                # REST endpoints (auth, logs, assistant, webhook)
│   │   ├── login/page.tsx      # Multi-admin authenticated login
│   │   ├── reset-password/     # Secure password recovery
│   │   └── not-found.tsx       # Branded 404 handler
│   ├── components/             # Reusable UI components
│   │   ├── admin/              # Admin dashboard panels and modals
│   │   ├── paperAssistant/     # Gemini AI chat interface and launcher
│   │   ├── Navbar.tsx          # University header
│   │   └── PaperList.tsx       # Paginated paper grid
│   ├── lib/                    # Shared core infrastructure
│   │   ├── authCheck.ts        # Centralized RBAC permission engine
│   │   ├── sheets.ts           # Google Sheets mirroring client
│   │   └── supabase/           # SSR and Admin Supabase clients
│   └── styles/                 # Global styles and assistant CSS
├── supabase/
│   └── rls_policies.sql        # Supabase Row-Level Security policy script
├── DOCUMENTED.md               # Complete technical & security documentation
└── .env.example                # Safe environment variables template
```

---

## 🚢 Deployment to Vercel

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "feat: production release"
   git push origin main
   ```
2. Import the repository in **[Vercel](https://vercel.com/new)**.
3. Configure the environment variables matching your `.env.local`.
4. Click **Deploy**. Vercel will build and deploy the production bundle in under 60 seconds.

---

## 👤 Author & Maintainer
- **Abhishek Sankhla**  
- *Poornima University | BCA (Cyber Security)*  
- [LinkedIn Profile](https://linkedin.com/in/abhihacker0777) | [GitHub Profile](https://github.com/abhihacker0777)