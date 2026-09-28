import { describe, expect, it } from "vitest";
import { csvCell } from "./csv";

describe("csvCell", () => {
  it("neutralizes spreadsheet formulas after leading whitespace and control characters", () => {
    for (const value of ["=1+1", "+cmd", "-2+3", "@SUM(1)", " \t=1+1", "\u0000\r@SUM(1)"]) {
      expect(csvCell(value)).toBe(`"'${value}"`);
    }
  });

  it("preserves numbers, dates, and CSV quoting", () => {
    expect(csvCell(-12)).toBe('"-12"');
    expect(csvCell("2026-09-26")).toBe('"2026-09-26"');
    expect(csvCell('Hello; "world"')).toBe('"Hello; ""world"""');
  });
});
