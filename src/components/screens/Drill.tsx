"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { weakestDimensions } from "@/lib/funnel";
import { nextScenario, totalScenarios } from "@/lib/drill";
import type { Scenario } from "@/lib/scenarios";
import { track } from "@/lib/analytics";

// Phase C — the adaptive daily "spot the flaw" drill. Serves one authored scenario at
// a time, weighted toward the dimensions the user missed on their real work. No streaks
// or points (survey: only 8% want them) — the reward is a visibly sharper judgment.
export default function Drill() {
  const { checks, go } = useFunnel();
  // Weakest dimensions from this session's real-work checks drive the adaptivity.
  // Frozen once on mount via a lazy initializer so the drill order stays stable.
  const [weak] = useState(() => weakestDimensions(checks));

  const [seen, setSeen] = useState<string[]>([]);
  const [current, setCurrent] = useState<Scenario | null>(() => nextScenario(weak, []));
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    track("drill_started", { weak_dims: weak });
  }, [weak]);

  if (!current) {
    // Session complete — no scenarios left.
    return (
      <div className="pad screen">
        <div className="eyebrow" style={{ color: "var(--brand)" }}>Sharpener complete</div>
        <h2 className="title" style={{ fontSize: 21 }}>You&apos;ve worked through today&apos;s set.</h2>
        <p className="sub" style={{ marginBottom: 16 }}>
          You caught {correctCount} of {seen.length}. Each one you spot here is one you&apos;ll catch in your real work before it ships.
        </p>
        <button className="cta" onClick={() => go("done")}>Back to your journey →</button>
      </div>
    );
  }

  const revealed = picked !== null;
  const correctIdx = current.options.findIndex((o) => o.correct);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const isRight = current!.options[i].correct;
    if (isRight) setCorrectCount((c) => c + 1);
    track("drill_answered", { dim: current!.dimension, correct: isRight });
  }

  function nextOne() {
    const nextSeen = [...seen, current!.id];
    setSeen(nextSeen);
    setCurrent(nextScenario(weak, nextSeen));
    setPicked(null);
  }

  const answeredSoFar = seen.length + (revealed ? 1 : 0);

  return (
    <div className="pad screen">
      <div className="eyebrow">2-min sharpener · {answeredSoFar}/{totalScenarios()}</div>
      <h2 className="title" style={{ fontSize: 19 }}>Spot the flaw</h2>
      <p className="sub" style={{ marginBottom: 12 }}>Testing your <b>{current.dimension}</b> judgment.</p>

      <div className="lossnote" style={{ marginBottom: 8 }}><b>You asked AI:</b> {current.prompt}</div>
      <div className="aibox">{current.aiOutput}</div>

      <div className="selectlbl">What&apos;s wrong here?</div>
      <div>
        {current.options.map((o, i) => {
          const cls =
            revealed && i === correctIdx ? " sel ok" : revealed && i === picked ? " sel warn" : picked === i ? " sel" : "";
          return (
            <div key={i} className={`opt${cls}`} onClick={() => choose(i)}>
              <div><b>{o.text}</b></div><div className="ck" />
            </div>
          );
        })}
      </div>

      {revealed ? (
        <>
          <div className={`finding ${current.options[picked!].correct ? "ok" : "warn"}`}>
            {current.options[picked!].correct ? "✓ Caught it." : "⚠ Missed — here's the tell."} {current.fix}
          </div>
          <button className="cta" style={{ marginTop: 14 }} onClick={nextOne}>Next →</button>
          <button className="ghost" onClick={() => go("done")}>Done for now</button>
        </>
      ) : null}
    </div>
  );
}
