import { describe, expect, it } from "vitest";
import { isActionCancelled, isActionCountedInReports, isActionPostponed } from "./actionMetrics";

describe("statusy działań w sprawozdaniach", () => {
  it("odwołane i odroczone nie liczą się w sprawozdaniach", () => {
    for (const status of ["odwolane", "odwołane", "anulowane", "cancelled", "odroczone", "postponed", " Odroczone "]) {
      expect(isActionCountedInReports({ status })).toBe(false);
    }
  });

  it("wykonane, planowane i bez statusu liczą się", () => {
    for (const status of ["wykonane", "w_toku", "planowane", ""]) {
      expect(isActionCountedInReports({ status })).toBe(true);
    }
  });

  it("rozróżnia odwołanie od odroczenia", () => {
    expect(isActionCancelled("odroczone")).toBe(false);
    expect(isActionPostponed("odroczone")).toBe(true);
    expect(isActionPostponed("anulowane")).toBe(false);
  });
});
