"use client";

import FunnelProvider, { useFunnel } from "@/components/FunnelProvider";

function Funnel() {
  const { state } = useFunnel();
  return (
    <main className="app">
      <div className="appcol" data-theme="light">
        <div className="pad screen" key={state.step}>
          <p className="eyebrow">STEP</p>
          <h2 className="title">{state.step}</h2>
          <p className="sub">Screen stub — replaced in Tasks 5–10.</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <FunnelProvider>
      <Funnel />
    </FunnelProvider>
  );
}
