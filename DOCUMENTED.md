# Poornima University PYQP — Enterprise Technical Documentation (DOCUMENTED.md)

---

## 1. Executive Architecture Overview

This project is the official **Previous Year Question Paper (PYQP) & Academic Document Portal** for **Poornima University (PU)**, designed with an enterprise-grade, defense-in-depth architecture adhering to OWASP Top 10 standards.

### System Architecture Topology
```
┌──────────────────────────────────────────────────────────────────────────┐
│                   Next.js 15 App Router + Turbopack                      │
│                  Edge / Node.js Runtime on Vercel                        │
└────────────┬─────────────────────────────┬───────────────────────────────┘
             │                             │
    Client & Server Actions         Server Actions / API Routes
             │                             │
    ┌────────▼──────────────┐     ┌────────▼────────────────────────────────┐
    │    Tailwind CSS v4    │     │   Security & Auth Layer                 │
    │    Lucide React       │     │   - @supabase/ssr (HTTP-Only Cookies)   │
    │    Recharts           │     │   - Centralized RBAC (requireAdminSession)│
    │    Static Public Assets│    │   - Cloudflare Turnstile CAPTCHA        │
    │    (Zero-RAM Decodes) │     │   - Upstash Redis Rate Limiting         │
    │                       │     │   - Zod Schema Sanitization / XSS       │
    └───────────────────────┘     └────────┬────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼────────────────────────────────┐
         │                                 │                                │
┌────────▼──────────┐            ┌────────▼──────────┐            ┌────────▼──────────┐
│  Supabase (PG)    │            │  Google Drive     │            │  Google Gemini    │
│  - RLS Policies   │            │  - Official OAuth │            │  - @google/genai  │
│  - Papers Index   │            │  - PDF/DOCX Files │            │  - Structured JSON│
│  - Admin Users    │            │  - Central Folder │            │  - Auto-Replies   │
│  - Audit Logs     │            │  - Google Sheets  │            │  - Query Insights │
└───────────────────┘            └───────────────────┘            └───────────────────┘
```

---

## 2. Core Technology Stack

| Component | Technology | Role / Specification |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+ (App Router)** | Full-stack React Server Components, Server Actions & Route Handlers |
| **Dev Bundler** | **Turbopack (`next dev --turbo`)** | Sub-second HMR and instant local development |
| **Language** | **TypeScript 5.7+** | End-to-end strict type safety across all files |
| **Styling & UI** | **Tailwind CSS v4** | Modern utility-first CSS via `@tailwindcss/postcss` |
| **Icons** | **Lucide React** (`lucide-react`) & **React Icons** | Clean vector iconography with zero layout shift |
| **Database & Auth** | **Supabase (PostgreSQL + RLS)** | `@supabase/ssr` with HttpOnly, Secure, SameSite cookies |
| **File Storage** | **Google Drive API v3** | Centralized drive folder with OAuth2 refresh token |
| **Sheets Archival** | **Google Sheets API v4** | Real-time backup mirror of paper records and admin actions |
| **AI Assistant** | **Google Gemini (`@google/genai`)** | Natural language queries with structured JSON schema and fallbacks |
| **Telemetry & Stats** | **Recharts** | Query insights, not-found question analytics, and paper counts |
| **Bot Mitigation** | **Cloudflare Turnstile** | Zero-friction invisible captcha protection on login |
| **Access Control** | **Centralized RBAC Engine** | Role-based permission enforcement (`full`, `editor`, `view`) |

---

## 3. Directory Architecture

```
PUSDFWEBCODEE/
├── .env.local                          # Protected local environment variables (Never committed)
├── .env.example                        # Clean environment template for Vercel / team setup
├── .gitignore                          # Comprehensive ignore rules (secrets, build, cache)
├── DOCUMENTED.md                       # Comprehensive Technical & Architectural Blueprint
├── README.md                           # Developer onboarding & repository orientation
├── next.config.ts                      # Next.js config (HSTS, CSP, X-Frame-Options, Image domains)
├── tsconfig.json                       # Strict TypeScript configuration
├── package.json                        # Root dependencies and Turbopack scripts
├── public/                             # Static brand assets (Served via HTTP cache with zero memory overhead)
│   ├── logo.png                        # Poornima University circular seal
│   ├── pulogo.png                      # PU crest logo
│   ├── pucoverlogo.webp                # Hero cover background
│   ├── pugeminilogo.svg                # Gemini PU floating badge
│   ├── pugeminifullogo.svg            # Full Gemini PU emblem
│   ├── puhindilogo.jpg                 # Hindi typography emblem
│   ├── pupatternlogo.png               # Academic pattern background
│   ├── puupdatelogo.png                # Official sidebar logo
│   └── punew.gif                       # Animated badge
├── src/
│   ├── actions/                        # Server Actions (Mutations protected with requireAdminSession)
│   │   └── paperActions.ts             # uploadPaperAction, bulkDeletePapersAction, bulkEditPapersAction, deletePaperAction
│   ├── app/                            # App Router routes and endpoints
│   │   ├── (public)/page.tsx           # Homepage (Hero, Search, Course Grids, Paper Viewer)
│   │   ├── (admin)/admin/page.tsx      # Admin Dashboard (Dashboard, Papers, Queries, Assistant, Users)
│   │   ├── login/page.tsx              # Secure Admin Login with Turnstile & Timing Equalization
│   │   ├── reset-password/page.tsx     # Password reset handler via secure token hash
│   │   ├── not-found.tsx               # Modern branded 404 handler
│   │   ├── api/                        # Next.js Route Handlers
│   │   │   ├── admin/
│   │   │   │   ├── papers/route.ts     # Admin papers retrieval (gated: papers:read)
│   │   │   │   ├── queries/route.ts    # Student queries retrieval (gated: queries:read)
│   │   │   │   ├── queries/insights/   # Query telemetry and analytics (gated: queries:read)
│   │   │   │   ├── settings/           # Assistant custom replies & blocklist (gated: assistant:*)
│   │   │   │   └── users/route.ts      # Managed admin users RBAC (gated: admins:manage)
│   │   │   ├── assistant/              # Gemini AI Student Assistant endpoints
│   │   │   ├── auth/                   # Authentication endpoints (login, logout, me, reset)
│   │   │   ├── logs/                   # Admin audit trail endpoints (gated: logs:read / logs:write)
│   │   │   ├── sync/route.ts           # Database sync (gated: papers:sync)
│   │   │   ├── delete/route.ts         # Single paper deletion (gated: papers:delete)
│   │   │   ├── bulk-delete/route.ts    # Bulk paper deletion (gated: papers:delete)
│   │   │   ├── bulk-edit/route.ts      # Bulk paper update (gated: papers:update)
│   │   │   ├── upload/route.ts         # Paper PDF upload (gated: papers:create)
│   │   │   └── webhook/route.ts        # Supabase to Google Sheets webhook (HMAC secret verified)
│   │   ├── globals.css                 # Tailwind v4 import & custom utilities
│   │   └── layout.tsx                  # Root layout with logo favicon & Turnstile script
│   ├── components/                     # Reusable modular UI components
│   │   ├── admin/                      # Admin dashboard panels, tables, and modals
│   │   ├── paperAssistant/             # Modular Gemini AI chat interface and launcher
│   │   ├── Navbar.tsx                  # University header with responsive seals
│   │   ├── Filters.tsx                 # Cascading search filter dropdowns
│   │   └── PaperList.tsx               # High-performance paginated paper table
│   ├── lib/                            # Shared core utilities
│   │   ├── authCheck.ts                # Centralized RBAC permission engine & AuthError handler
│   │   ├── sheets.ts                   # Google Sheets mirror service
│   │   └── supabase/                   # Supabase SSR and Service Role clients
│   └── services/api.ts                 # Client-side API fetch utilities with CSRF support
└── supabase/
    └── rls_policies.sql                # Supabase Row-Level Security policy definitions
```

---

## 4. Role-Based Access Control (RBAC) Specification

Defined centrally in `src/lib/authCheck.ts`, every administrative operation is validated against Supabase Auth sessions and the `admin_users` table using `requireAdminSession(requiredPermission)`:

### Role Permissions Matrix

| Permission | Full Admin (Owner) | Editor | View Only |
| :--- | :---: | :---: | :---: |
| `papers:read` | ✅ | ✅ | ✅ |
| `papers:create` | ✅ | ✅ | ❌ |
| `papers:update` | ✅ | ✅ | ❌ |
| `papers:file` | ✅ | ✅ | ❌ |
| `papers:delete` | ✅ | ❌ | ❌ |
| `papers:sync` | ✅ | ❌ | ❌ |
| `assistant:read` | ✅ | ✅ | ✅ |
| `assistant:reply:update` | ✅ | ✅ | ❌ |
| `assistant:reply:create` | ✅ | ❌ | ❌ |
| `assistant:reply:delete` | ✅ | ❌ | ❌ |
| `assistant:block` | ✅ | ❌ | ❌ |
| `monitor:read` | ✅ | ✅ | ✅ |
| `logs:read` | ✅ | ✅ | ✅ |
| `logs:write` | ✅ | ❌ | ❌ |
| `queries:read` | ✅ | ✅ | ✅ |
| `admins:manage` | ✅ (Owner Only) | ❌ | ❌ |

---

## 5. OWASP Top 10 Cyber Defense Matrix

| OWASP Vulnerability | Implementation Defense Mechanism |
| :--- | :--- |
| **A01: Broken Access Control** | • All mutating Server Actions (`paperActions.ts`) and administrative API routes enforce `requireAdminSession` with granular permissions.<br>• Client components only control visibility; the server authoritatively validates identity and role against Supabase Auth.<br>• Only the Primary Owner can create, edit, or toggle other administrators. |
| **A02: Cryptographic Failures** | • Passwords hashed securely via Supabase Auth (Argon2 / bcrypt).<br>• Password reset tokens stored exclusively as SHA-256 hashes with 15-minute expirations.<br>• `Strict-Transport-Security: max-age=31536000; includeSubDomains` header enforced.<br>• Secure, HttpOnly, SameSite cookie flags on all session cookies. |
| **A03: Injection (SQL / XSS / Command)** | • All PostgreSQL queries parameterized via Supabase PostgREST Client (zero raw SQL concatenation).<br>• Server-side Zod validation on inputs.<br>• React JSX automatic contextual encoding prevents XSS.<br>• Headers: `X-XSS-Protection: 1; mode=block` and `X-Content-Type-Options: nosniff`. |
| **A04: Insecure Design** | • Rate-limited assistant and login endpoints.<br>• Cloudflare Turnstile verification enforced before credential check.<br>• Constant-time comparison and timing equalization on auth attempts to prevent user enumeration. |
| **A05: Security Misconfiguration** | • Detailed stack traces disabled in production.<br>• Comprehensive Security Headers configured in `next.config.ts` (`X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`, `HSTS`).<br>• Webhook endpoint strictly rejects calls when HMAC secret is missing or mismatched. |
| **A06: Vulnerable & Outdated Components**| • Modern Next.js 15+ App Router runtime.<br>• Official `@google/genai` (v0.1.1) and `@supabase/ssr` packages.<br>• All deprecated legacy packages removed. |
| **A07: Identification & Auth Failures** | • Progressive lockout delay after repeated failed logins.<br>• Account temporarily locked after repeated failures.<br>• Generic login error message: *"Invalid identifier or password."* |
| **A08: Software & Data Integrity Failures**| • Uploaded files strictly validated by magic byte MIME signatures and extension (`.pdf` only, 50MB max).<br>• Supabase Webhook payload validation via secret verification. |
| **A09: Security Logging & Monitoring** | • Immutable audit logging of all paper creates, updates, and deletes in `admin_logs` and Google Sheets.<br>• Telemetry charts with Recharts to identify student search trends and unfulfilled paper requests. |
| **A10: Server-Side Request Forgery (SSRF)**| • Outgoing requests strictly constrained to official APIs: Supabase, Google Drive, Google Sheets, and Google Gemini API. |

---

## 6. AI Search Assistant Specification (`@google/genai`)

### Initial Student Experience & Dynamic Greeting
When a student logs in using their Poornima Google account (`...@poornima.edu.in`), the assistant drawer initializes with an intelligent context:

1. **Time-Aware Personalized Greeting**:
   - `05:00 - 11:59`: *"Good morning, [Student Name]! ☀️"*
   - `12:00 - 16:59`: *"Good afternoon, [Student Name]! 🌤️"*
   - `17:00 - 20:59`: *"Good evening, [Student Name]! 🌇"*
   - `21:00 - 04:59`: *"Hello [Student Name], studying late? 🌙"*
2. **Introductory Message**:
   > *"Hello! Welcome to Poornima University Academic Portal. How can I help you today? Ask me for any question paper by subject, course, or semester! 😊"*

### Natural Language Search Algorithm

1. The student enters natural queries (e.g., *"bca cyber security 2nd sem operating system mid term paper"*).
2. The server action calls `@google/genai` using model `gemini-2.5-flash` with **Structured JSON Schema Output**:
   ```json
   {
     "course": "BCA",
     "specialization": "CYBER SECURITY",
     "semester": "Sem 2",
     "exam": "MTE",
     "subjectKeywords": ["operating system"],
     "academicYear": null
   }
   ```
3. The server filters cached Supabase papers using multi-token score matching and returns direct viewable drive links with zero latency.
4. If the Gemini API is unreachable, a local regex token search automatically acts as a zero-downtime fallback.

---

## 7. Migration & Verification Status

| Milestone | Status | Details |
| :--- | :---: | :--- |
| **Next.js 15 TypeScript Scaffold** | ✅ Completed | Clean App Router structure with 100% strict type safety. |
| **Turbopack Dev & Static Production** | ✅ Completed | `next dev --turbo` running with zero image decoding memory issues. |
| **Asset Optimization** | ✅ Completed | Assets served via `/public` HTTP cache, eliminating compile-time Rust decoder memory limits. |
| **Supabase SSR & Security Middleware** | ✅ Completed | Session cookies handled securely with HttpOnly flags. |
| **Centralized RBAC Engine** | ✅ Completed | `requireAdminSession` enforced across all Server Actions and admin API routes. |
| **Google Drive & Sheets Integration** | ✅ Completed | OAuth2 refresh-token automated sync and archival. |
| **AI Assistant (`@google/genai`)** | ✅ Completed | Modern SDK with structured JSON parsing and local fallback. |
| **OWASP Top 10 Hardening** | ✅ Completed | HSTS, X-Frame-Options, XSS, rate-limiting, and Turnstile captcha active. |
| **Production Build Validation** | ✅ Completed | `next build` generates 36/36 static and dynamic routes with 0 errors. |
| **Type Check Validation** | ✅ Completed | `npx tsc --noEmit` exits with code 0 (zero errors). |
