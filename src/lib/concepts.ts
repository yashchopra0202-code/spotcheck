// Server-side Gemini "concepts" generator — turns the user's OWN check into 2-3 short
// lessons ("here's why YOUR number was wrong"), instead of the generic static cards.
// Never import this from client code; it reads the secret key.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

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

export function parseConcepts(text: string): Concepts {
  try {
    return JSON.parse(text) as Concepts;
  } catch {
    return JSON.parse(text.replace(/[\x00-\x1F]+/g, " ")) as Concepts;
  }
}

export async function generateConcepts(task: string, output: string, weaknesses: string, focus?: string): Promise<Concepts> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const focusLine = focus ? `\nFocus area: ${focus}.` : "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `TASK the user asked AI to do:\n${task}${focusLine}\n\nAI OUTPUT:\n${output}\n\nWHAT THE CHECK FLAGGED:\n${weaknesses || "Nothing failed outright."}\n\nTeach the principle behind this.` }],
      },
    ],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.3, thinkingConfig: { thinkingLevel: "low" } },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
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
    return parseConcepts(text);
  } finally {
    clearTimeout(timeout);
  }
}
