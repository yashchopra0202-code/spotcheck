"use client";
import { useFunnel } from "@/components/FunnelProvider";

export default function Done() {
  const { state } = useFunnel();
  return (
    <div className="pad screen">
      <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
      <div className="centerblock">
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h2 className="title" style={{ fontSize: 22 }}>You&apos;re all set{state.email ? "" : ""}.</h2>
        <p className="sub">Progress saved. Your {state.pace === "aggressive" ? "7" : "15"}-day plan on {state.focus ?? "your focus"} starts here — your daily coach lands next.</p>
      </div>
      <button className="cta" disabled>Your dashboard is coming soon</button>
    </div>
  );
}
