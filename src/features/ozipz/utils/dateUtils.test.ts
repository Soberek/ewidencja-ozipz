import { describe, it, expect, vi } from "vitest";
import {
  getTodayIsoDate,
  safeParseDate,
  getMonthKey,
  getYearKey,
  getYearNumber,
  isMonthClosed,
  formatDatePl,
  formatFullDatePl,
  formatMonthYearPl,
  compareDatesDesc,
  compareDatesAsc,
  getStoredClosedMonths,
} from "./dateUtils";

describe("dateUtils (date-fns helper functions)", () => {
  it("getTodayIsoDate returns current local date in YYYY-MM-DD format", () => {
    const today = getTodayIsoDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("getTodayIsoDate uses the local day of a supplied instant", () => {
    vi.stubEnv("TZ", "Europe/Warsaw");
    try {
      expect(getTodayIsoDate(new Date("2026-01-01T23:30:00Z"))).toBe("2026-01-02");
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("safeParseDate parses ISO, Polish dot format, slash format, and Date objects", () => {
    expect(safeParseDate("2026-08-30")).not.toBeNull();
    expect(safeParseDate("30.08.2026")).not.toBeNull();
    expect(safeParseDate("30/08/2026")).not.toBeNull();
    expect(safeParseDate(new Date(2026, 7, 30))).not.toBeNull();
    expect(safeParseDate("invalid-date")).toBeNull();
    expect(safeParseDate(null)).toBeNull();
    expect(safeParseDate(undefined)).toBeNull();
    expect(safeParseDate("")).toBeNull();
  });

  it("getMonthKey returns standard YYYY-MM format across varied inputs", () => {
    expect(getMonthKey("2026-08-30")).toBe("2026-08");
    expect(getMonthKey("30.08.2026")).toBe("2026-08");
    expect(getMonthKey("05.01.2026")).toBe("2026-01");
    expect(getMonthKey(new Date(2026, 11, 24))).toBe("2026-12");
    expect(getMonthKey("")).toBe("");
    expect(getMonthKey(null)).toBe("");
  });

  it("getYearKey and getYearNumber return accurate 4-digit years", () => {
    expect(getYearKey("2026-08-30")).toBe("2026");
    expect(getYearKey("15.03.2025")).toBe("2025");
    expect(getYearNumber("2026-08-30")).toBe(2026);
    expect(getYearNumber("invalid", 2026)).toBe(2026);
  });

  it("isMonthClosed checks closed months set reliably", () => {
    const closedSet = new Set(["2026-07", "2026-06"]);
    expect(isMonthClosed("2026-07-15", closedSet)).toBe(true);
    expect(isMonthClosed("15.07.2026", closedSet)).toBe(true);
    expect(isMonthClosed("2026-08-01", closedSet)).toBe(false);
    expect(isMonthClosed("2026-07-01", ["2026-07"])).toBe(true);
    expect(isMonthClosed(null, closedSet)).toBe(false);
  });

  it("formatDatePl and formatFullDatePl output Polish formatted dates", () => {
    expect(formatDatePl("2026-08-30")).toBe("30.08.2026");
    expect(formatDatePl("invalid", "brak")).toBe("brak");
    expect(formatFullDatePl("2026-08-30")).toBe("30 sierpnia 2026");
    expect(formatMonthYearPl("2026-08-30")).toBe("sierpień 2026");
  });

  it("compareDatesDesc and compareDatesAsc sort dates chronologically", () => {
    const dates = ["2026-01-10", "2026-08-30", "2025-12-31"];
    const sortedDesc = [...dates].sort(compareDatesDesc);
    expect(sortedDesc).toEqual(["2026-08-30", "2026-01-10", "2025-12-31"]);

    const sortedAsc = [...dates].sort(compareDatesAsc);
    expect(sortedAsc).toEqual(["2025-12-31", "2026-01-10", "2026-08-30"]);
  });

  it("getStoredClosedMonths only locks months explicitly saved by the user", () => {
    localStorage.clear();
    const defaults = getStoredClosedMonths();
    expect(defaults.size).toBe(0);

    localStorage.setItem("oz.closedMonths", JSON.stringify(["2026-01", "2026-02"]));
    const loaded = getStoredClosedMonths();
    expect(loaded.has("2026-01")).toBe(true);
    expect(loaded.has("2026-02")).toBe(true);
    expect(loaded.has("2026-07")).toBe(false);
  });
});
