-- Experience rating captured on the final (Done) screen — one row per submission.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Idempotent: safe to re-run. Mirrors the checks/signals posture in supabase-setup.sql.

create table if not exists public.ratings (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  rating       int  not null check (rating between 1 and 5),
  checks_count int  not null default 0,
  email        text,                 -- captured with the rating for follow-up
  created_at   timestamptz not null default now()
);

-- If an earlier version of this table was created without the email column, add it.
alter table public.ratings add column if not exists email text;

alter table public.ratings enable row level security;

-- Anon may INSERT only. The key is public and the funnel never reads this table back,
-- so no anon SELECT (same reasoning as checks/signals).
drop policy if exists "anon insert ratings" on public.ratings;
create policy "anon insert ratings" on public.ratings for insert to anon with check (true);
