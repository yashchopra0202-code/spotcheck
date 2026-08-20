-- Paste this into Supabase → SQL Editor → Run.
-- Creates one table to store every drill answer (your behavioural data).

create table if not exists public.answers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     text not null,
  scenario_id text not null,
  dimension   text not null,
  caught      boolean not null,
  chose       text,
  time_sec    numeric
);

-- Allow the app (using the public anon key) to insert answers.
alter table public.answers enable row level security;

create policy "anyone can insert answers"
  on public.answers for insert
  to anon
  with check (true);

-- (Optional) let you read them back in the SQL editor / dashboard.
create policy "anyone can read answers"
  on public.answers for select
  to anon
  using (true);
