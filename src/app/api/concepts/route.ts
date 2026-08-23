import { NextResponse } from "next/server";
import { generateConcepts } from "@/lib/concepts";

// Runs on the Node runtime so it can read the server-only GEMINI_API_KEY.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { task, output, weaknesses, focus } = await req.json();
    if (!task || !output) {
      return NextResponse.json({ error: "Both 'task' and 'output' are required." }, { status: 400 });
    }
    const result = await generateConcepts(String(task), String(output), String(weaknesses ?? ""), focus ? String(focus) : undefined);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "concepts failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
