"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { roadmapDays } from "@/lib/funnel";

export default function Done() {
  const { state, check } = useFunnel();
  const days = roadmapDays(state.pace);
  const ranCheck = !!check;
  const pct = ranCheck ? 15 : 10;

  // Animate the progress bar from 0 on mount.
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFill(pct), 160);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="pad screen">
      <div className="brandlogo" style={{ marginBottom: 4 }}><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>

      <div className="eyebrow" style={{ color: "var(--brand)", marginTop: 14 }}>Milestone unlocked</div>
      <h2 className="title" style={{ fontSize: 21 }}>You&apos;re AI-check ready.</h2>
      <p className="sub" style={{ marginBottom: 16 }}>
        Progress saved. Here&apos;s what you&apos;ve earned — your {days}-day plan on {state.focus ?? "your focus"} starts now.
      </p>

      <div className="eyebrow">Your journey</div>
      <div style={{ margin: "8px 0 6px" }}>
        <div className="jnode done"><div className="cc">✓</div><div className="tx">Set your goal &amp; plan</div></div>
        <div className="jline" />
        {ranCheck && (
          <>
            <div className="jnode done"><div className="cc">✓</div><div className="tx">Ran your first real-work check with Gemini</div></div>
            <div className="jline" />
          </>
        )}
        <div className="jnode done"><div className="cc">✓</div><div className="tx">Passed the capability test</div></div>
        <div className="jline" />
        <div className="jnode now"><div className="cc">▸</div><div className="tx"><b>Day 1 · Source integrity</b> — starts now</div></div>
        <div className="jline" />
        <div className="jnode pending"><div className="cc" /><div className="tx">Day 2 · Reproducibility</div></div>
      </div>

      <div className="eyebrow" style={{ marginTop: 10 }}>Achievements</div>
      <div className="badges">
        <div className="badge"><div className="ic">🎯</div><div className="nm">First check</div></div>
        <div className="badge"><div className="ic">🛡️</div><div className="nm">Source integrity</div></div>
        <div className="badge locked"><div className="ic">🔒</div><div className="nm">7-day run</div></div>
      </div>

      <div className="prog" style={{ marginTop: 12 }}><div className="f" style={{ transform: `scaleX(${fill / 100})` }} /></div>
      <p className="note">Day 1 of {days} · {pct}% to &ldquo;AI-ready analyst.&rdquo;</p>

      <button className="cta" disabled style={{ marginTop: 16 }}>Your daily coach lands next</button>
    </div>
  );
}
