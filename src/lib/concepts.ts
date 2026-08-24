// Server-side Claude "concepts" generator — turns the user's OWN check into 2-3 short
// lessons ("here's why YOUR number was wrong"), instead of the generic static cards.
// Never import this from client code; it reads the secret key.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const SYSTEM = `You are a finance AI-judgment coach. A finance professional ran an AI-assisted task, and it was just checked against a 7-dimension trust rubric. Some dimensions failed. Teach them the UNDERLYING PRINCIPLE behind what went wrong, so they catch it themselves next time — do not just repeat the fix.

Return 2-3 concept cards. Each card:
- title: the principle in a few words (e.g. "A 'duplicate' needs a key").
- body: two short sentences, concrete and tied to what actually happened in THEIR task. A busy finance professional should be able to act on it.

Ground every card in the specific failure(s) provided. If nothing failed, teach the principle behind the most important dimension they should keep verifying. Never invent numbers or output.`;

const SCHEMA = {
  type: "object",
  properties: {
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, body: { type: "string" } },
        required: ["title", "body"],
      },
    },
  },
  required: ["concepts"],
};

export type Concept = { title: string; body: string };
export type Concepts = { concepts: Concept[] };

// Kept for the unit test; the live path reads the validated tool input directly.
export function parseConcepts(text: string): Concepts {
  try {
    return JSON.parse(text) as Concepts;
  } catch {
    return JSON.parse(text.replace(/[\x00-\x1F]+/g, " ")) as Concepts;
  }
}

export async function generateConcepts(task: string, output: string, weaknesses: string, focus?: string): Promise<Concepts> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic();

  const focusLine = focus ? `\nFocus area: ${focus}.` : "";
  const userText = `TASK the user asked AI to do:\n${task}${focusLine}\n\nAI OUTPUT:\n${output}\n\nWHAT THE CHECK FLAGGED:\n${weaknesses || "Nothing failed outright."}\n\nTeach the principle behind this.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: userText }],
    tools: [{ name: "emit_concepts", description: "Return the concept cards.", input_schema: SCHEMA as Anthropic.Tool.InputSchema }],
    tool_choice: { type: "tool", name: "emit_concepts" },
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Claude returned no structured result");
  return block.input as Concepts;
}
