// Server-side "Mock Review" — an AI that plays a skeptical finance manager and
// pressure-tests whether the user can defend their AI-assisted work WITHOUT the AI.
// Directly serves the persona's deepest fear (PP3: collapsing when checked). Turn-based,
// capped at 3 questions, ending in a verdict. Never import from client code.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const SYSTEM = `You are a skeptical but fair finance manager doing a quick review of a piece of AI-assisted work a team member produced. Your goal: pressure-test whether they truly understand it and could defend it WITHOUT the AI — the way a real review or interview would. Concentrate your probing on the rubric dimensions that FAILED the check.

Rules:
- Ask ONE sharp, specific question per turn, 1-2 sentences. Reference their actual work.
- Push where their previous answer was vague or hand-wavy.
- Be tough but never demeaning, sarcastic, or cruel. You want them to pass.
- This review is exactly 3 questions total.
- When "Questions asked so far" is 3 (they have answered the third), set done=true and give a verdict: 1-2 sentences on whether this would survive a real review, what they defended well, and where they'd be caught. Otherwise done=false and "reply" is the next question ("verdict" empty).`;

const SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    done: { type: "boolean" },
    verdict: { type: "string" },
  },
  required: ["reply", "done", "verdict"],
};

export type ReviewTurn = { role: "reviewer" | "user"; text: string };
export type ReviewReply = { reply: string; done: boolean; verdict: string };

export function parseReview(text: string): ReviewReply {
  try {
    return JSON.parse(text) as ReviewReply;
  } catch {
    return JSON.parse(text.replace(/[\x00-\x1F]+/g, " ")) as ReviewReply;
  }
}

export async function review(
  task: string,
  work: string,
  weaknesses: string,
  transcript: ReviewTurn[],
  questionsAsked: number,
): Promise<ReviewReply> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const tx = transcript.length
    ? transcript.map((t) => `${t.role === "reviewer" ? "MANAGER" : "THEM"}: ${t.text}`).join("\n")
    : "(no exchange yet — ask your first question)";
  const userText = `Work under review — task: "${task}"\n\nThe work:\n${work}\n\nWhat the check flagged (probe these):\n${weaknesses || "nothing major failed — probe whether they can reproduce and defend the result"}\n\nQuestions asked so far: ${questionsAsked} of 3.\n\nTranscript:\n${tx}\n\nReturn the next manager turn as JSON.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.4, thinkingConfig: { thinkingLevel: "low" } },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no content");
    return parseReview(text);
  } finally {
    clearTimeout(timeout);
  }
}
