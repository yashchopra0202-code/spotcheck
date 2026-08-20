import posthog from "posthog-js";

// Initializes PostHog once (only in the browser, only if a key is set).
let ready = false;

export function initAnalytics() {
  if (ready || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no analytics configured yet — fine
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    person_profiles: "always",
  });
  ready = true;
}

// Fire an event. If PostHog isn't configured, logs to console so you can still see it.
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.log("[track]", event, props ?? {});
    return;
  }
  posthog.capture(event, props);
}

// Stable anonymous id per browser (no login needed for the MVP).
export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("spotcheck_uid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("spotcheck_uid", id);
  }
  return id;
}
