import { describe, it, expect } from "vitest";
import {
  isAdultVacationRecipientGroup,
  vacationAgeRangeLabel,
  classifyVacationRecipient,
  buildVacationSummary,
  isVacationAction,
} from "./vacationReporting";
import type { OzipzAction } from "../types/ozipz.types";

describe("vacationReporting", () => {
  describe("isAdultVacationRecipientGroup", () => {
    it("recognizes adult groups and roles", () => {
      expect(isAdultVacationRecipientGroup("Rodzice i opiekunowie")).toBe(true);
      expect(isAdultVacationRecipientGroup("Kadra wypoczynku")).toBe(true);
      expect(isAdultVacationRecipientGroup("Nauczyciele")).toBe(true);
      expect(isAdultVacationRecipientGroup("Dorośli mieszkańcy")).toBe(true);
      expect(isAdultVacationRecipientGroup("Seniorzy")).toBe(true);
      expect(isAdultVacationRecipientGroup("Przedstawiciele mediów")).toBe(true);
      expect(isAdultVacationRecipientGroup("Pracownicy instytucji")).toBe(true);
    });

    it("returns false for non-adult groups", () => {
      expect(isAdultVacationRecipientGroup("Uczniowie")).toBe(false);
      expect(isAdultVacationRecipientGroup("Dzieci w wieku 7-10 lat")).toBe(false);
      expect(isAdultVacationRecipientGroup("Młodzież obozowa")).toBe(false);
      expect(isAdultVacationRecipientGroup(null)).toBe(false);
      expect(isAdultVacationRecipientGroup(undefined)).toBe(false);
    });
  });

  describe("vacationAgeRangeLabel", () => {
    it("formats age ranges accurately", () => {
      expect(vacationAgeRangeLabel(null, null)).toBeNull();
      expect(vacationAgeRangeLabel(undefined, undefined)).toBeNull();
      expect(vacationAgeRangeLabel(8, 8)).toBe("8 lat");
      expect(vacationAgeRangeLabel(7, 12)).toBe("7–12 lat");
      expect(vacationAgeRangeLabel(15, 10)).toBe("10–15 lat");
      expect(vacationAgeRangeLabel(6, null)).toBe("od 6 lat");
      expect(vacationAgeRangeLabel(null, 18)).toBe("do 18 lat");
    });
  });

  describe("classifyVacationRecipient", () => {
    it("classifies recipient by age when age range is present", () => {
      const res = classifyVacationRecipient({ group: "Uczestnicy", ageFrom: 7, ageTo: 10 });
      expect(res.kind).toBe("wiek");
      expect(res.label).toBe("7–10 lat");
    });

    it("classifies as adult when no age range but adult group name", () => {
      const res = classifyVacationRecipient({ group: "Opiekunowie kolonii" });
      expect(res.kind).toBe("dorosli");
      expect(res.label).toBe("Dorośli");
    });

    it("classifies as general group when child/general group without age", () => {
      const res = classifyVacationRecipient({ group: "Dzieci z półkolonii" });
      expect(res.kind).toBe("grupa");
      expect(res.label).toBe("Dzieci z półkolonii");
    });

    it("handles empty or missing group cleanly", () => {
      const res = classifyVacationRecipient({});
      expect(res.kind).toBe("grupa");
      expect(res.label).toBe("Bez grupy");
    });
  });

  describe("buildVacationSummary", () => {
    it("aggregates actions for Bezpieczne Wakacje (JRWA 966.14 or wakacje keyword)", () => {
      const mockActions: Partial<OzipzAction>[] = [
        {
          id: "1",
          title: "Prelekcja o kleszczach i kąpieli",
          actionType: "Prelekcja",
          jrwaSign: "966.14.1.2026",
          numberOfActions: 2,
          participantsCount: 40,
          audienceGroup: "Uczestnicy półkolonii",
          materialsDistributedCount: 40,
        },
        {
          id: "2",
          title: "Spotkanie z kadrą kolonijną",
          actionType: "Instruktaż",
          jrwaCaseId: "966.14",
          numberOfActions: 1,
          participantsCount: 15,
          audienceGroup: "Kadra pedagogiczna i opiekunowie",
          materialsDistributedCount: 15,
        },
        {
          id: "3",
          title: "Higiena rąk w szkole",
          topic: "Higiena",
          jrwaSign: "966.4.1.2026",
          numberOfActions: 1,
          participantsCount: 30,
          audienceGroup: "Uczniowie",
        },
      ];

      const summary = buildVacationSummary(mockActions as OzipzAction[]);

      // Only actions 1 and 2 match 966.14
      expect(summary.byActivity).toHaveLength(2);
      expect(summary.byActivity[0].label).toBe("Prelekcja (warsztat)");
      expect(summary.byActivity[0].value).toBe(2);
      expect(summary.byActivity[1].label).toBe("Rozmowa indywidualna (instruktaż)");
      expect(summary.byActivity[1].value).toBe(1);

      expect(summary.byGroup).toHaveLength(2);
      expect(summary.recipientsSplit.adults).toBe(15);
      expect(summary.recipientsSplit.childrenWithoutAge).toBe(40);

      expect(summary.byMaterial).toHaveLength(1);
      expect(summary.byMaterial[0].value).toBe(55);
      expect(summary.byMaterialType[0].value).toBe(55);
    });

    it("matches actions by keyword in title or topic even without explicit JRWA sign", () => {
      const mockActions: Partial<OzipzAction>[] = [
        {
          id: "1",
          title: "Bezpieczne wakacje nad wodą",
          actionType: "Pogadanka",
          numberOfActions: 1,
          participantsCount: 25,
          audienceGroup: "Dzieci",
        },
        {
          id: "2",
          title: "Pogadanka w przedszkolu",
          topic: "Bezpieczne wakacje i słońce",
          actionType: "Pogadanka",
          numberOfActions: 1,
          participantsCount: 20,
          audienceGroup: "Przedszkolaki",
        },
      ];

      const summary = buildVacationSummary(mockActions as OzipzAction[]);
      // Both are Pogadanka -> mapped to Prelekcja (warsztat), aggregated into 1 row with count 2
      expect(summary.byActivity).toHaveLength(1);
      expect(summary.byActivity[0].label).toBe("Prelekcja (warsztat)");
      expect(summary.byActivity[0].value).toBe(2);
      expect(summary.recipientsSplit.childrenWithoutAge).toBe(45);
    });

    it("groups social media actions by official dictionary activity types rather than raw tweet text or abbreviations", () => {
      const mockActions: Partial<OzipzAction>[] = [
        {
          id: "tw-1",
          title: "Jasne, zwłaszcza białe ubrania, odbijają więcej promieniowania słonecznego niż ciemne... #Lato #Upał",
          actionType: "Publikacja media (Portal X)",
          jrwaSign: "966.14.1.2026",
          numberOfActions: 1,
          participantsCount: 150,
        },
        {
          id: "fb-1",
          title: "BW",
          actionType: "Publikacja media (Facebook)",
          jrwaSign: "966.14.2.2026",
          numberOfActions: 1,
          participantsCount: 200,
        },
        {
          id: "fb-2",
          title: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego na terenie powiatu myśliborskiego",
          actionType: "Publikacja media (Facebook)",
          jrwaSign: "966.14.3.2026",
          numberOfActions: 1,
          participantsCount: 300,
        },
        {
          id: "st-1",
          title: "Stoisko edukacyjno-informacyjne OZiPZ",
          actionType: "Stoisko edukacyjno-informacyjne",
          jrwaSign: "966.14.4.2026",
          numberOfActions: 1,
          participantsCount: 80,
        },
      ];

      const summary = buildVacationSummary(mockActions as OzipzAction[]);
      const labels = summary.byActivity.map((r) => r.label);

      // Must be canonical dictionary forms
      expect(labels).toContain("Publikacja media (Facebook)");
      expect(labels).toContain("Publikacja media (Portal X)");
      expect(labels).toContain("Stoisko edukacyjno-informacyjne");

      // Must NOT contain tweet text, abbreviation BW, or full program name
      expect(labels).not.toContain("BW");
      expect(labels.some((l) => l.includes("Jasne, zwłaszcza białe ubrania"))).toBe(false);
      expect(labels.some((l) => l.includes("Bezpieczeństwo dzieci"))).toBe(false);

      // Facebook actions should be aggregated together (1 + 1 = 2 actions)
      const fbRow = summary.byActivity.find((r) => r.label === "Publikacja media (Facebook)");
      expect(fbRow?.value).toBe(2);
    });

    it("strictly rejects actions belonging to other JRWA symbols (966.1, 966.3, 966.4) even if title mentions wakacje", () => {
      const mockActions: Partial<OzipzAction>[] = [
        {
          id: "tf-1",
          title: "Trzymaj Formę - zdrowe nawyki na wakacje",
          jrwaSign: "OZiPZ.966.1.1.2026",
          participantsCount: 35,
          numberOfActions: 1,
        },
        {
          id: "hig-1",
          title: "Czyste ręce przed wakacjami",
          jrwaCaseId: "966.3",
          participantsCount: 25,
          numberOfActions: 1,
        },
        {
          id: "bw-1",
          title: "Bezpieczny wypoczynek nad jeziorem",
          actionType: "Prelekcja",
          jrwaSign: "OZiPZ.966.14.10.2026",
          participantsCount: 50,
          numberOfActions: 1,
        },
      ];

      const summary = buildVacationSummary(mockActions as OzipzAction[]);
      expect(summary.byActivity).toHaveLength(1);
      expect(summary.byActivity[0].label).toBe("Prelekcja (warsztat)");
      expect(summary.recipientsSplit.childrenWithoutAge).toBe(50);
    });

    it("verifies isVacationAction returns true only for 966.14 or explicit Bezpieczne Wakacje/Ferie campaign", () => {
      expect(isVacationAction({ jrwaSign: "OZiPZ.966.14.35.2026" })).toBe(true);
      expect(isVacationAction({ jrwaCaseId: "966.14" })).toBe(true);
      expect(isVacationAction({ campaignName: "Bezpieczne Wakacje" })).toBe(true);
      expect(isVacationAction({ campaignName: "Bezpieczne Ferie" })).toBe(true);
      expect(isVacationAction({ programId: "bezpieczne-wakacje" })).toBe(true);

      // Rejections: other programs/JRWA are never counted even with keywords
      expect(isVacationAction({ jrwaSign: "OZiPZ.966.1.1.2026", title: "Bezpieczne wakacje" })).toBe(false);
      expect(isVacationAction({ jrwaCaseId: "966.3", title: "Bezpieczne wakacje" })).toBe(false);
      expect(isVacationAction({ jrwaSign: "OZiPZ.966.4.1.2026", topic: "wakacje" })).toBe(false);
      expect(isVacationAction({ title: "Zwykłe spotkanie", topic: "inne" })).toBe(false);
    });
  });
});
