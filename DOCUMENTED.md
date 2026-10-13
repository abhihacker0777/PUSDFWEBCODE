# 🎓 Poornima University PYQP — Complete Technical & Security Architecture Documentation

---

## 📑 Table Of Contents

1. [Executive System Overview](#1-executive-system-overview)
2. [System Topology & Infrastructure Architecture](#2-system-topology--infrastructure-architecture)
3. [Full Technology Stack & Specifications](#3-full-technology-stack--specifications)
4. [Project Directory & Component Structure](#4-project-directory--component-structure)
5. [Role-Based Access Control (RBAC) & Permission Matrix](#5-role-based-access-control-rbac--permission-matrix)
6. [Enterprise Cybersecurity & OWASP Top 10 Defenses](#6-enterprise-cybersecurity--owasp-top-10-defenses)
7. [Database Schema & Supabase Architecture](#7-database-schema--supabase-architecture)
8. [Google Cloud Integrations (Drive & Sheets)](#8-google-cloud-integrations-drive--sheets)
9. [Google Gemini AI Academic Assistant Specification](#9-google-gemini-ai-academic-assistant-specification)
10. [API Endpoints & Server Actions Directory](#10-api-endpoints--server-actions-directory)
11. [Admin Panel Modules & Capabilities](#11-admin-panel-modules--capabilities)
12. [Environment Variables & Secret Configuration](#12-environment-variables--secret-configuration)
13. [Production Deployment & Operational Runbook](#13-production-deployment--operational-runbook)
14. [System Maintenance, Backup, & Troubleshooting](#14-system-maintenance-backup--troubleshooting)

---

## 1. Executive System Overview

The **Poornima University Previous Year Question Paper (PYQP) Portal** Is An Enterprise-Grade, High-Performance Academic Document Management Platform Built Specifically For **Poornima University (PU)** Students, Faculty, And Examination Administrators.

### Primary Operational Objectives:
- **Zero Friction Academic Discovery**: Enables Undergraduates, Postgraduates, And Faculty Members To Instantly Filter, Search, And Preview Mid-Semester Examination (MSE) And End-Semester Examination (ESE) Question Papers.
- **Enterprise Storage Efficiency**: Leverages Google Drive API v3 For View-Only Document Hosting And Direct Web Embedding, Eliminating Local Server Disk Bottlenecks.
- **Dual-Layer Archival & Auditability**: Stores Relational Metadata In Supabase (PostgreSQL) While Synchronizing All Administrative Actions And Student Search Inquiries To Google Sheets In Real-Time.
- **Natural Language Academic Assistance**: Embeds Google Gemini AI (`@google/genai`) To Parse Student Inquiries, Resolve Subject Abbreviations, And Suggest Verified Question Papers.
- **Defense-In-Depth Security**: Enforces Multi-Tiered Role-Based Access Control (RBAC), HttpOnly Cookie Sessions, Cloudflare Turnstile Bot Mitigation, And Rate Limiting.

---

## 2. System Topology & Infrastructure Architecture

The System Employs A Unified Full-Stack Architecture Built On Next.js 16 App Router And Deployed To Vercel's Global Edge Network:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Poornima University PYQP Architecture                           │
│                      Next.js 16 App Router + Turbopack On Vercel                       │
└───────────────────┬───────────────────────────────────────────────┬────────────────────┘
                    │                                               │
           Client Application                              Server Infrastructure
    (React 19 Server & Client Components)         (Server Actions & Route Handlers)
                    │                                               │
   ┌────────────────┴──────────────────┐          ┌─────────────────┴──────────────────┐
   │  - Tailwind CSS v4 Utility Engine │          │  - Security & Authentication Layer │
   │  - Lucide React Vector Icons      │          │  - Centralized RBAC Verification   │
   │  - Recharts Telemetry Charts      │          │  - Cloudflare Turnstile CAPTCHA    │
   │  - Progressive Web App (PWA)      │          │  - Upstash Redis Sliding Limiter   │
   │  - Real-Time Cascading Filters    │          │  - Zod Schema Request Sanitization │
   └───────────────────────────────────┘          └─────────────────┬──────────────────┘
                                                                    │
           ┌────────────────────────────┬───────────────────────────┼────────────────────────────┐
           │                            │                           │                            │
┌──────────▼──────────┐      ┌──────────▼──────────┐     ┌──────────▼──────────┐      ┌──────────▼──────────┐
│   Supabase (PG)     │      │   Google Drive      │     │   Google Sheets     │      │   Google Gemini     │
│   PostgreSQL Engine │      │   Cloud Storage     │     │   Backup Mirror     │      │   AI Engine         │
│  - Row-Level Sec.   │      │  - OAuth2 Refresh   │     │  - Real-Time Append │      │  - @google/genai    │
│  - Papers Catalog   │      │  - View-Only PDFs   │     │  - Action Logs      │      │  - JSON Schema      │
│  - Admin Users      │      │  - Central Folder   │     │  - Query Insights   │      │  - Query Discovery  │
│  - Audit Trail      │      │  - Instant Previews │     │  - University Sync  │      │  - Regex Fallback   │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘      └─────────────────────┘
```

---

## 3. Full Technology Stack & Specifications

| Component Layer | Technology | Version / Specification | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Framework Engine** | **Next.js** | **16 (App Router)** | Full-Stack Server Components, Streaming UI, And Server Actions |
| **User Interface** | **React** | **19** | Modern Declarative Components, React Hooks, And Action Transitions |
| **Compiler & Dev Bundler** | **Turbopack** | **Native Next Engine** | Sub-Second Hot Module Replacement And Optimized Production Compilation |
| **Programming Language** | **TypeScript** | **5.7+ (Strict Mode)** | Complete Compile-Time Type Safety Across Both Frontend And Backend |
| **Styling Framework** | **Tailwind CSS** | **v4 (`@tailwindcss/postcss`)** | Utility-First CSS Engine With University Brand Color Theming |
| **Iconography** | **Lucide React** | **`lucide-react`** | Lightweight, Optimized Vector SVG Icon Components |
| **Relational Database** | **Supabase PostgreSQL** | **PostgreSQL 15+** | Relational Indexing, Fast Metadata Search, And Row-Level Security |
| **Authentication Engine** | **`@supabase/ssr`** | **SSR Cookie Client** | Cryptographically Secure HttpOnly, SameSite, Secure Cookie Sessions |
| **Cloud Document Storage** | **Google Drive API** | **v3 (OAuth2 Client)** | Scalable PDF Document Storage, View-Only Permissions, And Embeds |
| **Data Synchronization** | **Google Sheets API** | **v4 (OAuth2 Client)** | Continuous Real-Time Mirroring Of Action Logs And Query Insights |
| **Artificial Intelligence** | **Google Gemini** | **`@google/genai` (v0.1.1)** | Natural Language Query Extraction And Automated Question Answering |
| **Telemetry & Metrics** | **Recharts** | **Modern SVG Charts** | Administrative Visualizations Of Paper Usage And Search Trends |
| **Bot Mitigation** | **Cloudflare Turnstile** | **Client & Server SDK** | Frictionless CAPTCHA Verification Defending Administrative Logins |
| **Rate Limiting Engine** | **Upstash Redis** | **`@upstash/ratelimit`** | Distributed Sliding-Window Rate Limiting For Sensitive Endpoints |
| **Email Relay** | **Nodemailer** | **SMTP Over SSL (465)** | Administrative Password Reset Token Transmission Via Email |
| **PWA Engine** | **Web App Manifest** | **W3C PWA Standard** | Installable Standalone Desktop And Mobile Experience With University Seals |

---

## 4. Project Directory & Component Structure

```text
PUSDFWEBCODE/
├── public/                                # Static Brand Assets And Direct HTTP Cache
│   ├── logo.png                           # Official Poornima University Header Logo
│   ├── pulogo.png                         # University Crest Badge
│   ├── pucoverlogo.webp                   # Administrative Portal Hero Cover Graphic
│   ├── pugeminilogo.svg                   # Gemini AI Launcher Indicator Badge
│   ├── pugeminifullogo.svg                # Full Brand Gemini AI Emblem
│   ├── icon-192.png                       # PWA Home Screen Application Icon (192x192)
│   ├── icon-512.png                       # High-Resolution PWA Icon (512x512)
│   └── manifest.json                      # Progressive Web App Configuration Manifest
├── src/
│   ├── actions/                           # Authoritative Next.js Server Actions
│   │   ├── assistantActions.ts            # Natural Language Processing & Query Feedback
│   │   ├── authActions.ts                 # Admin Authentication, Verification & Logouts
│   │   └── paperActions.ts                # Paper CRUD, Bulk Operations & Sheets Sync
│   ├── app/                               # Next.js App Router Structure
│   │   ├── (public)/                      # Public Student Access Pages
│   │   │   └── page.tsx                   # Main Portal: Cascading Search & Paper Catalog
│   │   ├── (admin)/                       # Administrative Subsystem
│   │   │   └── admin/page.tsx             # Protected Multi-Panel Administrative Dashboard
│   │   ├── api/                           # Secure REST Route Handlers
│   │   │   ├── admin/                     # Administrative API Routes (RBAC Protected)
│   │   │   │   ├── papers/route.ts        # Comprehensive Paper Management Service
│   │   │   │   ├── queries/               # Student Inquiry Review & Insights
│   │   │   │   ├── sessions/route.ts      # Active Session Monitoring & Invalidation
│   │   │   │   ├── system-settings/       # Global Maintenance Mode & Announcement Toggles
│   │   │   │   └── users/route.ts         # Sub-Admin Creation & Permission Assignment
│   │   │   ├── assistant/                 # Gemini AI Assistant API Endpoints
│   │   │   ├── auth/                      # Authentication Verification & Profile Services
│   │   │   ├── bulk-delete/route.ts       # Multi-Paper Batch Deletion Service
│   │   │   ├── paper-options/route.ts     # Cascading Taxonomy Metadata Hierarchy
│   │   │   ├── papers/route.ts            # Public Paginated Query Service
│   │   │   ├── settings/public/route.ts   # Public Announcement & Status Flag Provider
│   │   │   ├── upload/route.ts            # Direct Drive Upload & Supabase Indexing
│   │   │   └── webhook/route.ts           # Supabase Database Webhook Listener (HMAC Verified)
│   │   ├── login/page.tsx                 # University Administrative Authentication Interface
│   │   ├── reset-password/page.tsx        # Password Recovery & Token Validation Interface
│   │   ├── error.tsx                      # Global Error Boundary With Branded Recovery
│   │   ├── layout.tsx                     # Universal Shell: Typography, Metadata & Turnstile
│   │   ├── not-found.tsx                  # Custom 404 University Branded Page
│   │   └── sitemap.ts                     # Search Engine Optimization Sitemap Generator
│   ├── components/                        # Reusable React UI Components
│   │   ├── admin/                         # Administrative Dashboard Subcomponents
│   │   │   ├── hooks/                     # Custom React Admin Controllers & Data Fetchers
│   │   │   ├── modals/                    # Upload, Edit, Delete, And Admin User Modals
│   │   │   ├── panels/                    # Paper Table, Query Insights & System Panels
│   │   │   └── utils/                     # Paper Action Handlers & Notification Helpers
│   │   ├── paperAssistant/                # AI Chat Drawer, Message Bubbles & Launcher
│   │   ├── Filters.tsx                    # Cascading Dropdowns: Course, Year, Semester
│   │   ├── Navbar.tsx                     # Header Navigation Featuring University Colors
│   │   └── PaperList.tsx                  # High-Performance Paginated Paper Cards & Table
│   ├── lib/                               # Core Infrastructure Clients & Utilities
│   │   ├── supabase/                      # Supabase SSR And Admin Service Role Clients
│   │   ├── authCheck.ts                   # Centralized RBAC Permission Verification Engine
│   │   ├── drive.ts                       # Google Drive API v3 OAuth2 Client & Uploader
│   │   ├── email.ts                       # Nodemailer SMTP Password Reset Delivery Client
│   │   ├── ratelimit.ts                   # Upstash Redis Sliding-Window Rate Limiter
│   │   ├── security.ts                    # Timing-Safe Token Comparison & Sanitization
│   │   └── sheets.ts                      # Google Sheets API v4 Synchronizer & Backup Client
│   ├── services/                          # Browser-Side API Layer & Cache Handlers
│   │   └── api/papers.ts                  # SWR / Client-Side Fetchers With In-Memory Cache
│   └── types/                             # Centralized TypeScript Interfaces & Schemas
│       └── index.ts                       # Database Rows, API Contracts & User Sessions
├── supabase/
│   └── rls_policies.sql                   # Supabase Row-Level Security Enforcements
├── .env.example                           # Standard Environment Configuration Blueprint
├── next.config.mjs                        # Production Security Headers & Route Rewrites
├── package.json                           # NPM Package Dependencies & Build Scripts
└── tsconfig.json                          # Strict TypeScript Configuration Options
```

---

## 5. Role-Based Access Control (RBAC) & Permission Matrix

The Portal Enforces Strict Centralized RBAC Located At `src/lib/authCheck.ts`. Every Server Action And Protected API Endpoint Calls `requireAdminSession(requiredPermission)`.

### Administrator Roles:
1. **Full Administrator (Owner / Super Admin)**: Has Unrestricted Governance Over All Question Papers, System Settings, Audit Logs, And Other Administrative Accounts.
2. **Editor**: Authorized To Upload Question Papers, Update Metadata, Replace Files, And Manage Custom Automated Replies. Cannot Delete Records Or Alter User Permissions.
3. **View Only (Auditor)**: Read-Only Access To Administrative Inventories, System Health Status, Student Inquiries, And Historical Audit Logs.

### Granular Permissions Matrix:

| Operational Permission | System Action Description | Full Admin (Owner) | Editor | View Only |
| :--- | :--- | :---: | :---: | :---: |
| `papers:read` | View All Paper Records In Administrative Catalog | ✅ | ✅ | ✅ |
| `papers:create` | Upload New Papers To Google Drive And Supabase | ✅ | ✅ | ❌ |
| `papers:update` | Edit Course, Semester, Year, Or Subject Metadata | ✅ | ✅ | ❌ |
| `papers:file` | Replace Or Update Existing PDF Document Files | ✅ | ✅ | ❌ |
| `papers:delete` | Permanently Delete Single Or Bulk Question Papers | ✅ | ❌ | ❌ |
| `papers:sync` | Trigger Manual Resynchronization With Google Sheets | ✅ | ❌ | ❌ |
| `assistant:read` | Review Student Search Queries And Assistant Logs | ✅ | ✅ | ✅ |
| `assistant:reply:update` | Update Automated Answers For Common Inquiries | ✅ | ✅ | ❌ |
| `assistant:reply:create` | Create New Predetermined Answers For Questions | ✅ | ❌ | ❌ |
| `assistant:reply:delete` | Remove Predetermined Answers From The Assistant | ✅ | ❌ | ❌ |
| `assistant:block` | Block Malicious Or Abusive User Email Addresses | ✅ | ❌ | ❌ |
| `monitor:read` | Inspect Real-Time Storage And System Telemetry | ✅ | ✅ | ✅ |
| `logs:read` | Browse Historical Administrative Activity Records | ✅ | ✅ | ✅ |
| `logs:write` | Append Structured Records To Audit Tables | ✅ | ❌ | ❌ |
| `queries:read` | Access Student Feedback And Unfulfilled Searches | ✅ | ✅ | ✅ |
| `admins:manage` | Create, Deactivate, Or Modify Sub-Administrators | ✅ (Owner Only) | ❌ | ❌ |

---

## 6. Enterprise Cybersecurity & OWASP Top 10 Defenses

| OWASP Vulnerability Standard | Concrete Defense Implementation In PUSDFWEBCODE |
| :--- | :--- |
| **A01: Broken Access Control** | • All Server Actions (`src/actions/paperActions.ts`) Authoritatively Validate Identity Through `requireAdminSession`.<br>• Frontend Component Visibility Toggles Are Purely Aesthetic; Server Rejects Unauthorized Execution With `403 Forbidden`.<br>• Sub-Administrator Accounts Cannot Elevate Permissions Or Modify Other Admins. |
| **A02: Cryptographic Failures** | • Passwords Are Cryptographically Stored Using Supabase Auth Hashing (Bcrypt / Argon2).<br>• Password Reset Tokens Are Stored Exclusively As HMAC-SHA256 Hashes With A Strict 15-Minute Expiration.<br>• Session Tokens Are Transmitted In Secure, HttpOnly, SameSite Cookies.<br>• Enforced `Strict-Transport-Security: max-age=31536000; includeSubDomains` Header. |
| **A03: Injection Defenses** | • All Database Operations Use Parameterized PostgREST Calls Via Supabase JavaScript Client (Zero Raw SQL Concatenation).<br>• Server-Side Inputs Are Validated And Sanitized Via Zod Schemas Before Processing.<br>• React Contextual Encoding Eliminates Cross-Site Scripting (XSS).<br>• Configured Headers: `X-Content-Type-Options: nosniff` And `X-XSS-Protection: 1; mode=block`. |
| **A04: Insecure Design** | • Rate-Limiting Protection On Public Assistant And Authentication Endpoints Via Upstash Redis.<br>• Cloudflare Turnstile Verification Required On All Login Attempts Prior To Credential Checks.<br>• Timing-Safe Comparison (`timingSafeEqual`) Avoids Side-Channel Timing Attacks During Token Verification. |
| **A05: Security Misconfiguration** | • Detailed Internal Error Traces Are Suppressed In Production; Replaced With Generic User-Facing Error Alerts.<br>• Hardened Security Headers Configured Directly Inside `next.config.mjs` (`X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).<br>• Webhook Endpoints Reject Unauthenticated Invocations Missing Valid HMAC Secrets. |
| **A06: Vulnerable Components** | • Runs Modern Next.js 16 (App Router) And React 19.<br>• Upgraded To Official `@google/genai` (v0.1.1) And `@supabase/ssr`.<br>• Complete Removal Of Deprecated Legacy Packages And Redundant Express Middlewares. |
| **A07: Identification & Auth Failures** | • Progressive Delays Enforced After Failed Authentication Attempts.<br>• Account Lockout Triggers Temporarily Following Repeated Consecutive Failures.<br>• Return Standardized Generic Errors (*"Invalid Identifier Or Password."*) To Prevent Account Enumeration. |
| **A08: Software & Data Integrity** | • File Uploads Enforce MIME Magic Byte Inspection, Validating Files Are Genuine PDFs Under 50MB.<br>• Supabase Webhooks Enforce Cryptographic Signature Verification Before Processing Events. |
| **A09: Security Logging & Monitoring** | • Immutable Audit Trails Documenting Creation, Editing, Deletion, And Sync Operations In `admin_logs` And Google Sheets.<br>• Visualized Telemetry Charts Powered By Recharts Detect Unusual Spikes In Unfulfilled Queries. |
| **A10: Server-Side Request Forgery** | • Outbound Network Calls Are Strictly Restricted To Whitelisted Endpoints (Google Drive API, Google Sheets API, Supabase API, And Google Gemini API). |

---

## 7. Database Schema & Supabase Architecture

The Primary Relational Database Is Managed Within Supabase (PostgreSQL 15+).

### Core Database Tables:

1. **`public.papers`**:
   - `id` (UUID, Primary Key): Unique Identifier For Each Question Paper.
   - `title` (Text): Descriptive Name (E.g., *"Operating Systems Mid-Term Paper 2024"*).
   - `course` (Text): Academic Degree (E.g., *"BCA"*, *"B.Tech"*, *"MBA"*).
   - `year` (Text): Academic Batch Year (E.g., *"2024"*, *"2023"*).
   - `semester` (Text): University Semester (E.g., *"Sem 1"*, *"Sem 2"*).
   - `specialization` (Text): Department Branch (E.g., *"Cyber Security"*, *"AI & DS"*, *"General"*).
   - `exam_type` (Text): Examination Category (*"MSE"* Or *"ESE"*).
   - `subject_code` (Text, Optional): Official Examination Subject Code.
   - `drive_file_id` (Text): Google Drive Unique File Storage Identifier.
   - `drive_view_link` (Text): View-Only Google Drive URL For Embedded Web Preview.
   - `download_link` (Text): Direct Download URL For Students.
   - `created_at` (Timestamptz): Timestamp Of Creation.
   - `updated_at` (Timestamptz): Timestamp Of Last Modification.

2. **`public.admin_users`**:
   - `id` (UUID, Primary Key): References Supabase Auth User ID.
   - `email` (Text, Unique): University Administrator Email (`...@poornima.edu.in`).
   - `display_name` (Text): Full Name Displayed In Dashboard.
   - `role` (Text): Role Permission Identifier (`full`, `editor`, `view`).
   - `is_active` (Boolean): Global Account Activation Toggle.
   - `created_at` (Timestamptz): Timestamp Of Enrollment.
   - `updated_at` (Timestamptz): Timestamp Of Last Profile Change.

3. **`public.admin_sessions`**:
   - `id` (UUID, Primary Key): Unique Session Identifier.
   - `user_id` (UUID): References `admin_users.id`.
   - `session_token` (Text): Encrypted Unique Session Verification Key.
   - `ip_address` (Text): Client IP Recorded During Authentication.
   - `user_agent` (Text): Device And Browser Signature.
   - `expires_at` (Timestamptz): Expiration Timestamp.
   - `created_at` (Timestamptz): Session Inception Timestamp.

4. **`public.admin_password_resets`**:
   - `id` (UUID, Primary Key): Unique Reset Request Identifier.
   - `email` (Text): Target Administrator Email.
   - `token_hash` (Text): HMAC-SHA256 Hash Of The Generated Password Reset Token.
   - `expires_at` (Timestamptz): Timestamp Marking The 15-Minute Expiration Threshold.
   - `used_at` (Timestamptz, Nullable): Timestamp When The Reset Was Redeemed.
   - `created_at` (Timestamptz): Timestamp Of Inception.

5. **`public.admin_logs`**:
   - `id` (UUID, Primary Key): Audit Log Entry Identifier.
   - `admin_email` (Text): Email Of The Acting Administrator.
   - `action` (Text): Event Category (`CREATE_PAPER`, `UPDATE_PAPER`, `DELETE_PAPER`, `BULK_DELETE`).
   - `details` (JSONB): Structured Context Regarding The Affected Record.
   - `ip_address` (Text): IP Address Of The Administrator At Execution.
   - `timestamp` (Timestamptz): Immutable Timestamp.

6. **`public.student_queries`**:
   - `id` (UUID, Primary Key): Unique Search Query Identifier.
   - `student_email` (Text, Nullable): Logged Student Google Account Email.
   - `query_text` (Text): Natural Language Query Entered By The Student.
   - `status` (Text): Status Indicator (`ANSWERED`, `UNANSWERED`, `NOT_FOUND`).
   - `paper_id` (UUID, Nullable): Matching Paper ID Found In Database.
   - `created_at` (Timestamptz): Timestamp Of Submission.

7. **`public.system_settings`**:
   - `id` (UUID, Primary Key): Setting Record Identifier.
   - `key` (Text, Unique): Global Configuration Parameter Key.
   - `value` (JSONB): Configuration Value Object.
   - `updated_by` (Text): Email Of The Modifying Administrator.
   - `updated_at` (Timestamptz): Modification Timestamp.

### Row-Level Security (RLS) Policy Specifications:
- **`papers`**: Public Read Access Is Permitted (`FOR SELECT USING (true)`). Insert, Update, And Delete Operations Are Restricted Strictly To Verified Administrative Sessions.
- **`admin_users` & `admin_sessions`**: Restricted Strictly To Service Role Calls And Authenticated Admin Sessions. Public Access Is Disallowed.
- **`admin_logs` & `system_settings`**: Read/Write Permitted Exclusively To Administrative Roles.

---

## 8. Google Cloud Integrations (Drive & Sheets)

### Google Drive Integration (`src/lib/drive.ts`):
- **Authentication**: Connects Via Google OAuth2 Using `CLIENT_ID`, `CLIENT_SECRET`, And A Long-Lived `DRIVE_REFRESH_TOKEN`.
- **Automated Token Refresh**: The System Automatically Generates Fresh Access Tokens On-Demand Without Interrupting Operations.
- **Upload Flow**:
  1. The User Submits A Validated PDF Through The Upload Modal.
  2. The Server Streams The File Buffer Directly To Google Drive Inside `DRIVE_FOLDER_ID`.
  3. Sets Permissions To Public Read (`type: 'anyone'`, `role: 'reader'`) While Disallowing Modifying Rights.
  4. Returns The Permanent `drive_file_id` And Formatted Preview Link (`https://drive.google.com/file/d/[ID]/preview`).
  5. The Local Buffer Is Immediately Garbage-Collected From Server Memory.

### Google Sheets Real-Time Mirror (`src/lib/sheets.ts`):
- **Purpose**: Provides Independent, Non-Technical University Personnel With Real-Time Access To Audit Logs And Inquiries.
- **Dual-Sheet Architecture**:
  - **Tab 1: Action Logs**: Records Every Create, Update, And Delete Event With Timestamp, Operator, Action, And Target File ID.
  - **Tab 2: Query Logs**: Tracks Student Search Searches, Flagging High-Demand Papers That Need To Be Sourced By The Library.
- **Resilience**: Network Failures In Google Sheets Invocations Are Handled Non-Blockingly, Ensuring Core Supabase Operations Never Fail Due To External Sheet Quota Limits.

---

## 9. Google Gemini AI Academic Assistant Specification

The Assistant Embeds In The Bottom-Right Corner Of The Student Interface And Utilizes Google Gemini (`@google/genai`) Operating Model `gemini-2.5-flash` Or `gemini-3.5-flash-lite`.

### Intelligent Query Extraction Pipeline:
1. **Student Natural Query**: E.g., *"Sir do we have 2023 cyber security bca operating system end term exam paper?"*
2. **Gemini Schema Extraction**:
   Gemini Extracts Strict Structured JSON:
   ```json
   {
     "course": "BCA",
     "specialization": "CYBER SECURITY",
     "semester": "Sem 2",
     "exam": "ESE",
     "subjectKeywords": ["Operating System"],
     "academicYear": "2023"
   }
   ```
3. **Database Matcher**: Evaluates Available Papers In Memory Using Score-Weighted Token Intersections.
4. **Interactive Response**: Returns A Direct Link Card Allowing The Student To Preview Or Download The Paper Instantly.
5. **Zero-Downtime Regex Fallback**: If The Gemini API Exceeds Rate Quotas Or Experiences Intermittent Network Delays, An Internal High-Performance Regular Expression Tokenizer Parses The Input And Returns Matches With Zero Outage.

---

## 10. API Endpoints & Server Actions Directory

### Public REST Endpoints:
- `GET /api/papers`: Paginated, Filterable Question Paper Inventory With Client-Side Caching Headers.
- `GET /api/paper-options`: Dynamic Cascading Taxonomy Hierarchy (Courses, Batches, Semesters, Specializations).
- `GET /api/settings/public`: Public Application Configuration (Maintenance Flag, University Announcement Banners).
- `POST /api/assistant`: Natural Language Assistant Search Powered By Google Gemini.
- `POST /api/assistant/feedback`: Logs Unfulfilled Student Queries For Library Administration Review.

### Protected Administrative REST Endpoints:
- `POST /api/auth/login`: Administrative Authentication With Turnstile CAPTCHA Verification.
- `POST /api/auth/logout`: Revokes Current Session Token And Invalidates Auth Cookies.
- `GET /api/auth/me`: Verifies Active Session And Returns Authenticated Admin Profile.
- `GET /api/admin/papers`: Complete Administrative Search, Filtering, And Pagination Service.
- `POST /api/upload`: Direct Paper Ingestion Streaming To Google Drive And Supabase.
- `POST /api/bulk-delete`: Multi-Selection Batch Deletion Requiring Explicit Admin Confirmation.
- `GET /api/admin/queries`: Review Student Search Queries And Missing Paper Alerts.
- `GET /api/admin/queries/insights`: Telemetry Insights Detailing Most Requested Subjects And Unmet Searches.
- `GET /api/admin/system-settings`: Fetch Global Configuration Toggles.
- `PUT /api/admin/system-settings`: Update Maintenance Mode, AI Assistant Parameters, And Public Alerts.
- `GET /api/admin/users`: List Sub-Administrators With Role Assignments (Owner Only).
- `POST /api/admin/users`: Enroll New Sub-Administrator Account (Owner Only).
- `DELETE /api/admin/users`: Deactivate Or Remove Sub-Administrator Account (Owner Only).
- `POST /api/webhook`: Supabase Database Webhook Ingestion Point With HMAC Secret Verification.

### Authoritative Server Actions:
- `src/actions/paperActions.ts`:
  - `savePaperAction(data)`: Handles Paper Creation And Updates With Role Verification.
  - `deletePaperAction(id)`: Permanently Deletes Specified Paper And Drive Assets.
  - `bulkUploadPapersAction(items)`: Batch Ingestion Processor With Sequential Drive Streaming.
  - `syncSheetsAction()`: Triggers Manual Bidirectional Sync With University Google Sheets.
- `src/actions/authActions.ts`:
  - `loginAction(credentials)`: Validates Credentials And Establishes Secure Session.
  - `requestPasswordResetAction(email)`: Dispatches Signed Recovery Email Via SMTP Relay.
  - `completePasswordResetAction(token, newPassword)`: Validates HMAC Token And Updates Password.
- `src/actions/assistantActions.ts`:
  - `askAssistantAction(query)`: Processes Natural Language Queries Through Gemini AI.
  - `recordQueryFeedbackAction(payload)`: Saves Missing Paper Alerts To Database.

---

## 11. Admin Panel Modules & Capabilities

The Administrative Dashboard (`/admin`) Provides Centralized Operational Control:

### 1. Dashboard Overview Panel
- **Real-Time Counters**: Displays Total Question Papers, Total Courses, Unfulfilled Student Inquiries, And System Health.
- **Recent Ingestion Feed**: Chronological Stream Of Latest Uploaded Examination Papers.

### 2. Paper Catalog & Management Panel
- **Multi-Parameter Search**: Instant Filtering By Course, Year, Semester, Exam Type, Or Keyword.
- **Single Paper Ingestion Modal**: Drag-And-Drop Upload With Automatic MIME Validation.
- **Bulk Ingestion Modal**: Batch Processor Allowing Concurrent Registration Of Entire Examination Batches.
- **Paper Editor Modal**: Edit Metadata (Subject Code, Title, Course, Semester) Without Re-Uploading File.
- **Bulk Deletion Toolbar**: Multi-Select Checkboxes With Safety Confirmation Modal.

### 3. Student Inquiries & Insights Panel
- **Search Demand Analytics**: Interactive Recharts Bar And Pie Visualizations Showing Most Requested Subjects.
- **Missing Papers Tracker**: Actionable List Of Student Queries That Returned Zero Results, Allowing Library Staff To Source Missing Papers.

### 4. Administrator Account Management (Super Admin Exclusive)
- **Account Enrollment**: Add New Departmental Administrators By Email.
- **Role Assignment**: Assign Granular Roles (`Full Administrator`, `Editor`, `View Only`).
- **Access Revocation**: Instantly Deactivate Or Delete Compromised Accounts.

### 5. Global System Settings Panel
- **Maintenance Mode Toggle**: Instantly Takes The Public Portal Offline For Scheduled Examination Maintenance.
- **Announcement Banner**: Broadcast Emergency University Notifications Or Examination Instructions.
- **AI Model Selector**: Select Between Gemini Flash Models And Adjust Semantic Sensitivity.

### 6. Audit Trail & Log Viewer
- **Immutable Action Log**: Searchable Historical Activity Log Documenting Operator, Action, Timestamp, And IP Address.

---

## 12. Environment Variables & Secret Configuration

All Secrets Must Be Configured In `.env.local` And Never Committed To Version Control:

| Variable Name | Environment | Description & Requirement | Example Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase Project REST Endpoint URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase Anonymous Public API Key | `eyJhbGciOiJIUzI1NiIsInR5...` |
| `SUPABASE_URL` | Server | Supabase Server Base URL | `https://xyzproject.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (Secret) | High-Privilege Service Role Key For Admin Tasks | `eyJhbGciOiJIUzI1NiIsInR5...` |
| `SUPABASE_WEBHOOK_SECRET` | Server (Secret) | Secret Token Verifying Incoming Supabase Webhooks | `my-secret-webhook-key-123` |
| `ADMIN_EMAIL` | Server | Primary University Owner / Super Admin Email | `library@poornima.edu.in` |
| `ADMIN_DISPLAY_NAME` | Server | Display Name Of The Super Administrator | `Central Library Admin` |
| `JWT_SECRET` | Server (Secret) | Cryptographic Key Used For Session Verification | `c3f81e...64-char-random-hex` |
| `GEMINI_API_KEY` | Server (Secret) | Google AI Studio Gemini API Key | `AIzaSy...your-gemini-key` |
| `GEMINI_MODEL` | Server | Designated Google Gemini Model Name | `gemini-2.5-flash` |
| `CLIENT_ID` | Server (Secret) | Google Cloud Platform OAuth2 Client ID | `123456789-abc.apps.googleusercontent.com` |
| `CLIENT_SECRET` | Server (Secret) | Google Cloud Platform OAuth2 Client Secret | `GOCSPX-your-secret-key` |
| `DRIVE_REFRESH_TOKEN` | Server (Secret) | Long-Lived OAuth2 Refresh Token For Google Drive | `1//04...your-refresh-token` |
| `DRIVE_FOLDER_ID` | Server | Designated Google Drive Target Storage Folder ID | `1A2B3C4D5E6F7G8H9I0J` |
| `SHEET_ID` | Server | University Audit & Telemetry Google Sheet ID | `1xYz987654321AbCdEfGh` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Cloudflare Turnstile Public Site Key | `0x4AAAAAA...your-site-key` |
| `CAPTCHA_SECRET` | Server (Secret) | Cloudflare Turnstile Private Secret Key | `0x4AAAAAA...your-secret-key` |
| `SMTP_HOST` | Server | Outgoing Mail Server Host For Password Resets | `smtp.gmail.com` |
| `SMTP_PORT` | Server | Outgoing Mail Server Port | `465` |
| `SMTP_SECURE` | Server | SSL Connection Toggle (`true` For Port 465) | `true` |
| `SMTP_USER` | Server | Authenticated SMTP User Account | `library@poornima.edu.in` |
| `SMTP_PASSWORD` | Server (Secret) | Google Workspace App Password (16 Characters) | `abcd efgh ijkl mnop` |
| `PASSWORD_RESET_FROM` | Server | Formatted Sender Address On Outgoing Resets | `"Poornima Library" <library@poornima.edu.in>` |
| `SECURITY_CONTACT_EMAIL` | Public / Server | Official Emergency Security Contact Email | `library@poornima.edu.in` |

---

## 13. Production Deployment & Operational Runbook

### Deployment On Vercel:
1. **Repository Synchronization**:
   Push Clean Code To The Designated GitHub Or GitLab Enterprise Repository:
   ```bash
   git add .
   git commit -m "feat: complete poornima university production build"
   git push origin main
   ```
2. **Project Ingestion**:
   - Log In To The [Vercel Dashboard](https://vercel.com).
   - Click **Add New Project** And Select The Target Repository.
3. **Build & Runtime Configuration**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Development Command**: `next dev --turbopack`
   - **Output Directory**: `.next`
4. **Environment Variables**:
   - In Vercel Project Settings, Navigate To **Environment Variables**.
   - Input All Values Documented In Section 12 Above.
5. **Deployment Execution**:
   - Click **Deploy**. Vercel Will Compile The Turbopack Production Artifact In Under 60 Seconds.

---

## 14. System Maintenance, Backup, & Troubleshooting

### 1. Google OAuth Token Refresh Incident
- **Symptom**: Uploads Fail With Message *"Google Drive Authentication Error."*
- **Root Cause**: The Google Cloud OAuth Consent Screen May Be Set To "Testing", Causing Tokens To Expire Every 7 Days.
- **Resolution**:
  1. Open The Google Cloud Console.
  2. Under **APIs & Services** > **OAuth Consent Screen**, Publish The Application To **Production**.
  3. Generate A Fresh Long-Lived Refresh Token And Update `DRIVE_REFRESH_TOKEN` In Vercel.

### 2. Database Backup & Disaster Recovery
- **Supabase Automated Daily Backups**: Managed Automatically By Supabase Infrastructure.
- **Google Sheets Secondary Mirror**: The Entire Paper Catalog And Audit History Are Continuously Mirrored To Google Sheets, Ensuring Paper Records Are Never Lost Even If Database Maintenance Is Required.

### 3. Emergency Maintenance Mode
- **Procedure**: If The University System Experiences Scheduled Maintenance, An Administrator Can Enable Maintenance Mode In The Admin Settings Panel, Or Set `MAINTENANCE_MODE=true` In Environment Variables, Showing A Branded Maintenance Screen To Students.

---

**Developed & Maintained By:** Abhishek Sankhla  
*BCA (Cyber Security) Batch 2025–28 | Poornima University | [LinkedIn Profile](https://linkedin.com/in/abhihacker0777)*
