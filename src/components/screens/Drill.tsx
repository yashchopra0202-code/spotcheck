"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { weakestDimensions } from "@/lib/funnel";
import { nextScenario, totalScenarios } from "@/lib/drill";
import type { Scenario } from "@/lib/scenarios";
import { track } from "@/lib/analytics";

const SEEN_KEY = "spotcheck_drill_seen";

// Which scenarios the user has already drilled (across sessions), so each day serves
// fresh ones. Drill mounts client-side only, so localStorage is safe here. Once every
// scenario has been seen, start a new cycle so the habit never dead-ends.
function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) && arr.length < totalScenarios() ? arr : [];
  } catch {
    return [];
  }
}
function persistSeen(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

// Phase C — the adaptive daily "spot the flaw" drill. Serves one authored scenario at
// a time, weighted toward the dimensions the user missed on their real work, and skips
// scenarios already seen on previous days. No streaks/points (survey: only 8% want them).
export default function Drill() {
  const { checks, go } = useFunnel();
  const [weak] = useState(() => weakestDimensions(checks));
  const [seen, setSeen] = useState<string[]>(() => loadSeen());
  const [current, setCurrent] = useState<Scenario | null>(() => nextScenario(weak, seen));
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(0);

  useEffect(() => {
    track("drill_started", { weak_dims: weak, already_seen: seen.length });
    // seen is captured once at mount; intentionally not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weak]);

  if (!current) {
    // Session complete — no unseen scenarios left this cycle.
    return (
      <div className="pad screen">
        <div className="eyebrow" style={{ color: "var(--brand)" }}>Sharpener complete</div>
        <h2 className="title" style={{ fontSize: 21 }}>Nice — that&apos;s today&apos;s set.</h2>
        <p className="sub" style={{ marginBottom: 16 }}>
          You caught {correctCount} of {answered}. Every flaw you spot here is one you&apos;ll catch in your real work before it ships. Come back tomorrow for a fresh set.
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
    setAnswered((a) => a + 1);
    track("drill_answered", { dim: current!.dimension, correct: isRight });
  }

  function nextOne() {
    const nextSeen = [...seen, current!.id];
    setSeen(nextSeen);
    persistSeen(nextSeen);
    const next = nextScenario(weak, nextSeen);
    if (!next) track("drill_completed", { caught: correctCount, answered });
    setCurrent(next);
    setPicked(null);
  }

  return (
    <div className="pad screen">
      <div className="eyebrow">2-min sharpener · {answered + 1}/{totalScenarios()}</div>
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
