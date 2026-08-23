"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";

// The milestone screen (replaces the old quiz-score screen). Instead of a generic test
// score, it celebrates what the user actually did: real AI-assisted work checked against
// the standard, and the issues they caught before those numbers could ship.
export default function Results() {
  const { checks, go } = useFunnel();
  const issues = checks.reduce((n, c) => n + c.missed_dims.length, 0);
  const runs = checks.length;
  const clean = issues === 0;

  // Reveal the badge a beat after the number lands.
  const [showBadge, setShowBadge] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowBadge(true), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="pad screen">
      <div className="eyebrow" style={{ color: "var(--brand)" }}>Milestone unlocked</div>

      <div className="scorebig">
        <div className="v">{clean ? runs : issues}<small>{clean ? (runs === 1 ? " check" : " checks") : (issues === 1 ? " issue" : " issues")}</small></div>
      </div>
      <p className="sub" style={{ textAlign: "center", marginBottom: 18 }}>
        {clean
          ? "You verified your AI-assisted work and it checked out clean. That's the habit that keeps wrong numbers from shipping."
          : `You caught ${issues} ${issues === 1 ? "issue" : "issues"} before ${issues === 1 ? "it" : "they"}'d have shipped — ${issues === 1 ? "a number" : "numbers"} you won't get caught on later.`}
      </p>

      <div className={`achieve${showBadge ? " in" : ""}`}>
        <div className="ic">🎯</div>
        <div>
          <div className="l">Achievement unlocked</div>
          <b>First real check</b>
          <p>You ran your real AI-assisted work against a standard of good — most people never do.</p>
        </div>
      </div>

      <button className="cta" style={{ marginTop: 22 }} onClick={() => go("email")}>See what you&apos;ve earned →</button>
    </div>
  );
}
