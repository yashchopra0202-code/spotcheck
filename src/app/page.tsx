"use client";

import FunnelProvider, { useFunnel } from "@/components/FunnelProvider";
import ThemeSwitch from "@/components/ThemeSwitch";
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
import Email from "@/components/screens/Email";
import Done from "@/components/screens/Done";

function Funnel() {
  const { state, back, canGoBack, theme } = useFunnel();
  // Back is available everywhere it can unwind, except the terminal "done" screen.
  const showBack = canGoBack && state.step !== "done";
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
      case "email": return <Email />;
      case "done": return <Done />;
      default:
        return <Welcome />;
    }
  })();
  return (
    <main className="app" data-theme={theme}>
      <div className="appcol">
        <div className="topbar">
          {showBack ? (
            <button className="backbtn" onClick={back} aria-label="Go back">‹ Back</button>
          ) : (
            <span aria-hidden="true" />
          )}
          <ThemeSwitch />
        </div>
        <div className="screenwrap" key={state.step}>{screen}</div>
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
