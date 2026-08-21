"use client";
import { useRef, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { CHECK_OPTIONS } from "@/lib/funnel";
import { runCheck } from "@/lib/critiqueClient";
import { track } from "@/lib/analytics";
import { saveCheck } from "@/lib/supabase";

export default function PathAUpload() {
  const { state, go, userId, setCheck } = useFunnel();
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [checkOpt, setCheckOpt] = useState(CHECK_OPTIONS[0]);
  const [taskType, setTaskType] = useState<"critical" | "scratch">("critical");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(`${f.name}`);
    if (/\.(csv|txt)$/i.test(f.name)) {
      f.text().then((t) => setPaste(t.slice(0, 8000))); // xlsx not parsed in MVP (spec §14)
    }
  }

  async function run() {
    if (!paste.trim() || busy) return;
    setBusy(true);
    track("apply_to_work_used", { task_type: taskType });
    const result = await runCheck({ task: `The user asked AI to: ${checkOpt}`, output: paste, focus: state.focus ?? undefined });
    setCheck({ task: checkOpt, paste, taskType, result });
    saveCheck({
      user_id: userId,
      task: checkOpt,
      paste,
      focus: state.focus,
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
      <h2 className="title" style={{ fontSize: 20 }}>Bring the work you want checked</h2>
      <div className="drop">
        <div className="ic">📎</div>
        <b>Paste your AI output below, or</b>
        <span>.csv / .txt (xlsx: paste the values)</span><br />
        <button className="browse" type="button" onClick={() => fileInput.current?.click()}>📁 Browse files</button>
        <input ref={fileInput} type="file" accept=".csv,.txt" hidden onChange={onFile} />
      </div>
      {fileName ? <div className="filechip"><span className="x">✓</span> {fileName}</div> : null}
      <textarea className="field" style={{ minHeight: 120, resize: "vertical" }} placeholder="Paste the AI's answer, formula, or cleaned data here…" value={paste} onChange={(e) => setPaste(e.target.value)} />
      <div className="selectlbl">What should your coach check?</div>
      <div>
        {CHECK_OPTIONS.map((o) => (
          <div key={o} className={`opt${checkOpt === o ? " sel" : ""}`} onClick={() => setCheckOpt(o)}>
            <div><b>{o}</b></div><div className="ck" />
          </div>
        ))}
      </div>
      <div className="selectlbl">Is this going to ship?</div>
      <div className="seg" role="group">
        <button type="button" className={taskType === "critical" ? "on" : ""} onClick={() => setTaskType("critical")}>Yes, it ships</button>
        <button type="button" className={taskType === "scratch" ? "on" : ""} onClick={() => setTaskType("scratch")}>Just testing</button>
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!paste.trim() || busy} onClick={run}>
        {busy ? "Checking with Gemini…" : "Run the check with Gemini ✦"}
      </button>
      <p className="note" style={{ textAlign: "center" }}>🔒 Your paste is used only to run this check.</p>
    </div>
  );
}
