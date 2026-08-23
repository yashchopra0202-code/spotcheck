import { describe, it, expect } from "vitest";
import { parseConcepts } from "./concepts";

const VALID = { concepts: [{ title: "A duplicate needs a key", body: "AI picks the match column. Wrong key deletes real firms." }] };

describe("parseConcepts", () => {
  it("parses clean JSON", () => {
    expect(parseConcepts(JSON.stringify(VALID))).toEqual(VALID);
  });

  it("recovers when Gemini emits a raw control character inside a string value", () => {
    const withRawNewline = '{"concepts":[{"title":"one\ntwo","body":"do x"}]}';
    expect(() => JSON.parse(withRawNewline)).toThrow();
    const out = parseConcepts(withRawNewline);
    expect(out.concepts[0].title).toContain("one");
    expect(out.concepts[0].body).toBe("do x");
  });
});
