import { NextResponse } from "next/server";
import { preflight } from "@/lib/preflight";

// Runs on the Node runtime so it can read the server-only GEMINI_API_KEY.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { task, focus } = await req.json();
    if (!task) {
      return NextResponse.json({ error: "'task' is required." }, { status: 400 });
    }
    const result = await preflight(String(task), focus ? String(focus) : undefined);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "preflight failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
