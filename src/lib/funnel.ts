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
  "Duplicate rows",
  "Missing data",
  "Currency and units",
  "Formula mistakes",
  "Totals that don't add up",
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
  { q: "AI reports \"Gross margin 62%\" from ₹10.0 Cr revenue and ₹6.2 Cr COGS. What's wrong?", opts: [
    { t: "AI used COGS ÷ revenue; gross margin is (revenue − COGS) ÷ revenue = 38%", correct: true },
    { t: "Nothing — 62% is high but possible", correct: false },
    { t: "Revenue and COGS are swapped", correct: false } ] },
  { q: "AI: \"New product revenue grew +8,900% (₹2 L → ₹1.8 Cr).\" Before this goes in the board deck…", opts: [
    { t: "Flag the near-zero launch base — the % is right but misleading; lead with absolute values", correct: true },
    { t: "Recheck the maths — growth can't exceed 100%", correct: false },
    { t: "Nothing — it's a real, impressive number", correct: false } ] },
  { q: "AI \"reconciled\" month-end cash to the P&L and flagged a ₹30 L gap as an error. Before you escalate?", opts: [
    { t: "Timing / accruals — cash and accrual bases differ by design; the gap may be expected", correct: true },
    { t: "The bank statement is wrong", correct: false },
    { t: "Someone mis-posted ₹30 L — start an audit", correct: false } ] },
  { q: "You asked for \"Q3 revenue.\" Your fiscal year starts April; AI returned Jul–Sep figures. The risk?", opts: [
    { t: "Fiscal Q3 is Oct–Dec; AI used calendar quarters — confirm the period before it ships", correct: true },
    { t: "None — Q3 is always Jul–Sep", correct: false },
    { t: "The figures need to be annualised", correct: false } ] },
  { q: "AI: \"DSO = 30 days,\" using this year's revenue but last year's period-end receivables. The problem?", opts: [
    { t: "Numerator and denominator are from different periods — the ratio is meaningless", correct: true },
    { t: "DSO should use COGS, not revenue", correct: false },
    { t: "30 days is too low to be real", correct: false } ] },
  { q: "AI's variance table shows \"Opex favourable +₹12 L,\" but actual Opex came in ₹12 L above budget. What happened?", opts: [
    { t: "Sign flipped — Opex over budget is unfavourable; AI subtracted in the wrong order", correct: true },
    { t: "Favourable is correct — lower costs are always favourable", correct: false },
    { t: "₹12 L is within tolerance, ignore it", correct: false } ] },
];

export function scoreAnswers(correct: boolean[]): number {
  return correct.filter(Boolean).length;
}
