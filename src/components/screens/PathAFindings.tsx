"use client";
import { useEffect } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { judgmentMap, conceptsInput } from "@/lib/funnel";
import { prefetchConcepts } from "@/lib/conceptsClient";
import { track } from "@/lib/analytics";

export default function PathAFindings() {
  const { check, checks, go, state: funnelState } = useFunnel();

  // Prefetch the Learn-screen concepts now — this screen always precedes it, so the ~6s
  // Haiku call runs while the user reads findings / does the mock review. The Learn screen
  // then shows tailored cards immediately instead of its own thinking wait.
  useEffect(() => {
    if (check) prefetchConcepts(conceptsInput(check, funnelState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check]);

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

  // Co-pilot panel: a running judgment map across every output checked this session.
  const map = judgmentMap(checks);
  const n = checks.length;

  function checkAnother() {
    track("check_another", { checks_so_far: n });
    go("a_upload");
  }

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

      {/* Persistent judgment-map rail — accumulates as the user checks more outputs. */}
      <div className="jmap">
        <div className="jmap-hd">
          <b>Your judgment map</b>
          <span className="note" style={{ margin: 0 }}>{n} check{n === 1 ? "" : "s"} this session</span>
        </div>
        {map.map((c) => {
          const state = c.fails === 0 ? "pass" : c.fails === c.total ? "fail" : "mixed";
          return (
            <div key={c.name} className="jmap-row">
              <span className={`jdot ${state}`} aria-hidden="true" />
              <span className="jname">{c.name}{c.core ? "" : " ·"}</span>
              <span className="jtally note" style={{ margin: 0 }}>{c.passes}/{c.total} clear</span>
            </div>
          );
        })}
      </div>

      <button className="ghost" style={{ marginTop: 10 }} onClick={checkAnother}>+ Check another output</button>
      <button className="ghost" onClick={() => { track("mock_review_started"); go("mock_review"); }}>🎤 Now defend it — face a mock review</button>
      <button className="cta" onClick={() => go("a_concepts")}>Why did this happen? →</button>
    </div>
  );
}
