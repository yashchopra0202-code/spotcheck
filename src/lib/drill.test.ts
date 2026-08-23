import { describe, it, expect } from "vitest";
import { nextScenario, totalScenarios } from "./drill";
import { SCENARIOS } from "./scenarios";

describe("nextScenario (adaptive drill)", () => {
  it("serves a scenario on the user's weakest dimension first", () => {
    const s = nextScenario(["Plausibility"], []);
    expect(s).not.toBeNull();
    expect(s!.dimension).toBe("Plausibility");
  });

  it("respects weakness order when several weak dimensions are given", () => {
    const s = nextScenario(["Ship-ready fit", "Source integrity"], []);
    expect(s!.dimension).toBe("Ship-ready fit");
  });

  it("skips scenarios already seen and moves to the next best", () => {
    // Every Plausibility scenario seen → should fall through to the next weak dim.
    const plausSeen = SCENARIOS.filter((s) => s.dimension === "Plausibility").map((s) => s.id);
    const s = nextScenario(["Plausibility", "Source integrity"], plausSeen);
    expect(s!.dimension).toBe("Source integrity");
  });

  it("falls back to the next unseen scenario when no weak dimension matches", () => {
    const s = nextScenario([], []);
    expect(s).not.toBeNull();
    expect(s!.id).toBe(SCENARIOS[0].id);
  });

  it("returns null once every scenario has been seen (session complete)", () => {
    const allSeen = SCENARIOS.map((s) => s.id);
    expect(nextScenario(["Plausibility"], allSeen)).toBeNull();
    expect(nextScenario([], allSeen)).toBeNull();
  });

  it("totalScenarios matches the authored library", () => {
    expect(totalScenarios()).toBe(SCENARIOS.length);
    expect(totalScenarios()).toBeGreaterThan(0);
  });
});
