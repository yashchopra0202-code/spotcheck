// Phase C — adaptive daily drill selection. Pure logic over the authored SCENARIOS,
// no React/I/O — unit-tested. Weights the next scenario toward the rubric dimensions
// the user actually missed on their real work (from the co-pilot panel's checks),
// falling back to the next unseen scenario so every dimension still gets covered.

import { SCENARIOS, type Scenario } from "./scenarios";

// Pick the next scenario to serve.
// - `weakDims`: dimension names worst-first (from weakestDimensions(checks)).
// - `seen`: scenario ids already shown this session.
// Returns null when every scenario has been seen (session complete).
export function nextScenario(weakDims: string[], seen: string[]): Scenario | null {
  const remaining = SCENARIOS.filter((s) => !seen.includes(s.id));
  if (remaining.length === 0) return null;
  // Prefer an unseen scenario on the user's weakest dimension, in weakness order.
  for (const dim of weakDims) {
    const hit = remaining.find((s) => s.dimension === dim);
    if (hit) return hit;
  }
  // No weak-dimension match left — fall back to the next unseen scenario. Because
  // SCENARIOS are ordered by dimension, this naturally rotates across the rubric.
  return remaining[0];
}

export function totalScenarios(): number {
  return SCENARIOS.length;
}
