import { describe, it, expect } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "../../data/migratedData";

describe("Ewidencja OZiPZ - Harmonogram & Plan Pracy edu-report", () => {
  it("contains 94 authentic schedule items migrated from Firebase", () => {
    expect(MIGRATED_FIREBASE_DATA.schedules).toBeDefined();
    expect(MIGRATED_FIREBASE_DATA.schedules.length).toBe(94);
  });

  it("contains activityType dictionary with 18 authentic action forms for schedule binding", () => {
    const activityTypes = MIGRATED_FIREBASE_DATA.dictionaryItems.filter(
      (d) => d.dictType === "activityType" || d.dictType === "formy_dzialan"
    );
    expect(activityTypes.length).toBe(18);
    const labels = activityTypes.map((a) => a.label);
    expect(labels).toContain("Prelekcja (warsztat)");
    expect(labels).toContain("Konkurs (quiz)");
    expect(labels).toContain("Stoisko edukacyjno-informacyjne");
  });

  it("contains annotationReason dictionary with 30 official reasons for postponed items", () => {
    const reasons = MIGRATED_FIREBASE_DATA.dictionaryItems.filter(
      (d) => d.dictType === "annotationReason"
    );
    expect(reasons.length).toBe(30);
  });

  it("extracts event year and month accurately with fallback precedence", async () => {
    const { getEventYear, getEventMonth } = await import("../../utils/scheduleExecutionUtils");

    const eventWithYear: any = { year: 2026, eventDate: "2025-12-31", month: 1 };
    expect(getEventYear(eventWithYear)).toBe(2026);
    expect(getEventMonth(eventWithYear)).toBe(1);

    const eventWithDateOnly: any = { eventDate: "2026-08-15" };
    expect(getEventYear(eventWithDateOnly)).toBe(2026);
    expect(getEventMonth(eventWithDateOnly)).toBe(8);

    const eventWithoutDate: any = { month: 4 };
    expect(getEventMonth(eventWithoutDate)).toBe(4);
  });
});
