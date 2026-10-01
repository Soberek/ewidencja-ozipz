import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { filterActionsList, generateActiveFilterChips, type FilterChipSetters, type FilterChipState } from "./actionsFilterLogic";
import { useActionsFiltering } from "./useActionsFiltering";
import { useClosedMonths } from "./useClosedMonths";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";
import type { OzipzAction } from "../../../types/ozipz.types";

const action = (id: string, date: string, participantsCount = 10): OzipzAction => ({
  id, title: `Działanie ${id}`, actionType: "Prelekcja (warsztat)", date, facilityName: "SP1", municipality: "Myślibórz",
  topic: "", audienceGroup: "Uczniowie", participantsCount, leadEducator: "Jan Kowalski", ezdStatus: "do_ezd",
  status: "wykonane", numberOfActions: 1, indirectRecipientsCount: 0, materialsDistributedCount: 0,
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
});
const actions = [action("a1", "2025-09-15", 5), action("a2", "2026-09-10", 20), action("a3", "2026-03-02", 30)];

const baseCriteria = {
  search: "", effectivePeriod: "", statusFilter: "wszystkie" as const, quickFilterEzd: false,
  quickFilterProgramOnly: false, quickFilterInProgress: false, materialsOnlyFilter: false, quickFilterPublications: false,
  hidePublications: false, selectedMunicipalities: [], selectedPrograms: [], selectedActivityTypes: [], selectedTopics: [],
  educatorFilter: "", ezdFilter: "all",
};

describe("Filtr roku w rejestrze działań", () => {
  it("miesiąc filtruje w obrębie wybranego roku, a bez roku obejmuje wszystkie lata", () => {
    const september = { ...baseCriteria, effectivePeriod: "09" };
    expect(filterActionsList(actions, september).map((a) => a.id)).toEqual(["a2", "a1"]);
    expect(filterActionsList(actions, { ...september, yearFilter: "2026" }).map((a) => a.id)).toEqual(["a2"]);
    expect(filterActionsList(actions, { ...baseCriteria, yearFilter: "2025" }).map((a) => a.id)).toEqual(["a1"]);
  });

  it("status „Aktywne” pomija działania odwołane i odroczone", () => {
    const withStatuses = [
      ...actions,
      { ...action("c1", "2026-03-03"), status: "odwolane" },
      { ...action("c2", "2026-03-04"), status: "odwołane" },
      { ...action("p1", "2026-03-05"), status: "odroczone" },
    ];
    const ids = filterActionsList(withStatuses, { ...baseCriteria, statusFilter: "aktywne" }).map((a) => a.id);
    expect(ids.sort()).toEqual(["a1", "a2", "a3"]);
  });

  it("rok i okres mają etykietę tylko, gdy odbiegają od widoku domyślnego; usunięcie ją przywraca", () => {
    const defaults = { period: "10", year: "2026" };
    const state: FilterChipState = {
      search: "", effectivePeriod: "10", yearFilter: "2026", statusFilter: "aktywne", publicationsMode: "ukryte",
      quickFilterEzd: false, quickFilterProgramOnly: false, quickFilterInProgress: false, materialsOnlyFilter: false,
      selectedMunicipalities: [], selectedPrograms: [], selectedActivityTypes: [], selectedTopics: [], educatorFilter: "", ezdFilter: "all",
    };
    const setYearFilter = vi.fn();
    const setSelectedMonth = vi.fn();
    const setters = { setYearFilter, setSelectedMonth, setPeriodFilter: vi.fn() } as unknown as FilterChipSetters;
    expect(generateActiveFilterChips(state, setters, defaults)).toEqual([]);

    const chips = generateActiveFilterChips({ ...state, yearFilter: "", effectivePeriod: "" }, setters, defaults);
    expect(chips.map((c) => `${c.label}: ${c.value}`)).toEqual(["Rok: Wszystkie lata", "Okres: Wszystkie miesiące"]);
    chips.forEach((c) => c.onRemove());
    expect(setYearFilter).toHaveBeenCalledWith("2026");
    expect(setSelectedMonth).toHaveBeenCalledWith("10");
  });

  it("lista dotyczy wybranego roku, a lata są brane z danych", () => {
    const { result } = renderHook(() => useActionsFiltering({
      actions, onDeleteAction: vi.fn(), onUpdateAction: vi.fn(), defaultYear: "2026",
    }));
    expect(result.current.filteredActions.map((a) => a.id)).toEqual(["a2", "a3"]);
    expect(result.current.availableYears).toContain("2025");
    expect(result.current.availableYears).toContain("2026");

    act(() => result.current.setYearFilter(""));
    expect(result.current.filteredActions).toHaveLength(3);
    act(() => result.current.handleClearFilters());
    expect(result.current.yearFilter).toBe("2026");
  });
});

describe("Blokady miesięcy odświeżane w tle", () => {
  const originalRefresh = useOzipzDbStore.getState().refreshClosedMonths;
  afterEach(() => {
    // Odmontowanie przed przywróceniem store — inaczej hook odświeża się już po zakończeniu testu.
    cleanup();
    useOzipzDbStore.setState({ refreshClosedMonths: originalRefresh });
  });

  it("po powrocie do okna formularz nie przechodzi w tryb wczytywania", async () => {
    let release: () => void = () => {};
    const refreshClosedMonths = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockImplementation(() => new Promise<void>((resolve) => { release = resolve; }));
    useOzipzDbStore.setState({ refreshClosedMonths });
    const { result } = renderHook(() => useClosedMonths());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(refreshClosedMonths).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("ready");
    await act(async () => { release(); });
    expect(result.current.status).toBe("ready");
  });

  it("błąd odświeżenia nadal blokuje zmiany", async () => {
    const refreshClosedMonths = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValue(new Error("offline"));
    useOzipzDbStore.setState({ refreshClosedMonths });
    const { result } = renderHook(() => useClosedMonths());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.status).toBe("error");
  });
});
