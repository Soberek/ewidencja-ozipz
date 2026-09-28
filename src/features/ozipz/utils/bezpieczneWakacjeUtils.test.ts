import { describe, it, expect } from "vitest";
import {
  isAdultGrupa,
  ageRangeLabel,
  classifyOdbiorcaBw,
  buildBezpieczneWakacjeSummary,
  BEZPIECZNE_WAKACJE_JRWA,
} from "./bezpieczneWakacjeUtils";

describe("bezpieczneWakacjeUtils", () => {
  it("should classify adult groups vs youth correctly", () => {
    expect(isAdultGrupa("Nauczyciele i wychowawcy")).toBe(true);
    expect(isAdultGrupa("Rodzice / opiekunowie")).toBe(true);
    expect(isAdultGrupa("Kadra kolonijna")).toBe(true);
    expect(isAdultGrupa("Uczniowie szkół podstawowych")).toBe(false);
  });

  it("should format age range labels", () => {
    expect(ageRangeLabel(7, 12)).toBe("7–12 lat");
    expect(ageRangeLabel(10, 10)).toBe("10 lat");
    expect(ageRangeLabel(15, null)).toBe("od 15 lat");
    expect(ageRangeLabel(null, 6)).toBe("do 6 lat");
    expect(ageRangeLabel(null, null)).toBeNull();
  });

  it("should classify recipients into age, adults or group", () => {
    expect(classifyOdbiorcaBw({ wiek_od: 7, wiek_do: 12 })).toEqual({ kind: "wiek", label: "7–12 lat" });
    expect(classifyOdbiorcaBw({ audienceGroup: "Kadra pedagogiczna" })).toEqual({ kind: "dorosli", label: "Dorośli" });
    expect(classifyOdbiorcaBw({ audienceGroup: "Nauczyciele", wiek_od: 25, wiek_do: 60 })).toEqual({ kind: "dorosli", label: "Dorośli" });
    expect(classifyOdbiorcaBw({ wiek_od: 25, wiek_do: 50 })).toEqual({ kind: "dorosli", label: "Dorośli" });
    expect(classifyOdbiorcaBw({ audienceGroup: "Harcerze" })).toEqual({ kind: "grupa", label: "Harcerze" });
  });

  it("should aggregate actions for Bezpieczne Wakacje summary", () => {
    const summary = buildBezpieczneWakacjeSummary(
      [
        {
          jrwa: BEZPIECZNE_WAKACJE_JRWA,
          date: "2026-07-10",
          title: "Prelekcja o bezpieczeństwie",
          numberOfActions: 2,
          participantsCount: 40,
          audienceGroup: "Półkolonie",
          odbiorcy: [
            { grupa_nazwa: "Półkolonie", liczba_osob: 35, wiek_od: 7, wiek_do: 12 },
            { grupa_nazwa: "Opiekunowie", liczba_osob: 5 },
          ],
          materialsDistributedCount: 40,
        },
      ],
      { rok: 2026, months: [7, 8] }
    );

    expect(summary.zadaniaCount).toBe(1);
    expect(summary.allActions).toBe(2);
    expect(summary.allPeople).toBe(40);
    expect(summary.odbiorcySplit.dorosli).toBe(5);
    expect(summary.odbiorcySplit.zWiekiem).toBe(35);
    expect(summary.byDzialanie[0].name).toBe("Prelekcja (warsztat)");
    expect(summary.byDzialanie[0].actions).toBe(2);
  });

  it("should match actions based on title/topic keywords when JRWA is not explicitly attached", () => {
    const summary = buildBezpieczneWakacjeSummary(
      [
        {
          title: "Spotkanie z dziećmi: Bezpieczne Wakacje nad wodą",
          date: "2026-07-15",
          numberOfActions: 1,
          participantsCount: 25,
          audienceGroup: "Dzieci",
        },
        {
          topic: "Bezpieczne ferie zimowe na stoku",
          date: "2026-07-20",
          numberOfActions: 1,
          participantsCount: 30,
        },
        {
          title: "Odwołana akcja wakacyjna",
          status: "odwolane",
          date: "2026-07-22",
          numberOfActions: 1,
          participantsCount: 10,
        },
      ],
      { rok: 2026, months: [7] }
    );

    expect(summary.zadaniaCount).toBe(2);
    expect(summary.allActions).toBe(2);
    expect(summary.allPeople).toBe(55);
  });

  it("should handle empty action list and empty months without errors", () => {
    const summaryEmpty = buildBezpieczneWakacjeSummary([], { rok: 2026, months: [] });
    expect(summaryEmpty.zadaniaCount).toBe(0);
    expect(summaryEmpty.allActions).toBe(0);
    expect(summaryEmpty.allPeople).toBe(0);
    expect(summaryEmpty.odbiorcySplit.dorosli).toBe(0);

    const summaryNoActions = buildBezpieczneWakacjeSummary([], { rok: 2026, months: [7, 8] });
    expect(summaryNoActions.zadaniaCount).toBe(0);
    expect(summaryNoActions.allPeople).toBe(0);
  });

  it("should group by canonical dictionary action forms and never use raw tweet contents or abbreviations", () => {
    const summary = buildBezpieczneWakacjeSummary(
      [
        {
          jrwa: BEZPIECZNE_WAKACJE_JRWA,
          date: "2026-07-05",
          title: "Jasne, zwłaszcza białe ubrania odbijają słońce... #Lato",
          actionType: "Publikacja media (Portal X)",
          numberOfActions: 1,
          participantsCount: 120,
        },
        {
          jrwa: BEZPIECZNE_WAKACJE_JRWA,
          date: "2026-07-06",
          title: "BW",
          actionType: "Publikacja media (Facebook)",
          numberOfActions: 1,
          participantsCount: 200,
        },
        {
          jrwa: BEZPIECZNE_WAKACJE_JRWA,
          date: "2026-07-07",
          title: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego na terenie powiatu myśliborskiego",
          actionType: "Publikacja media (Facebook)",
          numberOfActions: 1,
          participantsCount: 250,
        },
        {
          jrwa: BEZPIECZNE_WAKACJE_JRWA,
          date: "2026-07-08",
          title: "Stoisko edukacyjno-informacyjne OZiPZ",
          actionType: "Stoisko edukacyjno-informacyjne",
          numberOfActions: 1,
          participantsCount: 50,
        },
      ],
      { rok: 2026, months: [7] }
    );

    const names = summary.byDzialanie.map((d) => d.name);
    expect(names).toContain("Publikacja media (Facebook)");
    expect(names).toContain("Publikacja media (Portal X)");
    expect(names).toContain("Stoisko edukacyjno-informacyjne");

    expect(names).not.toContain("BW");
    expect(names.some((n) => n.includes("Jasne, zwłaszcza białe ubrania"))).toBe(false);
    expect(names.some((n) => n.includes("Bezpieczeństwo dzieci"))).toBe(false);

    const fbGroup = summary.byDzialanie.find((d) => d.name === "Publikacja media (Facebook)");
    expect(fbGroup?.actions).toBe(2);
    expect(fbGroup?.zadania).toBe(2);
    expect(fbGroup?.people).toBe(450);
  });
});
