"use client";
import { useFunnel } from "@/components/FunnelProvider";

export default function PathAFindings() {
  const { check, go } = useFunnel();
  if (!check) {
    // Guard: reached without a result (e.g. reload). Send back to upload.
    return (
      <div className="pad screen">
        <p className="sub">No check to show.</p>
        <button className="cta" onClick={() => go("a_upload")}>Run a check →</button>
      </div>
    );
  }
  const { result } = check;
  const failedCore = result.dimensions.filter((d) => !d.pass);
  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A</span>
      <div className="coachsay"><div className="g" /><div className="bub">{result.summary}</div></div>
      <div>
        {result.dimensions.map((d, i) => (
          <div key={d.name} className="step">
            <span className="n">{i + 1}</span>
            <div><b>{d.name}{d.pass ? " ✓" : " ⚠"}</b><p>{d.note}</p></div>
          </div>
        ))}
      </div>
      {!result.trustworthy ? (
        <div className="finding warn"><b>⚠️ Don&apos;t ship yet:</b> {failedCore.length} check{failedCore.length === 1 ? "" : "s"} failed.</div>
      ) : (
        <div className="finding ok">✓ Looks trustworthy — the core checks pass.</div>
      )}
      <div className="finding ok">✓ Fix: {result.one_fix}</div>
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("a_concepts")}>Why did this happen? →</button>
    </div>
  );
}
