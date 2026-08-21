"use client";
import { useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { TEST_QUESTIONS, scoreAnswers } from "@/lib/funnel";
import { track } from "@/lib/analytics";

type Phase = "asking" | "decide" | "done";

export default function Test() {
  const { go } = useFunnel();
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("asking");

  const q = TEST_QUESTIONS[idx];
  const answered = results.length;
  const score = scoreAnswers(results);

  function pick(optIdx: number) {
    if (picked !== null) return;
    const correct = q.opts[optIdx].correct;
    setPicked(optIdx);
    setResults((r) => [...r, correct]);
    track("test_answered", { idx, correct });
  }

  function next() {
    setPicked(null);
    const nextIdx = idx + 1;
    if (nextIdx === 3) { setPhase("decide"); return; }
    if (nextIdx >= TEST_QUESTIONS.length) { finish(); return; }
    setIdx(nextIdx);
  }

  function contMore() { setPhase("asking"); setIdx(3); }

  function finish() {
    setPhase("done");
    track("test_completed", { score, answered });
  }

  if (phase === "done") {
    return (
      <div className="pad screen">
        <div className="eyebrow">Test your AI capability</div>
        <div className="scorebig"><div className="v">{score}<small>/{answered}</small></div></div>
        <p className="sub" style={{ textAlign: "center" }}>A sharp starting line — this is where your judgment begins, with room to climb.</p>
        <button className="cta" style={{ marginTop: 20 }} onClick={() => go("email")}>Continue →</button>
      </div>
    );
  }

  if (phase === "decide") {
    return (
      <div className="pad screen">
        <div className="eyebrow">Test your AI capability</div>
        <div className="scorebig"><div className="v">{score}<small>/3</small></div></div>
        <p className="sub" style={{ textAlign: "center" }}>Through the core check. Sharpen your score with a few more?</p>
        <button className="cta" style={{ marginTop: 20 }} onClick={contMore}>Try 3 more</button>
        <button className="ghost" onClick={finish}>Finish &amp; see result</button>
      </div>
    );
  }

  return (
    <div className="pad screen">
      <div className="eyebrow">Test your AI capability</div>
      <h2 className="title" style={{ fontSize: 20 }}>How sharp is your AI judgment?</h2>
      <div className="tcount">QUESTION {idx + 1}{idx < 3 ? " OF 3" : ""}</div>
      <div className="testq">{q.q}</div>
      <div>
        {q.opts.map((o, i) => {
          let cls = "pick";
          if (picked !== null) {
            if (o.correct) cls += " correct";
            else if (i === picked) cls += " wrong";
          }
          return <button key={i} className={cls} disabled={picked !== null} onClick={() => pick(i)}>{o.t}</button>;
        })}
      </div>
      {picked !== null ? <button className="cta" style={{ marginTop: 14 }} onClick={next}>Next →</button> : null}
    </div>
  );
}
