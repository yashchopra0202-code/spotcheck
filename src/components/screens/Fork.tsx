"use client";
import { useFunnel } from "@/components/FunnelProvider";

export default function Fork() {
  const { go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">How do you want to start?</div>
      <h2 className="title" style={{ fontSize: 21 }}>Pick your first move</h2>
      <p className="sub" style={{ marginBottom: 14 }}>Both lead to the same capability test.</p>
      <div className="forkcard" onClick={() => go("a_preflight")}>
        <div className="em">🧩</div>
        <div><b>Solve a real problem I&apos;m facing now</b><p>Upload a task from your actual work and get unstuck today.</p></div>
      </div>
      <div className="forkcard disabled">
        <div className="em">🗺️</div>
        <div><b>Build me a customized plan</b><p>AI tailors a plan from your answers. <b>Coming soon.</b></p></div>
      </div>
    </div>
  );
}
