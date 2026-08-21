"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { FOCUS_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Focus() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">Your focus</div>
      <h2 className="title">What do you want to trust yourself with first?</h2>
      <p className="sub" style={{ marginBottom: 14 }}>Pick one to start.</p>
      <div>
        {FOCUS_OPTIONS.map((o) => (
          <div key={o.value} className={`opt${state.focus === o.value ? " sel" : ""}`} onClick={() => set({ focus: o.value })}>
            <div className="em">{o.emoji}</div>
            <div><b>{o.value}</b>{o.sub ? <span>{o.sub}</span> : null}</div>
            <div className="ck" />
          </div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!state.focus} onClick={() => { track("onboarding_step", { step: "focus" }); go("pace"); }}>
        Continue
      </button>
    </div>
  );
}
