import { describe, expect, it } from "vitest";
import type { OzipzFacility, OzipzLetter } from "../types/ozipz.types";
import { buildSearchIndex, searchIndex, type SearchSources } from "./globalSearch";

const empty: SearchSources = {
  actions: [], letters: [], jrwaCases: [], scheduleEvents: [], facilities: [], contacts: [], programs: [],
  participations: [], materials: [], distributions: [], publications: [], registers: [], staff: [],
};
const facility = { id: "f1", name: "Szkoła Podstawowa nr 2 w Barlinku", city: "Barlinek", municipality: "Barlinek", type: "szkoła", address: "ul. Łąkowa 1", postalCode: "74-320" } as OzipzFacility;
const letter = { id: "l1", subject: "Zaproszenie na festyn zdrowia", letterNumber: "OZiPZ.9011.3.2026", letterDate: "2026-09-10", senderRecipient: "Gmina Myślibórz", caseSign: "OZiPZ.9011.3.2026", direction: "przychodzace", assignedPerson: "", status: "nowe", createdAt: "", updatedAt: "" } as OzipzLetter;

describe("globalna wyszukiwarka", () => {
  const index = buildSearchIndex({ ...empty, facilities: [facility], letters: [letter] });

  it("ignoruje wielkość liter i polskie znaki", () => {
    expect(searchIndex(index, "lakowa").map((item) => item.key)).toEqual(["facility-f1"]);
    expect(searchIndex(index, "MYSLIBORZ").map((item) => item.key)).toEqual(["letter-l1"]);
  });

  it("wymaga wszystkich słów zapytania i znajduje po znaku sprawy", () => {
    expect(searchIndex(index, "festyn 9011").map((item) => item.key)).toEqual(["letter-l1"]);
    expect(searchIndex(index, "festyn barlinek")).toEqual([]);
  });

  it("otwiera rekord w module przez okno edycji", () => {
    const [result] = searchIndex(index, "barlinek");
    expect(result.path).toBe("/lokalizacje");
    expect(result.modal).toEqual({ type: "facility", payload: { item: facility } });
  });

  it("zwraca pustą listę dla pustego zapytania", () => {
    expect(searchIndex(index, "   ")).toEqual([]);
  });
});
