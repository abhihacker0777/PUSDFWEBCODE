-- Poornima PYQP Supabase schema.
-- Run this in Supabase SQL Editor. It is safe to run again.

create extension if not exists pgcrypto;

-- 1. Paper metadata
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  course text not null default '',
  year text not null default '',
  specialization text not null default '',
  semester text not null default '',
  exam text not null default '',
  title text not null default '',
  drive_url text not null default '',
  drive_file_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists papers_filter_idx
  on public.papers (course, year, specialization, semester, exam);

create index if not exists papers_public_idx
  on public.papers (course, year, semester, exam)
  where title <> '' and drive_url <> '';

create index if not exists papers_public_order_by_idx
  on public.papers (course, year, specialization, semester, exam, title)
  where title <> '' and drive_url <> '';

-- 2. Admin action logs
create table if not exists public.admin_logs (
  id bigint primary key,
  "index" text,
  date text,
  status text,
  course text,
  year text,
  spec text,
  semester text,
  exam text,
  name text,
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_created_idx
  on public.admin_logs (created_at desc);

-- 3. Student assistant/query logs
drop table if exists public.assistant_logs;

create table if not exists public.student_queries (
  id uuid primary key default gen_random_uuid(),
  email text not null default '',
  question text not null default '',
  status text not null default '',
  message text not null default '',
  paper_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists student_queries_email_idx
  on public.student_queries (email);

create index if not exists student_queries_sort_idx
  on public.student_queries (created_at desc);

-- 4. Assistant/admin settings
create table if not exists public.blocked_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_replies (
  keyword text primary key,
  reply text not null default '',
  created_at timestamptz not null default now()
);

-- 5. Custom admin login + password reset
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  login_identifier text not null unique,
  password_hash text not null,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  reset_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_reset_token_hash_idx
  on public.admin_users (reset_token_hash)
  where reset_token_hash is not null;

-- 6. updated_at triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists papers_set_updated_at on public.papers;
create trigger papers_set_updated_at
before update on public.papers
for each row
execute function public.set_updated_at();

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

-- 7. Security
alter table public.papers enable row level security;
alter table public.admin_logs enable row level security;
alter table public.student_queries enable row level security;
alter table public.blocked_users enable row level security;
alter table public.custom_replies enable row level security;
alter table public.admin_users enable row level security;

-- The backend must use SUPABASE_SERVICE_ROLE_KEY.
-- Do not add public anon read/write policies unless you intentionally move
-- reads directly into the browser later.
