import { describe, it, expect } from "vitest";
import type { OzipzAction, OzipzDistribution, OzipzMaterial } from "../types/ozipz.types";
import {
  buildActionBreakdown,
  formatActionBreakdownText,
  listActionBreakdownOptions,
  matchesActionBreakdown,
} from "./actionBreakdown";

const action = (over: Partial<OzipzAction>): OzipzAction => ({
  id: "a",
  title: "Wykład",
  actionType: "Wykład",
  date: "2026-04-10",
  facilityName: "SP 1",
  municipality: "Myślibórz",
  programId: "sdz",
  programName: "Światowy Dzień Zdrowia",
  topic: "",
  audienceGroup: "Uczniowie",
  ezdStatus: "",
  status: "wykonane",
  numberOfActions: 1,
  participantsCount: 20,
  indirectRecipientsCount: 0,
  materialsDistributedCount: 0,
  leadEducator: "Jan Kowalski",
  createdAt: "",
  updatedAt: "",
  ...over,
});

const actions: OzipzAction[] = [
  action({ id: "1", date: "2026-04-09", title: "Happening", actionType: "Happening", participantsCount: 300, facilityName: "PSSE" }),
  action({ id: "2", date: "2026-04-22", participantsCount: 70, indirectRecipientsCount: 5, materialsDistributedCount: 3 }),
  action({ id: "3", date: "2026-05-05", participantsCount: 25, numberOfActions: 2, campaignId: "Jesień bez infekcji", campaignName: "Jesień bez infekcji" }),
  action({ id: "4", date: "2026-06-01", participantsCount: 999, status: "odwolane" }),
  action({ id: "5", date: "2026-04-15", programId: "inne", programName: "Inne zadanie", participantsCount: 10 }),
];

describe("listActionBreakdownOptions", () => {
  it("lists programs and campaigns with period and year counts, skipping cancelled", () => {
    const options = listActionBreakdownOptions(actions, [4]);
    const sdz = options.find((o) => o.value === "program:sdz");
    expect(sdz).toMatchObject({ label: "Światowy Dzień Zdrowia", periodEntries: 2, yearEntries: 3 });
    const camp = options.find((o) => o.value === "kampania:Jesień bez infekcji");
    expect(camp).toMatchObject({ kind: "kampania", periodEntries: 0, yearEntries: 1 });
    expect(options[options.length - 1].kind).toBe("kampania");
  });
});

describe("matchesActionBreakdown", () => {
  it("matches by program id or campaign name", () => {
    expect(matchesActionBreakdown(actions[0], "program:sdz")).toBe(true);
    expect(matchesActionBreakdown(actions[4], "program:sdz")).toBe(false);
    expect(matchesActionBreakdown(actions[2], "kampania:Jesień bez infekcji")).toBe(true);
    expect(matchesActionBreakdown(actions[0], "")).toBe(false);
  });
});

describe("buildActionBreakdown", () => {
  const scoped = actions.filter((a) => matchesActionBreakdown(a, "program:sdz"));
  const materials: OzipzMaterial[] = [
    { id: "m1", title: "Ulotka", materialType: "ulotka", topic: "", publisher: "", createdAt: "", updatedAt: "" },
  ];
  const distributions: OzipzDistribution[] = [
    {
      id: "d1",
      materialTitle: "Plakat",
      recipientName: "SP 1",
      actionId: "2",
      quantity: 2,
      distributionDate: "2026-04-22",
      assignedEducator: "",
      purpose: "",
      createdAt: "",
    },
  ];

  it("sums totals, months and forms without cancelled entries", () => {
    const b = buildActionBreakdown(scoped, [4, 5, 6], { distributions, materials });
    expect(b.totals).toMatchObject({ entries: 3, actions: 4, recipients: 400, materials: 3, facilities: 2, municipalities: 1, planned: 0 });
    expect(b.byMonth.map((m) => [m.month, m.actions])).toEqual([[4, 2], [5, 2], [6, 0]]);
    expect(b.byForm[0]).toMatchObject({ label: "Wykład", actions: 3 });
    expect(b.entries.map((e) => e.id)).toEqual(["1", "2", "3"]);
    const titled = buildActionBreakdown([action({ title: "Światowy Dzień Zdrowia" }), action({ id: "t", title: "Dni otwarte PIS" })], [4]);
    expect(titled.entries.map((e) => e.title)).toEqual(["", "Dni otwarte PIS"]);
  });

  it("takes materials from distributions and puts the remainder under an untitled bucket", () => {
    const b = buildActionBreakdown(scoped, [4], { distributions, materials });
    expect(b.materials).toEqual([
      { title: "Plakat", quantity: 2, type: "" },
      { title: "Materiały bez wskazanego tytułu", quantity: 1, type: "" },
    ]);
    const withMaterialId = buildActionBreakdown([action({ id: "x", materialId: "m1", materialsDistributedCount: 4 })], [4], { materials });
    expect(withMaterialId.materials).toEqual([{ title: "Ulotka", quantity: 4, type: "ulotka" }]);
  });

  it("formats a pasteable text summary grouped by month", () => {
    const b = buildActionBreakdown(scoped, [4, 5]);
    const text = formatActionBreakdownText(b, { label: "Światowy Dzień Zdrowia", year: 2026, months: [4, 5] });
    expect(text).toContain("Rozpiska: Światowy Dzień Zdrowia");
    expect(text).toContain("Okres: kwiecień - maj 2026");
    expect(text).toContain("Zrealizowano 4 działania (3 wpisy), docierając do 400 odbiorców w 2 placówkach na terenie 1 gminy.");
    expect(text).toContain("Kwiecień\n- 09.04.2026 – Happening (przemarsz, gra, event) – PSSE, gm. Myślibórz (1 dz., 300 odb.)");
    expect(text).toContain("Maj\n");
  });
});
