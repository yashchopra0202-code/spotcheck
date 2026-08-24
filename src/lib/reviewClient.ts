import type { ReviewTurn, ReviewReply } from "@/lib/review";
export type { ReviewTurn, ReviewReply } from "@/lib/review";

// Rubric-grounded canned questions if the AI is unreachable — keeps the mock review
// working (and useful) even on quota/latency failures.
const FALLBACK_QUESTIONS = [
  "Walk me through how you got this number — without opening the AI. Which step are you least sure of?",
  "What did the AI assume that you didn't check? Name one assumption and how you'd verify it.",
  "If I told you one input was from the wrong period, how would you catch that before this ships?",
];
const FALLBACK_VERDICT =
  "I couldn't fully probe this, but the principle holds: if you can't reproduce and defend the number without the AI, it's not ready to ship. Re-run your key figure once before it goes out.";

export async function runReview(input: {
  task: string;
  work: string;
  weaknesses: string;
  transcript: ReviewTurn[];
  questionsAsked: number;
}): Promise<ReviewReply> {
  const controller = new AbortController();
  // Claude Haiku returns these in ~5-8s (measured); 30s is a safety net for a
  // hung request, well under the 60s server maxDuration. (Was 58s, sized for the
  // old Gemini path's ~30-44s cold latency.)
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) return fallback(input.questionsAsked);
    const data = await res.json();
    if (!data || typeof data.reply !== "string" || typeof data.done !== "boolean") return fallback(input.questionsAsked);
    return data as ReviewReply;
  } catch {
    return fallback(input.questionsAsked);
  } finally {
    clearTimeout(timeout);
  }
}

function fallback(questionsAsked: number): ReviewReply {
  if (questionsAsked >= 3) return { reply: "", done: true, verdict: FALLBACK_VERDICT };
  return { reply: FALLBACK_QUESTIONS[questionsAsked] ?? FALLBACK_QUESTIONS[0], done: false, verdict: "" };
}
