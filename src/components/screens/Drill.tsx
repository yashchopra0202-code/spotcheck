"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { weakestDimensions } from "@/lib/funnel";
import { nextScenario, totalScenarios } from "@/lib/drill";
import type { Scenario } from "@/lib/scenarios";
import { track } from "@/lib/analytics";

const SEEN_KEY = "spotcheck_drill_seen";
const FIRST_SET = 5; // questions in the core session
const EXTRA = 3; // optional add-on → max 8 per session

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

// The adaptive daily "spot the flaw" drill. A session is 5 questions, with an optional
// +3 (max 8) — not the whole library at once. It weights toward the dimensions the user
// missed on real work, skips scenarios seen on previous days, and ends on a thank-you +
// "make it a daily habit" milestone. No streaks/points (survey: only 8% want them).
export default function Drill() {
  const { checks, go } = useFunnel();
  const [weak] = useState(() => weakestDimensions(checks));
  const [seen, setSeen] = useState<string[]>(() => loadSeen());
  const [current, setCurrent] = useState<Scenario | null>(() => nextScenario(weak, seen));
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [target, setTarget] = useState(FIRST_SET);
  const [phase, setPhase] = useState<"drilling" | "checkpoint" | "done">("drilling");

  useEffect(() => {
    track("drill_started", { weak_dims: weak, already_seen: seen.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weak]);

  function finish() {
    track("drill_completed", { caught: correctCount, answered });
    setPhase("done");
  }

  // ---- Milestone / thank-you (end of the daily loop) ----
  if (phase === "done" || !current) {
    const issues = checks.reduce((n, c) => n + c.missed_dims.length, 0);
    const runs = checks.length;
    return (
      <div className="pad screen">
        <div className="eyebrow" style={{ color: "var(--brand)" }}>That&apos;s a wrap for today</div>
        <h2 className="title" style={{ fontSize: 21 }}>Thank you — nicely done. 🎉</h2>
        <p className="sub" style={{ marginBottom: 14 }}>Here&apos;s what you achieved today:</p>
        <div style={{ margin: "0 0 14px" }}>
          {runs > 0 ? <div className="achline">✓ Checked {runs} real piece{runs === 1 ? "" : "s"} of AI work</div> : null}
          {runs > 0 ? <div className="achline">✓ Caught {issues} issue{issues === 1 ? "" : "s"} before {issues === 1 ? "it" : "they"}&apos;d have shipped</div> : null}
          <div className="achline">✓ Sharpened your judgment on {correctCount}/{answered} drill{answered === 1 ? "" : "s"}</div>
        </div>
        <div className="finding ok">
          <b>Now take it into your real work.</b> Make one habit stick: check your AI-assisted work against the standard before it ships — every day.
        </div>
        <button className="cta" style={{ marginTop: 16 }} onClick={() => go("done")}>Back to my journey →</button>
      </div>
    );
  }

  // ---- Checkpoint after the first 5 ----
  if (phase === "checkpoint") {
    return (
      <div className="pad screen">
        <div className="eyebrow" style={{ color: "var(--brand)" }}>{FIRST_SET} done</div>
        <h2 className="title" style={{ fontSize: 21 }}>Nice — {FIRST_SET} sharpened.</h2>
        <p className="sub" style={{ marginBottom: 16 }}>
          That&apos;s today&apos;s core set. Got 2 more minutes? {EXTRA} more will push your judgment further — or call it here.
        </p>
        <button className="cta" onClick={continueMore}>Attempt {EXTRA} more →</button>
        <button className="ghost" onClick={finish}>Finish for today</button>
      </div>
    );
  }

  // ---- A drill question ----
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

  function serveNext(afterSeen: string[]) {
    const next = nextScenario(weak, afterSeen);
    if (!next) {
      finish();
      return;
    }
    setCurrent(next);
    setPicked(null);
  }

  function nextOne() {
    const nextSeen = [...seen, current!.id];
    setSeen(nextSeen);
    persistSeen(nextSeen);
    if (answered >= target) {
      // Hit the session target: offer more after the first set, else finish.
      if (target === FIRST_SET) {
        setPhase("checkpoint");
        setPicked(null);
      } else {
        finish();
      }
      return;
    }
    serveNext(nextSeen);
  }

  function continueMore() {
    setTarget(FIRST_SET + EXTRA);
    setPhase("drilling");
    serveNext([...seen]);
  }

  return (
    <div className="pad screen">
      <div className="eyebrow">2-min sharpener · {answered + 1}/{target}</div>
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
          <button className="cta" style={{ marginTop: 14 }} onClick={nextOne}>{answered >= target ? "See today's summary →" : "Next →"}</button>
          <button className="ghost" onClick={finish}>Done for now</button>
        </>
      ) : null}
    </div>
  );
}
