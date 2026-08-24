import { describe, it, expect } from "vitest";
import { parseCritique } from "./critique";

const VALID = {
  summary: "ok",
  trustworthy: false,
  dimensions: [{ name: "Source integrity", pass: false, note: "check the key" }],
  one_fix: "verify the total",
};

describe("parseCritique", () => {
  it("parses clean JSON", () => {
    expect(parseCritique(JSON.stringify(VALID))).toEqual(VALID);
  });

  it("recovers when the model emits a raw control character inside a string value", () => {
    // A literal newline inside the summary string makes this invalid JSON;
    // strict JSON.parse throws, and parseCritique must recover instead of failing.
    const withRawNewline = '{"summary":"line one\nline two","trustworthy":true,"dimensions":[],"one_fix":"do x"}';
    expect(() => JSON.parse(withRawNewline)).toThrow(); // proves the input really is invalid
    const out = parseCritique(withRawNewline);
    expect(out.trustworthy).toBe(true);
    expect(out.one_fix).toBe("do x");
    expect(out.summary).toContain("line one");
  });
});
