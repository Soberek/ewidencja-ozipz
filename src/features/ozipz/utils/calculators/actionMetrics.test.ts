import { describe, expect, it } from "vitest";
import { calculateSyntheticActionMetrics, isActionCancelled, isActionCountedInReports, isActionPostponed } from "./actionMetrics";
import type { OzipzAction } from "../../types/ozipz.types";

describe("statusy działań w sprawozdaniach", () => {
  it("odwołane i odroczone nie liczą się w sprawozdaniach", () => {
    for (const status of ["odwolane", "odwołane", "anulowane", "cancelled", "odroczone", "postponed", " Odroczone "]) {
      expect(isActionCountedInReports({ status })).toBe(false);
    }
  });

  it("wykonane i bez statusu liczą się", () => {
    for (const status of ["wykonane", ""]) {
      expect(isActionCountedInReports({ status })).toBe(true);
    }
  });

  it("rozróżnia odwołanie od odroczenia", () => {
    expect(isActionCancelled("odroczone")).toBe(false);
    expect(isActionPostponed("odroczone")).toBe(true);
    expect(isActionPostponed("anulowane")).toBe(false);
  });

  it("does not classify postponed actions as executed in synthetic metrics", () => {
    const actions = [
      { status: "wykonane", numberOfActions: 2, participantsCount: 10 },
      { status: "odroczone", numberOfActions: 5, participantsCount: 100 },
      { status: "odwolane", numberOfActions: 3, participantsCount: 100 },
    ] as OzipzAction[];
    const result = calculateSyntheticActionMetrics(actions);
    expect(result).toMatchObject({ tasksCount: 1, dzCount: 2, totalRecipients: 10, cancelledCount: 1 });
  });
});
