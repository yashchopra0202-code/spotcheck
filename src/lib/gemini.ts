// Server-side Gemini critique — the product's core logic (proven in Phase 0).
// Never import this from client code; it reads the secret key.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const SYSTEM = `You are a finance AI-judgment coach. A finance professional asked an AI tool to do a task and got an output. Judge whether that output is TRUSTWORTHY enough to ship, using this 7-dimension rubric:

1. Output verified — was the result cross-checked (spot-check a row, cross-foot a total, tie to a control figure), not just accepted because "it ran"?
2. Source integrity — for data cleaning: do row counts add up, no silently dropped/merged/duplicated rows, no silent type/date coercion?
3. Plausibility — is the magnitude, sign, and unit sensible (no 10x errors, no impossible %, currency consistent)?
4. Instruction fidelity — did it answer the EXACT question asked (right period, filter, definition e.g. gross vs net)?
5. Assumptions surfaced — are hidden assumptions (blanks-as-zero, mean vs median, dedup key, rounding) named and reasonable?
6. Reproducible — could the user redo/explain this without the AI?
7. Ship-ready fit — correct format, labels, rounding, and caveats for where it lands?

Dimensions 1-4 are non-negotiable: any fail there means NOT trustworthy.
Be specific and concrete in each note. If a dimension isn't applicable, mark pass:true and note "n/a".
Keep every note to one or two sentences a busy finance professional can act on.`;

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

export type Dimension = { name: string; pass: boolean; note: string };
export type Critique = { summary: string; trustworthy: boolean; dimensions: Dimension[]; one_fix: string };

export async function critique(task: string, output: string, focus?: string): Promise<Critique> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const focusLine = focus ? `\nThe user is focused on: ${focus}.` : "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `TASK the user asked AI to do:\n${task}${focusLine}\n\nAI OUTPUT:\n${output}\n\nJudge it against the rubric.` }],
      },
    ],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2 },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content");
    return JSON.parse(text) as Critique;
  } finally {
    clearTimeout(timeout);
  }
}
