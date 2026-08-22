import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

// Runs on the Node runtime so it can read the server-only RESEND_API_KEY.
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email, role, focus } = await req.json();
    if (!email || !EMAIL_RE.test(String(email))) {
      return NextResponse.json({ error: "A valid 'email' is required." }, { status: 400 });
    }
    const result = await sendWelcomeEmail({
      email: String(email),
      role: role ? String(role) : null,
      focus: focus ? String(focus) : null,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "welcome email failed";
    return NextResponse.json({ sent: false, reason: msg }, { status: 500 });
  }
}
