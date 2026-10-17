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

create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  "index" text,
  date text,
  status text,
  course text,
  year text,
  spec text,
  semester text,
  exam text,
  name text,
  admin_name text,
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_created_idx
  on public.admin_logs (created_at desc);

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

create table if not exists public.blocked_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  auth_email text unique,
  login_identifier text not null unique,
  display_name text not null default '',
  role text not null default 'view',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_auth_user_id_idx
  on public.admin_users (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists admin_users_auth_email_idx
  on public.admin_users (auth_email)
  where auth_email is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_users_role_check'
      and conrelid = 'public.admin_users'::regclass
  ) then
    alter table public.admin_users
      add constraint admin_users_role_check
      check (role in ('full', 'editor', 'view'));
  end if;
end $$;

create table if not exists public.admin_password_resets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_password_resets_token_hash_idx
  on public.admin_password_resets (token_hash);

create index if not exists admin_password_resets_expires_at_idx
  on public.admin_password_resets (expires_at);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  email text not null default '',
  display_name text not null default '',
  ip_address text not null default '',
  user_agent text not null default '',
  last_active timestamptz not null default now(),
  revocation_token text not null unique,
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_email_active_idx
  on public.admin_sessions (email, is_revoked, last_active desc);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value) values
  ('library_admin_invite_notify', '{"enabled": false}'::jsonb),
  ('admin_login_notify', '{"enabled": false}'::jsonb),
  ('maintenance_mode', '{"enabled": false, "message": "Papers under semester review"}'::jsonb)
on conflict (key) do nothing;

create or replace function public.set_updated_at()
returns trigger
set search_path = public
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

alter table public.papers enable row level security;
alter table public.admin_logs enable row level security;
alter table public.student_queries enable row level security;
alter table public.blocked_users enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_password_resets enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.system_settings enable row level security;

drop policy if exists "Public papers are viewable by everyone" on public.papers;
create policy "Public papers are viewable by everyone" on public.papers
  for select
  using (true);


create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  course text not null,
  batch_year text not null default '',
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_course_idx
  on public.push_subscriptions (course);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
