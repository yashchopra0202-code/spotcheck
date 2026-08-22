"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { ROLE_OPTIONS, TENURE_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Role() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">About you</div>
      <h2 className="title">What&apos;s your role in finance?</h2>
      <div className="optgrid">
        {ROLE_OPTIONS.map((o) => (
          <div key={o.value} className={`opt${state.role === o.value ? " sel" : ""}`} onClick={() => set({ role: o.value })}>
            <div className="em">{o.emoji}</div>
            <div><b>{o.value}</b></div>
            <div className="ck" />
          </div>
        ))}
      </div>
      <div className="seglabel">Years in finance</div>
      <div className="tchips">
        {TENURE_OPTIONS.map((t) => (
          <div key={t} className={`tchip${state.tenure === t ? " sel" : ""}`} onClick={() => set({ tenure: t })}>{t}</div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!state.role || !state.tenure} onClick={() => { track("onboarding_step", { step: "role" }); go("comfort"); }}>
        Continue
      </button>
    </div>
  );
}
