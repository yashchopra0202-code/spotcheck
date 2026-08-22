"use client";
import { useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { effectiveFocus } from "@/lib/funnel";
import { saveProfile } from "@/lib/supabase";
import { track } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Email() {
  const { state, set, go, userId } = useFunnel();
  const [email, setEmail] = useState(state.email);
  const valid = EMAIL_RE.test(email);

  function submit() {
    if (!valid) return;
    set({ email });
    saveProfile({
      user_id: userId, role: state.role, tenure: state.tenure,
      ai_comfort: state.comfort, focus: effectiveFocus(state), pace: state.pace, email,
    });
    track("identity_captured");
    go("done");
  }

  return (
    <div className="pad screen">
      <div className="brandlogo" style={{ marginBottom: 6 }}><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
      <h2 className="title" style={{ fontSize: 20 }}>Save your progress</h2>
      <div className="lossnote">You built a plan, ran a real check, and passed the capability test. Add your email to <b>save it and get your score</b>.</div>
      <input className="field" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="cta" style={{ marginTop: "auto" }} disabled={!valid} onClick={submit}>Create my account</button>
      <p className="legal">By continuing you agree to our <a>Terms &amp; Conditions</a> and <a>Privacy Policy</a>.</p>
    </div>
  );
}
