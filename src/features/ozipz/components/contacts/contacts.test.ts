import { describe, it, expect } from "vitest";
import { MIGRATED_FIREBASE_DATA } from "../../data/migratedData";

describe("Ewidencja OZiPZ - snapshot bez danych osobowych", () => {
  // The snapshot ships inside the public installer, so it must not carry third-party contact details.
  it("ships no contacts from edu-report", () => {
    expect(MIGRATED_FIREBASE_DATA.contacts).toEqual([]);
  });

  it("ships facilities without coordinator names, phones or e-mails", () => {
    MIGRATED_FIREBASE_DATA.facilities.forEach((f) => {
      expect(f.defaultCoordinatorName ?? "").toBe("");
      expect(f.defaultCoordinatorPhone ?? "").toBe("");
      expect(f.defaultCoordinatorEmail ?? "").toBe("");
      expect(f.notes ?? "").not.toMatch(/@|Telefon/);
    });
  });
});
