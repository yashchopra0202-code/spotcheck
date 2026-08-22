"use client";
import { useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { FOCUS_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";
import { saveSignal } from "@/lib/supabase";

export default function Focus() {
  const { state, set, go, userId } = useFunnel();
  // "Other" is selected when a free-text focus exists but no preset focus is chosen.
  const otherSelected = !state.focus && state.focusOther !== null;
  const [proTapped, setProTapped] = useState<string | null>(null);

  function pick(value: (typeof FOCUS_OPTIONS)[number]["value"]) {
    set({ focus: value, focusOther: null });
  }
  function pickOther() {
    set({ focus: null, focusOther: state.focusOther ?? "" });
  }
  // PRO options are a fake-door: not selectable, but a tap is a willingness-to-pay signal.
  function tapPro(value: string) {
    setProTapped(value);
    track("pro_interest", { option: value });
    saveSignal({ user_id: userId, type: "pro_interest", value });
  }

  const [otherText, setOtherText] = useState(state.focusOther ?? "");
  // Continue is enabled once a preset OR "Other" is chosen (free text is optional).
  const canContinue = !!state.focus || otherSelected;

  return (
    <div className="pad screen">
      <div className="eyebrow">Your focus</div>
      <h2 className="title">What do you want to trust yourself with first?</h2>
      <p className="sub" style={{ marginBottom: 14 }}>Pick one to start.</p>
      <div className="optgrid">
        {FOCUS_OPTIONS.map((o) =>
          o.pro ? (
            <div key={o.value} className="opt pro" onClick={() => tapPro(o.value)}>
              <div className="em">{o.emoji}</div>
              <div><b>{o.value}</b>{o.sub ? <span>{o.sub}</span> : null}</div>
              <span className="protag">PRO</span>
            </div>
          ) : (
            <div key={o.value} className={`opt${state.focus === o.value ? " sel" : ""}`} onClick={() => pick(o.value)}>
              <div className="em">{o.emoji}</div>
              <div><b>{o.value}</b>{o.sub ? <span>{o.sub}</span> : null}</div>
              <div className="ck" />
            </div>
          )
        )}
        <div className={`opt${otherSelected ? " sel" : ""}`} onClick={pickOther}>
          <div className="em">✏️</div>
          <div><b>Something else</b><span>Tell us in your words</span></div>
          <div className="ck" />
        </div>
      </div>
      {proTapped && (
        <p className="note" style={{ color: "var(--brand)", marginTop: 2 }}>
          {proTapped} is a Pro feature — we&apos;ll email you when it opens. For now, start with an option above.
        </p>
      )}
      {otherSelected && (
        <input
          className="field"
          style={{ marginTop: 4 }}
          placeholder="e.g. budget variance commentary (optional)"
          value={otherText}
          onChange={(e) => { setOtherText(e.target.value); set({ focusOther: e.target.value }); }}
        />
      )}
      <button
        className="cta"
        style={{ marginTop: 20 }}
        disabled={!canContinue}
        onClick={() => { track("onboarding_step", { step: "focus", other: otherSelected }); go("pace"); }}
      >
        Continue
      </button>
    </div>
  );
}
