import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Reads your keys from environment variables (set in .env.local and in Vercel).
// If the keys aren't set yet, `supabase` is null and the app still runs —
// answers just aren't saved remotely. This lets you develop before wiring the DB.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export type AnswerRow = {
  user_id: string;
  scenario_id: string;
  dimension: string;
  caught: boolean;
  chose: string;
  time_sec: number;
};

export async function saveAnswer(row: AnswerRow) {
  if (!supabase) return; // no DB configured yet — skip silently
  try {
    await supabase.from("answers").insert(row);
  } catch {
    // never let logging break the experience
  }
}

export type ProfileRow = {
  user_id: string;
  role?: string | null;
  tenure?: string | null;
  ai_comfort?: string | null;
  focus?: string | null;
  pace?: string | null;
  email?: string | null;
};

// Writes go through a SECURITY DEFINER function (see supabase-setup.sql), not a
// direct table upsert: an INSERT ... ON CONFLICT DO UPDATE needs read-visibility
// of the row, which anon deliberately does NOT have (that would expose every
// user's email). The function runs with owner privileges and bypasses RLS; anon
// can only call it, never read the table.
export async function saveProfile(row: ProfileRow) {
  if (!supabase) return;
  try {
    await supabase.rpc("upsert_profile", {
      p_user_id: row.user_id,
      p_role: row.role ?? null,
      p_tenure: row.tenure ?? null,
      p_ai_comfort: row.ai_comfort ?? null,
      p_focus: row.focus ?? null,
      p_pace: row.pace ?? null,
      p_email: row.email ?? null,
    });
  } catch {
    // never let persistence break the funnel
  }
}

export type CheckRow = {
  user_id: string;
  task: string;
  paste: string;
  focus: string | null;
  trustworthy: boolean;
  missed_dims: string[];
  result_json: unknown;
};

export async function saveCheck(row: CheckRow) {
  if (!supabase) return;
  try {
    await supabase.from("checks").insert(row);
  } catch {
    // ignore
  }
}

export type SignalRow = { user_id: string; type: string; value: string };

export async function saveSignal(row: SignalRow) {
  if (!supabase) return;
  try {
    await supabase.from("signals").insert(row);
  } catch {
    // ignore
  }
}

// One-tap experience rating from the final screen. Insert-only (no read-back), so it
// uses a plain INSERT like checks/signals — needs the `ratings` table + anon-insert
// policy from supabase-setup.sql (or scripts/add-ratings.sql) to persist.
export type RatingRow = { user_id: string; rating: number; checks_count: number; email?: string | null };

export async function saveRating(row: RatingRow) {
  if (!supabase) return;
  try {
    await supabase.from("ratings").insert(row);
  } catch {
    // ignore
  }
}
