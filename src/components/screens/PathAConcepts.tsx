"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { effectiveFocus } from "@/lib/funnel";
import { runConcepts, FALLBACK_CONCEPTS, type Concept } from "@/lib/conceptsClient";
import { track } from "@/lib/analytics";

export default function PathAConcepts() {
  const { state, check, go } = useFunnel();
  // No check to learn from → show the static cards immediately (no fetch).
  const [concepts, setConcepts] = useState<Concept[] | null>(check ? null : FALLBACK_CONCEPTS.concepts);

  useEffect(() => {
    if (!check) return;
    let alive = true;
    // Build lessons from the user's ACTUAL check so it reads "here's why YOUR number
    // was wrong" — not a generic card. Falls back to the static set on any failure.
    const failed = check.result.dimensions.filter((d) => !d.pass);
    const weaknesses = failed.map((d) => `${d.name}: ${d.note}`).join("; ");
    const task = state.preflightTask?.trim() || check.task;
    track("concepts_requested", { failed: failed.length });
    runConcepts({ task, output: check.paste, weaknesses, focus: effectiveFocus(state) ?? undefined }).then((r) => {
      if (alive) setConcepts(r.concepts);
    });
    return () => {
      alive = false;
    };
  }, [check, state]);

  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · LEARN</span>
      <h2 className="title" style={{ fontSize: 20 }}>What just happened, explained</h2>
      {concepts === null ? (
        <p className="sub" style={{ marginTop: 8 }}>Turning your check into lessons…</p>
      ) : (
        concepts.map((c, i) => (
          <div key={i} className="concept">
            <div className="l">Concept {i + 1}</div>
            <b>{c.title}</b>
            <p>{c.body}</p>
          </div>
        ))
      )}
      <button className="cta" style={{ marginTop: 20 }} disabled={concepts === null} onClick={() => go("results")}>See where you stand →</button>
    </div>
  );
}
