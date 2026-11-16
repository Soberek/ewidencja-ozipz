import { describe, expect, it } from "vitest";
import type { OzipzAction, OzipzDistribution, OzipzMaterial } from "../types/ozipz.types";
import { buildRozdzielnikHtml, collectActionMaterials, listRozdzielnikTasks, rozdzielnikTaskIdFor } from "./rozdzielnikPrint";

const action = (overrides: Partial<OzipzAction>): OzipzAction => ({
  id: "a1",
  title: "Prelekcja",
  actionType: "Prelekcja",
  date: "2026-09-09",
  facilityName: "SP 3",
  municipality: "Myślibórz",
  topic: "",
  audienceGroup: "Uczniowie",
  ezdStatus: "",
  status: "",
  participantsCount: 20,
  materialsDistributedCount: 0,
  leadEducator: "Jan",
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

const distribution = (actionId: string, materialTitle: string, quantity: number): OzipzDistribution => ({
  id: `${actionId}-${materialTitle}`,
  actionId,
  materialTitle,
  quantity,
  recipientName: "SP 3",
  distributionDate: "2026-09-09",
  assignedEducator: "",
  purpose: "",
  createdAt: "",
});

const materials: OzipzMaterial[] = [
  { id: "m1", title: "Szczepienia chronią", materialType: "plakat", topic: "", publisher: "", createdAt: "", updatedAt: "" },
];

describe("collectActionMaterials", () => {
  it("bierze pozycje rozdzielnika działania i dołączonej dystrybucji, sumując te same tytuły", () => {
    const main = action({ id: "a1" });
    const companion = action({ id: "a2", linkedActionId: "a1", materialsDistributedCount: 5 });
    const items = collectActionMaterials(main, {
      actions: [main, companion],
      distributions: [distribution("a1", "Ulotka A", 60), distribution("a2", "Ulotka A", 10), distribution("a2", "Plakat B", 2)],
      materials,
    });

    expect(items).toEqual([
      { title: "Ulotka A", quantity: 70 },
      { title: "Plakat B", quantity: 2 },
    ]);
  });

  it("bez pozycji rozdzielnika używa materiału i liczby sztuk z działania", () => {
    const main = action({ materialId: "m1", materialsDistributedCount: 25 });
    expect(collectActionMaterials(main, { actions: [main], distributions: [], materials })).toEqual([
      { title: "Szczepienia chronią", quantity: 25 },
    ]);
    expect(collectActionMaterials(action({}), { actions: [], distributions: [], materials })).toEqual([]);
  });
});

describe("buildRozdzielnikHtml", () => {
  it("wypełnia nagłówek i ma tyle wierszy, ile materiałów", () => {
    const html = buildRozdzielnikHtml({
      date: "2026-09-09",
      programName: "Profilaktyka chorób zakaźnych",
      institution: "SP 3 w Myśliborzu",
      items: [
        { title: "Jesień bez infekcji - znajdź zagrożenia", quantity: 60 },
        { title: "Szczepienia chronią", quantity: 2 },
      ],
    });

    expect(html).toContain("ROZDZIELNIK z dn. 09.09.2026 r.");
    expect(html).toContain("Profilaktyka chorób zakaźnych");
    expect(html).toContain('rowspan="2"');
    expect(html).toContain("Jesień bez infekcji - znajdź zagrożenia");
    expect(html.match(/class="col-material"/g)).toHaveLength(3); // nagłówek + 2 wiersze
  });

  it("bez daty zostawia kropki, a bez materiałów jeden pusty wiersz", () => {
    const html = buildRozdzielnikHtml({ programName: "", institution: "", items: [] });
    expect(html).toContain("ROZDZIELNIK z dn. .................... r.");
    expect(html.match(/class="col-material"/g)).toHaveLength(2);
  });
});

describe("zadania do druku rozdzielnika", () => {
  const parent = action({ id: "p1", actionType: "Prelekcja" });
  const linked = action({ id: "d1", actionType: "Dystrybucja", linkedActionId: "p1" });
  const standalone = action({ id: "d2", actionType: "Dystrybucja" });
  const empty = action({ id: "e1" });
  const sources = {
    actions: [parent, linked, standalone, empty],
    distributions: [distribution("p1", "Ulotka", 10), distribution("d1", "Plakat", 2), distribution("d2", "Broszura", 5)],
    materials,
  };

  it("pomija działania bez materiałów i dystrybucję zapisaną razem z działaniem", () => {
    const tasks = listRozdzielnikTasks(sources);
    expect(tasks.map((t) => t.action.id).sort()).toEqual(["d2", "p1"]);
    expect(tasks.find((t) => t.action.id === "p1")?.items.map((i) => i.title).sort()).toEqual(["Plakat", "Ulotka"]);
  });

  it("dla dystrybucji z działania wskazuje zadanie nadrzędne, dla samodzielnej – ją samą, dla pustego – nic", () => {
    const tasks = listRozdzielnikTasks(sources);
    expect(rozdzielnikTaskIdFor(linked, tasks)).toBe("p1");
    expect(rozdzielnikTaskIdFor(standalone, tasks)).toBe("d2");
    expect(rozdzielnikTaskIdFor(empty, tasks)).toBeUndefined();
  });
});
