import { describe, it, expect, afterEach, vi } from "vitest";
import { runCheck, FALLBACK_CRITIQUE } from "./critiqueClient";
import type { Critique } from "./critique";

const VALID_CRITIQUE: Critique = {
  summary: "Looks solid overall.",
  trustworthy: true,
  dimensions: [
    { name: "Source integrity", pass: true, note: "Row counts tie out." },
    { name: "Output verified", pass: true, note: "Cross-footed the total." },
  ],
  one_fix: "Nothing to fix.",
};

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runCheck", () => {
  it("returns the parsed critique on a valid response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(VALID_CRITIQUE)));
    const result = await runCheck({ task: "clean data", output: "some output" });
    expect(result).toEqual(VALID_CRITIQUE);
    expect(result).not.toBe(FALLBACK_CRITIQUE);
  });

  it("returns FALLBACK_CRITIQUE when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "server error" }, false)));
    const result = await runCheck({ task: "clean data", output: "some output" });
    expect(result).toBe(FALLBACK_CRITIQUE);
  });

  it("returns FALLBACK_CRITIQUE when trustworthy is not a boolean", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ ...VALID_CRITIQUE, trustworthy: "yes" })
      )
    );
    const result = await runCheck({ task: "clean data", output: "some output" });
    expect(result).toBe(FALLBACK_CRITIQUE);
  });

  it("returns FALLBACK_CRITIQUE when dimensions is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ ...VALID_CRITIQUE, dimensions: "not-an-array" })
      )
    );
    const result = await runCheck({ task: "clean data", output: "some output" });
    expect(result).toBe(FALLBACK_CRITIQUE);
  });

  it("returns FALLBACK_CRITIQUE when fetch rejects (network error / abort)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const result = await runCheck({ task: "clean data", output: "some output" });
    expect(result).toBe(FALLBACK_CRITIQUE);
  });
});
