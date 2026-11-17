import { describe, it, expect } from "vitest";
import { buildIzrzHtml } from "./izrzPrint";
import { prepareIzrzData } from "./izrzGenerator";

describe("buildIzrzHtml", () => {
  const data = prepareIzrzData(
    {
      title: "Stoisko",
      actionType: "Stoisko edukacyjne",
      date: "2026-05-14",
      facilityName: "Szkoła <Podstawowa>",
      participantsCount: 20,
      audienceGroup: "Uczniowie - 20",
      programName: "Trzymaj Formę!",
      izrzSign: "IZRZ: 12/2026",
      jrwaSign: "OZ.966.1.12.2026",
      notes: "Opis przebiegu.\n\nUwagi: Dni otwarte",
    },
    null,
    { materials: [{ title: "Ulotka", quantity: 20 }] }
  );

  it("prints all seven points with the same content as the docx", () => {
    const html = buildIzrzHtml(data);
    expect(html).toContain("Informacja dotycząca realizacji zadania 12/2026");
    expect(html).toContain("Znak sprawy:</strong> OZiPZ.966.1.12.2026");
    expect(html).toContain("2. Forma zadania:");
    expect(html).toContain("Stoisko edukacyjne, dystrybucja");
    expect(html).toContain("14.05.2026");
    expect(html).toContain("Opis przebiegu.");
    expect(html).toContain("Dni otwarte");
    expect(html).toContain("Załączniki:<br>1. Rozdzielnik materiałów");
    expect(html).toContain("(podpis osoby odpowiedzialnej)");
    for (let n = 1; n <= 7; n++) expect(html).toContain(`${n}. `);
  });

  it("escapes user text", () => {
    expect(buildIzrzHtml(data)).not.toContain("<Podstawowa>");
  });
});
