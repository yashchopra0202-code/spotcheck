// Server-side welcome email via Brevo (transactional email API). Never import
// from client code — it reads the secret BREVO_API_KEY. Mirrors the critique.ts
// pattern: if the key/sender isn't set, this no-ops gracefully so the funnel
// never breaks.
//
// Brevo lets you send from a single *verified sender* (e.g. your own Gmail)
// with no domain — good enough for an MVP. For better inbox placement, verify a
// domain in Brevo later and point EMAIL_FROM_ADDRESS at it (no code change).
// Strip ALL whitespace, including invisible Unicode spaces (e.g. U+202F narrow
// no-break space) that pasting into a dashboard can silently inject. Such a
// character in the api-key header throws "Cannot convert argument to a
// ByteString" before the request is even sent. API keys and email addresses
// never legitimately contain whitespace, so this is safe and defensive.
const clean = (v: string | undefined) => (v || "").replace(/\s+/g, "");

const SENDER_EMAIL = clean(process.env.EMAIL_FROM_ADDRESS);
const SENDER_NAME = (process.env.EMAIL_FROM_NAME || "SpotCheck").trim();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spotcheck-welleap.vercel.app";

export type WelcomeInput = { email: string; role?: string | null; focus?: string | null };

function firstName(email: string): string {
  const local = email.split("@")[0] || "there";
  const word = local.split(/[.\-_+]/)[0] || "there";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function html({ email }: WelcomeInput): string {
  const name = escapeHtml(firstName(email));
  const p = "font-size:15px;line-height:1.65;margin:0 0 18px;color:#c3c7d1;";
  return `
  <div style="margin:0;padding:0;background:#0f1115;">
    <div style="max-width:520px;margin:0 auto;padding:40px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e7e9ee;">
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:28px;">
        Spot<span style="color:#7c9cff;">Check</span>
      </div>
      <p style="${p}">Hi ${name},</p>
      <p style="${p}">Your account is ready.</p>
      <p style="${p}">You unlock your potential with AI by using it on real work, not by reading about it. So don't start with a sample file — start with the one already open on your desk.</p>
      <p style="${p}">A few minutes a day beats one long session a month. Make a check part of your routine: before a file goes to your manager, before a number goes into a deck. The goal isn't to add AI to your calendar — it's to make it part of the work already on it.</p>
      <p style="${p}margin-bottom:26px;">Tell your coach what to check, upload a real file, and come back tomorrow with the next one.</p>
      <a href="${APP_URL}" style="display:inline-block;background:#7c9cff;color:#0f1115;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
        Open SpotCheck →
      </a>
      <p style="font-size:14px;line-height:1.6;margin:30px 0 0;color:#8b8f9a;">— The SpotCheck Team</p>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export async function sendWelcomeEmail(input: WelcomeInput): Promise<{ sent: boolean; reason?: string }> {
  const key = clean(process.env.BREVO_API_KEY);
  if (!key) return { sent: false, reason: "BREVO_API_KEY not set" };
  if (!SENDER_EMAIL) return { sent: false, reason: "EMAIL_FROM_ADDRESS not set" };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: input.email }],
      subject: "Your SpotCheck account is ready",
      htmlContent: html(input),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { sent: false, reason: `Brevo HTTP ${res.status}: ${detail}` };
  }
  const data = await res.json().catch(() => ({}));
  return { sent: Boolean(data?.messageId) };
}
