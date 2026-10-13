ALTER TABLE IF EXISTS public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public papers are viewable by everyone" ON public.papers;
CREATE POLICY "Public papers are viewable by everyone" ON public.papers
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Students can submit queries" ON public.student_queries;

DROP TABLE IF EXISTS public.custom_replies CASCADE;
DROP VIEW IF EXISTS public.portal_settings CASCADE;
DROP VIEW IF EXISTS public.question_papers CASCADE;

DROP INDEX IF EXISTS public.admin_sessions_revocation_token_idx;

ALTER FUNCTION public.set_updated_at() SET search_path = public;
