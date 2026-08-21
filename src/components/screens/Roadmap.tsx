"use client";
import { useEffect } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { roadmap, roadmapDays } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Roadmap() {
  const { state, go } = useFunnel();
  const milestones = roadmap(state.pace);
  useEffect(() => {
    track("commit_set", { focus: state.focus, pace: state.pace });
    track("roadmap_viewed", { days: roadmapDays(state.pace) });
  }, [state.pace, state.focus]);
  return (
    <div className="pad screen">
      <div className="eyebrow">Your roadmap · {roadmapDays(state.pace)} days</div>
      <h2 className="title" style={{ fontSize: 20 }}>Start your AI journey</h2>
      <div>
        {milestones.map((m, i) => (
          <div key={m.title} className={`plancard${i === 0 ? " sel" : ""}`}>
            <b>{m.when}</b>
            <div className="meta">{m.title} — {m.note}</div>
          </div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("fork")}>Begin →</button>
    </div>
  );
}
