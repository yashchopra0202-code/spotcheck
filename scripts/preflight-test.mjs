// Phase A go/no-go: does Gemini return a genuinely BETTER prompt (+ the assumptions
// to pin down) WITHOUT doing the finance task itself? Throwaway script — run, read
// the output, decide go/no-go. The core risk is the coach drifting into "assistant"
// (producing the answer). This script prints each result and flags anything that
// smells like a finished deliverable rather than a prompt.
//
// Run:  node scripts/preflight-test.mjs
// Needs a key in ~/spotcheck/.env.local  ->  GEMINI_API_KEY=your_key_here

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
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
if (!KEY) {
  console.error("\n❌ No GEMINI_API_KEY found.\n   Add it to ~/spotcheck/.env.local:  GEMINI_API_KEY=your_key_here\n");
  process.exit(1);
}

// Keep this in sync with src/lib/preflight.ts (throwaway copy for the probe).
const SYSTEM = `You are a finance AI-judgment coach. A finance professional is ABOUT to ask an AI tool to do a task. Your job is to make them wield the AI well — you do NOT do the task, and you never produce the answer, the numbers, the formula, or the finished output.

Coach the INPUT using this 7-dimension "standard of good" rubric (dims 4 and 5 matter most before the work starts):
1. Output verified — how will they cross-check the result?
2. Source integrity — row counts add up, no silently dropped/duplicated rows, no silent type/date coercion.
3. Plausibility — magnitude, sign, unit sensible.
4. Instruction fidelity — is the task stated EXACTLY enough (right period, filter, definition e.g. gross vs net)?
5. Assumptions surfaced — which hidden assumptions must be pinned down first (blanks-as-zero, dedup key, rounding, currency, date format)?
6. Reproducible — can they redo it without the AI?
7. Ship-ready fit — format, labels, rounding, caveats.

Return: assumptions_to_pin (2–4 concrete questions to self, each tagged to a rubric dimension), hardened_prompt (a precise rewrite they paste into their OWN AI tool — a PROMPT, never the completed answer), post_checks (2–3 checks to run on the output). Never include actual result values, computed numbers, or a finished formula/table.

CRITICAL RULE — do NOT put words in the user's mouth. State as firm instructions ONLY what the user actually told you. For ANYTHING you are inferring that the user did NOT state (a definition like net vs gross, a filter like excluding intercompany/refunds, a column name, a date format, a period boundary), write it as a bracketed placeholder for the user to confirm — e.g. "[confirm: exclude Intercompany & Refunds? — only if those exist in your data]" — never as an asserted fact, and never invent the user's column names or data structure. Every bracketed placeholder must also appear in assumptions_to_pin.`;

const SCHEMA = {
  type: "object",
  properties: {
    assumptions_to_pin: {
      type: "array",
      items: {
        type: "object",
        properties: { dimension: { type: "string" }, question: { type: "string" } },
        required: ["dimension", "question"],
      },
    },
    hardened_prompt: { type: "string" },
    post_checks: { type: "array", items: { type: "string" } },
  },
  required: ["assumptions_to_pin", "hardened_prompt", "post_checks"],
};

// Real finance tasks a user is ABOUT to run — no AI output yet (that's the point).
const CASES = [
  { task: "Total FY24 revenue across our 5 business units in cells B2:B6.", focus: "Formula correction" },
  { task: "Clean this 1,200-row customer export and remove duplicates.", focus: "Spreadsheet work" },
  { task: "Work out our net profit margin for FY24 for the board deck.", focus: "Data analysis" },
];

async function runPreflight(task, focus) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: `TASK the user is about to ask AI to do:\n${task}\nThe user is focused on: ${focus}.\n\nCoach the input. Do NOT do the task.` }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 },
  };
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text);
}

// Heuristic guardrail: does hardened_prompt smell like a finished answer instead of a prompt?
function looksLikeAnswer(prompt) {
  const flags = [];
  if (/=\s*[A-Z]+\(/.test(prompt)) flags.push("contains a spreadsheet formula (=FUNC(...) — may be doing the work)");
  if (/\b\d{1,3}(\.\d+)?\s*%/.test(prompt)) flags.push("contains a percentage result");
  if (/(₹|Rs\.?|\$)\s?\d/.test(prompt)) flags.push("contains a currency figure");
  return flags;
}

console.log(`\n🧭 Pre-flight prompt-coach go/no-go  (model: ${MODEL})\n${"=".repeat(64)}`);
for (const c of CASES) {
  console.log(`\n📋 TASK: ${c.task}\n   FOCUS: ${c.focus}`);
  try {
    const r = await runPreflight(c.task, c.focus);
    console.log(`   → PIN DOWN FIRST:`);
    for (const a of r.assumptions_to_pin) console.log(`      • [${a.dimension}] ${a.question}`);
    console.log(`   → HARDENED PROMPT:\n      "${r.hardened_prompt}"`);
    console.log(`   → POST-CHECKS:`);
    for (const p of r.post_checks) console.log(`      ✓ ${p}`);
    const flags = looksLikeAnswer(r.hardened_prompt);
    if (flags.length) {
      console.log(`   ⚠️  GUARDRAIL FLAG — the "prompt" may be doing the work:`);
      for (const f of flags) console.log(`      ! ${f}`);
    } else {
      console.log(`   ✅ Reads like a prompt, not an answer.`);
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
  }
}
console.log(`\n${"=".repeat(64)}\nGo/no-go: are these prompts genuinely sharper than the user's ask,\nAND free of finished answers? If yes, build the UI. If any ⚠️ fired, tighten SYSTEM.\n`);
