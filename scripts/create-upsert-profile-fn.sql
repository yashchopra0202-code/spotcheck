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
