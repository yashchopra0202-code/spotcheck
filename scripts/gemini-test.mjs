// Phase 0 de-risk: can Gemini critique real finance work against our rubric,
// and return clean structured JSON? Throwaway script — run, read output, decide go/no-go.
//
// Run:  node scripts/gemini-test.mjs
// Needs a key in ~/spotcheck/.env.local  ->  GEMINI_API_KEY=your_key_here
// (optional)  GEMINI_MODEL=gemini-2.0-flash   [alts: gemini-1.5-flash, gemini-2.5-flash]

import { readFileSync } from "node:fs";

// --- load key from .env.local (no dependency) or from the environment ---
function loadEnv() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
if (!KEY) {
  console.error("\n❌ No GEMINI_API_KEY found.\n   Add it to ~/spotcheck/.env.local:  GEMINI_API_KEY=your_key_here\n");
  process.exit(1);
}

// --- the rubric: this IS the product's grading logic ---
const SYSTEM = `You are a finance AI-judgment coach. A finance professional asked an AI tool to do a task and got an output. Your job is to judge whether that output is TRUSTWORTHY enough to ship, using this 7-dimension rubric:

1. Output verified — was the result cross-checked (spot-check a row, cross-foot a total, tie to a control figure), not just accepted because "it ran"?
2. Source integrity — for data cleaning: do row counts add up, no silently dropped/merged/duplicated rows, no silent type/date coercion?
3. Plausibility — is the magnitude, sign, and unit sensible (no 10x errors, no impossible %, currency consistent)?
4. Instruction fidelity — did it answer the EXACT question asked (right period, filter, definition e.g. gross vs net)?
5. Assumptions surfaced — are hidden assumptions (blanks-as-zero, mean vs median, dedup key, rounding) named and reasonable?
6. Reproducible — could the user redo/explain this without the AI?
7. Ship-ready fit — correct format, labels, rounding, and caveats for where it lands?

Dimensions 1–4 are non-negotiable: any fail there means NOT trustworthy.
Be specific and concrete in each note. If a dimension isn't applicable, mark pass:true and say "n/a".`;

const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    trustworthy: { type: "boolean" },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, pass: { type: "boolean" }, note: { type: "string" } },
        required: ["name", "pass", "note"],
      },
    },
    one_fix: { type: "string" },
  },
  required: ["summary", "trustworthy", "dimensions", "one_fix"],
};

const CASES = [
  { task: "Remove duplicate customers from this 1,200-row export.", output: "Done — 1,050 unique rows (removed 150 duplicates)." },
  { task: "Write a formula to total FY24 revenue for all 5 business units in cells B2:B6.", output: "=SUM(B2:B5)" },
  { task: "Net profit margin for FY24. (This business has historically run ~8%.)", output: "Net margin: 47%" },
];

async function critique(task, output) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: `TASK the user asked AI to do:\n${task}\n\nAI OUTPUT:\n${output}\n\nJudge it.` }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 },
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

console.log(`\n🔎 Testing Gemini rubric critique  (model: ${MODEL})\n${"=".repeat(60)}`);
for (const c of CASES) {
  console.log(`\n📋 TASK: ${c.task}\n   AI OUTPUT: ${c.output}`);
  try {
    const r = await critique(c.task, c.output);
    console.log(`   → TRUSTWORTHY: ${r.trustworthy ? "✅ yes" : "⚠️  NO"}`);
    console.log(`   → SUMMARY: ${r.summary}`);
    for (const d of r.dimensions) if (!d.pass) console.log(`      ✗ ${d.name}: ${d.note}`);
    console.log(`   → ONE FIX: ${r.one_fix}`);
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
  }
}
console.log(`\n${"=".repeat(60)}\nGo/no-go: are these critiques accurate + useful? If yes, the core works.\n`);
