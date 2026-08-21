# SpotCheck — Launch Runbook (to 40–50 users, today · 2026-08-21)

**Goal:** take the merged Phase 1 build (guest funnel + Path A) from local → deployed → in front of 40–50 real finance users **today**, with funnel data landing in PostHog. Launch is the LAST step.

**Critical path is ~1.5–2 hrs** of active work if your browser/account steps go smoothly. Each stage has a **GATE** — do not move on until it's green.

**Owners:** 🧑 = you (browser/accounts/logins I can't do) · 🤖 = me (code/git/verify/drafts).

---

## Stage 0 — Pre-flight fixes (≈20 min) 🧑🤖
Unblocks everything and closes the security hole before real data flows.

- [x] 🤖 **DONE: hardened Gemini JSON parsing** (merged `90a3c7a`) — intermittent unescaped control chars in Gemini output were silently degrading live critiques to the fallback; now parsed robustly + unit-tested. Verified live.
- [ ] 🔴 🧑 **LAUNCH BLOCKER — raise the Gemini quota.** The current key is **free-tier: 20 requests/DAY** for `gemini-3.6-flash` (confirmed via live 429 RESOURCE_EXHAUSTED). At 40–50 users that runs out almost immediately and everyone after gets the canned fallback — killing the USP. **Enable billing** on the API project (Google AI Studio → billing / Google Cloud → link a billing account) so the paid-tier quota applies. Flash usage is very cheap (fractions of a cent per call; a full launch is well under a dollar). **Do this before launch, non-negotiable.**
- [ ] 🧑 **Rotate the Gemini API key** (do together with billing). It was pasted in chat earlier → treat as compromised. Google AI Studio → new key (on the billing-enabled project) → replace `GEMINI_API_KEY` in `~/spotcheck/.env.local`.
- [ ] 🧑 **Run the Supabase migration** in the SQL editor (https://supabase.com/dashboard/project/ygvzpfuimrrluezszzac/sql/new):
  ```sql
  alter table public.profiles add column if not exists tenure text;
  alter table public.profiles add column if not exists pace   text;
  drop policy if exists "anon read profiles" on public.profiles;
  drop policy if exists "anon read checks"   on public.checks;
  ```
- [ ] 🤖 **Verify the migration** — I re-probe with the anon key: `tenure`/`pace` should resolve, and anon read of `checks`/`profiles` should flip to denied.
- [ ] 🧑 **Add the PostHog key** to `.env.local`: `NEXT_PUBLIC_POSTHOG_KEY=phc_...` (PostHog → Project Settings → Project API Key). Optional: `NEXT_PUBLIC_POSTHOG_HOST` (default US cloud).
- [ ] 🤖 **Local smoke test** — `npm run dev`, walk the full funnel: onboarding → Path A paste → live critique → concepts → test → email. Confirm a `profiles` row saves (no 400) and events fire (console or PostHog).

**GATE 0:** local flow works end-to-end · persistence saves (no 400) · migration verified · keys rotated/added.

---

## Stage 1 — Code to GitHub (≈10 min) 🧑🤖
No remote exists yet.

- [ ] 🧑 Create an **empty private** GitHub repo named `spotcheck` (no README/gitignore).
- [ ] 🤖 Wire the remote + push `main`: `git remote add origin <url>` → `git push -u origin main`. *(You may get a one-time browser git login — normal.)*
- [ ] 🤖 Confirm `.env.local` is gitignored (it is) — **secrets must not land in the repo.**

**GATE 1:** code is on GitHub; no secrets committed.

---

## Stage 2 — Deploy to Vercel (≈15 min) 🧑🤖

- [ ] 🧑 Vercel → **Add New → Project → Import** the `spotcheck` repo.
- [ ] 🧑 **Environment Variables** (add all; values from your `.env.local`):
  - `GEMINI_API_KEY` (the rotated one) — server-side
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - *(optional)* `GEMINI_MODEL` if overriding `gemini-3.6-flash`
- [ ] 🧑 **Deploy** → get the live URL (`spotcheck-*.vercel.app`).
- [ ] 🤖 Guide/verify the deploy log if the build errors.

**GATE 2:** production build succeeds; live URL loads the Welcome screen.

> ⚠️ **Latency watch:** a cold critique runs ~44–55s; Vercel's serverless cap is **60s** (already set via `maxDuration=60`). The first request after idle is the slow one — see Stage 3.

---

## Stage 3 — Production smoke test (≈15 min) 🧑🤖
Prove it works for a stranger before you send it to 50.

- [ ] 🧑 On the **live URL**, walk the funnel on **mobile + desktop**.
- [ ] 🧑 Run one **real critique** (paste a flawed AI output, e.g. `Done — 1,050 unique rows (removed 150 duplicates).`). Expect a real critique (may take up to ~55s on a cold start — that's the warm-up; subsequent ones are fast).
- [ ] 🧑 Confirm a row appears in Supabase `profiles` and `checks` (Table editor).
- [ ] 🧑 Confirm events appear in **PostHog** (`welcome_viewed`, `apply_to_work_used`, `check_completed`, `identity_captured`).
- [ ] 🤖 If the cold-start critique times out to the fallback, I'll warm the function / advise (a scheduled ping, or a "first check may take a moment" note in the UI).

**GATE 3:** a stranger can complete the flow · a real critique returns · data + events land.

---

## Stage 4 — Launch prep (≈30 min) 🧑🤖

- [ ] 🤖 Draft the **outreach message** (the ask: *"2-min check that tells you if your AI-assisted finance work is trustworthy — try it?"* + the live link).
- [ ] 🤖 Draft a **tracking sheet**: name · channel · sent · completed · caught-a-flaw · WTP note.
- [ ] 🧑 Build the **list of 60–70 names** (to net 40–50): (1) warm finance/ops contacts, (2) LinkedIn DMs to finance analysts, (3) finance/accounting communities.

**GATE 4:** message + tracking sheet ready · ≥60 names listed.

---

## Stage 5 — LAUNCH (last, today) 🧑
- [ ] 🧑 Send **wave 1** (~15–20 warmest contacts). Personal, one line, the link.
- [ ] 🧑🤖 **Monitor the PostHog funnel live** for the first ~30 min — watch for prod errors and drop-off. I'll help read it.
- [ ] 🧑 Send **wave 2** (LinkedIn + communities) once wave 1 shows the flow holds.
- [ ] 🎯 **Activation signal to watch:** first `apply_to_work_used` — someone checking their *own* real work. That's the aha the whole product bets on.

**GATE 5 (done for today):** real users flowing · activation observed · no blocking prod errors.

---

## Tomorrow (Day 5) — the graded "one iteration" 🤖🧑
- Read the funnel: biggest drop-off? which rubric dimensions get missed? did anyone hit the fake-door intent?
- Ship **one** change from a real insight; document before/after. This is explicitly scored.

## Rollback / safety
- Every deploy is a git commit → Vercel keeps prior deploys; **instant rollback** to the last good one from the Vercel dashboard.
- `.env.local` is gitignored; secrets live only in Vercel's env store + your machine.
- Vault originals backed up at `~/.claude/jobs/ebaf3e06/tmp/vault-backup-2026-08-21/`.

## What's explicitly NOT in scope today (Phase 2 — do NOT let these delay launch)
Coach chat · Path B · assignment/homework · dashboard · subscription + ₹999 fake-door screen · login · theming.
