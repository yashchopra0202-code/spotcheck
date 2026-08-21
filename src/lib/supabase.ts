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

export async function saveProfile(row: ProfileRow) {
  if (!supabase) return;
  try {
    await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
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
