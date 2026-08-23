import { NextResponse } from "next/server";
import { review, type ReviewTurn } from "@/lib/review";

// Runs on the Node runtime so it can read the server-only GEMINI_API_KEY.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { task, work, weaknesses, transcript, questionsAsked } = await req.json();
    if (!work) {
      return NextResponse.json({ error: "'work' is required." }, { status: 400 });
    }
    const result = await review(
      String(task ?? "AI-assisted finance work"),
      String(work),
      String(weaknesses ?? ""),
      Array.isArray(transcript) ? (transcript as ReviewTurn[]) : [],
      Number(questionsAsked) || 0,
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "review failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
