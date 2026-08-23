import type { Concepts } from "@/lib/concepts";
import { CONCEPTS } from "@/lib/funnel";
export type { Concept, Concepts } from "@/lib/concepts";

// Static fallback — the original hand-written cards. Used when the AI can't be reached
// (quota/latency), so the learn step always has something useful to show.
export const FALLBACK_CONCEPTS: Concepts = { concepts: CONCEPTS };

export async function runConcepts(input: { task: string; output: string; weaknesses: string; focus?: string }): Promise<Concepts> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 58000);
  try {
    const res = await fetch("/api/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_CONCEPTS;
    const data = await res.json();
    if (!data || !Array.isArray(data.concepts) || data.concepts.length === 0) return FALLBACK_CONCEPTS;
    return data as Concepts;
  } catch {
    return FALLBACK_CONCEPTS;
  } finally {
    clearTimeout(timeout);
  }
}
