"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { COMFORT_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Comfort() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">No wrong answer</div>
      <h2 className="title">How much have you used AI for work?</h2>
      <div className="optgrid">
        {COMFORT_OPTIONS.map((o) => (
          <div key={o.value} className={`opt${state.comfort === o.value ? " sel" : ""}`} onClick={() => set({ comfort: o.value })}>
            <div><b>{o.label}</b></div>
            <div className="ck" />
          </div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!state.comfort} onClick={() => { track("onboarding_step", { step: "comfort" }); go("focus"); }}>
        Continue
      </button>
    </div>
  );
}
