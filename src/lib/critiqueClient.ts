import type { Critique } from "@/lib/critique";
export type { Critique } from "@/lib/critique";

export const FALLBACK_CRITIQUE: Critique = {
  summary: "I couldn't reach your coach just now — here's the manual check to run before you trust this.",
  trustworthy: false,
  dimensions: [
    { name: "Source integrity", pass: false, note: "Compare row counts before/after and check the de-dupe key against the source." },
    { name: "Output verified", pass: false, note: "Cross-foot the total or tie one figure to a control you already know." },
    { name: "Reproducible", pass: false, note: "Make sure you can redo this number without the AI." },
  ],
  one_fix: "Re-run the key number yourself once before you ship it.",
};

export async function runCheck(input: { task: string; output: string; focus?: string }): Promise<Critique> {
  const controller = new AbortController();
  // Claude Haiku returns these in ~5-8s (measured); 30s is a safety net for a
  // hung request, well under the 60s server maxDuration. (Was 58s, sized for the
  // old Gemini path's ~30-44s cold latency.)
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_CRITIQUE;
    const data = await res.json();
    if (!data || typeof data.trustworthy !== "boolean" || !Array.isArray(data.dimensions)) return FALLBACK_CRITIQUE;
    return data as Critique;
  } catch {
    return FALLBACK_CRITIQUE;
  } finally {
    clearTimeout(timeout);
  }
}
