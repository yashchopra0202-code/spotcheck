// Server-side Claude "pre-flight" prompt coach — Moment 1 of the real-work co-pilot.
// Coaches the INPUT before the user runs AI: names the assumptions to pin down and
// hands back a rubric-hardened prompt to run in their OWN tool.
// Never import this from client code; it reads the secret key.
//
// GUARDRAIL (structural, not just prose): the response schema has NO answer/result
// field. The coach must never produce the finished deliverable — only a better prompt
// and the questions to pin down. This is what keeps SpotCheck a coach, not a worse
// ChatGPT. See "Phase 2 - Real-Work Co-Pilot Direction" in the vault.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const SYSTEM = `You are a finance AI-judgment coach. A finance professional is ABOUT to ask an AI tool to do a task. Your job is to make them wield the AI well — you do NOT do the task, and you never produce the answer, the numbers, the formula, or the finished output.

Coach the INPUT using this 7-dimension "standard of good" rubric (dims 4 and 5 matter most before the work starts):
1. Output verified — how will they cross-check the result (spot-check a row, cross-foot a total, tie to a control figure)?
2. Source integrity — for data work: row counts add up, no silently dropped/merged/duplicated rows, no silent type/date coercion.
3. Plausibility — magnitude, sign, and unit sensible (no 10x errors, no impossible %, consistent currency).
4. Instruction fidelity — is the task stated EXACTLY enough (right period, filter, definition e.g. gross vs net) that the AI can't answer a subtly different question?
5. Assumptions surfaced — which hidden assumptions must be pinned down first (blanks-as-zero, mean vs median, dedup key, rounding, currency, date format)?
6. Reproducible — will they be able to redo/explain it without the AI?
7. Ship-ready fit — correct format, labels, rounding, caveats for where it lands.

Return three things:
- assumptions_to_pin: the specific decisions the user must nail down BEFORE running the AI, each tagged to the rubric dimension it protects. Phrase each as a concrete question to themselves. Include every definition, filter, or data detail you are INFERRING (see the critical rule). 2–4 items.
- hardened_prompt: a rewrite of the user's ask into a precise prompt they can paste into their OWN AI tool. It must be a PROMPT (instructions to an AI), never the completed answer. It asks the AI to show its work and flag what it couldn't verify.
- post_checks: 2–3 quick checks to run on the AI's output once they get it, tied to the rubric.

CRITICAL RULE — do NOT put words in the user's mouth. State as firm instructions ONLY what the user actually told you. For ANYTHING you are inferring that the user did NOT state — a definition (net vs gross), a filter (e.g. exclude intercompany/refunds), a column name, a date format, a period boundary — do NOT assert it as fact. Write it as a bracketed placeholder for the user to confirm or fill in, e.g. "[confirm: exclude Intercompany & Refunds? — only if those categories exist in your data]" or "[confirm your fiscal Q3 = Oct–Dec 2023]". Never invent the user's column names, categories, or data structure as if you know their sheet. Every bracketed placeholder in the hardened_prompt must also appear as a question in assumptions_to_pin.

Be specific to the finance task. Never include actual result values, computed numbers, or a finished formula/table as if you did the work.`;

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

export type Assumption = { dimension: string; question: string };
export type Preflight = { assumptions_to_pin: Assumption[]; hardened_prompt: string; post_checks: string[] };

// Kept for the unit test; the live path reads the validated tool input directly.
export function parsePreflight(text: string): Preflight {
  try {
    return JSON.parse(text) as Preflight;
  } catch {
    return JSON.parse(text.replace(/[\x00-\x1F]+/g, " ")) as Preflight;
  }
}

export async function preflight(task: string, focus?: string): Promise<Preflight> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic();

  const focusLine = focus ? `\nThe user is focused on: ${focus}.` : "";
  const userText = `TASK the user is about to ask AI to do:\n${task}${focusLine}\n\nCoach the input. Do NOT do the task.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
    tools: [{ name: "emit_preflight", description: "Return the coached prompt and assumptions.", input_schema: SCHEMA as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: "emit_preflight" },
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Claude returned no structured result");
  return block.input as Preflight;
}
