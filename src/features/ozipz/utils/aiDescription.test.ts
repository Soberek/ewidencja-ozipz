import { describe, expect, it } from "vitest";
import { buildSystemPrompt, buildUserPrompt, cleanGeneratedDescription } from "./aiDescription";
import { buildActionFacts, buildTemplateFacts } from "./aiDescriptionFacts";

describe("prompt opisu działania", () => {
  it("pomija puste dane i dołącza wpisany tekst jako notatki do uwzględnienia", () => {
    const prompt = buildUserPrompt([["Forma działania", "Prelekcja"], ["Miejsce", "  "], ["Odbiorcy", null]], "  Uczniowie byli aktywni.  ");
    expect(prompt).toContain("- Forma działania: Prelekcja");
    expect(prompt).not.toContain("Miejsce");
    expect(prompt).not.toContain("Odbiorcy");
    expect(prompt).toContain("Notatki użytkownika do uwzględnienia:\nUczniowie byli aktywni.");
  });

  it("bez wpisanego tekstu zaznacza brak notatek", () => {
    expect(buildUserPrompt([["Forma działania", "Prelekcja"]], "")).toContain("Notatki użytkownika: brak.");
  });

  it("szablon zakazuje dat i liczb, działanie wymaga czasu przeszłego", () => {
    expect(buildSystemPrompt("template")).toContain("nie podawaj dat, miejsc, liczby osób");
    expect(buildSystemPrompt("action")).toContain("czasu przeszłego");
    expect(buildSystemPrompt("action")).toContain("nie wymyślaj liczb");
  });
});

describe("cleanGeneratedDescription", () => {
  it("zdejmuje cudzysłów, nagłówek i formatowanie", () => {
    expect(cleanGeneratedDescription("**Opis czynności:** „Przeprowadzono prelekcję.”")).toBe("Przeprowadzono prelekcję.");
    expect(cleanGeneratedDescription("```\nPrzeprowadzono prelekcję.\n```")).toBe("Przeprowadzono prelekcję.");
  });
});

describe("fakty z formularzy", () => {
  it("działanie: data po polsku, liczby tylko gdy podane, bez osoby prowadzącej", () => {
    const facts = buildActionFacts({
      actionType: "Prelekcja", title: "Higiena rąk", program: "", campaign: "", date: "2026-11-16", facilityName: "SP 1",
      municipality: "Myślibórz", audience: "Uczniowie (10-12 lat)", participantsCount: 0, materials: ["Plakat", "Ulotka"], numberOfActions: 1,
    });
    const text = buildUserPrompt(facts, "");
    expect(text).toContain("Data realizacji: 16.11.2026");
    expect(text).toContain("Miejsce: SP 1, Myślibórz");
    expect(text).toContain("Materiały edukacyjne: Plakat; Ulotka");
    expect(text).not.toContain("Liczba uczestników");
    expect(text).not.toContain("Liczba zrealizowanych działań");
    expect(text).not.toContain("prowadząc");
  });

  it("szablon nie ma daty, miejsca ani liczb; tytułem bywa nazwa szablonu", () => {
    const text = buildUserPrompt(buildTemplateFacts({
      actionType: "Prelekcja", title: "", name: "4 prelekcje", program: "", campaign: "",
      audienceGroups: [{ name: "", items: [{ name: "Uczniowie" }, { name: "Rodzice" }] }], materials: [],
    }), "");
    expect(text).toContain("Tytuł: 4 prelekcje");
    expect(text).toContain("Odbiorcy: Uczniowie, Rodzice");
    expect(text).not.toMatch(/Data|Miejsce|Liczba/);
  });
});
