import { NextResponse } from "next/server";
import { critique } from "@/lib/gemini";

// Runs on the Node runtime so it can read the server-only ANTHROPIC_API_KEY.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { task, output, focus } = await req.json();
    if (!task || !output) {
      return NextResponse.json({ error: "Both 'task' and 'output' are required." }, { status: 400 });
    }
    const result = await critique(String(task), String(output), focus ? String(focus) : undefined);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "critique failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
