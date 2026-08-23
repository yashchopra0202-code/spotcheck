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
import PathAPreflight from "@/components/screens/PathAPreflight";
import PathAUpload from "@/components/screens/PathAUpload";
import PathAFindings from "@/components/screens/PathAFindings";
import PathAConcepts from "@/components/screens/PathAConcepts";
import Test from "@/components/screens/Test";
import Results from "@/components/screens/Results";
import Email from "@/components/screens/Email";
import Done from "@/components/screens/Done";
import Drill from "@/components/screens/Drill";

// Desktop chrome shows a 5-stage progress rail; group the 13 steps into stages.
const STAGES = ["work", "plan", "check", "test", "save"];
function stageIndex(step: string): number {
  switch (step) {
    case "welcome": case "role": case "comfort": case "focus": case "pace": return 0;
    case "roadmap": case "fork": return 1;
    case "a_preflight": case "a_upload": case "a_findings": case "a_concepts": return 2;
    case "test": case "results": return 3;
    case "email": return 4;
    case "done": case "drill": return 5;
    default: return 0;
  }
}

function Funnel() {
  const { state, back, canGoBack, theme } = useFunnel();
  const cur = stageIndex(state.step);
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
      case "a_preflight": return <PathAPreflight />;
      case "a_upload": return <PathAUpload />;
      case "a_findings": return <PathAFindings />;
      case "a_concepts": return <PathAConcepts />;
      case "test": return <Test />;
      case "results": return <Results />;
      case "email": return <Email />;
      case "done": return <Done />;
      case "drill": return <Drill />;
      default:
        return <Welcome />;
    }
  })();
  return (
    <main className="app" data-theme={theme}>
      <div className="appcol">
        <div className="topbar">
          <div className="tb-left">
            <span className="brandlogo tb-logo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></span>
            {showBack ? (
              <button className="backbtn" onClick={back} aria-label="Go back">‹ Back</button>
            ) : null}
          </div>
          <div className="tb-right">
            <div className="dots" aria-hidden="true">
              {STAGES.map((s, i) => <i key={s} className={i < cur ? "done" : i === cur ? "on" : ""} />)}
            </div>
            <ThemeSwitch />
          </div>
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
