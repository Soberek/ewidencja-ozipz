import { describe, it, expect } from "vitest";
import { buildIzrzAudienceDescription, sumAudienceCounts } from "./izrzAudience";

describe("buildIzrzAudienceDescription", () => {
  it("lists every recipient on its own line with per-action headers for several groups", () => {
    const raw =
      "Grupa 1: Uczniowie szkół podstawowych - 45, Kadra pedagogiczna - 5; Grupa 2: Uczniowie szkół podstawowych - 48, Kadra pedagogiczna - 4";
    expect(buildIzrzAudienceDescription(raw, { actionType: "Wykład", participantsCount: 102 })).toBe(
      [
        "Wykład 1:",
        "Uczniowie szkół podstawowych - 45",
        "Kadra pedagogiczna - 5",
        "Wykład 2:",
        "Uczniowie szkół podstawowych - 48",
        "Kadra pedagogiczna - 4",
      ].join("\n")
    );
  });

  it("uses the short form name (without parenthesis) in group headers", () => {
    const raw = "Grupa 1: Dzieci przedszkolne (3-6 lat) - 18; Grupa 2: Uczniowie szkół podstawowych (klasy I-VIII) - 22";
    expect(buildIzrzAudienceDescription(raw, { actionType: "Prelekcja (warsztat)", participantsCount: 40 })).toBe(
      "Prelekcja 1:\nDzieci przedszkolne (3-6 lat) - 18\nPrelekcja 2:\nUczniowie szkół podstawowych (klasy I-VIII) - 22"
    );
  });

  it("keeps custom group names as headers", () => {
    expect(buildIzrzAudienceDescription("Klasa 7A: Uczniowie - 20; Klasa 7B: Uczniowie - 21")).toBe(
      "Klasa 7A:\nUczniowie - 20\nKlasa 7B:\nUczniowie - 21"
    );
  });

  it("splits a single group into lines without a header", () => {
    expect(buildIzrzAudienceDescription("Opiekunowie - 3, Uczestnicy półkolonii - 30", { participantsCount: 33 })).toBe(
      "Opiekunowie - 3\nUczestnicy półkolonii - 30"
    );
  });

  it("does not break an enumeration that has one shared count", () => {
    expect(buildIzrzAudienceDescription("Dzieci, młodzież, dorośli, seniorzy - 150")).toBe(
      "Dzieci, młodzież, dorośli, seniorzy - 150"
    );
  });

  it("adds the participants count to a single recipient saved without a number", () => {
    expect(
      buildIzrzAudienceDescription("Mieszkańcy powiatu / społeczność lokalna", { participantsCount: 250 })
    ).toBe("Mieszkańcy powiatu / społeczność lokalna - 250");
    expect(buildIzrzAudienceDescription("Ogół społeczeństwa / Odbiorcy mediów", { participantsCount: 0 })).toBe(
      "Ogół społeczeństwa / Odbiorcy mediów"
    );
  });

  it("falls back to participants only when no group was recorded", () => {
    expect(buildIzrzAudienceDescription("", { participantsCount: 12 })).toBe("Uczestnicy - 12");
    expect(buildIzrzAudienceDescription(undefined)).toBe("");
  });
});

describe("sumAudienceCounts", () => {
  it("sums counts in raw audience strings and in generated descriptions", () => {
    const raw = "Grupa 1: Uczniowie - 45, Kadra - 5; Grupa 2: Uczniowie - 48";
    expect(sumAudienceCounts(raw)).toBe(98);
    expect(sumAudienceCounts(buildIzrzAudienceDescription(raw, { actionType: "Wykład" }))).toBe(98);
    expect(sumAudienceCounts("Mieszkańcy powiatu")).toBe(0);
  });
});
