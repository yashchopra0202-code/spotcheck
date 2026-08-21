"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { coachIntro } from "@/lib/funnel";

export default function Pace() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">Your plan</div>
      <div className="coachsay"><div className="g" /><div className="bub">{coachIntro(state)}</div></div>
      <p className="sub" style={{ marginBottom: 10, fontWeight: 600, color: "var(--text)" }}>Pick your pace:</p>
      <div className={`plancard${state.pace === "steady" ? " sel" : ""}`} onClick={() => set({ pace: "steady" })}>
        <div className="h"><b>Steady</b><span className="tagpop">RECOMMENDED</span></div>
        <div className="meta">15 days · 10 min/day</div>
      </div>
      <div className={`plancard${state.pace === "aggressive" ? " sel" : ""}`} onClick={() => set({ pace: "aggressive" })}>
        <div className="h"><b>Aggressive</b><span className="tagpop">FASTEST</span></div>
        <div className="meta">7 days · 25 min/day</div>
      </div>
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("roadmap")}>This is my plan →</button>
    </div>
  );
}
