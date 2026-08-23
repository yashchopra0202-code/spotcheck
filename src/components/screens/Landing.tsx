"use client";
import { useFunnel } from "@/components/FunnelProvider";
import ThemeSwitch from "@/components/ThemeSwitch";
import { track } from "@/lib/analytics";

/* Landing page — the acquisition front door. Full-width marketing surface that extends
   the app's dark visual world and flows into the onboarding funnel via "Begin".
   Icons are authored inline SVG (one consistent 1.75 stroke), not emoji. */

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconDoc = () => (<svg width="22" height="22" viewBox="0 0 24 24" {...S}><path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M8 12h8M8 16h5" /></svg>);
const IconShield = () => (<svg width="22" height="22" viewBox="0 0 24 24" {...S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="M9 12l2 2 4-4" /></svg>);
const IconEye = () => (<svg width="22" height="22" viewBox="0 0 24 24" {...S}><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" /></svg>);
const IconChat = () => (<svg width="22" height="22" viewBox="0 0 24 24" {...S}><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" /><path d="M8 10h8M8 13h5" /></svg>);
const IconTarget = () => (<svg width="22" height="22" viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>);
const IconLock = () => (<svg width="16" height="16" viewBox="0 0 24 24" {...S}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>);
const IconCheck = () => (<svg width="16" height="16" viewBox="0 0 24 24" {...S}><path d="M4 12l5 5L20 6" /></svg>);

const DIMS: [string, string][] = [
  ["Output verified", "Spot-checked, cross-footed, tied to a control figure."],
  ["Source integrity", "Row counts match; nothing silently dropped or coerced."],
  ["Plausibility", "Magnitude, sign and units make sense — no 10× surprises."],
  ["Instruction fidelity", "Answers the exact question — right period, gross vs net."],
  ["Assumptions surfaced", "Hidden choices named: blanks, dedup key, rounding."],
  ["Reproducible", "You can redo the number without the AI."],
  ["Ship-ready fit", "Right format, labels and caveats for where it lands."],
];

const FAQ: [string, string][] = [
  ["Is my data safe?", "Your pasted work is used only to run that one check — nothing is shared or sold."],
  ["Do I need to be technical?", "No. If you use AI for spreadsheets and numbers, SpotCheck is built for you."],
  ["How long does it take?", "Your first check takes about two minutes, and there's no signup to start."],
  ["What does it actually check?", "Whether your AI-assisted number is trustworthy — verified, plausible, answering the exact question, and reproducible."],
];

export default function Landing({ onBegin }: { onBegin: () => void }) {
  const { theme } = useFunnel();
  function begin(where: string) { track("landing_begin", { where }); onBegin(); }

  return (
    <div className="lp" data-theme={theme}>
      {/* NAV */}
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
          <nav className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#standard">The standard</a>
          </nav>
          <div className="lp-nav-right">
            <ThemeSwitch />
            <button className="lp-btn lp-btn-sm" onClick={() => begin("nav")}>Begin</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-wrap lp-hero-in">
          <div className="lp-hero-copy lp-reveal">
            <h1>Trust what AI does with your&nbsp;numbers.</h1>
            <p className="lp-lead">
              You use AI for finance work every day. SpotCheck checks it against a standard of good —
              so you catch the wrong number before a review, an interview, or a board deck does.
            </p>
            <div className="lp-cta-row">
              <button className="lp-btn lp-btn-lg" onClick={() => begin("hero")}>Begin&nbsp;→</button>
              <span className="lp-micro"><IconLock /> Free · no signup · under 2 minutes</span>
            </div>
          </div>
          <div className="lp-hero-art lp-reveal lp-reveal-2" aria-hidden="true">
            <div className="lp-card lp-shot">
              <div className="lp-shot-head"><span className="mk mk-sm" /><span>Your coach checked this</span></div>
              <div className="lp-verdict lp-warn">Don&apos;t ship yet — 2 checks failed</div>
              <div className="lp-shot-row"><IconCheck /><b>Output verified</b><span className="lp-x">✕ range stops at B5</span></div>
              <div className="lp-shot-row lp-ok"><span className="lp-tick"><IconCheck /></span><b>Plausibility</b><span>clear</span></div>
              <div className="lp-shot-row"><IconCheck /><b>Instruction fidelity</b><span className="lp-x">✕ gross, not net</span></div>
              <div className="lp-jrow">
                {[1, 0, 1, 0, 1, 1, 1].map((v, i) => <i key={i} className={v ? "on" : "off"} />)}
                <span className="lp-jlabel">judgment map</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="lp-band">
        <div className="lp-wrap">
          <p><b>85%</b> of finance professionals use AI daily — yet only <b>1 in 3</b> can tell whether they&apos;re using it well.</p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="lp-problem">
        <div className="lp-wrap lp-narrow">
          <h2>The gap nobody checks — until it&apos;s expensive.</h2>
          <p>
            You were never taught AI. Nothing at work tells you whether your AI-assisted numbers are trustworthy.
            So the first real test arrives unannounced — in a review, an interview, or a figure that shipped wrong —
            with no time left to fix it.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <h2 className="lp-h2">Three steps to work you can defend.</h2>
          <ol className="lp-steps">
            <li>
              <span className="lp-step-ic"><IconDoc /></span>
              <h3>Bring a real task</h3>
              <p>Paste the AI-assisted work you&apos;re about to ship — a formula, a cleaned sheet, a number for the deck.</p>
            </li>
            <li>
              <span className="lp-step-ic"><IconShield /></span>
              <h3>Get it checked</h3>
              <p>SpotCheck grades it against 7 trust dimensions and shows exactly what you&apos;d have shipped wrong.</p>
            </li>
            <li>
              <span className="lp-step-ic"><IconEye /></span>
              <h3>Learn to catch it yourself</h3>
              <p>A two-minute lesson drawn from your own check — so next time you spot it before the tool does.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* FEATURES — alternating rows */}
      <section className="lp-section lp-alt">
        <div className="lp-wrap">
          <div className="lp-feat">
            <div className="lp-feat-copy">
              <span className="lp-feat-ic"><IconShield /></span>
              <h2>A standard of good, applied to your real work</h2>
              <p>Every check runs your output against the same seven dimensions a careful analyst would — and tells you, plainly, whether it&apos;s safe to ship.</p>
            </div>
            <div className="lp-feat-art"><div className="lp-card lp-mini">
              <div className="lp-verdict lp-ok-v">Looks trustworthy — core checks pass</div>
              <div className="lp-mini-row"><span className="lp-tick"><IconCheck /></span> Source integrity — 1,200 rows intact</div>
              <div className="lp-mini-row"><span className="lp-tick"><IconCheck /></span> Reproducible — you can redo it</div>
            </div></div>
          </div>

          <div className="lp-feat lp-rev">
            <div className="lp-feat-copy">
              <span className="lp-feat-ic"><IconChat /></span>
              <h2>Defend it before your manager does</h2>
              <p>Mock Review puts you across the table from a skeptical AI manager who interrogates the work you just checked — three sharp questions, then a verdict.</p>
            </div>
            <div className="lp-feat-art"><div className="lp-card lp-mini">
              <div className="lp-bubble">You listed Jul–Sep as Q3. Our fiscal year starts in April — so why is this Q3?</div>
              <div className="lp-bubble-u">Because I assumed calendar quarters…</div>
            </div></div>
          </div>

          <div className="lp-feat">
            <div className="lp-feat-copy">
              <span className="lp-feat-ic"><IconTarget /></span>
              <h2>Sharper every day, in two minutes</h2>
              <p>A daily sharpener serves one AI output with a planted flaw, tuned to the checks you miss most. Judgment is a habit — this builds it.</p>
            </div>
            <div className="lp-feat-art"><div className="lp-card lp-mini">
              <div className="lp-q">You asked AI: total FY24 revenue for 5 units in B2:B6</div>
              <div className="lp-code">=SUM(B2:B5)</div>
              <div className="lp-opt lp-opt-on">The range stops at B5 — the 5th unit is left out</div>
            </div></div>
          </div>
        </div>
      </section>

      {/* THE STANDARD */}
      <section className="lp-section" id="standard">
        <div className="lp-wrap">
          <h2 className="lp-h2">The seven checks behind every verdict.</h2>
          <div className="lp-dims">
            {DIMS.map(([name, desc], i) => (
              <div className="lp-dim" key={name}>
                <span className="lp-dim-n">{i + 1}</span>
                <div><b>{name}</b><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section lp-alt">
        <div className="lp-wrap lp-narrow">
          <h2 className="lp-h2">Questions, answered.</h2>
          <div className="lp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}<span className="lp-faq-mk" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final">
        <div className="lp-wrap lp-narrow">
          <h2>Catch it before they do.</h2>
          <p>Check your first real task in under two minutes — no signup.</p>
          <button className="lp-btn lp-btn-lg" onClick={() => begin("final")}>Begin&nbsp;→</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
          <span className="lp-foot-note">Built for finance analysts who use AI daily.</span>
          <span className="lp-foot-note">© 2026 SpotCheck</span>
        </div>
      </footer>
    </div>
  );
}
