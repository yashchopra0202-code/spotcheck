"use client";
import { useEffect, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { roadmapDays, effectiveFocus, weakestDimensions } from "@/lib/funnel";
import { track } from "@/lib/analytics";
import { saveRating } from "@/lib/supabase";

export default function Done() {
  const { state, check, checks, go, userId } = useFunnel();
  const days = roadmapDays(state.pace);
  const ranCheck = !!check;
  const pct = ranCheck ? 15 : 10;

  // Tomorrow's sharpener targets the dimension they're weakest on (from their real
  // checks), so the hook feels personal. Falls back to a sensible next lesson.
  const tomorrowDim = weakestDimensions(checks)[0] ?? "Instruction fidelity";

  // Animate the progress bar from 0 on mount; fire the hook-shown event once.
  const [fill, setFill] = useState(0);
  const [notified, setNotified] = useState(false);
  const [rated, setRated] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFill(pct), 160);
    track("daily_loop_shown", { dim: tomorrowDim });
    return () => clearTimeout(t);
  }, [pct, tomorrowDim]);

  function remindMe() {
    setNotified(true);
    track("return_intent", { dim: tomorrowDim });
  }

  // One tap = submitted (no button — lowest friction on the last screen). Fires the
  // PostHog event and writes to the ratings table; checks_count lets us segment
  // satisfaction by usage. Silently no-ops if the DB/table isn't set up yet.
  function rate(n: number) {
    if (rated) return;
    setRated(n);
    const checks_count = checks.length;
    const email = state.email?.trim() || null;
    track("rating_submitted", { rating: n, checks_count, has_email: !!email });
    saveRating({ user_id: userId, rating: n, checks_count, email });
  }

  return (
    <div className="pad screen">
      <div className="brandlogo" style={{ marginBottom: 4 }}><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>

      <div className="eyebrow" style={{ color: "var(--brand)", marginTop: 14 }}>Milestone unlocked</div>
      <h2 className="title" style={{ fontSize: 21 }}>You&apos;re AI-check ready.</h2>
      <p className="sub" style={{ marginBottom: 16 }}>
        Progress saved. Here&apos;s what you&apos;ve earned — your {days}-day plan on {effectiveFocus(state) ?? "your focus"} starts now.
      </p>

      <div className="eyebrow">Your journey</div>
      <div style={{ margin: "8px 0 6px" }}>
        <div className="jnode done"><div className="cc">✓</div><div className="tx">Set your goal &amp; plan</div></div>
        <div className="jline" />
        {ranCheck && (
          <>
            <div className="jnode done"><div className="cc">✓</div><div className="tx">Ran your first real-work check with AI</div></div>
            <div className="jline" />
          </>
        )}
        <div className="jnode done"><div className="cc">✓</div><div className="tx">Passed the capability test</div></div>
        <div className="jline" />
        <div className="jnode now"><div className="cc">▸</div><div className="tx"><b>Day 1 · Source integrity</b> — starts now</div></div>
        <div className="jline" />
        <div className="jnode pending"><div className="cc" /><div className="tx">Day 2 · Reproducibility</div></div>
      </div>

      <div className="eyebrow" style={{ marginTop: 10 }}>Achievements</div>
      <div className="badges">
        <div className="badge"><div className="ic">🎯</div><div className="nm">First check</div></div>
        <div className="badge"><div className="ic">🛡️</div><div className="nm">Source integrity</div></div>
        <div className="badge locked"><div className="ic">🔒</div><div className="nm">7-day run</div></div>
      </div>

      <div className="prog" style={{ marginTop: 12 }}><div className="f" style={{ transform: `scaleX(${fill / 100})` }} /></div>
      <p className="note">Day 1 of {days} · {pct}% to &ldquo;AI-ready analyst.&rdquo;</p>

      {/* The daily loop: a live 2-min sharpener on the user's weakest check. */}
      <div className="eyebrow" style={{ marginTop: 18 }}>Your daily habit</div>
      <button className="cta" style={{ marginTop: 8 }} onClick={() => go("drill")}>Start today&apos;s 2-min sharpener →</button>
      <p className="note" style={{ textAlign: "center" }}>A fresh set on your weakest checks — starting with {tomorrowDim}.</p>
      <button className="ghost" onClick={remindMe} disabled={notified}>
        {notified ? "We'll nudge you daily ✓" : "🔔 Get a daily nudge"}
      </button>

      {/* Experience rating — one tap, captured to PostHog + the ratings table. */}
      <div className="rate">
        {rated ? (
          <p className="thanks">Thanks — that helps us make SpotCheck better. {"⭐".repeat(rated)}</p>
        ) : (
          <>
            <div className="q">How was your experience?</div>
            <div className="stars" role="radiogroup" aria-label="Rate your experience from 1 to 5 stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={n <= (hoverStar || rated) ? "on" : ""}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => rate(n)}
                >
                  ★
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
