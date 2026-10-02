import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { OzipzAction, OzipzJrwaCase } from "./types/ozipz.types";
import { useActionsFiltering } from "./components/actions/hooks/useActionsFiltering";
import { generateNextJrwaSign } from "./utils/jrwaNumberingUtils";

/**
 * Przełom roku: 5 stycznia 2027 aplikacja pracuje na nowym roku bez żadnej konfiguracji —
 * rejestr pokazuje działania z 2027, a numeracja spraw i IZRZ zaczyna się od 1.
 */
const action = (id: string, date: string, izrzSign?: string, jrwaSign?: string): OzipzAction => ({
  id, date, izrzSign, jrwaSign,
  title: "Prelekcja", actionType: "Prelekcja (warsztat)", facilityName: "SP 1", municipality: "Myślibórz",
  topic: "", audienceGroup: "Uczniowie", ezdStatus: "", status: "wykonane", numberOfActions: 1,
  participantsCount: 20, materialsDistributedCount: 0, leadEducator: "Jan",
  createdAt: "", updatedAt: "",
});

const actions = [
  action("a2026", "2026-12-15", "120/2026", "OZiPZ.966.7.14.2026"),
  action("a2027", "2027-01-04", "1/2027", "OZiPZ.966.7.1.2027"),
];

describe("przełom roku 2026 → 2027", () => {
  afterEach(() => vi.useRealTimers());

  it("rejestr działań domyślnie pokazuje tylko bieżący rok, a starszy rok zostaje do wyboru", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2027, 0, 5));
    // Te same wartości domyślne, które ustawia ActionsSection.
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions,
        onDeleteAction: async () => {},
        onUpdateAction: async () => {},
        defaultMonth: String(new Date().getMonth() + 1).padStart(2, "0"),
        defaultYear: String(new Date().getFullYear()),
      })
    );
    expect(result.current.filteredActions.map((a) => a.id)).toEqual(["a2027"]);
    expect(result.current.availableYears).toEqual(["2027", "2026"]);
  });

  it("numeracja sprawy JRWA i IZRZ zaczyna się od 1 w nowym roku", () => {
    const cases2026 = [{ jrwaSymbol: "966.7", caseNumber: 14, year: 2026, fullCaseSign: "OZiPZ.966.7.14.2026" }] as OzipzJrwaCase[];
    const next = generateNextJrwaSign({ symbol: "966.7", year: 2027, actions: [actions[0]], jrwaCases: cases2026, actionType: "Prelekcja (warsztat)" });
    expect(next.caseNumber).toBe(1);
    expect(next.fullCaseSign).toMatch(/\.966\.7\.1\.2027$/);
    expect(next.izrzSign).toMatch(/^1\/2027$/);

    const following = generateNextJrwaSign({ symbol: "966.7", year: 2027, actions, jrwaCases: cases2026, actionType: "Prelekcja (warsztat)" });
    expect(following.caseNumber).toBe(2);
  });
});
