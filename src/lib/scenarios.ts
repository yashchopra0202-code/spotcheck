// The 7 dimensions of the "Standard of Good" rubric (finance-analytical AI work).
export const DIMENSIONS = [
  { id: 1, name: "Output verified" },
  { id: 2, name: "Source integrity" },
  { id: 3, name: "Plausibility" },
  { id: 4, name: "Instruction fidelity" },
  { id: 5, name: "Assumptions surfaced" },
  { id: 6, name: "Reproducible" },
  { id: 7, name: "Ship-ready fit" },
] as const;

export type Scenario = {
  id: string;
  dimId: number;
  dimension: string;
  taskType: "Formula" | "Data cleaning" | "Analysis";
  prompt: string; // what the user asked ChatGPT
  aiOutput: string; // the AI's answer (with a planted flaw)
  options: { text: string; correct: boolean }[];
  fix: string; // the one-line micro-lesson
};

// 13 finance "spot the flaw" scenarios — one+ per rubric dimension, plus one clean.
export const SCENARIOS: Scenario[] = [
  {
    id: "S1",
    dimId: 1,
    dimension: "Output verified",
    taskType: "Formula",
    prompt: "Write a formula to total FY24 revenue for all 5 business units in B2:B6.",
    aiOutput: "=SUM(B2:B5)",
    options: [
      { text: "The range stops at B5, so the 5th unit (B6) is left out", correct: true },
      { text: "SUM is the wrong function here", correct: false },
      { text: "Looks fine — the formula is correct", correct: false },
    ],
    fix: "When AI writes a range, check it covers every row — cross-foot the count.",
  },
  {
    id: "S2",
    dimId: 2,
    dimension: "Source integrity",
    taskType: "Data cleaning",
    prompt: "Remove duplicate customers from this 1,200-row export.",
    aiOutput: "Done — 1,050 unique rows (removed 150 duplicates).",
    options: [
      { text: "150 removed is high — it likely dedup'd on name only and merged different firms", correct: true },
      { text: "Removing duplicates always loses data, this is expected", correct: false },
      { text: "Looks fine — fewer rows means it worked", correct: false },
    ],
    fix: "Check the row-count drop AND the dedup key against the source.",
  },
  {
    id: "S3",
    dimId: 2,
    dimension: "Source integrity",
    taskType: "Data cleaning",
    prompt: "Standardize this date column to YYYY-MM-DD.",
    aiOutput: "03/04/2024  →  2024-04-03   (applied to all rows)",
    options: [
      { text: "Source is DD/MM, so 03/04 = 3 April; it was read as MM/DD and is now wrong", correct: true },
      { text: "The output format YYYY-MM-DD is invalid", correct: false },
      { text: "Looks fine — the date converted correctly", correct: false },
    ],
    fix: "After any AI date conversion, spot-check one date you already know.",
  },
  {
    id: "S4",
    dimId: 3,
    dimension: "Plausibility",
    taskType: "Analysis",
    prompt: "Month-on-month growth for the new product line.",
    aiOutput: "MoM growth: +920%",
    options: [
      { text: "Last month's base was near-zero (launch), so the % is right but misleading", correct: true },
      { text: "Growth can't exceed 100%, so it must be a bug", correct: false },
      { text: "Looks fine — that's real growth", correct: false },
    ],
    fix: "A giant % usually hides a tiny denominator — sanity-check the base.",
  },
  {
    id: "S5",
    dimId: 3,
    dimension: "Plausibility",
    taskType: "Analysis",
    prompt: "Net profit margin for FY24.",
    aiOutput: "Net margin: 47%",
    options: [
      { text: "47% is implausible here — likely divided by COGS not revenue, or wrong units", correct: true },
      { text: "Margins over 40% are normal, nothing wrong", correct: false },
      { text: "Looks fine", correct: false },
    ],
    fix: "If a number defies what you know about the business, check the denominator and units.",
  },
  {
    id: "S6",
    dimId: 4,
    dimension: "Instruction fidelity",
    taskType: "Analysis",
    prompt: "Give me Q3 revenue (Jul–Sep FY24).",
    aiOutput: "Q3 revenue: ₹4.2 Cr  (Oct–Dec)",
    options: [
      { text: "It used fiscal Q3 (Oct–Dec), not the Jul–Sep months you asked for", correct: true },
      { text: "Q3 is always Jul–Sep, so it's fine", correct: false },
      { text: "The total is formatted wrong", correct: false },
    ],
    fix: "Confirm the AI's period matches your definition (calendar vs fiscal).",
  },
  {
    id: "S7",
    dimId: 4,
    dimension: "Instruction fidelity",
    taskType: "Analysis",
    prompt: "Total revenue for the deck.",
    aiOutput: "Total revenue: ₹12.5 Cr (gross)",
    options: [
      { text: "It used gross revenue (before returns/discounts); you needed net", correct: true },
      { text: "Revenue is revenue; gross vs net doesn't matter", correct: false },
      { text: "Looks fine", correct: false },
    ],
    fix: "'Revenue' is ambiguous — confirm gross vs net before it ships.",
  },
  {
    id: "S8",
    dimId: 5,
    dimension: "Assumptions surfaced",
    taskType: "Analysis",
    prompt: "Average deal size this quarter.",
    aiOutput: "Average deal size: ₹18.2 L",
    options: [
      { text: "The mean is skewed by two ₹2Cr deals; the median (₹6L) is more representative", correct: true },
      { text: "Average and median are always the same", correct: false },
      { text: "Looks fine", correct: false },
    ],
    fix: "For 'average', check whether outliers skew it — compare mean vs median.",
  },
  {
    id: "S9",
    dimId: 5,
    dimension: "Assumptions surfaced",
    taskType: "Analysis",
    prompt: "Average monthly spend per client.",
    aiOutput: "Average monthly spend: ₹1.1 L",
    options: [
      { text: "No-invoice months were blank; treating blanks as ₹0 drags the average down", correct: true },
      { text: "Averages ignore blanks automatically, so it's fine", correct: false },
      { text: "The currency symbol is missing", correct: false },
    ],
    fix: "Ask how the AI handled blanks/missing values — they silently change averages.",
  },
  {
    id: "S10",
    dimId: 6,
    dimension: "Reproducible",
    taskType: "Analysis",
    prompt: "What's our attrition rate?",
    aiOutput: "Attrition: 14.2%",
    options: [
      { text: "No formula or period shown — you can't reproduce or defend it in a review", correct: true },
      { text: "14.2% is too precise to be real", correct: false },
      { text: "Looks fine — the number is clear", correct: false },
    ],
    fix: "If you can't redo the number without the AI, don't ship it — ask for the steps.",
  },
  {
    id: "S11",
    dimId: 7,
    dimension: "Ship-ready fit",
    taskType: "Formula",
    prompt: "Total FY24 revenue for the board deck.",
    aiOutput: "1247653891.4",
    options: [
      { text: "The value may be right but it's unformatted — no ₹, no Cr rounding, no label", correct: true },
      { text: "The number is too large to be revenue", correct: false },
      { text: "Looks fine for a board deck", correct: false },
    ],
    fix: "Right number, wrong form — format and label it for where it lands.",
  },
  {
    id: "S12",
    dimId: 7,
    dimension: "Ship-ready fit",
    taskType: "Formula",
    prompt: "Formula for this month's run-rate.",
    aiOutput: "=45000*12",
    options: [
      { text: "It hardcodes 45000 instead of referencing the cell — it'll break next month", correct: true },
      { text: "Multiplication is the wrong operation for run-rate", correct: false },
      { text: "Looks fine", correct: false },
    ],
    fix: "AI often hardcodes values — make formulas reference cells so they hold next period.",
  },
  {
    id: "S13",
    dimId: 1,
    dimension: "Output verified",
    taskType: "Formula",
    prompt: "Sum of B2:B13 monthly revenue.",
    aiOutput: "=SUM(B2:B13)   → matches a manual cross-foot",
    options: [
      { text: "Looks fine — the range and total are correct", correct: true },
      { text: "The range is missing the last row", correct: false },
      { text: "It should use AVERAGE, not SUM", correct: false },
    ],
    fix: "Not everything is wrong — a good check also confirms when work IS sound (avoid false alarms).",
  },
];
