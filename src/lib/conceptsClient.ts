import type { Concepts } from "@/lib/concepts";
import { CONCEPTS } from "@/lib/funnel";
export type { Concept, Concepts } from "@/lib/concepts";

export type ConceptsInput = { task: string; output: string; weaknesses: string; focus?: string };

// Static fallback — the original hand-written cards. Used when the AI can't be reached
// (quota/latency), so the learn step always has something useful to show.
export const FALLBACK_CONCEPTS: Concepts = { concepts: CONCEPTS };

// Single-entry cache so the concepts call can be PREFETCHED on the findings screen (which
// always precedes the Learn screen) and be ready — or already in flight — by the time the
// user arrives, instead of waiting ~6s for Haiku there. Keyed by the exact input, so a
// different check simply replaces it. prefetchConcepts and runConcepts both build their
// input via funnel.conceptsInput(), guaranteeing identical keys → a hit.
let cached: { key: string; promise: Promise<Concepts> } | null = null;
const keyOf = (i: ConceptsInput) => JSON.stringify([i.task, i.output, i.weaknesses, i.focus ?? null]);

async function fetchConcepts(input: ConceptsInput): Promise<Concepts> {
  const controller = new AbortController();
  // Claude Haiku returns these in ~5-8s (measured); 30s is a safety net for a
  // hung request, well under the 60s server maxDuration. (Was 58s, sized for the
  // old Gemini path's ~30-44s cold latency.)
  const timeout = setTimeout(() => controller.abort(), 30000);
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

// Fire-and-forget: start the fetch early (from the findings screen) so it's warm when the
// Learn screen mounts. Safe to call repeatedly — it dedupes on the input key.
export function prefetchConcepts(input: ConceptsInput): void {
  const key = keyOf(input);
  if (cached?.key === key) return;
  cached = { key, promise: fetchConcepts(input) };
}

export async function runConcepts(input: ConceptsInput): Promise<Concepts> {
  const key = keyOf(input);
  if (cached?.key === key) return cached.promise; // reuse the prefetched (or in-flight) call
  cached = { key, promise: fetchConcepts(input) };
  return cached.promise;
}
