import { describe, it, expect } from "vitest";
import { parseReview } from "./review";

describe("parseReview", () => {
  it("parses a next-question turn", () => {
    const t = { reply: "Walk me through how you got this without the AI.", done: false, verdict: "" };
    expect(parseReview(JSON.stringify(t))).toEqual(t);
  });

  it("parses a final verdict turn", () => {
    const t = { reply: "", done: true, verdict: "You'd survive on the total, but the period would trip you up." };
    expect(parseReview(JSON.stringify(t))).toEqual(t);
  });

  it("recovers when a raw control character appears inside a string", () => {
    const withRawNewline = '{"reply":"line one\nline two","done":false,"verdict":""}';
    expect(() => JSON.parse(withRawNewline)).toThrow();
    expect(parseReview(withRawNewline).reply).toContain("line one");
  });
});
