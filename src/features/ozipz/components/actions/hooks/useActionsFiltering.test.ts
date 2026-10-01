import { beforeEach, describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionsFiltering } from "./useActionsFiltering";
import type { OzipzAction } from "../../../types/ozipz.types";
import { ACTION_FILTERS_STORAGE_KEY } from "./useActionFilterState";

describe("useActionsFiltering Hook - Smart Filtering Logic", () => {
  // Filtry są zapamiętywane – każdy test zaczyna od domyślnych.
  beforeEach(() => localStorage.removeItem(ACTION_FILTERS_STORAGE_KEY));

  const mockActions: OzipzAction[] = [
    {
      id: "act-1",
      title: "Warsztaty zdrowego żywienia",
      actionType: "Prelekcja (warsztat)",
      date: "2026-02-10",
      facilityName: "Szkoła Podstawowa nr 1 w Barlinku",
      municipality: "Barlinek",
      topic: "zdrowy_styl_zycia",
      audienceGroup: "Dzieci",
      programId: "prog-tf",
      programName: "Trzymaj Formę!",
      leadEducator: "Jan Kowalski",
      participantsCount: 30,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 25,
      status: "wykonane",
      ezdStatus: "w_ezd",
      jrwaSign: "OZiPZ.966.1.1.2026",
      createdAt: "2026-02-10",
      updatedAt: "2026-02-10",
    },
    {
      id: "act-2",
      title: "Stoisko profilaktyczne - Dni Myśliborza",
      actionType: "Stoisko informacyjno-edukacyjne",
      date: "2026-05-15",
      facilityName: "Rynek Miejski",
      municipality: "Myślibórz",
      topic: "tyton",
      audienceGroup: "Mieszkańcy",
      leadEducator: "Anna Nowak",
      participantsCount: 150,
      indirectRecipientsCount: 50,
      materialsDistributedCount: 100,
      status: "wykonane",
      ezdStatus: "do_ezd",
      createdAt: "2026-05-15",
      updatedAt: "2026-05-15",
    },
    {
      id: "act-3",
      title: "Planowana pogadanka o higienie",
      actionType: "Prelekcja (warsztat)",
      date: "2026-08-20",
      facilityName: "Przedszkole Miejskie w Dębnie",
      municipality: "Dębno",
      topic: "higiena",
      audienceGroup: "Dzieci",
      leadEducator: "Jan Kowalski",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      status: "planowane",
      ezdStatus: "do_ezd",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
    },
    {
      id: "act-4",
      title: "Odroczona akcja profilaktyki raka",
      actionType: "Konferencja",
      date: "2026-11-05",
      facilityName: "Ośrodek Zdrowia Boleszkowice",
      municipality: "Boleszkowice",
      topic: "nowotwory",
      audienceGroup: "Dorośli",
      leadEducator: "Anna Nowak",
      participantsCount: 10,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 0,
      status: "odroczone",
      ezdStatus: "nie_dotyczy",
      createdAt: "2026-11-05",
      updatedAt: "2026-11-05",
    },
  ];

  it("filters actions by municipality (single and multiple)", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setMunicipalityFilter("Barlinek");
    });

    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-1");

    // Multiple municipalities (Barlinek + Myślibórz)
    act(() => {
      result.current.setSelectedMunicipalities(["Barlinek", "Myślibórz"]);
    });

    expect(result.current.filteredActions.length).toBe(2);
    expect(result.current.filteredActions.map((a) => a.id)).toContain("act-1");
    expect(result.current.filteredActions.map((a) => a.id)).toContain("act-2");
  });

  it("filters actions by multiple activity types", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setSelectedActivityTypes(["Prelekcja (warsztat)", "Stoisko informacyjno-edukacyjne"]);
    });

    expect(result.current.filteredActions.length).toBe(3); // act-1, act-2, act-3
    expect(result.current.filteredActions.some((a) => a.id === "act-4")).toBe(false);
  });

  it("filters all publication media using group filter 'Publikacje (wszystkie media)'", () => {
    const actionsWithPubs: OzipzAction[] = [
      ...mockActions,
      {
        id: "pub-1",
        title: "Post profilaktyczny o WZW",
        actionType: "Publikacja media (Portal X)",
        date: "2026-06-10",
        facilityName: "Portal X @PSSEMysliborz",
        municipality: "Myślibórz",
        topic: "wzw",
        audienceGroup: "Społeczność online",
        leadEducator: "Jan Kowalski",
        participantsCount: 0,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        createdAt: "2026-06-10",
        updatedAt: "2026-06-10",
      },
      {
        id: "pub-2",
        title: "Artykuł o boreliozie",
        actionType: "Publikacja media (Facebook)",
        date: "2026-06-12",
        facilityName: "Facebook PSSE",
        municipality: "Myślibórz",
        topic: "kleszcze",
        audienceGroup: "Społeczność online",
        leadEducator: "Anna Nowak",
        participantsCount: 0,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        createdAt: "2026-06-12",
        updatedAt: "2026-06-12",
      },
    ];

    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: actionsWithPubs,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setSelectedActivityTypes(["Publikacje (wszystkie media)"]);
    });

    expect(result.current.filteredActions.length).toBe(2);
    expect(result.current.filteredActions.map((a) => a.id)).toEqual(["pub-2", "pub-1"]);
  });

  it("filters actions by program (specific program vs non-program actions)", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    // Filter for Trzymaj Formę
    act(() => {
      result.current.setProgramFilter("prog-tf");
    });
    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].title).toBe("Warsztaty zdrowego żywienia");

    // Filter for non-program (own) actions
    act(() => {
      result.current.setProgramFilter("none");
    });
    // In active mode, act-4 is "odroczone" so 2 remain: act-2 and act-3
    expect(result.current.filteredActions.length).toBe(2);
    expect(result.current.filteredActions.every((a) => !a.programId)).toBe(true);
  });

  it("filters actions by period (quarters, half-years, and individual months)", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    // Q1 (Jan-Mar): act-1 (Feb)
    act(() => {
      result.current.setPeriodFilter("q1");
    });
    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-1");

    // Q2 (Apr-Jun): act-2 (May)
    act(() => {
      result.current.setPeriodFilter("q2");
    });
    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-2");

    // H1 (Jan-Jun): act-1 and act-2
    act(() => {
      result.current.setPeriodFilter("h1");
    });
    expect(result.current.filteredActions.length).toBe(2);

    // Exact month "08" (Aug): act-3
    act(() => {
      result.current.setPeriodFilter("08");
    });
    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-3");
  });

  it("filters actions by materials only (MAT > 0)", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setMaterialsOnlyFilter(true);
    });

    // act-1 (25) and act-2 (100)
    expect(result.current.filteredActions.length).toBe(2);
    expect(result.current.filteredActions.map((a) => a.id)).toEqual(["act-2", "act-1"]);
  });

  it("filters actions by EZD status (do_ezd, w_ezd, nie_dotyczy)", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setEzdFilter("do_ezd");
    });

    expect(result.current.filteredActions.length).toBe(2);
    expect(result.current.filteredActions.every((a) => a.ezdStatus === "do_ezd")).toBe(true);
  });

  it("filters actions by lead educator and activity type", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setEducatorFilter("Anna Nowak");
      result.current.setActivityTypeFilter("Stoisko informacyjno-edukacyjne");
    });

    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-2");
  });

  it("handleClearFilters restores the default view", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setSearch("żywność");
      result.current.setSelectedMunicipalities(["Barlinek", "Dębno"]);
      result.current.setPeriodFilter("q1");
      result.current.setMaterialsOnlyFilter(true);
      result.current.setQuickFilterEzd(true);
    });

    expect(result.current.activeFiltersCount).toBeGreaterThan(0);

    act(() => {
      result.current.handleClearFilters();
    });

    expect(result.current.search).toBe("");
    expect(result.current.selectedMunicipalities).toEqual([]);
    expect(result.current.periodFilter).toBe("");
    expect(result.current.materialsOnlyFilter).toBe(false);
    expect(result.current.quickFilterEzd).toBe(false);
    expect(result.current.statusFilter).toBe("aktywne");
    expect(result.current.publicationsMode).toBe("ukryte");
    // Domyślnie odroczone działania są schowane.
    expect(result.current.filteredActions.some((action) => action.id === "act-4")).toBe(false);
    expect(result.current.activeFiltersCount).toBe(0);
    expect(result.current.activeFilterChips).toEqual([]);
  });

  it("calculates live KPI metrics for a couple of selected actions", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    // Select a couple of filtered actions: act-1 and act-2
    act(() => {
      result.current.handleToggleSelect("act-1", true);
      result.current.handleToggleSelect("act-2", true);
    });

    expect(result.current.selectedActionIds.size).toBe(2);
    expect(result.current.selectedMetrics.recipients).toBe(180); // 30 + 150
    expect(result.current.selectedMetrics.materials).toBe(125); // 25 + 100
    expect(result.current.selectedMetrics.doEzd).toBe(1); // act-2
  });

  it("selects first N actions using handleSelectFirstN", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.handleSelectFirstN(2);
    });

    expect(result.current.selectedActionIds.size).toBe(2);
  });

  it("drops hidden selections before bulk deletion after filtering", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: onDelete,
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.handleToggleSelect("act-1", true);
      result.current.handleToggleSelect("act-2", true);
      result.current.setSearch("Warsztaty");
    });

    expect([...result.current.selectedActionIds]).toEqual(["act-1"]);
    await act(async () => {
      await result.current.handleBulkDelete();
    });
    expect(onDelete).toHaveBeenCalledExactlyOnceWith("act-1");
  });

  it("keeps only unfinished selections after a failed bulk deletion", async () => {
    const onDelete = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("delete failed"));
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: onDelete,
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.handleToggleSelect("act-1", true);
      result.current.handleToggleSelect("act-2", true);
    });
    let failure: unknown;
    await act(async () => {
      try {
        await result.current.handleBulkDelete();
      } catch (error) {
        failure = error;
      }
    });
    expect(failure).toEqual(new Error("delete failed"));
    expect([...result.current.selectedActionIds]).toEqual(["act-2"]);
  });

  it("executes bulk EZD status update and bulk mark done", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: onUpdate,
      })
    );

    act(() => {
      result.current.handleToggleSelect("act-2", true);
      result.current.handleToggleSelect("act-3", true);
    });

    await act(async () => {
      await result.current.handleBulkMarkEzd("w_ezd");
    });

    expect(onUpdate).toHaveBeenCalledWith("act-2", { ezdStatus: "w_ezd" });
    expect(onUpdate).toHaveBeenCalledWith("act-3", { ezdStatus: "w_ezd" });
  });

  it("copies summary and exports selected actions", () => {
    const originalClipboard = navigator.clipboard;
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.handleToggleSelect("act-1", true);
      result.current.handleToggleSelect("act-2", true);
    });

    act(() => {
      result.current.handleBulkCopySummary();
    });

    expect(writeTextMock).toHaveBeenCalled();
    expect(writeTextMock.mock.calls[0][0]).toContain("Wybrane Działania OZiPZ (2)");

    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it("toggles quickFilterPublications and filters all publications with chip", () => {
    const actionsWithPubs: OzipzAction[] = [
      ...mockActions,
      {
        id: "pub-1",
        title: "Post profilaktyczny o WZW",
        actionType: "Publikacja media (Portal X)",
        date: "2026-06-10",
        facilityName: "Portal X @PSSEMysliborz",
        municipality: "Myślibórz",
        topic: "wzw",
        audienceGroup: "Społeczność online",
        leadEducator: "Jan Kowalski",
        participantsCount: 0,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
        createdAt: "2026-06-10",
        updatedAt: "2026-06-10",
      },
    ];

    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: actionsWithPubs,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setPublicationsMode("tylko");
    });

    expect(result.current.quickFilterPublications).toBe(true);
    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("pub-1");
    expect(result.current.activeFilterChips.find((c) => c.id === "publications")?.value).toBe("Tylko publikacje");

    act(() => {
      result.current.activeFilterChips.find((c) => c.id === "publications")?.onRemove();
    });
    expect(result.current.quickFilterPublications).toBe(false);
    expect(result.current.publicationsMode).toBe("ukryte");
  });

  it("hides publications by default and lets the user show them", () => {
    localStorage.clear();
    const actionsWithPubs: OzipzAction[] = [
      ...mockActions,
      {
        id: "pub-fb",
        title: "Post o profilaktyce na Facebooku",
        actionType: "Publikacja media (Facebook)",
        date: "2026-08-03",
        facilityName: "Facebook",
        municipality: "Myślibórz",
        topic: "bezpieczne_wakacje",
        audienceGroup: "Mieszkańcy",
        leadEducator: "Anna Nowak",
        participantsCount: 0,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
        createdAt: "2026-08-03",
        updatedAt: "2026-08-03",
      },
    ];

    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: actionsWithPubs,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    // 1. Domyślnie publikacje są schowane i nie liczą się jako aktywny filtr
    expect(result.current.hidePublications).toBe(true);
    expect(result.current.activeFilterChips.some((c) => c.id === "publications")).toBe(false);
    // Publikacja "pub-fb" jest schowana w tabeli działań
    expect(result.current.filteredActions.some((a) => a.id === "pub-fb")).toBe(false);
    expect(result.current.filteredActions.length).toBe(3); // act-1, act-2, act-3

    // 2. Użytkownik chce zobaczyć publikacje razem z innymi działaniami
    act(() => {
      result.current.setPublicationsMode("widoczne");
    });

    expect(result.current.hidePublications).toBe(false);
    // Teraz publikacja jest widoczna razem z innymi działaniami
    expect(result.current.filteredActions.some((a) => a.id === "pub-fb")).toBe(true);
    expect(result.current.filteredActions.length).toBe(4);

    expect(result.current.activeFilterChips.find((c) => c.id === "publications")?.value).toBe("Widoczne");

    // 3. Wyczyszczenie filtrów wraca do widoku domyślnego – publikacje znów schowane
    act(() => {
      result.current.handleClearFilters();
    });
    expect(result.current.hidePublications).toBe(true);
    expect(result.current.filteredActions.some((a) => a.id === "pub-fb")).toBe(false);
  });

  it("filters actions by information card number (izrzSign)", () => {
    const actionsWithIzrz: OzipzAction[] = [
      ...mockActions,
      {
        id: "act-izrz-search",
        title: "Warsztaty profilaktyczne",
        actionType: "Prelekcja (warsztat)",
        date: "2026-05-25",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Kowalski",
        participantsCount: 40,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        ezdStatus: "w_ezd",
        status: "wykonane",
        izrzSign: "74/2026",
        createdAt: "2026-05-25",
        updatedAt: "2026-05-25",
      },
    ];

    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: actionsWithIzrz,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
      })
    );

    act(() => {
      result.current.setSearch("74/2026");
    });

    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-izrz-search");
    expect(result.current.filteredActions[0].izrzSign).toBe("74/2026");
  });

  it("initializes selectedMonth and filters actions by defaultMonth when provided", () => {
    const { result } = renderHook(() =>
      useActionsFiltering({
        actions: mockActions,
        onDeleteAction: vi.fn(),
        onUpdateAction: vi.fn(),
        defaultMonth: "05",
      })
    );

    expect(result.current.selectedMonth).toBe("05");
    expect(result.current.effectivePeriod).toBe("05");
    expect(result.current.filteredActions.length).toBe(1);
    expect(result.current.filteredActions[0].id).toBe("act-2");
    expect(result.current.filteredActions[0].date).toBe("2026-05-15");
  });
});
