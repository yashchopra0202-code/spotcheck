// The 7 "Standard of Good" dimensions — shared by the UI (labels, judgment map).
// Dimensions 1-4 are non-negotiable (a fail = not trustworthy).
export const DIMENSIONS = [
  { id: 1, name: "Output verified", core: true },
  { id: 2, name: "Source integrity", core: true },
  { id: 3, name: "Plausibility", core: true },
  { id: 4, name: "Instruction fidelity", core: true },
  { id: 5, name: "Assumptions surfaced", core: false },
  { id: 6, name: "Reproducible", core: false },
  { id: 7, name: "Ship-ready fit", core: false },
] as const;

export const FOCUS_AREAS = [
  "Spreadsheet work",
  "Data analysis",
  "Financial projections",
  "Reconciliation & close",
] as const;
