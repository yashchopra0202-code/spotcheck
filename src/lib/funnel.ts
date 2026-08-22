// Pure funnel logic + static content. No React, no I/O — unit-tested.

export type Step =
  | "welcome" | "role" | "comfort" | "focus" | "pace" | "roadmap" | "fork"
  | "a_upload" | "a_findings" | "a_concepts" | "test" | "email" | "done";

export type Role =
  | "FP&A / Financial Analyst" | "Accountant / Controller"
  | "Finance Manager / Head" | "Founder handling finance";
export type Tenure = "0–2" | "3–5" | "6–10" | "10+";
export type Comfort = "none" | "few" | "weekly" | "daily" | "builder";
export type Focus = "Spreadsheet work" | "Formula correction" | "Data analysis" | "Projections & forecasting" | "Reconciliation & close";
export type Pace = "steady" | "aggressive";
export type TaskType = "critical" | "scratch";

export type FunnelState = {
  step: Step;
  role: Role | null;
  tenure: Tenure | null;
  comfort: Comfort | null;
  focus: Focus | null;
  focusOther: string | null; // free-text when the user picks "Other"
  pace: Pace;
  email: string;
};

export function initialState(): FunnelState {
  return { step: "welcome", role: null, tenure: null, comfort: null, focus: null, focusOther: null, pace: "steady", email: "" };
}

// The focus to show/use downstream: a chosen area, else the "Other" free text.
export function effectiveFocus(s: Pick<FunnelState, "focus" | "focusOther">): string | null {
  return s.focus ?? (s.focusOther && s.focusOther.trim() ? s.focusOther.trim() : null);
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

// MVP-active options let the user paste/upload real work for a live Gemini check.
// `pro` options are shown as a fake-door (grayed, "PRO") to measure willingness-to-pay.
export const FOCUS_OPTIONS: { value: Focus; emoji: string; sub?: string; pro?: boolean }[] = [
  { value: "Spreadsheet work", emoji: "📊", sub: "Formulas, cleanup, models — paste or upload" },
  { value: "Formula correction", emoji: "🧮", sub: "Check & fix an AI-written formula" },
  { value: "Data analysis", emoji: "📈", sub: "Variance, trends, drivers", pro: true },
  { value: "Reconciliation & close", emoji: "🧾", pro: true },
  { value: "Projections & forecasting", emoji: "🔮", pro: true },
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
