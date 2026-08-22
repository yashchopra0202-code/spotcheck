"use client";
import { useRef, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { CHECK_OPTIONS, effectiveFocus, type TaskType } from "@/lib/funnel";
import { runCheck } from "@/lib/critiqueClient";
import { track } from "@/lib/analytics";
import { saveCheck } from "@/lib/supabase";
import { summarizeRows, type Cell } from "@/lib/spreadsheet";

export default function PathAUpload() {
  const { state, go, userId, setCheck } = useFunnel();
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [checkOpt, setCheckOpt] = useState(CHECK_OPTIONS[0]);
  const [taskType, setTaskType] = useState<TaskType>("critical");
  const [busy, setBusy] = useState(false);
  const [fileErr, setFileErr] = useState("");
  const [summarized, setSummarized] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Small sheets go through verbatim (faithful); large ones are summarized so the
  // token cost stays flat and Gemini reasons about structure, not a truncated dump.
  const RAW_LIMIT = 4000;

  // File upload is offered only for spreadsheet work; other modes are paste-only.
  const canUpload = state.focus === "Spreadsheet work";
  const isFormula = state.focus === "Formula correction";

  // Parse the uploaded file to text/values client-side (stays private) and drop it
  // into the box so the user sees exactly what Gemini will check. .xlsx/.xls are
  // parsed with SheetJS (lazy-loaded); .csv/.txt are read as text.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setFileErr("");
    setSummarized(false);
    try {
      if (/\.txt$/i.test(f.name)) {
        const t = await f.text();
        setPaste(t.slice(0, 8000));
        return;
      }
      if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
        setFileErr("Unsupported file — upload .xlsx, .xls, or .csv.");
        return;
      }
      const XLSX = await import("xlsx");
      const wb = /\.csv$/i.test(f.name)
        ? XLSX.read(await f.text(), { type: "string" })
        : XLSX.read(await f.arrayBuffer(), { type: "array" });
      const first = wb.SheetNames[0];
      const sheet = first ? wb.Sheets[first] : undefined;
      if (!sheet) throw new Error("empty");
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (!csv.trim()) throw new Error("empty");
      if (csv.length <= RAW_LIMIT) {
        setPaste(csv);
        track("file_parsed", { kind: "sheet", mode: "raw" });
      } else {
        // Bounded structured summary for large sheets.
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Cell[][];
        setPaste(summarizeRows(rows, first));
        setSummarized(true);
        track("file_parsed", { kind: "sheet", mode: "summary" });
      }
    } catch {
      setFileErr("Couldn't read that file — try re-saving as .csv, or paste the values.");
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
          <p className="note" style={{ margin: "2px 0 10px" }}>Upload your spreadsheet or paste values · <span style={{ color: "var(--faint)" }}>PDF coming soon</span></p>
          <div className="drop">
            <div className="ic">📎</div>
            <b>Upload a spreadsheet, or paste below</b>
            <span>.xlsx · .xls · .csv — we read the first sheet</span><br />
            <button className="browse" type="button" onClick={() => fileInput.current?.click()}>📁 Browse files</button>
            <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv,.txt" hidden onChange={onFile} />
          </div>
          {fileName && !fileErr ? <div className="filechip"><span className="x">✓</span> {fileName} — {summarized ? "summarized below (large sheet)" : "values loaded below"}</div> : null}
          {summarized ? <p className="note" style={{ margin: "2px 0 0" }}>Large file — we sent Gemini a structured summary (shape, per-column totals, sample rows) instead of every row, so the check stays fast and cheap.</p> : null}
          {fileErr ? <div className="finding warn" style={{ marginTop: 8 }}>⚠️ {fileErr}</div> : null}
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
