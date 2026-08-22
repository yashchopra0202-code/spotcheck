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

// Desktop-only left-panel progress. Groups the 13 funnel steps into the 5
// journey stages a user recognizes; drives the done/now/pending rail.
const STAGES = ["Your work", "Your plan", "Run a real check", "Prove your judgment", "Save your progress"];

function stageIndex(step: string): number {
  switch (step) {
    case "welcome": case "role": case "comfort": case "focus": case "pace": return 0;
    case "roadmap": case "fork": return 1;
    case "a_upload": case "a_findings": case "a_concepts": return 2;
    case "test": return 3;
    case "email": return 4;
    case "done": return 5; // everything complete
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
      <div className="shell">
        <aside className="brandpanel" aria-hidden="true">
          <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
          <div className="bp-hero">
            <h1>Judge AI&rsquo;s finance work with confidence.</h1>
            <p>A coach that pressure-tests AI-assisted spreadsheets, formulas and numbers &mdash; so nothing wrong reaches your manager or a deck.</p>
          </div>
          <ol className="bp-progress">
            {STAGES.map((s, i) => (
              <li key={s} className={`bp-step ${i < cur ? "done" : i === cur ? "now" : "pending"}`}>
                <span className="d">{i < cur ? "✓" : i + 1}</span>
                <span className="t">{s}</span>
              </li>
            ))}
          </ol>
          <div className="bp-foot">
            <div className="q">&ldquo;Checks AI&rsquo;s work like a senior would.&rdquo;</div>
            <div className="m">Built for FP&amp;A, accountants, controllers, and founders handling finance.</div>
          </div>
        </aside>
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
