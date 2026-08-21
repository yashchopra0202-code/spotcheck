"use client";
import { useEffect } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { track } from "@/lib/analytics";

export default function Welcome() {
  const { go } = useFunnel();

  useEffect(() => {
    track("welcome_viewed");
  }, []);

  return (
    <div className="pad screen">
      <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
      <div style={{ margin: "auto 0" }}>
        <h2 className="title" style={{ fontSize: 25 }}>Trust what AI does with your numbers.</h2>
        <p className="sub">A 60-second setup. No sign-up to start.</p>
      </div>
      <button className="cta" onClick={() => go("role")}>Begin</button>
      <button className="ghost" onClick={() => { track("guest_skip"); go("fork"); }}>Explore as a guest →</button>
    </div>
  );
}
