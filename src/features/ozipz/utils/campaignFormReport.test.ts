import { describe, it, expect } from "vitest";
import type { ActionBreakdown, ActionBreakdownEntry } from "./actionBreakdown";
import {
  buildCampaignFormReport,
  classifyCampaignFormCategory,
  formatCampaignFormText,
  summarizeAudienceGroups,
} from "./campaignFormReport";

const entry = (over: Partial<ActionBreakdownEntry>): ActionBreakdownEntry => ({
  id: Math.random().toString(36),
  date: "2026-09-15",
  month: 9,
  form: "Wykład",
  title: "",
  facility: "SP 1",
  municipality: "Myślibórz",
  audience: "",
  actions: 1,
  recipients: 0,
  materials: 0,
  materialTitles: [],
  educator: "",
  status: "wykonane",
  notes: "",
  ...over,
});

const breakdownOf = (entries: ActionBreakdownEntry[], materials: ActionBreakdown["materials"] = []): ActionBreakdown => ({
  totals: { entries: 0, actions: 0, recipients: 0, materials: 0, facilities: 0, municipalities: 0 },
  byMonth: [],
  byForm: [],
  byFacility: [],
  byMunicipality: [],
  byEducator: [],
  materials,
  entries,
});

describe("classifyCampaignFormCategory", () => {
  it.each([
    ["Wykład", "wyklady"],
    ["Prelekcja (warsztat)", "wyklady"],
    ["Rozmowa indywidualna (instruktaż)", "konsultacje"],
    ["Stoisko edukacyjno-informacyjne", "plenerowe"],
    ["Happening (przemarsz, gra, event)", "plenerowe"],
    ["Konkurs (quiz)", "konkursy"],
    ["Publikacja media (Facebook)", "social"],
    ["Publikacja media (Portal X)", "social"],
    ["Publikacja media (Strona)", "www"],
    ["Wywiad do mediów", "wywiady"],
    ["Dystrybucja", "dystrybucja"],
    ["Sprawozdanie (z programu, miernik, tytoń)", "inne"],
  ])("%s → %s", (form, category) => {
    expect(classifyCampaignFormCategory({ form })).toBe(category);
  });

  it("ignores the title — a letter of intent about a webinar is not a training", () => {
    expect(classifyCampaignFormCategory({ form: "Pismo (list intencyjny)" })).toBe("inne");
  });
});

describe("summarizeAudienceGroups", () => {
  it("merges groups across entries and strips counts and group prefixes", () => {
    expect(
      summarizeAudienceGroups([
        "Grupa 1: Uczniowie - 22, Rodzice - 1\nGrupa 2: Uczniowie - 21",
        "Członkowie koła - 95 Pracownicy starostwa - 5",
        "Dzieci, młodzież, dorośli - 150",
        "Społeczność lokalna / internauci",
      ])
    ).toBe("Dzieci, młodzież, dorośli (150), Członkowie koła (95), Uczniowie (43), Pracownicy starostwa (5), Rodzice (1), Społeczność lokalna / internauci");
  });
});

describe("buildCampaignFormReport", () => {
  const b = breakdownOf(
    [
      entry({ form: "Stoisko edukacyjno-informacyjne", recipients: 215, audience: "Ogół społeczeństwa - 215" }),
      entry({ form: "Dystrybucja", recipients: 1, materials: 67, facility: "Boisko", audience: "Dorośli - 1" }),
      entry({ form: "Pismo (list intencyjny)", title: "Webinar HPV", recipients: 24, audience: "Kadra pedagogiczna - 24" }),
      entry({ form: "Publikacja media (Facebook)", actions: 3 }),
      entry({ form: "Publikacja media (Strona)", audience: "Społeczność lokalna / Internauci" }),
    ],
    [
      { title: "Ulotka A", quantity: 40, type: "ulotka" },
      { title: "Broszura", quantity: 25, type: "broszura" },
      { title: "Plakat", quantity: 2, type: "plakat" },
    ]
  );

  it("returns only form positions that have actions, in form order", () => {
    const sections = buildCampaignFormReport(b);
    expect(sections.flatMap((s) => s.items.map((i) => i.no))).toEqual([9, 10, 11, 22, 23, 24, 25, 29, 30, 33, 36, 37, 38, 39]);
    const text = formatCampaignFormText(sections, "HPV");
    expect(text).toContain("10. [IMPREZY PLENEROWE] Szacunkowa liczba uczestników wydarzeń plenerowych: 215");
    expect(text).toContain("23. [MATERIAŁY – DYSTRYBUCJA] Rodzaj dystrybuowanych materiałów: ulotka (40 szt.), broszura (25 szt.), plakat (2 szt.)");
    expect(text).toContain("24. [MATERIAŁY – DYSTRYBUCJA] Szacunkowa liczba odbiorców materiałów: 67");
    expect(text).toContain("25. [MATERIAŁY – DYSTRYBUCJA] Grupy odbiorców materiałów: Dorośli\n");
    expect(text).not.toContain("[SZKOLENIA]");
    expect(text).toContain("36. [INNE DZIAŁANIA] Opis innych działań: Pismo (list intencyjny) – Webinar HPV");
    expect(text).toContain("33. [SOCIAL MEDIA] Liczba opublikowanych postów: 3");
    expect(text).not.toContain("3. [WYKŁADY]");
  });

  it("describes unmatched forms under 'inne'", () => {
    const sections = buildCampaignFormReport(
      breakdownOf([entry({ form: "Sprawozdanie", recipients: 1 }), entry({ form: "Pismo", title: "Zaproszenie", actions: 2 })])
    );
    expect(sections.map((s) => s.category)).toEqual(["inne"]);
    expect(sections[0].items.map((i) => [i.no, i.value])).toEqual([
      [36, "Sprawozdanie; Pismo – Zaproszenie (2)"],
      [37, "3"],
      [38, "1"],
    ]);
  });
});
