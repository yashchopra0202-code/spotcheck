"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { runReview, type ReviewTurn } from "@/lib/reviewClient";
import { track } from "@/lib/analytics";

// Mock Review — the judged-moment simulator. A skeptical manager interrogates the work
// the user just checked (3 questions), then delivers a verdict. Serves PP3 (collapsing
// when checked). Turn-based; the AI never does the work, it pressure-tests understanding.
export default function MockReview() {
  const { state, check, go } = useFunnel();
  const [messages, setMessages] = useState<ReviewTurn[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"loading" | "chatting" | "done">("loading");
  const [verdict, setVerdict] = useState("");
  const started = useRef(false);

  const task = state.preflightTask?.trim() || check?.task || "AI-assisted finance work";
  const work = check?.paste ?? "";
  const weaknesses = check ? check.result.dimensions.filter((d) => !d.pass).map((d) => `${d.name}: ${d.note}`).join("; ") : "";

  // Get the manager's next turn. setState only happens AFTER the await, so calling this
  // from the mount effect doesn't trigger a synchronous-setState-in-effect.
  const advance = useCallback(
    async (transcript: ReviewTurn[], questionsAsked: number) => {
      const r = await runReview({ task, work, weaknesses, transcript, questionsAsked });
      if (r.done) {
        if (r.reply && r.verdict) setMessages((m) => [...m, { role: "reviewer", text: r.reply }]);
        setVerdict(r.verdict || r.reply);
        setPhase("done");
        track("mock_review_completed", {});
      } else {
        setMessages((m) => [...m, { role: "reviewer", text: r.reply }]);
        setPhase("chatting");
      }
    },
    [task, work, weaknesses],
  );

  // Kick off the first question once. Phase starts as "loading" already.
  useEffect(() => {
    if (started.current || !check) return;
    started.current = true;
    advance([], 0);
  }, [check, advance]);

  if (!check) {
    return (
      <div className="pad screen">
        <p className="sub">Run a check first, then defend it here.</p>
        <button className="cta" onClick={() => go("a_upload")}>Run a check →</button>
      </div>
    );
  }

  function submit() {
    if (!input.trim() || phase !== "chatting") return;
    const next: ReviewTurn[] = [...messages, { role: "user", text: input.trim() }];
    setMessages(next);
    setInput("");
    setPhase("loading");
    // Questions the manager has asked so far = reviewer turns in the transcript.
    advance(next, next.filter((m) => m.role === "reviewer").length);
  }

  return (
    <div className="pad screen">
      <span className="pathtag a">MOCK REVIEW</span>
      <h2 className="title" style={{ fontSize: 20 }}>Defend your work</h2>
      <p className="sub" style={{ marginBottom: 12 }}>Your manager is going to pressure-test this. Answer like it&apos;s real — no AI.</p>

      <div>
        {messages.map((m, i) =>
          m.role === "reviewer" ? (
            <div key={i} className="coachsay"><div className="g" /><div className="bub">{m.text}</div></div>
          ) : (
            <div key={i} className="umsg">{m.text}</div>
          ),
        )}
        {phase === "loading" ? <div className="coachsay"><div className="g" /><div className="bub">…</div></div> : null}
      </div>

      {phase === "done" ? (
        <>
          <div className="finding warn" style={{ marginTop: 12 }}><b>Verdict:</b> {verdict}</div>
          <button className="cta" style={{ marginTop: 16 }} onClick={() => go("a_concepts")}>Keep learning →</button>
        </>
      ) : (
        <>
          <textarea
            className="field"
            style={{ minHeight: 80, resize: "vertical", marginTop: 10 }}
            placeholder="Type your answer…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={phase !== "chatting"}
          />
          <button className="cta" disabled={!input.trim() || phase !== "chatting"} onClick={submit}>Answer →</button>
        </>
      )}
    </div>
  );
}
