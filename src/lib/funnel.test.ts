import { describe, it, expect } from "vitest";
import { roadmap, roadmapDays, coachIntro, scoreAnswers, TEST_QUESTIONS, judgmentMap, weakestDimensions, testBadge, type CheckRecord } from "./funnel";

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

describe("judgmentMap (co-pilot panel)", () => {
  const mk = (missed: string[]): CheckRecord => ({ task: "t", trustworthy: missed.length === 0, missed_dims: missed, ts: 0 });

  it("returns all 7 dimensions with zero totals when there are no checks", () => {
    const m = judgmentMap([]);
    expect(m).toHaveLength(7);
    expect(m.every((c) => c.total === 0 && c.passes === 0 && c.fails === 0)).toBe(true);
  });

  it("counts a dimension as passed for a check that did not list it in missed_dims", () => {
    const m = judgmentMap([mk(["Source integrity"])]);
    const source = m.find((c) => c.name === "Source integrity")!;
    const verified = m.find((c) => c.name === "Output verified")!;
    expect(source).toMatchObject({ total: 1, fails: 1, passes: 0 });
    expect(verified).toMatchObject({ total: 1, fails: 0, passes: 1 });
  });

  it("accumulates across multiple checks (passes + fails always sum to total)", () => {
    const m = judgmentMap([mk(["Plausibility"]), mk(["Plausibility"]), mk([])]);
    const plaus = m.find((c) => c.name === "Plausibility")!;
    expect(plaus).toMatchObject({ total: 3, fails: 2, passes: 1 });
    expect(m.every((c) => c.passes + c.fails === c.total)).toBe(true);
  });

  it("weakestDimensions ranks the most-missed first and omits clean dimensions", () => {
    const weak = weakestDimensions([mk(["Plausibility"]), mk(["Plausibility"]), mk(["Instruction fidelity"])]);
    expect(weak[0]).toBe("Plausibility");
    expect(weak).toContain("Instruction fidelity");
    expect(weak).not.toContain("Output verified");
  });
});

describe("testBadge", () => {
  it("awards the top badge at 80%+", () => {
    expect(testBadge(5, 6).name).toBe("Sharp Eye");
    expect(testBadge(6, 6).name).toBe("Sharp Eye");
  });
  it("awards the middle badge from 50–79%", () => {
    expect(testBadge(3, 6).name).toBe("Solid Instinct");
  });
  it("awards the entry badge below 50% and never divides by zero", () => {
    expect(testBadge(1, 6).name).toBe("Calibrating");
    expect(testBadge(0, 0).name).toBe("Calibrating");
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
