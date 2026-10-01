import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ACTION_FILTERS_STORAGE_KEY, useActionFilterState } from "./useActionFilterState";

describe("zapamiętywanie filtrów rejestru działań", () => {
  beforeEach(() => localStorage.clear());

  it("przywraca wybrane filtry po ponownym wejściu, ale nie wyszukiwany tekst", () => {
    const first = renderHook(() => useActionFilterState({ defaultMonth: "10", defaultYear: "2026" }));
    act(() => {
      first.result.current.setStatusFilter("wszystkie");
      first.result.current.setSelectedPrograms(["prog-a"]);
      first.result.current.setQuickFilterEzd(true);
      first.result.current.setPublicationsMode("widoczne");
      first.result.current.setSearch("prelekcja");
    });
    first.unmount();

    const { result } = renderHook(() => useActionFilterState({ defaultMonth: "10", defaultYear: "2026" }));
    expect(result.current.statusFilter).toBe("wszystkie");
    expect(result.current.selectedPrograms).toEqual(["prog-a"]);
    expect(result.current.quickFilterEzd).toBe(true);
    expect(result.current.publicationsMode).toBe("widoczne");
    expect(result.current.search).toBe("");
  });

  it("zawsze otwiera się na bieżącym miesiącu i roku – okres nie jest zapamiętywany", () => {
    const october = renderHook(() => useActionFilterState({ defaultMonth: "10", defaultYear: "2026" }));
    act(() => {
      october.result.current.setSelectedMonth("03");
      october.result.current.setYearFilter("2025");
    });
    october.unmount();

    // Kolejne wejście po zmianie roku: rejestr pokazuje styczeń 2027, a nie zapamiętany okres.
    const { result } = renderHook(() => useActionFilterState({ defaultMonth: "01", defaultYear: "2027" }));
    expect(result.current.selectedMonth).toBe("01");
    expect(result.current.yearFilter).toBe("2027");
  });

  it("bez zapisu używa domyślnych filtrów i ignoruje uszkodzony zapis", () => {
    localStorage.setItem(ACTION_FILTERS_STORAGE_KEY, "{nie-json");
    const { result } = renderHook(() => useActionFilterState({ defaultMonth: "10", defaultYear: "2026" }));
    expect(result.current.selectedMonth).toBe("10");
    expect(result.current.yearFilter).toBe("2026");
    expect(result.current.statusFilter).toBe("aktywne");
    expect(result.current.publicationsMode).toBe("ukryte");
  });

  it("przejmuje dotychczasowe ustawienie ukrywania publikacji", () => {
    localStorage.setItem("oz.hidePublications", "false");
    const { result } = renderHook(() => useActionFilterState());
    expect(result.current.publicationsMode).toBe("widoczne");
    expect(localStorage.getItem("oz.hidePublications")).toBeNull();
  });
});
