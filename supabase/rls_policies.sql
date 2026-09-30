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

-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL CORE TABLES
ALTER TABLE IF EXISTS papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blocked_users ENABLE ROW LEVEL SECURITY;

-- 2. PAPERS TABLE
-- Public users can view / search all papers
DROP POLICY IF EXISTS "Public papers are viewable by everyone" ON papers;
CREATE POLICY "Public papers are viewable by everyone" ON papers
  FOR SELECT
  USING (true);

-- 3. STUDENT QUERIES TABLE
-- Any student can submit a paper request query via the search assistant
DROP POLICY IF EXISTS "Students can submit queries" ON student_queries;
CREATE POLICY "Students can submit queries" ON student_queries
  FOR INSERT
  WITH CHECK (true);

-- 4. CUSTOM REPLIES TABLE
-- Public assistant can read automated replies
DROP POLICY IF EXISTS "Public can read custom replies" ON custom_replies;
CREATE POLICY "Public can read custom replies" ON custom_replies
  FOR SELECT
  USING (true);

-- ==============================================================================
-- 5. ADMIN TABLES (admin_users, admin_logs, blocked_users)
-- ==============================================================================
-- By enabling RLS without public policies, all direct REST / PostgREST queries 
-- from unauthenticated/anonymous clients are BLOCKED automatically.
-- The Next.js backend uses the Supabase service_role key to manage these tables securely.
-- ==============================================================================
