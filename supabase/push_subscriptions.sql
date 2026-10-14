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
