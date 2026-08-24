import type { Preflight } from "@/lib/preflight";
export type { Preflight } from "@/lib/preflight";

// Shown when the coach can't be reached — a rubric-grounded manual pre-flight so the
// user still gets value. Never contains a finished answer (same guardrail as the API).
export const FALLBACK_PREFLIGHT: Preflight = {
  assumptions_to_pin: [
    { dimension: "Instruction fidelity", question: "Have you stated the exact period, filter, and definitions (e.g. gross vs net) the AI must use?" },
    { dimension: "Assumptions surfaced", question: "How should blanks, duplicates, rounding, currency, and date formats be handled?" },
  ],
  hardened_prompt:
    "Do the task exactly as specified, using [state your period/filters/definitions here]. Show your working, list every assumption you made, and flag anything you could not verify. Do not silently change the question.",
  post_checks: [
    "Cross-check one key figure against a control you already trust.",
    "Confirm the output answers the exact question you asked, not a nearby one.",
  ],
};

export async function runPreflight(input: { task: string; focus?: string }): Promise<Preflight> {
  const controller = new AbortController();
  // Claude Haiku returns these in ~5-8s (measured); 30s is a safety net for a
  // hung request, well under the 60s server maxDuration. (Was 58s, sized for the
  // old Gemini path's ~30-44s cold latency.)
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("/api/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_PREFLIGHT;
    const data = await res.json();
    if (!data || !Array.isArray(data.assumptions_to_pin) || typeof data.hardened_prompt !== "string") return FALLBACK_PREFLIGHT;
    return data as Preflight;
  } catch {
    return FALLBACK_PREFLIGHT;
  } finally {
    clearTimeout(timeout);
  }
}
