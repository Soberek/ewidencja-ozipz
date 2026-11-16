import { describe, expect, it } from "vitest";
import type { OzipzDictionaryItem, OzipzMaterial, OzipzProgram, OzipzTemplate } from "../types/ozipz.types";
import {
  buildTemplatePayload, describeTemplateContent, resolveTemplateContent, templateContentKey, templateDetailRows, usableTemplates,
  type TemplateContent,
} from "./templateUtils";

const program = { id: "prog-wzw", name: "Profilaktyka chorób zakaźnych", jrwaSymbol: "966.8" } as OzipzProgram;
const legacy = (overrides: Partial<OzipzTemplate>): OzipzTemplate => ({
  id: "t", title: "Szablon", topic: "", actionType: "Prelekcja (warsztat)", defaultAudience: "", descriptionTemplate: "",
  createdAt: "", updatedAt: "", ...overrides,
});
const content: TemplateContent = {
  name: " 4 prelekcje ", actionType: "Prelekcja (warsztat)", title: "", programId: "prog-wzw", jrwaSymbol: "966.8",
  campaignId: "", leadEducator: " Anna ", numberOfActions: 4,
  audienceGroups: [
    { name: "Grupa 1", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }, { name: " ", ageFrom: null, ageTo: null }] },
    { name: "Klasa 7B", items: [{ name: "Rodzice" }] },
    { name: "", items: [{ name: "" }] },
  ],
  materialIds: ["mat-1", "", "mat-1"],
  description: "",
};

describe("templateUtils", () => {
  it("zapisuje treść po identyfikatorach, bez pustych pozycji, powtórzeń i automatycznych nazw grup", () => {
    const payload = buildTemplatePayload(content);
    expect(payload).toMatchObject({ title: "4 prelekcje", topic: "", defaultAudience: "", descriptionTemplate: "" });
    expect(payload.actionDefaults).toEqual({
      title: "", leadEducator: "Anna", campaignId: "", programId: "prog-wzw", jrwaSymbol: "", numberOfActions: 4,
      audienceGroups: [
        { name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }] },
        { name: "Klasa 7B", items: [{ name: "Rodzice", ageFrom: null, ageTo: null }] },
      ],
      materialIds: ["mat-1"],
    });
    expect(payload).not.toHaveProperty("suggestedMaterials");
  });

  it("odczytuje zapisany szablon bez zmian", () => {
    const saved = { ...legacy({}), ...buildTemplatePayload(content), id: "t" };
    expect(templateContentKey(resolveTemplateContent(saved, [program]))).toBe(templateContentKey(content));
  });

  it("starszy szablon: program po nazwie, a spłaszczoną listę odbiorców łączy w jedną grupę bez powtórzeń", () => {
    const resolved = resolveTemplateContent(legacy({
      topic: program.name,
      defaultAudience: "Uczniowie; Rodzice; Uczniowie; Rodzice",
      actionDefaults: { title: program.name, leadEducator: "Anna", campaignId: "" },
    }), [program]);
    expect(resolved).toMatchObject({ programId: "prog-wzw", jrwaSymbol: "", numberOfActions: 1, leadEducator: "Anna", materialIds: [] });
    expect(resolved.audienceGroups).toEqual([{ name: "", items: [
      { name: "Uczniowie", ageFrom: null, ageTo: null }, { name: "Rodzice", ageFrom: null, ageTo: null },
    ] }]);
  });

  it("starszy szablon: symbol JRWA z tekstu, jawne grupy i bez liczb osób", () => {
    const resolved = resolveTemplateContent(legacy({
      topic: "JRWA 966.3 - Zdrowe zęby",
      defaultAudience: "Klasa 1A: Uczniowie - 20, Rodzice - 5; Klasa 1B: Uczniowie - 18",
    }));
    expect(resolved.jrwaSymbol).toBe("966.3");
    expect(resolved.audienceGroups.map((g) => [g.name, g.items.map((i) => i.name)])).toEqual([
      ["Klasa 1A", ["Uczniowie", "Rodzice"]], ["Klasa 1B", ["Uczniowie"]],
    ]);
  });

  it("opisuje treść nazwami z katalogów i oznacza pozycje usunięte z katalogu", () => {
    const summary = describeTemplateContent(content, { programs: [program], materials: [] });
    expect(summary).toEqual({
      programName: program.name,
      jrwaSymbol: "966.8",
      classification: "Profilaktyka chorób zakaźnych (JRWA 966.8)",
      count: "4 działania",
      audience: "2 grupy: Uczniowie, Rodzice",
      materials: "materiał usunięty z katalogu",
    });
    expect(describeTemplateContent({ ...content, programId: "gone" }).classification).toBe("Program usunięty z katalogu");
  });

  it("listuje szablony alfabetycznie, bez pustych rekordów z importu", () => {
    const empty = legacy({ id: "e", title: "Szablon zadania", topic: "inne", defaultAudience: "uczniowie_sp" });
    const list = usableTemplates([legacy({ id: "b", title: "Zdrowe zęby" }), empty, legacy({ id: "a", title: "Ćwiczenia" })]);
    expect(list.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("przypięte szablony stoją na początku listy, w obu grupach alfabetycznie", () => {
    const list = usableTemplates([
      legacy({ id: "b", title: "Zdrowe zęby" }), legacy({ id: "p2", title: "Szczepienia", pinned: true }),
      legacy({ id: "a", title: "Ćwiczenia" }), legacy({ id: "p1", title: "Higiena", pinned: true }),
    ]);
    expect(list.map((t) => t.id)).toEqual(["p1", "p2", "a", "b"]);
  });

  it("podgląd szczegółów pokazuje wszystkie ustawione pola, grupy osobno i pomija puste", () => {
    const rows = templateDetailRows(
      { ...content, campaignId: "kamp-1", description: "Opis wzorcowy",
        audienceGroups: [...content.audienceGroups, { name: "", items: [{ name: "Nauczyciele", ageFrom: 25, ageTo: 60 }] }] },
      {
        programs: [program],
        materials: [{ id: "mat-1", title: "Ulotka, wersja 2" } as OzipzMaterial],
        campaigns: [{ id: "c1", dictType: "campaign", code: "kamp-1", label: "Światowy Dzień Zdrowia" } as OzipzDictionaryItem],
      }
    );
    expect(rows).toEqual([
      { label: "Forma", lines: ["Prelekcja (warsztat)"] },
      { label: "Program", lines: ["Profilaktyka chorób zakaźnych (JRWA 966.8)"] },
      { label: "Liczba działań", lines: ["4"] },
      { label: "Prowadzący", lines: ["Anna"] },
      { label: "Kampania / akcja", lines: ["Światowy Dzień Zdrowia"] },
      { label: "Odbiorcy", lines: ["Grupa 1: Uczniowie", "Klasa 7B: Rodzice", "Grupa 3: Nauczyciele (25–60 lat)"] },
      { label: "Materiały", lines: ["Ulotka, wersja 2"] },
      { label: "Opis czynności", lines: ["Opis wzorcowy"] },
    ]);
    expect(templateDetailRows({ ...content, programId: "", jrwaSymbol: "", numberOfActions: 1, leadEducator: "", audienceGroups: [], materialIds: [] }))
      .toEqual([{ label: "Forma", lines: ["Prelekcja (warsztat)"] }]);
  });
});
