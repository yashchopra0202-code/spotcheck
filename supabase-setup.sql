-- Paste into Supabase → SQL Editor → Run. MVP schema for SpotCheck.

-- Onboarding profile (one row per anonymous user id)
create table if not exists public.profiles (
  user_id     text primary key,
  role        text,
  focus       text,
  ai_comfort  text,
  email       text,
  created_at  timestamptz not null default now()
);

-- Every real-work check the user runs (the core behavioural data)
create table if not exists public.checks (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  task          text,
  paste         text,
  focus         text,
  trustworthy   boolean,
  missed_dims   text[],
  result_json   jsonb,
  created_at    timestamptz not null default now()
);

-- Lightweight signals (willingness-to-pay, homework scores, etc.)
create table if not exists public.signals (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  type       text not null,        -- e.g. 'wtp', 'homework'
  value      text,
  created_at timestamptz not null default now()
);

-- MVP: allow the anon public key to insert (and upsert its own profile)
alter table public.profiles enable row level security;
alter table public.checks   enable row level security;
alter table public.signals  enable row level security;

-- Idempotent cleanup so re-running this file removes anon SELECT from a live DB.
drop policy if exists "anon read profiles" on public.profiles;
drop policy if exists "anon read checks" on public.checks;

-- Anon SELECT intentionally omitted: this key is public, the funnel never reads these tables back, and there's no per-user JWT to scope rows by.
create policy "anon insert profiles" on public.profiles for insert to anon with check (true);
create policy "anon upsert profiles" on public.profiles for update to anon using (true) with check (true);
create policy "anon insert checks"   on public.checks   for insert to anon with check (true);
create policy "anon insert signals"  on public.signals  for insert to anon with check (true);

-- V3 Phase 1: onboarding pace + tenure
alter table public.profiles add column if not exists tenure text;
alter table public.profiles add column if not exists pace   text;
