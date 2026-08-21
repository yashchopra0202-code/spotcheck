-- SpotCheck V3 Phase 1 — Supabase migration (idempotent, safe to run once or repeatedly)
-- Run in: Supabase → SQL Editor → New query → paste → Run.

-- 1) Add the onboarding columns the funnel writes (fixes the profiles.upsert 400).
alter table public.profiles add column if not exists tenure text;
alter table public.profiles add column if not exists pace   text;

-- 2) Close the exposure: the public anon key must NOT be able to read others'
--    pasted work or emails. The app only ever inserts/upserts these tables.
drop policy if exists "anon read profiles" on public.profiles;
drop policy if exists "anon read checks"   on public.checks;
