import { describe, it, expect } from "vitest";
import { summarizeRows } from "./spreadsheet";

describe("summarizeRows", () => {
  it("reports shape, numeric stats, and a sample", () => {
    const rows = [
      ["Business Unit", "FY24 Revenue"],
      ["North", 1200000],
      ["South", 980000],
      ["West", 1450000],
      ["Central", 0],
    ];
    const out = summarizeRows(rows, "Rev");
    expect(out).toContain('sheet "Rev"');
    expect(out).toContain("4 data rows x 2 columns");
    expect(out).toContain("FY24 Revenue: numeric");
    expect(out).toContain("sum=3630000"); // 1.2M+0.98M+1.45M+0
    expect(out).toContain("Business Unit: text");
    expect(out).toContain("Sample");
  });

  it("stays bounded for a large sheet (does not dump every row)", () => {
    const rows: (string | number)[][] = [["id", "amount"]];
    for (let i = 0; i < 10000; i++) rows.push([`r${i}`, i]);
    const out = summarizeRows(rows, "Big");
    expect(out).toContain("10000 data rows");
    expect(out.length).toBeLessThan(1200); // summary, not a 10k-row dump
    // only a handful of sample rows, not all 10000
    expect(out.split("\n").length).toBeLessThan(20);
  });

  it("counts blanks and handles an empty sheet", () => {
    expect(summarizeRows([], "X")).toContain("empty");
    const out = summarizeRows([["a", "b"], [1, ""], [2, "y"]], "S");
    expect(out).toContain("1 blank");
  });
});
