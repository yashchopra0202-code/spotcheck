"use client";

import FunnelProvider, { useFunnel } from "@/components/FunnelProvider";
import Welcome from "@/components/screens/Welcome";
import Role from "@/components/screens/Role";
import Comfort from "@/components/screens/Comfort";
import Focus from "@/components/screens/Focus";
import Pace from "@/components/screens/Pace";
import Roadmap from "@/components/screens/Roadmap";
import Fork from "@/components/screens/Fork";
import PathAUpload from "@/components/screens/PathAUpload";
import PathAFindings from "@/components/screens/PathAFindings";
import PathAConcepts from "@/components/screens/PathAConcepts";
import Test from "@/components/screens/Test";

function Funnel() {
  const { state } = useFunnel();
  const screen = (() => {
    switch (state.step) {
      case "welcome": return <Welcome />;
      case "role": return <Role />;
      case "comfort": return <Comfort />;
      case "focus": return <Focus />;
      case "pace": return <Pace />;
      case "roadmap": return <Roadmap />;
      case "fork": return <Fork />;
      case "a_upload": return <PathAUpload />;
      case "a_findings": return <PathAFindings />;
      case "a_concepts": return <PathAConcepts />;
      case "test": return <Test />;
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
