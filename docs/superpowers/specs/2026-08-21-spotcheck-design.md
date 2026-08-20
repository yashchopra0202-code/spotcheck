# SpotCheck — Design Spec (v1)
**Date:** 2026-08-21 · **Status:** for review · **Deadline:** 26 Aug (~5 days)

## 1. Product in one line
A **guest-first, Gemini-powered learning coach** that gets finance professionals genuinely good at **trusting and fixing their AI-assisted work** — assess → personalized roadmap → daily 10–15 min practice with a **live AI coach**.

It is a **learning product** (Case fit: "Learning Tech & AI"), *not* a do-it-for-you assistant. Gemini helps you *get good*, not off your plate.

## 2. Problem & persona (locked — see vault)
- **Problem:** For the employed professional who already uses AI daily but was never taught it, nothing checks their real work against a standard of what "good" looks like for their role — so they can't tell if they're using AI well, their confidence stays untested, and it collapses the first time it's checked, when there's no time left to fix it.
- **Persona / beachhead:** employed, mid-career finance professional who does **data/spreadsheet work that actually ships** (finance analysts first; analytical ops, not ops-coordination). Uses AI daily but shallow; self-taught; identifies as "not technical."

## 3. USP — Gemini as a real-time in-app coach
The differentiator vs a static course *and* vs raw ChatGPT. Three roles:
1. **Live coach during practice** — "Ask your coach" for a hint / "why is this wrong?" in real time.
2. **Live critique of real work** — user pastes an actual AI-assisted task; Gemini critiques it against the 7-dimension rubric on the spot.
3. **Personalization** — Gemini phrases the roadmap and frames each day's task to the user's role + goal.

## 4. The funnel (guest-first commitment escalation)
**Ask (optional/guest) → personalize → commit to own goal → win before any score → strengths-first profile → roadmap (endowment) → identity → money.**
Principle: *every pre-paywall screen increases what the user would lose by leaving.* Never lead with a discouraging score.

## 5. Onboarding (finance-specific bones, learning-framed; fully skippable → guest)
- **0 · Welcome** — one line, one CTA, "~60 seconds." Brevity buys trust.
- **1 · Role + tenure** (one screen) — role list (FP&A/Analyst, Accountant/Controller, Finance Manager/Head, CFO, Treasury, Audit/Risk, Research, Founder, Student, Other) + segmented tenure (0–2 · 3–5 · 6–10 · 10+). **Powers:** vocabulary + explanation depth.
- **2 · AI-comfort ladder** — 5 **behavioral** rungs (never numeric, never "beginner"): *haven't really used → tried a few times → most weeks → daily, trust it → I build workflows others use.* **Routes, doesn't grade:** rungs 1–2 → guided rails (prompt cards, worked example, coach narrates, no blank box first session); rungs 3–5 → open path (their own file, shortcuts, guardrail copy suppressed). *This is the non-discouraging assessment fork.*
- **3 · Help area** — multi-select **capped at 3** (spreadsheets, data analysis, projections, reporting/MIS, reconciliation/close, doc reading, commentary/memos, Other→free-text). **"Other" free-text = highest-value telemetry; review weekly.**
- **4 · Force a priority** (shown if ≥2 chosen) — "Which do you want to be able to trust yourself with first?" **Commitment unit = a capability outcome, not "15 min/day."**
- **5 · Payoff preview** — reflect inputs back as a concrete plan. **No fabricated time-saving stat** (finance audience prices things; a fake number destroys trust).

## 6. Assessment (woven, non-discouraging)
Delivered as the **first win** + a few drills seeded to the focus area. Result screen is **strengths-first**: lead with sharpest dimension; frame the gap as "fastest win"; show composite as a **starting line with upside**, never a grade. Reuses the scenario bank.

## 7. Daily engine — A (daily) + C (weekly boss), with the Gemini coach
- **A — daily guided task** (10–15 min): 1-screen concept → realistic finance task in focus area → user does it (coach available) → **Gemini critiques vs rubric** → feedback (what you nailed + the one fix) → progress updates.
- **C — weekly boss level:** "Bring your own work" — paste a real AI-assisted task; Gemini full-rubric critique. The utility-magic moment.
- Content: authored scenario bank ([[Scenario Library v1]]), seeded per focus area; Gemini for critique + coaching, **not** infinite generation (MVP).

## 8. Roadmap & transformation
- **Roadmap:** deterministic sequence from weak dimensions + focus + daily time; **Gemini phrases** it warmly and **honestly** (credible, not hype).
- **Transformation:** judgment map that visibly climbs + **day-1-vs-today** ("you missed 3/4 source-integrity flaws — you now catch them"). Retention + share moment. **No streaks/points** (survey: 8% want them).

## 9. Identity & monetization
- **Identity:** email capture *after* wins + roadmap ("save your progress") — when they have something to lose.
- **Money:** $5/mo Pro at day 7 (unlimited real-work checks, all focus areas, deeper roadmap). **Case-window fix:** since day 7 won't arrive inside the ~5-day window, add an earlier **"would you pay $5?" fake-door** (`wtp_signal`) for the business metric. **No real payment processing in MVP.**

## 10. Tech architecture
- **Next.js + Supabase + Vercel + GitHub + Gemini + PostHog.** Single codebase.
- **Gemini server-side only** — `/api/coach` (hints) and `/api/critique` (rubric grading). Key in `GEMINI_API_KEY` env, never client. Model: Gemini Flash-class for latency/cost.
- **Identity:** anonymous id (guest) in localStorage + Supabase; email captured at the identity step.
- **Resilience:** Gemini timeout/error → authored fallback critique; the flow never blocks.

## 11. Data model (Supabase)
- `profiles` (user_id, role, tenure, ai_comfort_rung, focus_areas[], priority, daily_min, email?, created_at)
- `assessments` (user_id, dimension, score, created_at)
- `daily_progress` (user_id, day_n, dimension, scenario_id, caught, time_sec, created_at)
- `submissions` (user_id, day_n, task_text, gemini_feedback, created_at)
- RLS: anon insert/select on own rows (MVP-simple).

## 12. Analytics (PostHog)
- **North Star:** verified-catch rate (competence, not consumption).
- **Activation:** first drill where they catch a flaw (the win).
- **Events:** `onboarding_step{n}`, `guest_skip`, `commit_set{priority, daily_min}`, `drill_answered{dimension, caught, time_sec}`, `coach_asked{dimension}`, `apply_to_work_used{task_type: critical|scratch}`, `roadmap_viewed`, `identity_captured`, `wtp_signal{answer}`, `returned{day_n}`.
- Instruments the untested assumption via `apply_to_work_used` + `task_type` and `wtp_signal`.

## 13. Content — the rubric (product's core logic)
The 7-dimension "Standard of Good" ([[Standard of Good - Finance Rubric v1]]): Output verified · Source integrity · Plausibility · Instruction fidelity · Assumptions surfaced · Reproducible · Ship-ready fit. Non-negotiables = 1–4.

## 14. MVP cut (YAGNI — what's explicitly OUT)
❌ Real payment processing (fake-door only) · ❌ infinite Gemini-generated scenarios (authored bank + Gemini critique) · ❌ full auth/login (anon + email) · ❌ streaks/points · ❌ deep content for every role (spreadsheets/data first) · ❌ native mobile / community / social · ❌ the "open canvas / your own file" upload for rungs 3–5 beyond the paste-critique (keep MVP to paste, not file parsing).

## 15. Testing
- **Unit:** assessment scoring + roadmap generation (pure functions).
- **`/api/critique` & `/api/coach`:** mocked-response tests + one live smoke test each.
- **E2E manual:** full funnel (welcome → guest → win → profile → roadmap → identity → paywall) before deploy; 3–5 internal testers, then 40–50.
- Verify PostHog events fire before launch.

## 16. Five-day timeline
| Day | Focus |
|---|---|
| 1 (21) | Spec approved · scaffold already done · finalize scenarios + rubric prompt |
| 2 (22) | Build funnel screens + onboarding + assessment; wire Supabase + PostHog |
| 3 (23) | Daily engine + `/api/critique` + `/api/coach` (Gemini); design polish; deploy to Vercel |
| 4 (24) | Internal test + fixes; launch to 40–50 |
| 5 (25) | Behaviour + feedback; ship one change |
| 6 (26) | Final PRD with real data; submit |

## 17. Carried risks (from the grill)
- Retention rides **daily work**, not the day-7 event → daily engine is the hook.
- Assessment must not discourage → handled by **routing (not grading) + win-before-score**.
- **Untested assumption:** do users actually want the fix on real work? → instrumented via `apply_to_work_used` + `wtp_signal`; the 40–50 users falsify it.

## 18. Open decisions (none blocking)
- Exact Gemini model id (confirm from the API reference at build time).
- Whether the daily "concept" screen is authored copy or Gemini-phrased (default: authored for reliability).
