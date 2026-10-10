-- ==============================================================================
-- Poornima University Examination Archive Portal (PYQP)
-- Supabase Row-Level Security (RLS) Configuration Script
-- ==============================================================================
-- WHERE TO RUN:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project.
-- 3. Click "SQL Editor" in the left sidebar (icon with ">_").
-- 4. Click "+ New query".
-- 5. Paste this entire file into the editor.
-- 6. Click the green "Run" button (or press Ctrl + Enter).
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL PRODUCTION TABLES
ALTER TABLE IF EXISTS public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;

-- 2. PAPERS TABLE
-- Public users can view and search all published exam question papers
DROP POLICY IF EXISTS "Public papers are viewable by everyone" ON public.papers;
CREATE POLICY "Public papers are viewable by everyone" ON public.papers
  FOR SELECT
  USING (true);

-- 3. CLEAN UP PERMISSIVE OR OBSOLETE POLICIES
-- Drop unauthenticated direct insert on student_queries.
-- All query telemetry and paper feedback are safely validated and recorded by the Next.js server
-- via the service_role key. Direct PostgREST inserts are blocked to prevent spam and injection attacks.
DROP POLICY IF EXISTS "Students can submit queries" ON public.student_queries;

-- Drop obsolete custom_replies table and leaking views if they still exist
DROP TABLE IF EXISTS public.custom_replies CASCADE;
DROP VIEW IF EXISTS public.portal_settings CASCADE;
DROP VIEW IF EXISTS public.question_papers CASCADE;

-- 4. ADVISOR OPTIMIZATION & WARNING FIXES
-- Remove duplicate index on admin_sessions (revocation_token already has unique constraint index)
DROP INDEX IF EXISTS public.admin_sessions_revocation_token_idx;

-- Fix mutable search_path on trigger function to prevent search_path hijacking
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- ==============================================================================
-- 5. ADMIN & SENSITIVE TABLES ZERO-TRUST LOCKDOWN
-- ==============================================================================
-- Tables locked down with NO public policies:
-- - admin_logs
-- - student_queries
-- - blocked_users
-- - admin_users
-- - admin_password_resets
-- - admin_sessions
-- - system_settings
--
-- By enabling RLS without public policies, all direct REST / PostgREST queries 
-- from unauthenticated/anonymous clients are BLOCKED automatically.
-- The Next.js backend exclusively uses the SUPABASE_SERVICE_ROLE_KEY to interact
-- with these tables securely.
-- ==============================================================================
