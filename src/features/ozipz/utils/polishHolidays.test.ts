import { describe, expect, it } from "vitest";
import { findPolishHoliday, getPolishHolidays } from "./polishHolidays";

describe("getPolishHolidays", () => {
  it("wylicza święta ruchome od Wielkanocy", () => {
    expect(findPolishHoliday("2026-04-05")).toBe("Wielkanoc");
    expect(findPolishHoliday("2026-04-06")).toBe("Poniedziałek Wielkanocny");
    expect(findPolishHoliday("2026-06-04")).toBe("Boże Ciało");
    expect(findPolishHoliday("2027-03-28")).toBe("Wielkanoc");
  });

  it("uwzględnia Wigilię jako dzień wolny od 2025 r.", () => {
    expect(findPolishHoliday("2024-12-24")).toBeUndefined();
    expect(findPolishHoliday("2026-12-24")).toBe("Wigilia Bożego Narodzenia");
    expect(getPolishHolidays(2026)).toHaveLength(14);
  });

  it("nie oznacza zwykłych dni jako świąt", () => {
    expect(findPolishHoliday("2026-10-03")).toBeUndefined();
    expect(findPolishHoliday("")).toBeUndefined();
  });
});
