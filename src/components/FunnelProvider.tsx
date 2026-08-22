"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { FunnelState, Step, TaskType, initialState, effectiveFocus } from "@/lib/funnel";
import { getUserId, initAnalytics, track } from "@/lib/analytics";
import { saveProfile } from "@/lib/supabase";
import type { Critique } from "@/lib/gemini";

type Ctx = {
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  go: (step: Step) => void;
  back: () => void;
  canGoBack: boolean;
  userId: string;
  check: { task: string; paste: string; taskType: TaskType; result: Critique } | null;
  setCheck: (c: Ctx["check"]) => void;
};

const FunnelCtx = createContext<Ctx | null>(null);
const LS_KEY = "spotcheck_funnel";

export function useFunnel(): Ctx {
  const ctx = useContext(FunnelCtx);
  if (!ctx) throw new Error("useFunnel must be used inside FunnelProvider");
  return ctx;
}

export default function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FunnelState>(initialState);
  const [userId, setUserId] = useState("");
  const [check, setCheck] = useState<{ task: string; paste: string; taskType: TaskType; result: Critique } | null>(null);
  const [history, setHistory] = useState<Step[]>([]);
  const hydrated = useRef(false);

  // Hydrate from localStorage + set up analytics/anon id once.
  useEffect(() => {
    initAnalytics();
    // Client-only anon id from localStorage (unavailable during SSR), so this mount-time setState is intentional hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(getUserId());
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  // Persist funnel state after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const set = (p: Partial<FunnelState>) => setState((s) => ({ ...s, ...p }));

  const go = (step: Step) => {
    // Remember where we came from so back() can unwind branches correctly.
    setHistory((h) => [...h, state.step]);
    setState((s) => ({ ...s, step }));
    track("funnel_step", { step });
    // Upsert the profile snapshot as the user advances (guest id).
    if (userId) {
      saveProfile({
        user_id: userId,
        role: state.role,
        tenure: state.tenure,
        ai_comfort: state.comfort,
        focus: effectiveFocus(state),
        pace: state.pace,
        email: state.email || null,
      });
    }
  };

  // Go back to the previous step in history (no re-push, no re-save).
  const back = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setState((s) => ({ ...s, step: prev }));
      track("funnel_back", { to: prev });
      return h.slice(0, -1);
    });
  };

  return (
    <FunnelCtx.Provider value={{ state, set, go, back, canGoBack: history.length > 0, userId, check, setCheck }}>
      {children}
    </FunnelCtx.Provider>
  );
}
