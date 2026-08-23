import { describe, it, expect } from "vitest";
import { parsePreflight } from "./preflight";

const VALID = {
  assumptions_to_pin: [
    { dimension: "Instruction fidelity", question: "Is 'revenue' net or gross?" },
    { dimension: "Assumptions surfaced", question: "How should blank cells be treated?" },
  ],
  hardened_prompt: "Using net revenue (excl. GST), total FY24 (Apr–Mar) revenue for units in B2:B6; show your working and flag any blanks.",
  post_checks: ["Cross-foot the total against the 5 unit figures", "Confirm the range covers every unit row"],
};

describe("parsePreflight", () => {
  it("parses clean JSON", () => {
    expect(parsePreflight(JSON.stringify(VALID))).toEqual(VALID);
  });

  it("recovers when Gemini emits a raw control character inside a string value", () => {
    // A literal newline inside hardened_prompt makes this invalid JSON; strict
    // JSON.parse throws, and parsePreflight must recover instead of failing.
    const withRawNewline =
      '{"assumptions_to_pin":[],"hardened_prompt":"line one\nline two","post_checks":["check x"]}';
    expect(() => JSON.parse(withRawNewline)).toThrow(); // proves the input really is invalid
    const out = parsePreflight(withRawNewline);
    expect(out.hardened_prompt).toContain("line one");
    expect(out.post_checks).toEqual(["check x"]);
  });

  it("guardrail: the parsed shape carries no answer/result field (coach the input, never do the work)", () => {
    // The schema deliberately has no place to put a finished deliverable. This
    // asserts the contract so a future edit that adds one trips the test.
    const out = parsePreflight(JSON.stringify(VALID));
    const keys = Object.keys(out);
    expect(keys.sort()).toEqual(["assumptions_to_pin", "hardened_prompt", "post_checks"]);
    for (const forbidden of ["answer", "result", "output", "solution"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});
