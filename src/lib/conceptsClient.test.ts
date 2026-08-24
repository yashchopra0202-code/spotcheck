import { describe, it, expect, afterEach, vi } from "vitest";
import { runConcepts, prefetchConcepts, FALLBACK_CONCEPTS } from "./conceptsClient";

const VALID = { concepts: [{ title: "A key defines a duplicate", body: "Pick the column that identifies a row." }] };

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("conceptsClient", () => {
  it("runConcepts returns the parsed concepts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(VALID)));
    const r = await runConcepts({ task: "t", output: "o", weaknesses: "w" });
    expect(r).toEqual(VALID);
  });

  it("prefetch then run with the same input reuses the call (fetches once)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(VALID));
    vi.stubGlobal("fetch", fetchMock);
    const input = { task: "t2", output: "o2", weaknesses: "w2", focus: "x" };
    prefetchConcepts(input);
    const r = await runConcepts(input);
    expect(r).toEqual(VALID);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns FALLBACK_CONCEPTS on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "boom" }, false)));
    const r = await runConcepts({ task: "u", output: "u", weaknesses: "u" });
    expect(r).toBe(FALLBACK_CONCEPTS);
  });
});
