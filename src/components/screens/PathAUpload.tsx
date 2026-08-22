"use client";
import { useRef, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { CHECK_OPTIONS, effectiveFocus, type TaskType } from "@/lib/funnel";
import { runCheck } from "@/lib/critiqueClient";
import { track } from "@/lib/analytics";
import { saveCheck } from "@/lib/supabase";

export default function PathAUpload() {
  const { state, go, userId, setCheck } = useFunnel();
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [checkOpt, setCheckOpt] = useState(CHECK_OPTIONS[0]);
  const [taskType, setTaskType] = useState<TaskType>("critical");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // File upload is offered only for spreadsheet work; other modes are paste-only.
  const canUpload = state.focus === "Spreadsheet work";
  const isFormula = state.focus === "Formula correction";

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(`${f.name}`);
    if (/\.(csv|txt)$/i.test(f.name)) {
      f.text().then((t) => setPaste(t.slice(0, 8000))); // xlsx not parsed in MVP (spec §14)
    }
  }

  // In formula-correction mode the task is fixed and formula-specific.
  const FORMULA_TASK = "Check this AI-written finance formula: verify the ranges, criteria, and logic; flag any error; and give the corrected formula.";
  const taskLabel = isFormula ? FORMULA_TASK : `The user asked AI to: ${checkOpt}`;

  async function run() {
    if (!paste.trim() || busy) return;
    setBusy(true);
    track("apply_to_work_used", { task_type: taskType, mode: isFormula ? "formula" : "work" });
    const focus = effectiveFocus(state);
    const result = await runCheck({ task: taskLabel, output: paste, focus: focus ?? undefined });
    setCheck({ task: isFormula ? "Formula correction" : checkOpt, paste, taskType, result });
    saveCheck({
      user_id: userId,
      task: isFormula ? "Formula correction" : checkOpt,
      paste,
      focus,
      trustworthy: result.trustworthy,
      missed_dims: result.dimensions.filter((d) => !d.pass).map((d) => d.name),
      result_json: result,
    });
    track("check_completed", { trustworthy: result.trustworthy });
    setBusy(false);
    go("a_findings");
  }

  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · REAL PROBLEM</span>
      <h2 className="title" style={{ fontSize: 20 }}>{isFormula ? "Bring the formula to check" : "Bring the work you want checked"}</h2>
      {canUpload ? (
        <>
          <p className="note" style={{ margin: "2px 0 10px" }}>Paste text · <span style={{ color: "var(--faint)" }}>PDF upload coming soon</span></p>
          <div className="drop">
            <div className="ic">📎</div>
            <b>Paste your AI output below, or</b>
            <span>.csv / .txt (xlsx: paste the values)</span><br />
            <button className="browse" type="button" onClick={() => fileInput.current?.click()}>📁 Browse files</button>
            <input ref={fileInput} type="file" accept=".csv,.txt" hidden onChange={onFile} />
          </div>
          {fileName ? <div className="filechip"><span className="x">✓</span> {fileName}</div> : null}
        </>
      ) : null}
      <textarea className="field" style={{ minHeight: 120, resize: "vertical", marginTop: canUpload ? undefined : 8 }} placeholder={isFormula ? "Paste the AI-written formula, e.g. =SUMIF(A:A,\"West\",B:B)…" : "Paste the AI's answer, formula, or cleaned data here…"} value={paste} onChange={(e) => setPaste(e.target.value)} />
      {isFormula ? (
        <p className="note" style={{ margin: "2px 0 4px" }}>Gemini will verify the ranges, criteria &amp; logic and return the corrected formula.</p>
      ) : (
        <>
          <div className="selectlbl">What should your coach check?</div>
          <div>
            {CHECK_OPTIONS.map((o) => (
              <div key={o} className={`opt${checkOpt === o ? " sel" : ""}`} onClick={() => setCheckOpt(o)}>
                <div><b>{o}</b></div><div className="ck" />
              </div>
            ))}
          </div>
        </>
      )}
      <div className="selectlbl">Is this going to ship?</div>
      <div className="seg" role="group">
        <button type="button" className={taskType === "critical" ? "on" : ""} onClick={() => setTaskType("critical")}>Yes, it ships</button>
        <button type="button" className={taskType === "scratch" ? "on" : ""} onClick={() => setTaskType("scratch")}>Just testing</button>
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!paste.trim() || busy} onClick={run}>
        {busy ? "Checking with Gemini…" : isFormula ? "Check the formula with Gemini ✦" : "Run the check with Gemini ✦"}
      </button>
      <p className="note" style={{ textAlign: "center" }}>🔒 Your paste is used only to run this check.</p>
    </div>
  );
}
