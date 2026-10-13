# 🎓 Poornima University - Previous Year Question Papers Portal

A Full-Stack Web Application Designed To Help Poornima University Students And Faculty Easily Discover, Filter, Preview, And Access Previous Year Question Papers (MSE & ESE). Built With Modern Web Standards, High-Performance Rendering, And An Intuitive User Interface.

## ✨ Key Features

- **Cascading Instant Search**: Dynamic Multi-Dimensional Filtering Across Courses, Years, Specializations, Semesters, And Examination Types With Zero Dead Ends.
- **AI Academic Assistant**: Interactive Natural Language Assistant For Smart Paper Discovery And Automatic Question Handling.
- **Cloud Document Storage**: Integrated Google Drive Storage For Examination Paper PDF Hosting And Direct Previews.
- **Audit Logging & Records**: Administrative Paper Actions, Updates, And Query Records Synchronized To Google Sheets.
- **Metadata Database**: Supabase (PostgreSQL) Handles Fast Querying, Categorization, And Paper Records.
- **Administrative Management**: Multi-Tiered Administrative Dashboard For Uploading, Editing, And Managing Papers.
- **Progressive Web App (PWA)**: Installable Directly On Mobile And Desktop Devices With University Branding.
- **Responsive Interface**: Polished UI Matching Official Poornima University Colors (`#05488B` Blue, `#ffc107` Amber), Optimized For Both Mobile And Desktop.

## 🚀 Technologies Used

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Bundler & Compiler**: Turbopack
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL)
- **Cloud Storage**: Google Drive API v3
- **Data Archival**: Google Sheets API v4
- **AI Integration**: Google Gemini API
- **Analytics & Charts**: Recharts
- **Icons**: Lucide React

## 🛠️ Getting Started

### Prerequisites

- Node.js (V18.18 Or Higher, V20+ Recommended)
- npm, pnpm, Or Yarn
- Git

### Installation & Setup

1. **Clone The Repository:**

   ```bash
   git clone https://github.com/abhihacker0777/PUSDFWEBCODE.git
   cd PUSDFWEBCODE
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create A `.env.local` File In The Project Root:

   ```bash
   cp .env.example .env.local
   ```

   Fill In Your Configuration Keys For Supabase, Google APIs, And Application Settings.

4. **Run The Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) In Your Browser.

5. **Build For Production:**

   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```text
PUSDFWEBCODE/
├── src/
│   ├── actions/          # Server Actions (Paper Management, Auth, Assistant)
│   ├── app/              # Next.js App Router (Pages, Layouts, API Routes)
│   ├── components/       # Reusable UI Components (Admin Panels, Paper Assistant)
│   ├── lib/              # Core Libraries & Integrations (Supabase, Drive, Sheets)
│   ├── services/         # Client-Side API Services And Caching Layer
│   └── types/            # TypeScript Type Definitions And Interfaces
├── public/               # Static Assets, Branding, And PWA Manifest
├── next.config.mjs       # Next.js Configuration And API Rewrite Routes
├── package.json          # Dependencies, Scripts, And Package Metadata
└── tsconfig.json         # Strict TypeScript Compiler Options
```

## 🌟 Core Modules

### Dynamic Paper Discovery
The Public Portal Provides Responsive, Cascading Dropdowns That Adjust Available Options Based On Selected Course, Year, And Examination Type, Ensuring Students Find Past Papers Quickly Without Invalid Combinations.

### Cloud Storage Integration
Papers Are Indexed With Metadata In Supabase And Stored As View-Only Documents On Google Drive, Allowing Fast Previews And Downloads Without Overloading Local Server Storage.

### Administrative Control
Authorized Library Personnel Can Upload Single Papers Or Bulk Batches, Update Metadata, Monitor Paper Inventory, And Review Student Search Requests.

---

**Developed By:** Abhishek Sankhla  
*BCA (Cyber Security) Batch 2025–28 | Poornima University | [LinkedIn Profile](https://linkedin.com/in/abhihacker0777)*
