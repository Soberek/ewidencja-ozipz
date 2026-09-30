import { describe, it, expect } from "vitest";
import type { OzipzAction, OzipzDictionaryItem, OzipzFacility, OzipzScheduleEvent } from "../types/ozipz.types";
import {
  buildDictionaryUsageIndex,
  formatUsageSummary,
  getDictionaryUsageModules,
  isHiddenDictionaryItem,
} from "./dictionaryUsage";

const dict = (id: string, dictType: string, code: string, label: string): OzipzDictionaryItem => ({
  id,
  dictType,
  code,
  label,
  isSystem: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
});

const action = (overrides: Partial<OzipzAction>): OzipzAction =>
  ({
    id: Math.random().toString(36),
    title: "Działanie",
    actionType: "Prelekcja (warsztat)",
    date: "2026-03-01",
    facilityName: "SP1",
    municipality: "Myślibórz",
    audienceGroup: "Uczniowie",
    participantsCount: 10,
    leadEducator: "A",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }) as OzipzAction;

describe("dictionaryUsage", () => {
  it("matches records by code or label, case-insensitively", () => {
    const items = [dict("a", "activityType", "prelekcja", "Prelekcja (warsztat)"), dict("b", "activityType", "wyklad", "Wykład")];
    const index = buildDictionaryUsageIndex(items, {
      actions: [
        action({ actionType: "Prelekcja (warsztat)" }),
        action({ actionType: "  prelekcja (WARSZTAT) " }),
        action({ actionType: "wyklad" }),
        action({ actionType: "Nieznany typ" }),
      ],
    });

    expect(index.get("a")?.total).toBe(2);
    expect(index.get("b")?.total).toBe(1);
    expect(index.get("a")?.byModule).toEqual([{ module: "Działania", route: "/dzialania", count: 2 }]);
  });

  it("counts a record once even when both code and name reference the item", () => {
    const items = [dict("c", "campaign", "bezpieczne_wakacje", "Bezpieczne Wakacje")];
    const index = buildDictionaryUsageIndex(items, {
      actions: [action({ campaignId: "bezpieczne_wakacje", campaignName: "Bezpieczne Wakacje" })],
    });
    expect(index.get("c")?.total).toBe(1);
  });

  it("aggregates usage across modules", () => {
    const items = [dict("m", "municipality", "mysliborz", "Myślibórz")];
    const index = buildDictionaryUsageIndex(items, {
      actions: [action({}), action({})],
      facilities: [{ municipality: "Myślibórz", type: "szkola" } as OzipzFacility],
    });
    expect(index.get("m")?.total).toBe(3);
    expect(formatUsageSummary(index.get("m"))).toBe("Placówki: 1 · Działania: 2");
  });

  it("ignores categories without usage tracking and reports unused items", () => {
    const index = buildDictionaryUsageIndex([dict("x", "custom", "a", "A")], { actions: [action({ actionType: "A" })] });
    expect(index.size).toBe(0);
    expect(formatUsageSummary(undefined)).toBe("Nieużywana w rekordach");
    expect(getDictionaryUsageModules("custom")).toEqual([]);
    expect(getDictionaryUsageModules("activityType").map((m) => m.module)).toEqual(["Działania", "Harmonogram"]);
  });

  it("matches actions by the JRWA symbol inside the case sign, without confusing 966.1 with 966.14", () => {
    const items = [dict("j1", "jrwaSymbol", "966.1", "Trzymaj Formę"), dict("j14", "jrwaSymbol", "966.14", "Bezpieczne Wakacje")];
    const index = buildDictionaryUsageIndex(items, {
      actions: [action({ jrwaSign: "OZiPZ.966.14.40.2026" }), action({ jrwaSign: "OZiPZ.966.1.3.2026" })],
    });
    expect(index.get("j14")?.total).toBe(1);
    expect(index.get("j1")?.total).toBe(1);
  });

  it("matches municipalities stored without the „Gmina” prefix and campaigns stored by item id", () => {
    const items = [dict("gm", "municipality", "gmina_mysliborz", "Gmina Myślibórz"), dict("dict_camp_1", "campaign", "grypa", "Akcja Grypa")];
    const index = buildDictionaryUsageIndex(items, {
      facilities: [{ municipality: "Myślibórz", type: "szkola" } as OzipzFacility],
      actions: [action({ municipality: "Gmina Myślibórz" })],
      scheduleEvents: [{ campaignId: "dict_camp_1" } as OzipzScheduleEvent],
    });
    expect(index.get("gm")?.total).toBe(2);
    expect(index.get("dict_camp_1")?.total).toBe(1);
  });

  it("hides internal entries", () => {
    expect(isHiddenDictionaryItem(dict("1", "register_mapping", "x", "x"))).toBe(true);
    expect(isHiddenDictionaryItem(dict("dict-jrw-1", "jrwaSymbol", "966.1", "x"))).toBe(true);
    expect(isHiddenDictionaryItem(dict("2", "jrwaSymbol", "966.1", "x"))).toBe(false);
  });
});
