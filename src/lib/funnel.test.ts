import { describe, it, expect } from "vitest";
import { roadmap, roadmapDays, coachIntro, scoreAnswers, TEST_QUESTIONS } from "./funnel";

describe("roadmap", () => {
  it("steady has 4 milestones starting on source integrity for 15 days", () => {
    const r = roadmap("steady");
    expect(r).toHaveLength(4);
    expect(r[0].title).toBe("Source integrity");
    expect(roadmapDays("steady")).toBe(15);
  });
  it("aggressive is a 7-day plan ending on a boss milestone", () => {
    const r = roadmap("aggressive");
    expect(r).toHaveLength(4);
    expect(roadmapDays("aggressive")).toBe(7);
    expect(r[3].when.toLowerCase()).toContain("day 7");
  });
});

describe("coachIntro", () => {
  it("names the role and seeds source integrity", () => {
    const msg = coachIntro({ role: "FP&A / Financial Analyst", tenure: "3–5", comfort: "weekly" });
    expect(msg).toContain("FP&A");
    expect(msg.toLowerCase()).toContain("source integrity");
  });
  it("omits tenure gracefully when unset", () => {
    const msg = coachIntro({ role: null, tenure: null, comfort: null });
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe("capability test", () => {
  it("every question has exactly one correct option", () => {
    for (const q of TEST_QUESTIONS) {
      expect(q.opts.filter((o) => o.correct)).toHaveLength(1);
    }
  });
  it("scoreAnswers counts trues", () => {
    expect(scoreAnswers([true, false, true])).toBe(2);
    expect(scoreAnswers([])).toBe(0);
  });
});
