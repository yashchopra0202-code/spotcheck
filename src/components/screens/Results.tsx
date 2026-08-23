"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { testBadge } from "@/lib/funnel";

// Post-test beat 1 (of the two-screen finish): the score reveal + the achievement it
// unlocks. A celebrated moment before we ask for the email and show the roadmap/hook.
export default function Results() {
  const { testResult, go } = useFunnel();
  const score = testResult?.score ?? 0;
  const total = testResult?.total ?? 0;
  const badge = testBadge(score, total);

  // Reveal the badge a beat after the score lands.
  const [showBadge, setShowBadge] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowBadge(true), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="pad screen">
      <div className="eyebrow" style={{ color: "var(--brand)" }}>Your result</div>
      <div className="scorebig"><div className="v">{score}<small>/{total}</small></div></div>
      <p className="sub" style={{ textAlign: "center", marginBottom: 18 }}>
        A sharp starting line — this is where your AI judgment begins, with room to climb.
      </p>

      <div className={`achieve${showBadge ? " in" : ""}`}>
        <div className="ic">{badge.emoji}</div>
        <div>
          <div className="l">Achievement unlocked</div>
          <b>{badge.name}</b>
          <p>{badge.blurb}</p>
        </div>
      </div>

      <button className="cta" style={{ marginTop: 22 }} onClick={() => go("email")}>See what you&apos;ve earned →</button>
    </div>
  );
}
