# Architectural Migration Plan & Developer Handover Guide

> **Project**: Poornima University Previous Year Question Paper (PYQP) Portal  
> **Status**: Production-Ready Next.js App Router (TypeScript)  
> **Author / Maintainer**: Abhishek Sankhla (BCA Cyber Security, 2025-28)  
> **Last Updated**: September 30, 2026

---

## 1. Executive Summary & Core Requirements

This document acts as the definitive roadmap and architectural blueprint. Any AI agent, pair programmer, or engineer continuing work on this repository **must** read and follow these requirements without deviation:

1. **Framework & Language**: Next.js App Router (v15+) with TypeScript (`strict: true`).
2. **Design & Brand Fidelity**:
   - **DO NOT** rewrite or redesign the UI from scratch with arbitrary components.
   - **Preserve** the original Poornima University theme, logos (`puhindilogo.jpg`, `logo.png`, `pulogo.png`, `pucoverlogo.webp`, `punew.gif`, `pugeminilogo.svg`, `pugeminifullogo.svg`), colors (`#05488B`, `#ffc107`, `#b22222`, `#264796`), and font treatments.
   - **Search Bar Placement**: Maintained inside the Course filter row at `sm:-translate-y-3.5 sm:-translate-x-12` with manual vertical offsets (`mt-1 sm:mt-5`).
   - **Paper Cards**: Left-accent yellow border (`border-l-[6px] border-[#ffca2c]`), `📄` icon, secure Google Drive link preview, and metadata badges.
   - **Author Footer**: Preserved on the public homepage:
     ```html
     Created By - Abhishek Sankhla
     BCA (Cyber Security) Batch - 2025-28
     Poornima University
     ```
3. **Database & Auth**:
   - **Supabase PostgreSQL** with Row Level Security (RLS) policies.
   - **@supabase/ssr** cookie-backed sessions with HttpOnly, Secure, and SameSite=Strict cookies.
   - Google Sheets dual-sync logging retained for academic reporting.
4. **Storage**:
   - Google Drive official API v3 with refresh-token OAuth.
5. **AI Search Assistant**:
   - Official `@google/genai` SDK using `gemini-3.5-flash-lite` (or latest active Flash model).
   - Natural language queries (e.g., *"bca cyber security 2nd sem operating system mid term paper"*).
   - Structured JSON schema parsing + multi-token local scoring.
   - **Institutional Sign-In**: Restricted strictly to `@poornima.edu.in` accounts.
   - **Time-Aware Greeting & High-Demand Chips**:
     - `05:00 - 11:59`: *"Good morning, [Name]! ☀️"*
     - `12:00 - 16:59`: *"Good afternoon, [Name]! 🌤️"*
     - `17:00 - 20:59`: *"Good evening, [Name]! 🌇"*
     - `21:00 - 04:59`: *"Hello [Name], studying late? 🌙"*
     - Message: *"Hello! Welcome to Poornima University. How can I help you today? 😊\n\nWhat paper do you want? Choose from high-demand programs below or ask directly:"*
     - Quick Chips:
       - `[ 🎓 B.Tech Papers ]`
       - `[ 💻 BCA Papers ]`
       - `[ 📊 MCA Papers ]`
6. **Security & OWASP Top 10**:
   - Cryptographic CSRF tokens on all state-mutating requests.
   - Cloudflare Turnstile CAPTCHA protection on admin authentication.
   - Constant-time comparison & timing equalization on authentication to prevent user enumeration.
   - Upstash Redis sliding-window rate limiting.
7. **Environment Variables**:
   - **NEVER** delete or truncate keys from `.env` or `.env.local`.

---

## 2. Directory Layout (Next.js TypeScript App Router)

```
c:/Users/abhis/Downloads/PUSDFWEBCODEE_FIXED/PUSDFWEBCODEE/
├── public/                       # High-resolution logos, GIFs, and SVGs
│   ├── logo.png
│   ├── pucoverlogo.webp
│   ├── pugeminifullogo.svg
│   ├── pugeminilogo.svg
│   ├── puhindilogo.jpg
│   ├── pulogo.png
│   ├── punew.gif
│   ├── pupatternlogo.png
│   └── puupdatelogo.png
├── src/
│   ├── actions/                  # Server Actions (Auth, Papers, Gemini Assistant)
│   │   ├── assistantActions.ts
│   │   ├── authActions.ts
│   │   └── paperActions.ts
│   ├── app/                      # Next.js App Router Routes & APIs
│   │   ├── (admin)/admin/        # Protected Admin Dashboard
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (public)/             # Public Question Paper Portal
│   │   │   └── page.tsx
│   │   ├── api/                  # RESTful & Streaming Endpoints
│   │   │   ├── assistant/        # AI Search & Google Token Verification
│   │   │   ├── auth/             # Login, Logout, Session (/me), Reset
│   │   │   ├── csrf-token/       # CSRF Cookie Dispatched Endpoint
│   │   │   └── papers/           # Filtered Papers PostgREST Proxy
│   │   ├── login/                # Admin Login with Turnstile
│   │   │   ├── components/       # LoginBrandPanel, LoginForm, useLoginController
│   │   │   └── page.tsx
│   │   ├── reset-password/       # SHA-256 Token Password Reset
│   │   │   └── page.tsx
│   │   ├── globals.css           # Tailwind v4 + Base + Assistant CSS
│   │   └── layout.tsx            # Root HTML & Metadata
│   ├── assets/                   # Bundled UI assets for direct TSX imports
│   ├── components/               # Core Frontend Components
│   │   ├── admin/                # Complete Admin Component Suite
│   │   │   ├── AdminHeader.jsx
│   │   │   ├── AdminIcons.jsx
│   │   │   ├── AdminModals.jsx
│   │   │   ├── AdminShared.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── BulkPaperUpload.jsx
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── QueryInsightsPanel.jsx
│   │   │   ├── RecentActionsPanel.jsx
│   │   │   ├── StudentQueriesHome.jsx
│   │   │   ├── StudentQueriesPanel.jsx
│   │   │   └── useAdminPageController.js
│   │   ├── paperAssistant/       # AI Floating Launcher & Chat Drawer
│   │   │   ├── assistantAuth.ts
│   │   │   ├── PaperAssistantChat.tsx
│   │   │   ├── PaperAssistantLauncher.tsx
│   │   │   ├── PaperAssistantPanel.tsx
│   │   │   ├── PaperAssistantSignin.tsx
│   │   │   ├── useAssistantConfig.ts
│   │   │   ├── useAssistantMessages.ts
│   │   │   └── usePaperAssistantController.ts
│   │   ├── Filters.tsx           # Course, Year, Spec, Sem, Exam & Search Bar
│   │   ├── Navbar.tsx            # Poornima Maroon Header with Seals
│   │   ├── PaperAssistant.tsx    # Floating Widget Entry Point
│   │   └── PaperList.tsx         # Yellow Accent Cards with Drive Previews
│   ├── lib/                      # Secure Singletons & Clients
│   │   ├── drive.ts              # Google Drive API v3 OAuth Manager
│   │   ├── email.ts              # Nodemailer HTML Templates
│   │   ├── gemini.ts             # Official @google/genai Client
│   │   ├── googleAuth.ts         # Google Sign-In & Service Auth
│   │   ├── redis.ts              # Rate Limiting Engine
│   │   ├── security.ts           # Turnstile & Timing Equalization
│   │   ├── supabase/             # SSR Cookie & Service Clients
│   │   └── utils.ts              # Helpers & Time Greeting
│   ├── services/                 # Frontend API & Cache Layer
│   │   └── api/
│   ├── styles/                   # Imported CSS Files (base, assistant, scrollbars)
│   ├── types/                    # TypeScript Data Contracts
│   └── utils/                    # Client-side Local Fuzzy Search
├── DOCUMENTED.md                 # Full In-Depth Architecture & Security Docs
├── PLAN.md                       # This File (Execution Roadmap & Handover)
├── README.md                     # High-Level Project Overview
├── next.config.ts                # Rewrites, Security Headers & Remote Patterns
├── package.json
└── tsconfig.json
```

---

## 3. Step-by-Step Transition & Verification Roadmap

### Phase 1: Clean Foundation (Complete)
- [x] Initialized Next.js 15 App Router with TypeScript.
- [x] Retained all 9 original assets in `public/` and `src/assets/`.
- [x] Ported all custom stylesheets (`base.css`, `assistant.css`, `scrollbars.css`).

### Phase 2: Frontend Fidelity (Complete)
- [x] Ported `Navbar.tsx` (`#b22222`, Hindi logo, font-serif header, PU seal).
- [x] Ported `Filters.tsx` (preserving the exact search bar location at `sm:-translate-y-3.5 sm:-translate-x-12`).
- [x] Ported `PaperList.tsx` (`border-[#ffca2c]` yellow border cards, `📄` icon, Drive link sanitization).
- [x] Ported `Home.tsx` (`page.tsx`) with animated loading spinner and Abhishek Sankhla's footer.
- [x] Ported `PaperAssistant` launcher, panel, Google signin, and chat.
- [x] Integrated dynamic time-aware greetings and high-demand quick chips (`B.Tech`, `BCA`, `MCA`).

### Phase 3: Auth & Admin Suite (Complete)
- [x] Ported `LoginBrandPanel.tsx` and `LoginForm.tsx` with Cloudflare Turnstile.
- [x] Ported `ResetPasswordPage` with SHA-256 token verification.
- [x] Ported `AdminPage` with all navigation tabs: `Edit Data`, `Bulk Paper Operations`, `Recent Actions`, `Student Queries`, `Update Assistant`, `Admins`.
- [x] Fixed admin permission evaluation so that navigation tabs remain visible and fully functional for administrators.

### Phase 4: Backend API & Rewrites (Complete)
- [x] Added `next.config.ts` rewrites for `/papers`, `/papers/search`, `/assistant/config`, `/assistant/search`, `/assistant/google/verify`, `/csrf-token`, `/me`, `/logout`, and `/password-reset`.
- [x] Fixed `verifyGoogleInstitutionalToken` export in `src/lib/googleAuth.ts`.
- [x] Verified build (`npm run build`) compiles with code 0.
- [x] Verified runtime (`npm run dev`) serves on `http://localhost:3000`.

### Phase 5: 100% Pure TypeScript & Clean Directory (Complete)
- [x] Converted 100% of `.js` and `.jsx` files in `src/` to strict `.ts` and `.tsx` (zero `.js` / `.jsx` files remain).
- [x] Fully typed all admin hooks (`usePaperDashboard`, `useAdminSession`, `useAdminChrome`, `useBulkPaperUpload`, etc.).
- [x] Fixed all TSX element prop types (`colSpan={6}`, callback signatures, type contracts).
- [x] Validated production build (`next build`) exits cleanly with code 0 and all static routes generated.

---

## 4. Instructions for Future Engineers / AI Assistants

1. **Do not create alternative designs**: The user's exact design, colors, positions, and credits must remain intact.
2. **Do not remove `.env` keys**: Existing credentials for Supabase, Google Drive, Turnstile, and Gemini must be preserved.
3. **Keep `DOCUMENTED.md`, `PLAN.md`, and `README.md` updated**: If new endpoints or features are added, update these documentation files immediately.
4. **Production Build Validation**: Always run `npm run build` to confirm zero TypeScript compilation or linting regressions.
