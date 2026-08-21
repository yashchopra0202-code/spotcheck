"use client";

import FunnelProvider, { useFunnel } from "@/components/FunnelProvider";
import Welcome from "@/components/screens/Welcome";
import Role from "@/components/screens/Role";
import Comfort from "@/components/screens/Comfort";
import Focus from "@/components/screens/Focus";

function Funnel() {
  const { state } = useFunnel();
  const screen = (() => {
    switch (state.step) {
      case "welcome": return <Welcome />;
      case "role": return <Role />;
      case "comfort": return <Comfort />;
      case "focus": return <Focus />;
      default:
        return (
          <div className="pad screen">
            <p className="eyebrow">STEP</p>
            <h2 className="title">{state.step}</h2>
            <p className="sub">Stub — implemented in a later task.</p>
          </div>
        );
    }
  })();
  return (
    <main className="app">
      <div className="appcol" data-theme="light" key={state.step}>{screen}</div>
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
