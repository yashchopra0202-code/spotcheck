"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { FunnelState, Step, initialState } from "@/lib/funnel";
import { getUserId, initAnalytics, track } from "@/lib/analytics";
import { saveProfile } from "@/lib/supabase";
import type { Critique } from "@/lib/gemini";

type Ctx = {
  state: FunnelState;
  set: (p: Partial<FunnelState>) => void;
  go: (step: Step) => void;
  userId: string;
  check: { task: string; paste: string; taskType: "critical" | "scratch"; result: Critique } | null;
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
  const [check, setCheck] = useState<{ task: string; paste: string; taskType: "critical" | "scratch"; result: Critique } | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage + set up analytics/anon id once.
  useEffect(() => {
    initAnalytics();
    setUserId(getUserId());
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
    hydrated.current = true;
    track("welcome_viewed");
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
    setState((s) => ({ ...s, step }));
    track("funnel_step", { step });
    // Upsert the profile snapshot as the user advances (guest id).
    if (userId) {
      saveProfile({
        user_id: userId,
        role: state.role,
        tenure: state.tenure,
        ai_comfort: state.comfort,
        focus: state.focus,
        pace: state.pace,
        email: state.email || null,
      });
    }
  };

  return (
    <FunnelCtx.Provider value={{ state, set, go, userId, check, setCheck }}>
      {children}
    </FunnelCtx.Provider>
  );
}
