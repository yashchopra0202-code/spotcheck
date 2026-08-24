"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { effectiveFocus } from "@/lib/funnel";
import { runConcepts, FALLBACK_CONCEPTS, type Concept } from "@/lib/conceptsClient";
import { track } from "@/lib/analytics";

export default function PathAConcepts() {
  const { state, check, go } = useFunnel();
  // Show useful lessons immediately — never block the screen or the button on the AI.
  // Upgrade to lessons tailored to the user's own check if/when the AI responds; if it
  // can't (quota/latency), the solid static set stays and the flow keeps moving.
  const [concepts, setConcepts] = useState<Concept[]>(FALLBACK_CONCEPTS.concepts);
  const [tailoring, setTailoring] = useState(!!check);

  useEffect(() => {
    if (!check) return; // no check → tailoring is already false from init
    let alive = true;
    const failed = check.result.dimensions.filter((d) => !d.pass);
    const weaknesses = failed.map((d) => `${d.name}: ${d.note}`).join("; ");
    const task = state.preflightTask?.trim() || check.task;
    track("concepts_requested", { failed: failed.length });
    runConcepts({ task, output: check.paste, weaknesses, focus: effectiveFocus(state) ?? undefined }).then((r) => {
      if (alive) {
        setConcepts(r.concepts);
        setTailoring(false);
      }
    });
    return () => {
      alive = false;
    };
    // Only re-run when the check itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check]);

  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · LEARN</span>
      <h2 className="title" style={{ fontSize: 20 }}>What just happened, explained</h2>
      {tailoring ? (
        <div className="thinking" role="status" aria-live="polite">
          <span className="tmk" aria-hidden="true" />
          <span className="tlabel">Tailoring these to your check<span className="tdots"><i /><i /><i /></span></span>
        </div>
      ) : (
        concepts.map((c, i) => (
          <div key={i} className="concept">
            <div className="l">Concept {i + 1}</div>
            <b>{c.title}</b>
            <p>{c.body}</p>
          </div>
        ))
      )}
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("results")}>See where you stand →</button>
    </div>
  );
}
