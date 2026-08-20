"use client";

import { useEffect, useMemo, useState } from "react";
import { SCENARIOS, DIMENSIONS, Scenario } from "@/lib/scenarios";
import { initAnalytics, track, getUserId } from "@/lib/analytics";
import { saveAnswer } from "@/lib/supabase";

type Screen = "home" | "drill" | "feedback" | "done";
type Answer = { dimId: number; caught: boolean };

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [lastCaught, setLastCaught] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [userId, setUserId] = useState("");
  const [applied, setApplied] = useState(false);

  const scenario: Scenario = SCENARIOS[idx];

  // On first load: set up analytics + a stable anonymous id.
  useEffect(() => {
    initAnalytics();
    setUserId(getUserId());
    track("app_opened");
  }, []);

  // When a drill is shown, start its timer and log it.
  useEffect(() => {
    if (screen === "drill") {
      setStartTime(Date.now());
      track("drill_started", {
        scenario_id: scenario.id,
        dimension: scenario.dimension,
        task_type: scenario.taskType,
      });
    }
  }, [screen, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  function start() {
    setAnswers([]);
    setIdx(0);
    setScreen("drill");
  }

  function answer(optionIndex: number) {
    const caught = scenario.options[optionIndex].correct;
    const time_sec = Math.round((Date.now() - startTime) / 1000);
    setLastCaught(caught);
    setAnswers((a) => [...a, { dimId: scenario.dimId, caught }]);
    track("drill_answered", {
      scenario_id: scenario.id,
      dimension: scenario.dimension,
      caught,
      time_sec,
    });
    saveAnswer({
      user_id: userId,
      scenario_id: scenario.id,
      dimension: scenario.dimension,
      caught,
      chose: scenario.options[optionIndex].text,
      time_sec,
    });
    setScreen("feedback");
  }

  function next() {
    if (idx < SCENARIOS.length - 1) {
      setIdx((i) => i + 1);
      setScreen("drill");
    } else {
      setScreen("done");
      track("judgment_map_viewed", { weakest: weakest?.name ?? "n/a" });
    }
  }

  // Judgment map: catch-rate per dimension.
  const map = useMemo(() => {
    return DIMENSIONS.map((d) => {
      const rows = answers.filter((a) => a.dimId === d.id);
      const caught = rows.filter((a) => a.caught).length;
      return { ...d, caught, total: rows.length };
    });
  }, [answers]);

  const weakest = useMemo(() => {
    const seen = map.filter((m) => m.total > 0);
    if (!seen.length) return null;
    return [...seen].sort(
      (a, b) => a.caught / a.total - b.caught / b.total
    )[0];
  }, [map]);

  const caughtCount = answers.filter((a) => a.caught).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold tracking-tight text-teal-700">SpotCheck</span>
          {screen !== "home" && (
            <span className="text-xs text-slate-400">
              {Math.min(idx + 1, SCENARIOS.length)} / {SCENARIOS.length}
            </span>
          )}
        </div>

        {screen === "home" && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h1 className="text-2xl font-semibold mb-2">Can you trust your AI's numbers?</h1>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              A 2-minute daily check for finance folks who use AI. Spot the flaw
              in a real AI answer before it ships — and find your blind spots.
            </p>
            <button
              onClick={start}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 font-medium transition"
            >
              Start today&apos;s check ▸
            </button>
            <p className="text-xs text-slate-400 mt-4 text-center">
              Private. No login. ~2 minutes.
            </p>
          </section>
        )}

        {screen === "drill" && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              {scenario.taskType}
            </p>
            <p className="text-sm text-slate-500 mb-3">
              You asked AI: <span className="text-slate-700">“{scenario.prompt}”</span>
            </p>
            <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm whitespace-pre-wrap mb-5 font-mono">
              {scenario.aiOutput}
            </pre>
            <p className="font-medium mb-3">What&apos;s off here — if anything?</p>
            <div className="space-y-2">
              {scenario.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  className="w-full text-left border border-slate-200 hover:border-teal-500 hover:bg-teal-50 rounded-xl px-4 py-3 text-sm transition"
                >
                  {o.text}
                </button>
              ))}
            </div>
          </section>
        )}

        {screen === "feedback" && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <div
              className={`rounded-xl p-4 mb-4 ${
                lastCaught ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
            >
              <p className="font-semibold mb-1">
                {lastCaught ? "You caught it 👏" : "Easy to miss —"}
              </p>
              <p className="text-sm">
                {scenario.dimension}
              </p>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              <span className="font-medium">Catch it next time: </span>
              {scenario.fix}
            </p>
            <button
              onClick={next}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 font-medium transition"
            >
              {idx < SCENARIOS.length - 1 ? "Next ▸" : "See my judgment map ▸"}
            </button>
          </section>
        )}

        {screen === "done" && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-1">
                You caught {caughtCount} of {answers.length}.
              </h2>
              {weakest && (
                <p className="text-sm text-slate-500 mb-5">
                  Blind spot to watch: <span className="text-amber-700 font-medium">{weakest.name}</span>.
                </p>
              )}
              <div className="space-y-3">
                {map.filter((m) => m.total > 0).map((m) => {
                  const pct = Math.round((m.caught / m.total) * 100);
                  return (
                    <div key={m.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{m.name}</span>
                        <span className="text-slate-400">{m.caught}/{m.total}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pct >= 50 ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apply to your work — tests whether users want the check on real work */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-medium mb-2">Apply it to your own work</h3>
              <p className="text-sm text-slate-500 mb-3">
                Got an AI answer you&apos;re about to use? Paste it and run one check.
              </p>
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm mb-3"
                rows={3}
                placeholder="Paste your AI output..."
              />
              <p className="text-xs text-slate-500 mb-3">
                Did you verify the total against a control figure, and check the source?
              </p>
              <button
                onClick={() => {
                  setApplied(true);
                  track("apply_to_work_used", { task_type: "unknown" });
                }}
                className="w-full border border-teal-600 text-teal-700 hover:bg-teal-50 rounded-xl py-2.5 text-sm font-medium transition"
              >
                {applied ? "Logged ✓ — keep it in your habit" : "I ran the check"}
              </button>
              <p className="text-xs text-slate-400 mt-3 text-center">🔒 Nothing you paste is stored or shared.</p>
            </div>

            <button
              onClick={start}
              className="w-full text-teal-700 text-sm py-2"
            >
              ↻ Do another round
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
