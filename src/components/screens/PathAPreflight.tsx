"use client";
import { useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { effectiveFocus, type TaskType } from "@/lib/funnel";
import { runPreflight, type Preflight } from "@/lib/preflightClient";
import { runCheck } from "@/lib/critiqueClient";
import { saveCheck } from "@/lib/supabase";
import { track } from "@/lib/analytics";

// Moment 1 + the check, on ONE screen with numbered steps. The old two-screen jump
// (copy a prompt here → paste something on a different screen) confused users because
// the hand-off "go run this in your OWN AI tool, then bring the answer back" was never
// shown. Now Step 1 (coached prompt) and Step 2 (paste the result) live together, with
// the hand-off spelled out between them. Still coach, not assistant: the user runs the
// prompt in their own tool; SpotCheck only sharpens it and checks what comes back.
export default function PathAPreflight() {
  const { state, set, go, userId, setCheck, addCheck } = useFunnel();
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Preflight | null>(null);
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("critical");
  const [checking, setChecking] = useState(false);

  const focus = effectiveFocus(state);

  async function coach() {
    if (!task.trim() || busy) return;
    setBusy(true);
    track("preflight_run", { focus: focus ?? undefined });
    // Carry the task so a later "check another output" (which reuses the upload
    // screen) can still show "For: <task>" and stay anchored to the same work.
    set({ preflightTask: task.trim() });
    const r = await runPreflight({ task, focus: focus ?? undefined });
    setResult(r);
    setBusy(false);
  }

  async function copyPrompt() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.hardened_prompt);
      setCopied(true);
      track("preflight_prompt_copied", { focus: focus ?? undefined });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the text is still visible to copy manually */
    }
  }

  async function runTheCheck() {
    if (!paste.trim() || checking) return;
    setChecking(true);
    track("apply_to_work_used", { task_type: taskType, mode: "work" });
    const taskLabel = `Check the AI's output for this task: "${task}". Judge whether it is trustworthy to ship and flag anything wrong.`;
    const critique = await runCheck({ task: taskLabel, output: paste, focus: focus ?? undefined });
    const missed = critique.dimensions.filter((d) => !d.pass).map((d) => d.name);
    const taskName = task.trim().slice(0, 80);
    setCheck({ task: taskName, paste, taskType, result: critique });
    addCheck({ task: taskName, trustworthy: critique.trustworthy, missed_dims: missed, ts: Date.now() });
    saveCheck({ user_id: userId, task: taskName, paste, focus, trustworthy: critique.trustworthy, missed_dims: missed, result_json: critique });
    track("check_completed", { trustworthy: critique.trustworthy });
    setChecking(false);
    go("a_findings");
  }

  // Step 0 — ask what they're about to do.
  if (!result) {
    return (
      <div className="pad screen">
        <span className="pathtag a">PATH A · BEFORE YOU RUN AI</span>
        <h2 className="title" style={{ fontSize: 20 }}>What are you about to ask AI to do?</h2>
        <p className="sub" style={{ marginBottom: 12 }}>
          Your coach won&apos;t do it for you — it&apos;ll sharpen how you ask, then check what your AI gives back.
        </p>
        <textarea
          className="field"
          style={{ minHeight: 110, resize: "vertical" }}
          placeholder="e.g. Total FY24 revenue across our 5 business units, or clean this customer export and remove duplicates…"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />
        <button className="cta" style={{ marginTop: 18 }} disabled={!task.trim() || busy} onClick={coach}>
          {busy ? "Coaching your prompt…" : "Sharpen my prompt ✦"}
        </button>
        <p className="note" style={{ textAlign: "center" }}>🔒 Only used to coach this prompt — your coach never does the work for you.</p>
      </div>
    );
  }

  // Steps 1 + 2 on one screen — coached prompt, then paste the result back.
  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · COACH + CHECK</span>

      {/* STEP 1 — the coached prompt to run in the user's own AI tool */}
      <div className="stepnum"><span className="sn">1</span><b>Run this prompt in your AI tool</b></div>
      <p className="sub" style={{ margin: "2px 0 10px" }}>Pin these down — they&apos;re where AI silently goes wrong:</p>
      <div style={{ marginBottom: 12 }}>
        {result.assumptions_to_pin.map((a, i) => (
          <div key={i} className="finding" style={{ marginBottom: 8, background: "var(--wash)" }}>
            <b style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: 0.3 }}>{a.dimension}</b>
            <div style={{ marginTop: 2 }}>{a.question}</div>
          </div>
        ))}
      </div>
      <div className="aibox">{result.hardened_prompt}</div>
      <button className="ghost" onClick={copyPrompt}>{copied ? "Copied ✓" : "📋 Copy prompt"}</button>
      <div className="handoff">👉 Paste this into <b>ChatGPT, Copilot, or Gemini</b>, run it, then bring the answer back below.</div>

      {/* STEP 2 — paste what the AI gave back and check it */}
      <div className="stepnum" style={{ marginTop: 18 }}><span className="sn">2</span><b>Paste what your AI gave back</b></div>
      <textarea
        className="field"
        style={{ minHeight: 110, resize: "vertical", marginTop: 8 }}
        placeholder="Paste the AI's answer, formula, or cleaned data here — not the prompt…"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
      />
      {result.post_checks?.length ? (
        <div className="note" style={{ margin: "0 0 8px" }}>
          Then sanity-check: {result.post_checks.join(" · ")}
        </div>
      ) : null}
      <div className="selectlbl">Is this going to ship?</div>
      <div className="seg" role="group">
        <button type="button" className={taskType === "critical" ? "on" : ""} onClick={() => setTaskType("critical")}>Yes, it ships</button>
        <button type="button" className={taskType === "scratch" ? "on" : ""} onClick={() => setTaskType("scratch")}>Just testing</button>
      </div>
      <button className="cta" style={{ marginTop: 18 }} disabled={!paste.trim() || checking} onClick={runTheCheck}>
        {checking ? "Checking with AI…" : "Run the check with AI ✦"}
      </button>
      <p className="note" style={{ textAlign: "center" }}>🔒 Your paste is used only to run this check.</p>
    </div>
  );
}
