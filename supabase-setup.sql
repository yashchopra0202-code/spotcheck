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

-- One-tap experience rating captured on the final (Done) screen. checks_count lets us
-- segment satisfaction by how much the user actually used the product.
create table if not exists public.ratings (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  rating       int  not null check (rating between 1 and 5),
  checks_count int  not null default 0,
  email        text,                 -- captured with the rating for follow-up
  created_at   timestamptz not null default now()
);

-- MVP: allow the anon public key to insert (and upsert its own profile)
alter table public.profiles enable row level security;
alter table public.checks   enable row level security;
alter table public.signals  enable row level security;
alter table public.ratings  enable row level security;

-- Idempotent cleanup so re-running this file removes anon SELECT from a live DB.
drop policy if exists "anon read profiles" on public.profiles;
drop policy if exists "anon read checks" on public.checks;

-- Anon SELECT intentionally omitted: this key is public, the funnel never reads these tables back, and there's no per-user JWT to scope rows by.
create policy "anon insert profiles" on public.profiles for insert to anon with check (true);
create policy "anon upsert profiles" on public.profiles for update to anon using (true) with check (true);
create policy "anon insert checks"   on public.checks   for insert to anon with check (true);
create policy "anon insert signals"  on public.signals  for insert to anon with check (true);
create policy "anon insert ratings"  on public.ratings  for insert to anon with check (true);

-- V3 Phase 1: onboarding pace + tenure
alter table public.profiles add column if not exists tenure text;
alter table public.profiles add column if not exists pace   text;

-- Secure profile write path for the guest (anon) key.
-- An INSERT ... ON CONFLICT DO UPDATE (upsert) needs read-visibility of the row,
-- which anon does NOT have (removing anon SELECT is what protects everyone's
-- emails). This SECURITY DEFINER function runs with owner privileges and bypasses
-- RLS, so anon can upsert its own profile WITHOUT being able to read the table.
-- COALESCE preserves earlier non-null values when a later call sends nulls.

create or replace function public.upsert_profile(
  p_user_id    text,
  p_role       text default null,
  p_tenure     text default null,
  p_ai_comfort text default null,
  p_focus      text default null,
  p_pace       text default null,
  p_email      text default null
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.profiles (user_id, role, tenure, ai_comfort, focus, pace, email)
  values (p_user_id, p_role, p_tenure, p_ai_comfort, p_focus, p_pace, p_email)
  on conflict (user_id) do update set
    role       = coalesce(excluded.role,       public.profiles.role),
    tenure     = coalesce(excluded.tenure,     public.profiles.tenure),
    ai_comfort = coalesce(excluded.ai_comfort, public.profiles.ai_comfort),
    focus      = coalesce(excluded.focus,      public.profiles.focus),
    pace       = coalesce(excluded.pace,       public.profiles.pace),
    email      = coalesce(excluded.email,      public.profiles.email);
$$;

-- Only the anon role may call it (not read the table directly).
revoke all on function public.upsert_profile(text,text,text,text,text,text,text) from public;
grant execute on function public.upsert_profile(text,text,text,text,text,text,text) to anon;
