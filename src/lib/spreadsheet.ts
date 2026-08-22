// Compact, bounded summary of a spreadsheet for the Gemini check.
// Sending a structured summary (shape, per-column stats, a few sample rows)
// instead of a raw dump keeps token cost flat regardless of file size AND gives
// a better check — Gemini reasons about structure, not truncated rows.

export type Cell = string | number | boolean | null | undefined;

const MAX_COLS = 30;
const SAMPLE_ROWS = 5;

function toNumber(v: Cell): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,%₹$€£\s]/g, "");
    if (cleaned === "" || isNaN(Number(cleaned))) return null;
    return Number(cleaned);
  }
  return null;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Summarize a sheet given as a 2D array (row 0 = headers).
 * Output is compact (bounded columns + sample rows), safe to send to an LLM.
 */
export function summarizeRows(rows: Cell[][], sheetName = "Sheet1"): string {
  if (!rows || rows.length === 0) return `Sheet "${sheetName}" is empty.`;
  const headerRow = rows[0] ?? [];
  const headers = headerRow.map((h, i) => (h == null || h === "" ? `Col${i + 1}` : String(h)));
  const data = rows.slice(1);
  const nRows = data.length;
  const nCols = Math.min(headers.length, MAX_COLS);

  const lines: string[] = [];
  lines.push(`Spreadsheet summary — sheet "${sheetName}"`);
  lines.push(`${nRows} data rows x ${headers.length} columns${headers.length > MAX_COLS ? ` (first ${MAX_COLS} summarized)` : ""}.`);
  lines.push("Columns:");

  for (let c = 0; c < nCols; c++) {
    const col = data.map((r) => r?.[c]);
    const nonBlank = col.filter((v) => v !== null && v !== undefined && v !== "");
    const blanks = nRows - nonBlank.length;
    const nums = nonBlank.map(toNumber).filter((n): n is number => n !== null);
    const isNumeric = nonBlank.length > 0 && nums.length >= nonBlank.length * 0.8;

    if (isNumeric) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      lines.push(`- ${headers[c]}: numeric · sum=${round(sum)} · min=${round(min)} · max=${round(max)}${blanks ? ` · ${blanks} blank` : ""}`);
    } else {
      const distinct = new Set(nonBlank.map((v) => String(v))).size;
      lines.push(`- ${headers[c]}: text · ${distinct} distinct value${distinct === 1 ? "" : "s"}${blanks ? ` · ${blanks} blank` : ""}`);
    }
  }

  const k = Math.min(SAMPLE_ROWS, nRows);
  if (k > 0) {
    lines.push(`Sample (first ${k} of ${nRows} rows):`);
    lines.push(headers.slice(0, nCols).join(" | "));
    for (let i = 0; i < k; i++) {
      const r = rows[i + 1] ?? [];
      lines.push(r.slice(0, nCols).map((v) => (v == null ? "" : String(v))).join(" | "));
    }
  }
  return lines.join("\n");
}
