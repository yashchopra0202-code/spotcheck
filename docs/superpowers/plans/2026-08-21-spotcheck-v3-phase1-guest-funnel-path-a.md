# SpotCheck V3 — Phase 1: Guest Funnel + Path A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the guest-first onboarding funnel plus the Path A "check my real work with Gemini" flow end-to-end, faithful to the V3 prototype, replacing the current single-page drill.

**Architecture:** A single client-rendered funnel driven by a `FunnelProvider` state machine (no per-screen routing — mirrors the prototype's `go(step)`). Funnel answers live in React state, persisted to `localStorage` and upserted to the Supabase `profiles` table under the existing anonymous user id. Path A posts the user's pasted AI output to the already-live `/api/critique` route and renders the real Gemini `Critique`. All screen visuals come from a design-token CSS system ported verbatim from the V3 prototype into `globals.css` (light theme built; dark/indigo tokens included but not wired — deferred).

**Tech Stack:** Next.js 16.3.1 (App Router, client components), React 19, TypeScript, Tailwind v4 (present, but screens use ported prototype CSS classes, not Tailwind utilities), Supabase JS, PostHog, Gemini (server-side, existing), Vitest (added here for pure-logic tests).

**Spec:** `docs/superpowers/specs/2026-08-21-spotcheck-design.md` — and the V3 prototype (artifact `4994ad67`, full HTML cached at `/Users/mishasonichopra/.claude/projects/-Users-mishasonichopra/310722f4-a24e-4060-baef-29b83eefebb6/tool-results/artifact-4994ad67-1787267380-f723.html`). The prototype is the visual/behavioural source of truth; the spec governs scope and data.

## Global Constraints

- **This is NOT the Next.js in your training data** (per `AGENTS.md`). Before writing any code, read the relevant guide in `node_modules/next/dist/docs/` (App Router, client components, route handlers) and heed deprecation notices. `AGENTS.md` re-adds its block on `next dev`; commit it with your work to keep the tree clean.
- **Gemini is server-side only.** Never import `src/lib/gemini.ts` from client code. Path A calls it via `POST /api/critique` (already live, verified).
- **Guest-first.** Nothing before the email screen may require login. `src/lib/analytics.ts:getUserId()` provides a stable anonymous id in `localStorage` (`spotcheck_uid`). Reuse it — do not invent a new id scheme.
- **No fabricated numbers** in copy (spec §5). Use the prototype's exact copy; do not invent time-saved or accuracy stats.
- **Never lead with a discouraging score** (spec §4). The capability-test result is framed as a starting line, never a grade.
- **Phase 1 scope only.** OUT of this phase: login/auth (screen 1), Path B (11–13), assignment (15–16), dashboard (18), subscription (19), contact (20), the Gemini coach chat overlay, and theme switching. Where a Phase-1 screen links to a deferred screen, degrade gracefully (hide the link or show "coming soon") — never link to a screen that doesn't exist.
- **Resilience (spec §10):** a Gemini timeout or error in Path A must fall back to an authored critique so the flow never blocks.
- **7 rubric dimensions** are fixed in `src/lib/rubric.ts` (`DIMENSIONS`, dims 1–4 `core:true`). Reuse that constant; do not redefine dimension names.
- **Currency:** copy uses ₹ (prototype default). Keep ₹ in Phase 1.
- **Commit after every task** with a `feat:`/`chore:`/`test:` message.

---

## File Structure

**Create:**
- `src/lib/funnel.ts` — funnel types, static data (roles, comfort rungs, focus areas, roadmaps, capability-test questions, concept cards, Path-A check options), and pure functions (`roadmap`, `roadmapDays`, `coachIntro`, `scoreAnswers`). No React, no I/O.
- `src/lib/funnel.test.ts` — Vitest unit tests for the pure functions.
- `src/lib/critiqueClient.ts` — client-side `runCheck()` that POSTs to `/api/critique`, with timeout + authored fallback. Re-exports the `Critique` type from `gemini.ts`.
- `src/components/FunnelProvider.tsx` — React context: funnel state, `set(partial)`, `go(step)`, current step; persistence to `localStorage` + Supabase profile upsert; analytics on step change.
- `src/components/screens/*.tsx` — one component per screen: `Welcome`, `Role`, `Comfort`, `Focus`, `Pace`, `Roadmap`, `Fork`, `PathAUpload`, `PathAFindings`, `PathAConcepts`, `Test`, `Email`, `Done`.
- `vitest.config.ts` — Vitest config (node environment).

**Modify:**
- `src/app/globals.css` — replace body/Tailwind base with the ported prototype design tokens + component classes.
- `src/app/layout.tsx` — set the `data-theme="light"` wrapper and viewport; keep it minimal.
- `src/app/page.tsx` — replace the drill with `<FunnelProvider>` wrapping a `<Funnel/>` that renders the current screen.
- `src/lib/supabase.ts` — add `saveProfile`, `saveCheck`, `saveSignal` + their row types (keep existing `saveAnswer`).
- `supabase-setup.sql` — add `tenure` and `pace` columns to `profiles`.
- `package.json` — add `vitest` devDep and a `test` script.

**Reuse unchanged:** `src/lib/gemini.ts`, `src/app/api/critique/route.ts`, `src/lib/rubric.ts` (`DIMENSIONS`, `FOCUS_AREAS`), `src/lib/analytics.ts` (`initAnalytics`, `track`, `getUserId`).

**Not used in Phase 1 (leave as-is):** `src/lib/scenarios.ts` (kept for the later daily engine), `saveAnswer`.

---

## Task 1: Design system + app shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx` (temporary placeholder so the app builds)

**Interfaces:**
- Produces: the CSS classes every screen uses (`.app`, `.pad`, `.brandlogo`, `.eyebrow`, `.title`, `.sub`, `.cta`, `.ghost`, `.note`, `.opt`/`.sel`/`.em`/`.ck`, `.seglabel`, `.tchips`/`.tchip`, `.coachsay`, `.plancard`/`.tagpop`, `.forkcard`, `.pathtag`/`.a`/`.b`, `.drop`, `.filechip`, `.selectlbl`, `.step`, `.finding`/`.warn`/`.ok`, `.concept`, `.field`, `.lossnote`, `.legal`, `.divider`, `.tcount`, `.testq`, `.scorebig`, `.pick`/`.correct`/`.wrong`, `.browse`, `.seg`/segmented toggle) and the theme variables on `[data-theme]`.

- [ ] **Step 1: Read the Next.js docs**

Read `node_modules/next/dist/docs/` guides for App Router, client components, and `metadata`/`viewport` exports. Confirm the `page.tsx`/`layout.tsx` patterns before editing.

- [ ] **Step 2: Rewrite `globals.css` with the ported design tokens**

Replace the file contents with the prototype's token system (light theme active; dark/indigo included for later) and the flowing single-column app layout (drop the device-frame/carousel — real screens render in normal flow):

```css
:root { color-scheme: light; }

/* Theme tokens — ported verbatim from V3 prototype. Applied via [data-theme] on .app. */
[data-theme="light"]{--surface:#FFFFFF;--wash:#F6F8FB;--sel:#F0FAF6;--text:#0F1729;--muted:#5B6473;--faint:#8A93A3;--line:#E7EAF0;--brand:#0E7C66;--good:#12B981;--watch:#F4A100;--coach:#3E63DD;--good-ink:#0A6B53;--watch-ink:#8A5A00;--coach-ink:#33478A;--code:#0C1526;--code-tx:#D7E0EE}
[data-theme="dark"]{--surface:#161C27;--wash:#0E131C;--sel:#12271F;--text:#E9EDF3;--muted:#9AA6B6;--faint:#68727F;--line:#28303C;--brand:#2FD1AC;--good:#2FD1AC;--watch:#F5B94D;--coach:#8AA0F5;--good-ink:#63E3C4;--watch-ink:#F3C579;--coach-ink:#AEBEFF;--code:#080C15;--code-tx:#CDD8EA}
[data-theme="indigo"]{--surface:#FFFFFF;--wash:#F5F6FD;--sel:#EEF0FE;--text:#12142B;--muted:#5A5F7A;--faint:#8A8FB0;--line:#E6E7F5;--brand:#4F46E5;--good:#12B981;--watch:#F4A100;--coach:#4F46E5;--good-ink:#0A6B53;--watch-ink:#8A5A00;--coach-ink:#4F46E5;--code:#141233;--code-tx:#DAD8F2}

*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:-apple-system,"SF Pro Text",system-ui,Segoe UI,sans-serif;-webkit-font-smoothing:antialiased}

/* App shell: centered mobile-width column, full-bleed on small screens */
.app{min-height:100vh;background:var(--wash);color:var(--text);display:flex;justify-content:center}
.appcol{width:100%;max-width:440px;min-height:100vh;background:var(--wash);position:relative;overflow-x:hidden}
.pad{padding:34px 22px 26px;display:flex;flex-direction:column;min-height:100vh}
.screen{animation:fade .3s ease}
@keyframes fade{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}

.brandlogo{display:flex;align-items:center;gap:9px}
.brandlogo .mk{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--brand),#0a5f4e);position:relative;box-shadow:0 5px 14px -5px var(--brand)}
.brandlogo .mk::after{content:"✓";position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-weight:800;font-size:16px}
.brandlogo .wm{font-size:19px;font-weight:800;letter-spacing:-.02em;color:var(--text)}
.brandlogo .wm span{color:var(--brand)}

.eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);font-weight:600}
h2.title{font-size:22px;line-height:1.18;letter-spacing:-.02em;margin:10px 0 6px;font-weight:700;color:var(--text)}
.sub{color:var(--muted);font-size:13.5px;line-height:1.5;margin:0}

.cta{margin-top:auto;width:100%;border:0;background:var(--brand);color:#fff;font-family:inherit;font-weight:600;font-size:16px;padding:15px;border-radius:15px;cursor:pointer;box-shadow:0 10px 24px -12px var(--brand);transition:.12s}
.cta:hover{filter:brightness(1.06)}.cta:active{transform:translateY(1px)}
.cta:disabled{background:var(--line);color:var(--faint);box-shadow:none;cursor:default}
.ghost{background:none;color:var(--muted);box-shadow:none;font-size:13.5px;padding:12px;margin-top:6px;border:0;cursor:pointer;font-family:inherit;width:100%}
.ghost:hover{color:var(--brand)}
.note{font-size:12px;color:var(--faint);margin:8px 0 0}

.opt{display:flex;align-items:center;gap:12px;padding:14px;border:1.5px solid var(--line);border-radius:14px;background:var(--surface);margin-bottom:8px;cursor:pointer;transition:.15s;color:var(--text)}
.opt:hover{border-color:var(--brand)}.opt.sel{border-color:var(--brand);background:var(--sel)}
.opt .em{width:32px;height:32px;border-radius:9px;background:var(--wash);display:grid;place-items:center;font-size:16px;flex:none}
.opt.sel .em{background:var(--brand);color:#fff}
.opt b{font-size:14px;font-weight:600;display:block}.opt span{font-size:12px;color:var(--muted)}
.opt .ck{margin-left:auto;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--line);flex:none}
.opt.sel .ck{background:var(--brand);border-color:var(--brand)}
.opt.sel .ck::after{content:"✓";color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;height:100%}

.seglabel{font-size:12px;color:var(--muted);margin:16px 0 6px;font-weight:600}
.tchips{display:flex;gap:7px}
.tchip{flex:1;text-align:center;padding:12px 0;border:1.5px solid var(--line);border-radius:12px;cursor:pointer;font-weight:700;font-size:14px;background:var(--surface);color:var(--text)}
.tchip.sel{border-color:var(--brand);background:var(--sel);color:var(--brand)}

.coachsay{display:flex;gap:10px;margin:6px 0 14px}
.coachsay .g{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4285F4,#9b72cb,#d96570);flex:none}
.coachsay .bub{background:var(--surface);border:1px solid var(--line);border-radius:4px 14px 14px 14px;padding:13px;font-size:13px;line-height:1.5;color:var(--text)}
.coachsay .bub b{color:var(--brand)}

.plancard{border:1.5px solid var(--line);border-radius:15px;padding:15px;margin-bottom:10px;cursor:pointer;transition:.15s;background:var(--surface);color:var(--text)}
.plancard:hover{border-color:var(--brand)}.plancard.sel{border-color:var(--brand);background:var(--sel)}
.plancard .h{display:flex;justify-content:space-between;align-items:center}
.plancard b{font-size:15px;font-weight:700}.plancard .meta{font-size:12.5px;color:var(--muted);margin:3px 0 0}
.tagpop{font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--brand);background:var(--sel);padding:3px 8px;border-radius:20px}

.forkcard{display:flex;gap:12px;align-items:flex-start;border:1.5px solid var(--line);border-radius:15px;padding:15px;margin-bottom:10px;cursor:pointer;transition:.15s;background:var(--surface);color:var(--text)}
.forkcard:hover{border-color:var(--brand)}
.forkcard b{font-size:15px;font-weight:700}.forkcard p{font-size:12.5px;color:var(--muted);margin:3px 0 0;line-height:1.4}
.forkcard .em{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:18px;flex:none;background:var(--wash)}
.forkcard.disabled{opacity:.55;cursor:default}.forkcard.disabled:hover{border-color:var(--line)}

.pathtag{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.08em;padding:3px 8px;border-radius:20px;margin-bottom:2px}
.pathtag.a{background:var(--sel);color:var(--brand)}.pathtag.b{background:rgba(62,99,221,.12);color:var(--coach-ink)}

.drop{border:2px dashed var(--line);border-radius:16px;padding:22px 16px;text-align:center;background:var(--surface);margin:8px 0 4px}
.drop .ic{font-size:26px}.drop b{display:block;font-size:14px;margin:8px 0 2px;color:var(--text)}.drop span{font-size:12px;color:var(--faint)}
.browse{display:inline-flex;align-items:center;gap:6px;margin-top:12px;border:1.5px solid var(--brand);background:var(--surface);color:var(--brand);font-weight:600;font-size:13px;padding:10px 16px;border-radius:11px;cursor:pointer;font-family:inherit}
.browse:hover{background:var(--sel)}
.filechip{display:flex;align-items:center;gap:10px;background:var(--sel);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin:10px 0 6px;font-size:13px;color:var(--text)}
.filechip .x{width:24px;height:24px;border-radius:7px;background:var(--brand);color:#fff;display:grid;place-items:center;font-size:11px;font-weight:800;flex:none}
.selectlbl{font-size:13px;font-weight:600;margin:14px 0 8px;color:var(--text)}

.step{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px}
.step .n{width:22px;height:22px;border-radius:50%;background:var(--sel);color:var(--brand);font-size:11px;font-weight:800;display:grid;place-items:center;flex:none}
.step b{font-weight:600;color:var(--text)}.step p{margin:2px 0 0;color:var(--muted);font-size:12px;line-height:1.4}
.finding{border-radius:13px;padding:14px;margin:6px 0 4px;font-size:13px;line-height:1.5}
.finding.warn{background:rgba(244,161,0,.15);color:var(--watch-ink)}
.finding.ok{background:rgba(18,185,129,.13);color:var(--good-ink)}
.concept{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:9px}
.concept .l{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--coach-ink);font-weight:700;margin-bottom:4px}
.concept b{font-size:14px;font-weight:600;color:var(--text)}.concept p{margin:5px 0 0;font-size:12.5px;color:var(--muted);line-height:1.5}

.field{width:100%;border:1.5px solid var(--line);border-radius:13px;padding:14px;font-size:15px;font-family:inherit;margin-bottom:10px;background:var(--surface);color:var(--text)}
.field:focus{outline:0;border-color:var(--brand)}
.lossnote{background:var(--wash);border-radius:13px;padding:13px;font-size:12.5px;color:var(--muted);line-height:1.45;margin-bottom:14px}.lossnote b{color:var(--text)}
.legal{font-size:11px;color:var(--faint);text-align:center;margin-top:12px;line-height:1.6}.legal a{color:var(--muted);text-decoration:underline;cursor:pointer}
.divider{display:flex;align-items:center;gap:10px;color:var(--faint);font-size:12px;margin:8px 0 12px}.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--line)}

.tcount{font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--faint)}
.testq{font-size:16.5px;font-weight:600;margin:10px 0 14px;color:var(--text);line-height:1.35}
.scorebig{text-align:center;margin:8px 0 12px}
.scorebig .v{font-size:54px;font-weight:800;color:var(--good);font-variant-numeric:tabular-nums}
.scorebig .v small{font-size:22px;color:var(--faint)}
.pick{display:block;width:100%;text-align:left;border:1.5px solid var(--line);background:var(--surface);border-radius:13px;padding:14px;font-size:13.5px;font-family:inherit;color:var(--text);margin-bottom:9px;cursor:pointer;transition:.15s;line-height:1.4}
.pick:hover{border-color:var(--brand);background:var(--sel)}
.pick.correct{border-color:var(--good);background:rgba(18,185,129,.14);font-weight:600}
.pick.wrong{border-color:var(--watch);background:rgba(244,161,0,.16)}
.pick:disabled{cursor:default}

/* small segmented control (ship-toggle on Path A) */
.seg{display:inline-flex;background:var(--wash);border:1px solid var(--line);border-radius:11px;padding:3px}
.seg button{border:0;background:none;color:var(--muted);font-family:inherit;font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:8px;cursor:pointer}
.seg button.on{background:var(--brand);color:#fff}

.centerblock{margin:auto 0;text-align:center}
.spinner{width:26px;height:26px;border:3px solid var(--line);border-top-color:var(--brand);border-radius:50%;animation:spin .8s linear infinite;margin:14px auto}
@keyframes spin{to{transform:rotate(360deg)}}
```

- [ ] **Step 3: Simplify `layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpotCheck — Trust what AI does with your numbers",
  description: "A guest-first Gemini coach that gets finance pros good at trusting and fixing their AI-assisted work.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Temporary `page.tsx` placeholder (proves the tokens render)**

```tsx
export default function Home() {
  return (
    <main className="app">
      <div className="appcol" data-theme="light">
        <div className="pad">
          <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
          <div className="centerblock">
            <h2 className="title" style={{ fontSize: 25 }}>Design tokens OK</h2>
            <p className="sub">Placeholder — replaced in Task 4.</p>
          </div>
          <button className="cta">Sample button</button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify the build compiles and tokens render**

Run: `cd /Users/mishasonichopra/spotcheck && npm run build`
Expected: build succeeds, no type errors.
Then run `npm run dev`, open http://localhost:3000, confirm: teal brand mark, teal CTA button, `--wash` background, centered 440px column.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: port V3 design tokens + app shell"
```

---

## Task 2: Funnel logic module + Vitest

**Files:**
- Create: `src/lib/funnel.ts`
- Create: `src/lib/funnel.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - Types: `Step`, `Role`, `Tenure`, `Comfort`, `Focus`, `Pace`, `FunnelState`, `Milestone`, `TestQuestion`.
  - Data: `ROLE_OPTIONS`, `COMFORT_OPTIONS`, `FOCUS_OPTIONS`, `CHECK_OPTIONS`, `CONCEPTS`, `TEST_QUESTIONS`.
  - Functions: `roadmap(pace: Pace): Milestone[]`, `roadmapDays(pace: Pace): number`, `coachIntro(s: Pick<FunnelState,"role"|"tenure"|"comfort">): string`, `scoreAnswers(correct: boolean[]): number`, `initialState(): FunnelState`.

- [ ] **Step 1: Add Vitest to `package.json`**

Add to `devDependencies`: `"vitest": "^3.2.4"`. Add to `scripts`: `"test": "vitest run"`. Then run `npm install`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Write the failing tests (`src/lib/funnel.test.ts`)**

```ts
import { describe, it, expect } from "vitest";
import { roadmap, roadmapDays, coachIntro, scoreAnswers, TEST_QUESTIONS } from "./funnel";

describe("roadmap", () => {
  it("steady has 4 milestones starting on source integrity for 15 days", () => {
    const r = roadmap("steady");
    expect(r).toHaveLength(4);
    expect(r[0].title).toBe("Source integrity");
    expect(roadmapDays("steady")).toBe(15);
  });
  it("aggressive is a 7-day plan ending on a boss milestone", () => {
    const r = roadmap("aggressive");
    expect(r).toHaveLength(4);
    expect(roadmapDays("aggressive")).toBe(7);
    expect(r[3].when.toLowerCase()).toContain("day 7");
  });
});

describe("coachIntro", () => {
  it("names the role and seeds source integrity", () => {
    const msg = coachIntro({ role: "FP&A / Financial Analyst", tenure: "3–5", comfort: "weekly" });
    expect(msg).toContain("FP&A");
    expect(msg.toLowerCase()).toContain("source integrity");
  });
  it("omits tenure gracefully when unset", () => {
    const msg = coachIntro({ role: null, tenure: null, comfort: null });
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe("capability test", () => {
  it("every question has exactly one correct option", () => {
    for (const q of TEST_QUESTIONS) {
      expect(q.opts.filter((o) => o.correct)).toHaveLength(1);
    }
  });
  it("scoreAnswers counts trues", () => {
    expect(scoreAnswers([true, false, true])).toBe(2);
    expect(scoreAnswers([])).toBe(0);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './funnel'` (or missing exports).

- [ ] **Step 5: Implement `src/lib/funnel.ts`**

```ts
// Pure funnel logic + static content. No React, no I/O — unit-tested.

export type Step =
  | "welcome" | "role" | "comfort" | "focus" | "pace" | "roadmap" | "fork"
  | "a_upload" | "a_findings" | "a_concepts" | "test" | "email" | "done";

export type Role =
  | "FP&A / Financial Analyst" | "Accountant / Controller"
  | "Finance Manager / Head" | "Founder handling finance";
export type Tenure = "0–2" | "3–5" | "6–10" | "10+";
export type Comfort = "none" | "few" | "weekly" | "daily" | "builder";
export type Focus = "Spreadsheet work" | "Data analysis" | "Projections & forecasting" | "Reconciliation & close";
export type Pace = "steady" | "aggressive";
export type TaskType = "critical" | "scratch";

export type FunnelState = {
  step: Step;
  role: Role | null;
  tenure: Tenure | null;
  comfort: Comfort | null;
  focus: Focus | null;
  pace: Pace;
  email: string;
};

export function initialState(): FunnelState {
  return { step: "welcome", role: null, tenure: null, comfort: null, focus: null, pace: "steady", email: "" };
}

export const ROLE_OPTIONS: { value: Role; emoji: string }[] = [
  { value: "FP&A / Financial Analyst", emoji: "📉" },
  { value: "Accountant / Controller", emoji: "📒" },
  { value: "Finance Manager / Head", emoji: "🏦" },
  { value: "Founder handling finance", emoji: "🚀" },
];

export const TENURE_OPTIONS: Tenure[] = ["0–2", "3–5", "6–10", "10+"];

export const COMFORT_OPTIONS: { value: Comfort; label: string }[] = [
  { value: "none", label: "Haven't really used them" },
  { value: "few", label: "Tried it a few times" },
  { value: "weekly", label: "Use it most weeks for drafting" },
  { value: "daily", label: "Use it daily, trust it with real work" },
  { value: "builder", label: "I build prompts others use" },
];

export const FOCUS_OPTIONS: { value: Focus; emoji: string; sub?: string }[] = [
  { value: "Spreadsheet work", emoji: "📊", sub: "Formulas, cleanup, models" },
  { value: "Data analysis", emoji: "📈", sub: "Variance, trends, drivers" },
  { value: "Projections & forecasting", emoji: "🔮" },
  { value: "Reconciliation & close", emoji: "🧾" },
];

// Path A — "What should your coach check?"
export const CHECK_OPTIONS: string[] = [
  "Did AI clean the data correctly?",
  "Is this formula right?",
  "Do these totals add up?",
];

export const CONCEPTS: { title: string; body: string }[] = [
  { title: 'A "duplicate" needs a key', body: "AI decides what makes two rows the same. Wrong column = deletes real data." },
  { title: "Row-count sanity check", body: "Any big count change after an AI clean is a flag to verify." },
  { title: "Source integrity = trust", body: "If cleaned data doesn't tie to the source, every number is suspect." },
];

export type Milestone = { when: string; title: string; note: string };

const ROADMAPS: Record<Pace, Milestone[]> = {
  steady: [
    { when: "Days 1–4 · now", title: "Source integrity", note: "Your fastest win" },
    { when: "Days 5–8", title: "Reproducibility", note: "Redo any number without AI" },
    { when: "Days 9–12", title: "Instruction fidelity", note: "Catch subtly-wrong answers" },
    { when: "Days 13–15 · boss", title: "Your own real work", note: "Full check with your coach" },
  ],
  aggressive: [
    { when: "Days 1–2 · now", title: "Source integrity", note: "Your fastest win" },
    { when: "Days 3–4", title: "Reproducibility", note: "Redo any number without AI" },
    { when: "Days 5–6", title: "Instruction fidelity", note: "Catch subtly-wrong answers" },
    { when: "Day 7 · boss", title: "Your own real work", note: "Full check with your coach" },
  ],
};

export function roadmap(pace: Pace): Milestone[] {
  return ROADMAPS[pace];
}
export function roadmapDays(pace: Pace): number {
  return pace === "aggressive" ? 7 : 15;
}

const COMFORT_PHRASE: Record<Comfort, string> = {
  none: ", just getting started with AI",
  few: ", still early with AI",
  weekly: ", using AI weekly",
  daily: ", using AI daily",
  builder: ", already building AI workflows",
};

const ROLE_SHORT: Record<Role, string> = {
  "FP&A / Financial Analyst": "FP&A",
  "Accountant / Controller": "an accountant",
  "Finance Manager / Head": "a finance lead",
  "Founder handling finance": "a founder on finance",
};

export function coachIntro(s: Pick<FunnelState, "role" | "tenure" | "comfort">): string {
  const rolePart = s.role ? ROLE_SHORT[s.role] : "a finance pro";
  const tenurePart = s.tenure ? `, ${s.tenure} yrs` : "";
  const comfortPart = s.comfort ? COMFORT_PHRASE[s.comfort] : "";
  return `You're ${rolePart}${tenurePart}${comfortPart} — so you need judgment, not basics. I'll start you on source integrity.`;
}

export type TestQuestion = { q: string; opts: { t: string; correct: boolean }[] };

export const TEST_QUESTIONS: TestQuestion[] = [
  { q: "AI says your 12-month revenue totals ₹14.2 Cr. Fastest way to trust it?", opts: [
    { t: "Cross-foot the 12 monthly figures", correct: true },
    { t: "Ask AI if it's sure", correct: false },
    { t: "Assume it's right — it ran", correct: false } ] },
  { q: 'AI wrote =SUMIF(A:A,"West",B:B). Biggest risk?', opts: [
    { t: "The criteria text must exactly match the data", correct: true },
    { t: "SUMIF is deprecated", correct: false },
    { t: "No risk", correct: false } ] },
  { q: "AI reports a 47% net margin; you know the business runs ~8%. You should…", opts: [
    { t: "Check the denominator & units — likely wrong", correct: true },
    { t: "Trust it, margins vary", correct: false },
    { t: "Round to 50%", correct: false } ] },
  { q: 'AI "cleaned" 1,200 rows down to 900. First check?', opts: [
    { t: "Row-count drop + the de-dupe key", correct: true },
    { t: "Cell colours", correct: false },
    { t: "The font", correct: false } ] },
  { q: "You need Q3 (Jul–Sep) but AI gave Oct–Dec. That's a failure of…", opts: [
    { t: "Instruction fidelity", correct: true },
    { t: "Plausibility", correct: false },
    { t: "Formatting", correct: false } ] },
  { q: "AI gives a number with no formula or steps. Before shipping…", opts: [
    { t: "Make sure you can reproduce it yourself", correct: true },
    { t: "Ship it — it's precise", correct: false },
    { t: "Change the font", correct: false } ] },
];

export function scoreAnswers(correct: boolean[]): number {
  return correct.filter(Boolean).length;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all describe blocks green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/funnel.ts src/lib/funnel.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: funnel logic module (roadmap, coach intro, capability test) + vitest"
```

---

## Task 3: Supabase persistence helpers + schema migration

**Files:**
- Modify: `src/lib/supabase.ts`
- Modify: `supabase-setup.sql`

**Interfaces:**
- Consumes: existing `supabase` client from `src/lib/supabase.ts`.
- Produces:
  - Types: `ProfileRow = { user_id: string; role?: string | null; tenure?: string | null; ai_comfort?: string | null; focus?: string | null; pace?: string | null; email?: string | null }`, `CheckRow = { user_id: string; task: string; paste: string; focus: string | null; trustworthy: boolean; missed_dims: string[]; result_json: unknown }`, `SignalRow = { user_id: string; type: string; value: string }`.
  - Functions: `saveProfile(row: ProfileRow): Promise<void>` (upsert on `user_id`), `saveCheck(row: CheckRow): Promise<void>`, `saveSignal(row: SignalRow): Promise<void>`. All no-op silently if `supabase` is null or on error (never break UX).

- [ ] **Step 1: Add `tenure` and `pace` columns to the schema**

Append to `supabase-setup.sql` (after the `profiles` table block) and note it must be re-run in the Supabase SQL editor:

```sql
-- V3 Phase 1: onboarding pace + tenure
alter table public.profiles add column if not exists tenure text;
alter table public.profiles add column if not exists pace   text;
```

- [ ] **Step 2: Add the helper functions to `src/lib/supabase.ts`**

Append below the existing `saveAnswer`:

```ts
export type ProfileRow = {
  user_id: string;
  role?: string | null;
  tenure?: string | null;
  ai_comfort?: string | null;
  focus?: string | null;
  pace?: string | null;
  email?: string | null;
};

export async function saveProfile(row: ProfileRow) {
  if (!supabase) return;
  try {
    await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
  } catch {
    // never let persistence break the funnel
  }
}

export type CheckRow = {
  user_id: string;
  task: string;
  paste: string;
  focus: string | null;
  trustworthy: boolean;
  missed_dims: string[];
  result_json: unknown;
};

export async function saveCheck(row: CheckRow) {
  if (!supabase) return;
  try {
    await supabase.from("checks").insert(row);
  } catch {
    // ignore
  }
}

export type SignalRow = { user_id: string; type: string; value: string };

export async function saveSignal(row: SignalRow) {
  if (!supabase) return;
  try {
    await supabase.from("signals").insert(row);
  } catch {
    // ignore
  }
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts supabase-setup.sql
git commit -m "feat: supabase profile/check/signal helpers + schema migration"
```

---

## Task 4: FunnelProvider + page wiring (screens stubbed)

**Files:**
- Create: `src/components/FunnelProvider.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `initialState`, `FunnelState`, `Step` from `funnel.ts`; `getUserId`, `initAnalytics`, `track` from `analytics.ts`; `saveProfile` from `supabase.ts`.
- Produces: `useFunnel(): { state: FunnelState; set: (p: Partial<FunnelState>) => void; go: (step: Step) => void; userId: string }` and a default-export `<FunnelProvider>`.

- [ ] **Step 1: Create `src/components/FunnelProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { FunnelState, Step, initialState } from "@/lib/funnel";
import { getUserId, initAnalytics, track } from "@/lib/analytics";
import { saveProfile } from "@/lib/supabase";

type Ctx = {
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  go: (step: Step) => void;
  userId: string;
};

const FunnelCtx = createContext<Ctx | null>(null);
const LS_KEY = "spotcheck_funnel";

export function useFunnel(): Ctx {
  const ctx = useContext(FunnelCtx);
  if (!ctx) throw new Error("useFunnel must be used inside FunnelProvider");
  return ctx;
}

export default function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FunnelState>(initialState);
  const [userId, setUserId] = useState("");
  const hydrated = useRef(false);

  // Hydrate from localStorage + set up analytics/anon id once.
  useEffect(() => {
    initAnalytics();
    setUserId(getUserId());
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
    hydrated.current = true;
    track("welcome_viewed");
  }, []);

  // Persist funnel state after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const set = (p: Partial<FunnelState>) => setState((s) => ({ ...s, ...p }));

  const go = (step: Step) => {
    setState((s) => ({ ...s, step }));
    track("funnel_step", { step });
    // Upsert the profile snapshot as the user advances (guest id).
    if (userId) {
      saveProfile({
        user_id: userId,
        role: state.role,
        tenure: state.tenure,
        ai_comfort: state.comfort,
        focus: state.focus,
        pace: state.pace,
        email: state.email || null,
      });
    }
  };

  return (
    <FunnelCtx.Provider value={{ state, set, go, userId }}>
      {children}
    </FunnelCtx.Provider>
  );
}
```

Note: `go()` reads `state` from the closure, so the snapshot reflects values set *before* this navigation. That is the desired behaviour — each screen calls `set(...)` for its own answers, then `go(next)`, so the answer is included.

- [ ] **Step 2: Wire `page.tsx` to render the current screen (stubs for now)**

```tsx
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
```

- [ ] **Step 3: Verify boot + persistence**

Run `npm run dev`, open http://localhost:3000. Expected: the shell renders with `welcome` as the current step. In the browser console you should see `[track] welcome_viewed` (PostHog not configured locally → console fallback). Reload — no crash.

- [ ] **Step 4: Commit**

```bash
git add src/components/FunnelProvider.tsx src/app/page.tsx
git commit -m "feat: FunnelProvider state machine + page wiring"
```

---

## Task 5: Onboarding screens — Welcome, Role, Comfort, Focus

**Files:**
- Create: `src/components/screens/Welcome.tsx`
- Create: `src/components/screens/Role.tsx`
- Create: `src/components/screens/Comfort.tsx`
- Create: `src/components/screens/Focus.tsx`
- Modify: `src/app/page.tsx` (render the real screens via a switch)

**Interfaces:**
- Consumes: `useFunnel()`; `ROLE_OPTIONS`, `TENURE_OPTIONS`, `COMFORT_OPTIONS`, `FOCUS_OPTIONS` from `funnel.ts`; `track` from `analytics.ts`.

- [ ] **Step 1: `Welcome.tsx`**

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { track } from "@/lib/analytics";

export default function Welcome() {
  const { go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
      <div style={{ margin: "auto 0" }}>
        <h2 className="title" style={{ fontSize: 25 }}>Trust what AI does with your numbers.</h2>
        <p className="sub">A 60-second setup. No sign-up to start.</p>
      </div>
      <button className="cta" onClick={() => go("role")}>Begin</button>
      <button className="ghost" onClick={() => { track("guest_skip"); go("fork"); }}>Explore as a guest →</button>
    </div>
  );
}
```
(The prototype's "Log in" link is omitted — login is Phase 2.)

- [ ] **Step 2: `Role.tsx`** (role single-select + tenure chips; Continue enabled only when a role is chosen)

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { ROLE_OPTIONS, TENURE_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Role() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">About you</div>
      <h2 className="title" style={{ fontSize: 20 }}>What&apos;s your role in finance?</h2>
      <div>
        {ROLE_OPTIONS.map((o) => (
          <div key={o.value} className={`opt${state.role === o.value ? " sel" : ""}`} onClick={() => set({ role: o.value })}>
            <div className="em">{o.emoji}</div>
            <div><b>{o.value}</b></div>
            <div className="ck" />
          </div>
        ))}
      </div>
      <div className="seglabel">Years in finance</div>
      <div className="tchips">
        {TENURE_OPTIONS.map((t) => (
          <div key={t} className={`tchip${state.tenure === t ? " sel" : ""}`} onClick={() => set({ tenure: t })}>{t}</div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!state.role} onClick={() => { track("onboarding_step", { step: "role" }); go("comfort"); }}>
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 3: `Comfort.tsx`**

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { COMFORT_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Comfort() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">No wrong answer</div>
      <h2 className="title" style={{ fontSize: 20 }}>How much have you used AI for work?</h2>
      <div>
        {COMFORT_OPTIONS.map((o) => (
          <div key={o.value} className={`opt${state.comfort === o.value ? " sel" : ""}`} onClick={() => set({ comfort: o.value })}>
            <div><b>{o.label}</b></div>
            <div className="ck" />
          </div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!state.comfort} onClick={() => { track("onboarding_step", { step: "comfort" }); go("focus"); }}>
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 4: `Focus.tsx`** (single-select — spec §5)

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { FOCUS_OPTIONS } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Focus() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">Your focus</div>
      <h2 className="title">What do you want to trust yourself with first?</h2>
      <p className="sub" style={{ marginBottom: 14 }}>Pick one to start.</p>
      <div>
        {FOCUS_OPTIONS.map((o) => (
          <div key={o.value} className={`opt${state.focus === o.value ? " sel" : ""}`} onClick={() => set({ focus: o.value })}>
            <div className="em">{o.emoji}</div>
            <div><b>{o.value}</b>{o.sub ? <span>{o.sub}</span> : null}</div>
            <div className="ck" />
          </div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!state.focus} onClick={() => { track("onboarding_step", { step: "focus" }); go("pace"); }}>
        Continue
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Replace the `page.tsx` switch to render real + stub screens**

```tsx
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
```

- [ ] **Step 6: Verify the onboarding path**

Run `npm run dev`. Click Begin → choose a role (Continue enables) → pick tenure → Continue → pick a comfort rung → Continue → pick a focus → Continue lands on the `pace` stub. Reload mid-funnel: state persists (you stay past welcome). Console shows `onboarding_step` events.

- [ ] **Step 7: Commit**

```bash
git add src/components/screens/Welcome.tsx src/components/screens/Role.tsx src/components/screens/Comfort.tsx src/components/screens/Focus.tsx src/app/page.tsx
git commit -m "feat: onboarding screens (welcome, role, comfort, focus)"
```

---

## Task 6: Pace, Roadmap, Fork

**Files:**
- Create: `src/components/screens/Pace.tsx`
- Create: `src/components/screens/Roadmap.tsx`
- Create: `src/components/screens/Fork.tsx`
- Modify: `src/app/page.tsx` (add the three cases)

**Interfaces:**
- Consumes: `useFunnel()`; `coachIntro`, `roadmap`, `roadmapDays` from `funnel.ts`; `track` from `analytics.ts`.

- [ ] **Step 1: `Pace.tsx`** (coach bubble from `coachIntro(state)`, Steady/Aggressive select)

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { coachIntro } from "@/lib/funnel";

export default function Pace() {
  const { state, set, go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">Your plan</div>
      <div className="coachsay"><div className="g" /><div className="bub">{coachIntro(state)}</div></div>
      <p className="sub" style={{ marginBottom: 10, fontWeight: 600, color: "var(--text)" }}>Pick your pace:</p>
      <div className={`plancard${state.pace === "steady" ? " sel" : ""}`} onClick={() => set({ pace: "steady" })}>
        <div className="h"><b>Steady</b><span className="tagpop">RECOMMENDED</span></div>
        <div className="meta">15 days · 10 min/day</div>
      </div>
      <div className={`plancard${state.pace === "aggressive" ? " sel" : ""}`} onClick={() => set({ pace: "aggressive" })}>
        <div className="h"><b>Aggressive</b><span className="tagpop">FASTEST</span></div>
        <div className="meta">7 days · 25 min/day</div>
      </div>
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("roadmap")}>This is my plan →</button>
    </div>
  );
}
```

- [ ] **Step 2: `Roadmap.tsx`** (renders milestones for the chosen pace; fires `commit_set` + `roadmap_viewed`)

```tsx
"use client";
import { useEffect } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { roadmap, roadmapDays } from "@/lib/funnel";
import { track } from "@/lib/analytics";

export default function Roadmap() {
  const { state, go } = useFunnel();
  const milestones = roadmap(state.pace);
  useEffect(() => {
    track("commit_set", { focus: state.focus, pace: state.pace });
    track("roadmap_viewed", { days: roadmapDays(state.pace) });
  }, [state.pace, state.focus]);
  return (
    <div className="pad screen">
      <div className="eyebrow">Your roadmap · {roadmapDays(state.pace)} days</div>
      <h2 className="title" style={{ fontSize: 20 }}>Start your AI journey</h2>
      <div>
        {milestones.map((m, i) => (
          <div key={m.title} className={`plancard${i === 0 ? " sel" : ""}`}>
            <b>{m.when}</b>
            <div className="meta">{m.title} — {m.note}</div>
          </div>
        ))}
      </div>
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("fork")}>Begin →</button>
    </div>
  );
}
```

- [ ] **Step 3: `Fork.tsx`** (Path A active; Path B disabled "coming soon" — Phase 1 constraint)

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";

export default function Fork() {
  const { go } = useFunnel();
  return (
    <div className="pad screen">
      <div className="eyebrow">How do you want to start?</div>
      <h2 className="title" style={{ fontSize: 21 }}>Pick your first move</h2>
      <p className="sub" style={{ marginBottom: 14 }}>Both lead to the same capability test.</p>
      <div className="forkcard" onClick={() => go("a_upload")}>
        <div className="em">🧩</div>
        <div><b>Solve a real problem I&apos;m facing now</b><p>Upload a task from your actual work and get unstuck today.</p></div>
      </div>
      <div className="forkcard disabled">
        <div className="em">🗺️</div>
        <div><b>Build me a customized plan</b><p>Gemini tailors a plan from your answers. <b>Coming soon.</b></p></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add cases to `page.tsx`**

Add imports and `case "pace": return <Pace />;`, `case "roadmap": return <Roadmap />;`, `case "fork": return <Fork />;` to the switch.

- [ ] **Step 5: Verify**

Run `npm run dev`. From focus → pace: the coach bubble names your role and "source integrity". Toggle Steady/Aggressive → roadmap header shows 15 vs 7 days and the milestone `when` labels change accordingly. Fork: Path A card is clickable → lands on `a_upload` stub; Path B card is visibly dimmed and does nothing. Console shows `commit_set` + `roadmap_viewed`.

- [ ] **Step 6: Commit**

```bash
git add src/components/screens/Pace.tsx src/components/screens/Roadmap.tsx src/components/screens/Fork.tsx src/app/page.tsx
git commit -m "feat: pace, dynamic roadmap, and path fork screens"
```

---

## Task 7: Path A — Upload/paste + critique client

**Files:**
- Create: `src/lib/critiqueClient.ts`
- Create: `src/components/screens/PathAUpload.tsx`
- Modify: `src/app/page.tsx` (add `a_upload` case)

**Interfaces:**
- Consumes: `Critique` type from `src/lib/gemini.ts`; `CHECK_OPTIONS` from `funnel.ts`; `useFunnel()`; `track` from `analytics.ts`.
- Produces:
  - `runCheck(input: { task: string; output: string; focus?: string }): Promise<Critique>` — POSTs to `/api/critique`, 26s client timeout, returns authored `FALLBACK_CRITIQUE` on any error.
  - `FALLBACK_CRITIQUE: Critique`.
  - A React context value on the window? No — the `Critique` result is passed via funnel by storing it on a module-level ref is fragile; instead **store the last critique + inputs in FunnelProvider state**. To avoid widening `FunnelState` types with a heavy object, keep a separate lightweight state: see Step 2.

- [ ] **Step 1: Create `src/lib/critiqueClient.ts`**

```ts
import type { Critique } from "@/lib/gemini";
export type { Critique } from "@/lib/gemini";

export const FALLBACK_CRITIQUE: Critique = {
  summary: "I couldn't reach your coach just now — here's the manual check to run before you trust this.",
  trustworthy: false,
  dimensions: [
    { name: "Source integrity", pass: false, note: "Compare row counts before/after and check the de-dupe key against the source." },
    { name: "Output verified", pass: false, note: "Cross-foot the total or tie one figure to a control you already know." },
    { name: "Reproducible", pass: false, note: "Make sure you can redo this number without the AI." },
  ],
  one_fix: "Re-run the key number yourself once before you ship it.",
};

export async function runCheck(input: { task: string; output: string; focus?: string }): Promise<Critique> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 26000);
  try {
    const res = await fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_CRITIQUE;
    const data = await res.json();
    if (!data || typeof data.trustworthy !== "boolean" || !Array.isArray(data.dimensions)) return FALLBACK_CRITIQUE;
    return data as Critique;
  } catch {
    return FALLBACK_CRITIQUE;
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 2: Extend `FunnelProvider` to hold the Path-A result**

In `FunnelProvider.tsx`, add a second piece of state (not persisted — it's ephemeral) exposed through the context:

```tsx
// add import:
import type { Critique } from "@/lib/gemini";

// inside the component, after useState<FunnelState>:
const [check, setCheck] = useState<{ task: string; paste: string; taskType: "critical" | "scratch"; result: Critique } | null>(null);
```

Extend the `Ctx` type and the provider value:

```tsx
type Ctx = {
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  go: (step: Step) => void;
  userId: string;
  check: { task: string; paste: string; taskType: "critical" | "scratch"; result: Critique } | null;
  setCheck: (c: Ctx["check"]) => void;
};
```
(Provide `check` and `setCheck` in the `<FunnelCtx.Provider value={...}>`.)

- [ ] **Step 3: Create `PathAUpload.tsx`** (paste primary; optional .csv/.txt read; ship-toggle for `task_type`; check-option select)

```tsx
"use client";
import { useRef, useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { CHECK_OPTIONS } from "@/lib/funnel";
import { runCheck } from "@/lib/critiqueClient";
import { track } from "@/lib/analytics";
import { saveCheck } from "@/lib/supabase";

export default function PathAUpload() {
  const { state, go, userId, setCheck } = useFunnel();
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState("");
  const [checkOpt, setCheckOpt] = useState(CHECK_OPTIONS[0]);
  const [taskType, setTaskType] = useState<"critical" | "scratch">("critical");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(`${f.name}`);
    if (/\.(csv|txt)$/i.test(f.name)) {
      f.text().then((t) => setPaste(t.slice(0, 8000))); // xlsx not parsed in MVP (spec §14)
    }
  }

  async function run() {
    if (!paste.trim() || busy) return;
    setBusy(true);
    track("apply_to_work_used", { task_type: taskType });
    const result = await runCheck({ task: `The user asked AI to: ${checkOpt}`, output: paste, focus: state.focus ?? undefined });
    setCheck({ task: checkOpt, paste, taskType, result });
    saveCheck({
      user_id: userId,
      task: checkOpt,
      paste,
      focus: state.focus,
      trustworthy: result.trustworthy,
      missed_dims: result.dimensions.filter((d) => !d.pass).map((d) => d.name),
      result_json: result,
    });
    track("check_completed", { trustworthy: result.trustworthy });
    setBusy(false);
    go("a_findings");
  }

  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · REAL PROBLEM</span>
      <h2 className="title" style={{ fontSize: 20 }}>Bring the work you want checked</h2>
      <div className="drop">
        <div className="ic">📎</div>
        <b>Paste your AI output below, or</b>
        <span>.csv / .txt (xlsx: paste the values)</span><br />
        <button className="browse" type="button" onClick={() => fileInput.current?.click()}>📁 Browse files</button>
        <input ref={fileInput} type="file" accept=".csv,.txt" hidden onChange={onFile} />
      </div>
      {fileName ? <div className="filechip"><span className="x">✓</span> {fileName}</div> : null}
      <textarea className="field" style={{ minHeight: 120, resize: "vertical" }} placeholder="Paste the AI's answer, formula, or cleaned data here…" value={paste} onChange={(e) => setPaste(e.target.value)} />
      <div className="selectlbl">What should your coach check?</div>
      <div>
        {CHECK_OPTIONS.map((o) => (
          <div key={o} className={`opt${checkOpt === o ? " sel" : ""}`} onClick={() => setCheckOpt(o)}>
            <div><b>{o}</b></div><div className="ck" />
          </div>
        ))}
      </div>
      <div className="selectlbl">Is this going to ship?</div>
      <div className="seg" role="group">
        <button type="button" className={taskType === "critical" ? "on" : ""} onClick={() => setTaskType("critical")}>Yes, it ships</button>
        <button type="button" className={taskType === "scratch" ? "on" : ""} onClick={() => setTaskType("scratch")}>Just testing</button>
      </div>
      <button className="cta" style={{ marginTop: 20 }} disabled={!paste.trim() || busy} onClick={run}>
        {busy ? "Checking with Gemini…" : "Run the check with Gemini ✦"}
      </button>
      <p className="note" style={{ textAlign: "center" }}>🔒 Your paste is used only to run this check.</p>
    </div>
  );
}
```

- [ ] **Step 4: Add the `a_upload` case to `page.tsx`.**

- [ ] **Step 5: Verify (live smoke)**

Ensure `GEMINI_API_KEY` is set in `.env.local`. Run `npm run dev`, reach Path A, paste e.g. `Done — 1,050 unique rows (removed 150 duplicates).`, keep "Did AI clean the data correctly?", click Run. Expected: button shows "Checking with Gemini…", then it advances to the `a_findings` stub within ~a few seconds. Console shows `apply_to_work_used` and `check_completed`. If the key is missing/network fails, it still advances (fallback) — confirm by temporarily renaming the key.

- [ ] **Step 6: Commit**

```bash
git add src/lib/critiqueClient.ts src/components/screens/PathAUpload.tsx src/components/FunnelProvider.tsx src/app/page.tsx
git commit -m "feat: Path A upload/paste + live Gemini critique client with fallback"
```

---

## Task 8: Path A — Findings + Concepts

**Files:**
- Create: `src/components/screens/PathAFindings.tsx`
- Create: `src/components/screens/PathAConcepts.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useFunnel()` (`check`, `go`); `CONCEPTS` from `funnel.ts`.

- [ ] **Step 1: `PathAFindings.tsx`** (renders the real `Critique`: summary bubble, per-dimension steps, warn/ok findings)

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";

export default function PathAFindings() {
  const { check, go } = useFunnel();
  if (!check) {
    // Guard: reached without a result (e.g. reload). Send back to upload.
    return (
      <div className="pad screen">
        <p className="sub">No check to show.</p>
        <button className="cta" onClick={() => go("a_upload")}>Run a check →</button>
      </div>
    );
  }
  const { result } = check;
  const failedCore = result.dimensions.filter((d) => !d.pass);
  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A</span>
      <div className="coachsay"><div className="g" /><div className="bub">{result.summary}</div></div>
      <div>
        {result.dimensions.map((d, i) => (
          <div key={d.name} className="step">
            <span className="n">{i + 1}</span>
            <div><b>{d.name}{d.pass ? " ✓" : " ⚠"}</b><p>{d.note}</p></div>
          </div>
        ))}
      </div>
      {!result.trustworthy ? (
        <div className="finding warn"><b>⚠️ Don&apos;t ship yet:</b> {failedCore.length} check{failedCore.length === 1 ? "" : "s"} failed.</div>
      ) : (
        <div className="finding ok">✓ Looks trustworthy — the core checks pass.</div>
      )}
      <div className="finding ok">✓ Fix: {result.one_fix}</div>
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("a_concepts")}>Why did this happen? →</button>
    </div>
  );
}
```

- [ ] **Step 2: `PathAConcepts.tsx`**

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";
import { CONCEPTS } from "@/lib/funnel";

export default function PathAConcepts() {
  const { go } = useFunnel();
  return (
    <div className="pad screen">
      <span className="pathtag a">PATH A · LEARN</span>
      <h2 className="title" style={{ fontSize: 20 }}>What just happened, explained</h2>
      {CONCEPTS.map((c, i) => (
        <div key={c.title} className="concept">
          <div className="l">Concept {i + 1}</div>
          <b>{c.title}</b>
          <p>{c.body}</p>
        </div>
      ))}
      <button className="cta" style={{ marginTop: 20 }} onClick={() => go("test")}>Test what I learned →</button>
    </div>
  );
}
```

- [ ] **Step 3: Add `a_findings` and `a_concepts` cases to `page.tsx`.**

- [ ] **Step 4: Verify**

Run a real check (Task 7 flow). Findings screen shows Gemini's summary in the coach bubble, all 7 dimensions with pass/fail marks and notes, a warn/ok banner matching `trustworthy`, and the one-fix. "Why did this happen?" → 3 concept cards → "Test what I learned" → `test` stub.

- [ ] **Step 5: Commit**

```bash
git add src/components/screens/PathAFindings.tsx src/components/screens/PathAConcepts.tsx src/app/page.tsx
git commit -m "feat: Path A findings (real critique) + concepts screens"
```

---

## Task 9: Capability Test

**Files:**
- Create: `src/components/screens/Test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useFunnel()`; `TEST_QUESTIONS`, `scoreAnswers` from `funnel.ts`; `track` from `analytics.ts`.

Behaviour (faithful to prototype): show one question at a time. After Q3, offer "Try 3 more" or "Finish & see result". Finishing shows `score/answered` framed as a starting line (never a grade), then Continue → `email`.

- [ ] **Step 1: `Test.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { TEST_QUESTIONS, scoreAnswers } from "@/lib/funnel";
import { track } from "@/lib/analytics";

type Phase = "asking" | "decide" | "done";

export default function Test() {
  const { go } = useFunnel();
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("asking");

  const q = TEST_QUESTIONS[idx];
  const answered = results.length;
  const score = scoreAnswers(results);

  function pick(optIdx: number) {
    if (picked !== null) return;
    const correct = q.opts[optIdx].correct;
    setPicked(optIdx);
    setResults((r) => [...r, correct]);
    track("test_answered", { idx, correct });
  }

  function next() {
    setPicked(null);
    const nextIdx = idx + 1;
    if (nextIdx === 3) { setPhase("decide"); return; }
    if (nextIdx >= TEST_QUESTIONS.length) { finish(); return; }
    setIdx(nextIdx);
  }

  function contMore() { setPhase("asking"); setIdx(3); }

  function finish() {
    setPhase("done");
    track("test_completed", { score, answered });
  }

  if (phase === "done") {
    return (
      <div className="pad screen">
        <div className="eyebrow">Test your AI capability</div>
        <div className="scorebig"><div className="v">{score}<small>/{answered}</small></div></div>
        <p className="sub" style={{ textAlign: "center" }}>A sharp starting line — this is where your judgment begins, with room to climb.</p>
        <button className="cta" style={{ marginTop: 20 }} onClick={() => go("email")}>Continue →</button>
      </div>
    );
  }

  if (phase === "decide") {
    return (
      <div className="pad screen">
        <div className="eyebrow">Test your AI capability</div>
        <div className="scorebig"><div className="v">{score}<small>/3</small></div></div>
        <p className="sub" style={{ textAlign: "center" }}>Through the core check. Sharpen your score with a few more?</p>
        <button className="cta" style={{ marginTop: 20 }} onClick={contMore}>Try 3 more</button>
        <button className="ghost" onClick={finish}>Finish &amp; see result</button>
      </div>
    );
  }

  return (
    <div className="pad screen">
      <div className="eyebrow">Test your AI capability</div>
      <h2 className="title" style={{ fontSize: 20 }}>How sharp is your AI judgment?</h2>
      <div className="tcount">QUESTION {idx + 1}{idx < 3 ? " OF 3" : ""}</div>
      <div className="testq">{q.q}</div>
      <div>
        {q.opts.map((o, i) => {
          let cls = "pick";
          if (picked !== null) {
            if (o.correct) cls += " correct";
            else if (i === picked) cls += " wrong";
          }
          return <button key={i} className={cls} disabled={picked !== null} onClick={() => pick(i)}>{o.t}</button>;
        })}
      </div>
      {picked !== null ? <button className="cta" style={{ marginTop: 14 }} onClick={next}>Next →</button> : null}
    </div>
  );
}
```

- [ ] **Step 2: Add the `test` case to `page.tsx`.**

- [ ] **Step 3: Verify**

Answer Q1–Q3: wrong picks highlight the correct option in green, chosen wrong in amber, others locked. After Q3 the decide screen shows `n/3`. "Try 3 more" continues to Q4–Q6 then the result; "Finish" jumps straight to the result. Result copy frames a starting line (no "grade"/"fail"). Continue → `email` stub. Console shows `test_answered` × N and one `test_completed`.

- [ ] **Step 4: Commit**

```bash
git add src/components/screens/Test.tsx src/app/page.tsx
git commit -m "feat: capability test (3 + optional 3, starting-line framing)"
```

---

## Task 10: Email capture + Done, full E2E, events

**Files:**
- Create: `src/components/screens/Email.tsx`
- Create: `src/components/screens/Done.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useFunnel()` (`state`, `set`, `go`, `userId`); `saveProfile` from `supabase.ts`; `track` from `analytics.ts`.

- [ ] **Step 1: `Email.tsx`** (endowment copy; save email → `identity_captured` → `done`)

```tsx
"use client";
import { useState } from "react";
import { useFunnel } from "@/components/FunnelProvider";
import { saveProfile } from "@/lib/supabase";
import { track } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Email() {
  const { state, set, go, userId } = useFunnel();
  const [email, setEmail] = useState(state.email);
  const valid = EMAIL_RE.test(email);

  function submit() {
    if (!valid) return;
    set({ email });
    saveProfile({
      user_id: userId, role: state.role, tenure: state.tenure,
      ai_comfort: state.comfort, focus: state.focus, pace: state.pace, email,
    });
    track("identity_captured");
    go("done");
  }

  return (
    <div className="pad screen">
      <div className="brandlogo" style={{ marginBottom: 6 }}><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
      <h2 className="title" style={{ fontSize: 20 }}>Save your progress</h2>
      <div className="lossnote">You built a plan, ran a real check, and passed the capability test. Add your email to <b>save it and get your score</b>.</div>
      <input className="field" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="cta" style={{ marginTop: "auto" }} disabled={!valid} onClick={submit}>Create my account</button>
      <p className="legal">By continuing you agree to our <a>Terms &amp; Conditions</a> and <a>Privacy Policy</a>.</p>
    </div>
  );
}
```

- [ ] **Step 2: `Done.tsx`** (Phase-1 terminus — dashboard is Phase 2)

```tsx
"use client";
import { useFunnel } from "@/components/FunnelProvider";

export default function Done() {
  const { state } = useFunnel();
  return (
    <div className="pad screen">
      <div className="brandlogo"><span className="mk" /><span className="wm">Spot<span>Check</span></span></div>
      <div className="centerblock">
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h2 className="title" style={{ fontSize: 22 }}>You&apos;re all set{state.email ? "" : ""}.</h2>
        <p className="sub">Progress saved. Your {state.pace === "aggressive" ? "7" : "15"}-day plan on {state.focus ?? "your focus"} starts here — your daily coach lands next.</p>
      </div>
      <button className="cta" disabled>Your dashboard is coming soon</button>
    </div>
  );
}
```

- [ ] **Step 3: Add `email` and `done` cases to `page.tsx`. Remove the default stub** (all Phase-1 steps are now implemented; keep a minimal fallback returning `<Welcome/>` for safety).

- [ ] **Step 4: Full E2E walkthrough**

Run `npm run dev`. Clear localStorage (`localStorage.clear()` in console) and reload. Walk the whole funnel twice:
1. **Begin path:** Welcome→Begin → Role(+tenure) → Comfort → Focus → Pace (coach bubble correct) → Roadmap (days match pace) → Fork → Path A: paste a flawed output, pick a check, set ship-toggle, Run → Findings (real Gemini result) → Concepts → Test (do 3, then "Try 3 more", finish) → Email (invalid disables button; valid enables) → Create account → Done.
2. **Guest path:** Welcome→"Explore as a guest" → lands on Fork (fires `guest_skip`) → Path A → … → Done.

Confirm no console errors. Confirm the events fire in order: `welcome_viewed`, `funnel_step`/`onboarding_step`, `commit_set`, `roadmap_viewed`, `apply_to_work_used`, `check_completed`, `test_answered`×N, `test_completed`, `identity_captured`.

- [ ] **Step 5: Full build + tests + lint**

Run:
```bash
cd /Users/mishasonichopra/spotcheck && npm run build && npm test && npm run lint
```
Expected: build succeeds, tests pass, lint clean (fix any lint errors before committing).

- [ ] **Step 6: Commit**

```bash
git add src/components/screens/Email.tsx src/components/screens/Done.tsx src/app/page.tsx
git commit -m "feat: email capture + phase-1 terminus; complete guest funnel + Path A"
```

---

## Self-Review

**Spec coverage (§ → task):**
- §4 funnel / commitment escalation → Tasks 5–10 (welcome → onboarding → win → roadmap → identity). ✓
- §5 onboarding (role, comfort behavioural rungs, focus single-select, pace) → Tasks 5–6. ✓ (Payoff-preview "no fabricated stat" honoured: roadmap uses only day counts.)
- §6 assessment non-discouraging → Task 9 (starting-line framing; win-before-score via Path A check preceding the test). ✓
- §7 daily engine → **deferred** (Phase 2). Path A "bring your own work" (§7 weekly boss) is delivered early as the USP. ✓ (noted)
- §8 roadmap deterministic + warmly phrased → Task 6 (`roadmap()` deterministic; `coachIntro` warm). ✓
- §9 identity after wins → Task 10 email screen. Monetization/WTP → **deferred** (subscription screen 19, Phase 2). ✓ (noted)
- §10 tech: Gemini server-only via `/api/critique`, anon id, resilience fallback → Tasks 7–8. ✓
- §11 data model → Task 3 (`profiles` upsert, `checks` insert; `assessments`/`daily_progress`/`submissions` are Phase 2). ✓ (noted)
- §12 analytics → Tasks 5–10 wire `onboarding_step`, `guest_skip`, `commit_set`, `roadmap_viewed`, `apply_to_work_used{task_type}`, `identity_captured` (+ `check_completed`, `test_*`). `returned{day_n}`/`coach_asked` are Phase 2. ✓ (noted)
- §13 rubric → reused from `rubric.ts`/`gemini.ts`; findings render all 7 dimensions. ✓
- §14 MVP cut → honoured: no payment, no infinite generation, anon+email only, no streaks, paste-not-file-parse (xlsx paste-only). ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" — every screen has full JSX; logic has full code and tests. ✓

**Type consistency:** `Critique` sourced once from `gemini.ts`, re-exported by `critiqueClient.ts`, threaded through `FunnelProvider.check`. `Step` union in `funnel.ts` matches every `go(...)` call and every `page.tsx` switch case (`welcome`,`role`,`comfort`,`focus`,`pace`,`roadmap`,`fork`,`a_upload`,`a_findings`,`a_concepts`,`test`,`email`,`done`). `saveProfile`/`saveCheck`/`saveSignal` signatures match their call sites. ✓

**Deferred-screen links:** Fork Path B is disabled ("coming soon"); Welcome omits the login link; Done shows a disabled "dashboard coming soon" — no link targets a non-existent screen. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-21-spotcheck-v3-phase1-guest-funnel-path-a.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.
