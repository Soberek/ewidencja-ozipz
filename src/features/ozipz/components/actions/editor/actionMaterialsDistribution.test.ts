import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionEditorState } from "./useActionEditorState";
import { duplicateActionDraft } from "./editorUtils";
import type {
  OzipzAction,
  OzipzDistribution,
  OzipzMaterial,
  OzipzProgram,
  OzipzFacility,
  OzipzDictionaryItem,
  OzipzStaff,
} from "../../../types/ozipz.types";

describe("Action Materials Distribution - Breakdown & Persistence", () => {
  const mockPrograms: OzipzProgram[] = [
    {
      id: "prog-1",
      code: "P1",
      name: "Program Profilaktyczny",
      editionYear: "2026",
      targetAudience: "Uczniowie",
      description: "Opis programu",
      status: "aktywny",
      jrwaSymbol: "966.1",
      participatingSchoolsCount: 1,
      totalPupilsReached: 100,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const mockFacilities: OzipzFacility[] = [
    {
      id: "fac-1",
      name: "Szkoła Podstawowa nr 1",
      type: "szkola_podstawowa",
      municipality: "Myślibórz",
      county: "powiat myśliborski",
      address: "ul. Szkolna 1",
      city: "Myślibórz",
      postalCode: "74-300",
      leadingAuthority: "Gmina Myślibórz",
      isComplex: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const mockDictItems: OzipzDictionaryItem[] = [
    {
      id: "dict-act-1",
      dictType: "activityType",
      code: "prelekcja",
      label: "Prelekcja",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "dict-muni-1",
      dictType: "municipality",
      code: "mysliborz",
      label: "Myślibórz",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const mockStaff: OzipzStaff[] = [
    {
      id: "staff-1",
      fullName: "Jan Kowalski",
      role: "Asystent",
      email: "jan@example.com",
      phone: "123456789",
      active: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const mockMaterials: OzipzMaterial[] = [
    {
      id: "mat-broszura-1",
      title: "Broszura o Zdrowiu",
      materialType: "broszura",
      topic: "zdrowie",
      publisher: "GIS",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "mat-ulotka-2",
      title: "Ulotka Profilaktyczna",
      materialType: "ulotka",
      topic: "profilaktyka",
      publisher: "MZ",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  it("splits multiple added materials into distinct items and passes them to onSave without collapsing", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        onSave,
      })
    );

    // Dodaj 1. materiał: 40 sztuk
    act(() => {
      result.current.handleAddMaterialItem("mat-broszura-1", 40);
    });

    // Dodaj 2. materiał: 25 sztuk
    act(() => {
      result.current.handleAddMaterialItem("mat-ulotka-2", 25);
    });

    expect(result.current.materialItems.length).toBe(2);
    expect(result.current.materialItems[0]).toMatchObject({
      materialId: "mat-broszura-1",
      quantity: 40,
    });
    expect(result.current.materialItems[1]).toMatchObject({
      materialId: "mat-ulotka-2",
      quantity: 25,
    });
    // Łączna suma to 65
    expect(result.current.materialsDistributedCount).toBe(65);

    // Zapisz działanie
    await act(async () => {
      await result.current.onSubmit({
        title: "Warsztaty z materiałami",
        actionType: "Prelekcja",
        date: "2026-05-10",
        facilityName: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        topic: "zdrowie",
        audienceGroup: "Uczniowie",
        leadEducator: "Jan Kowalski",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 65,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
      });
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedAction = onSave.mock.calls[0][0];
    const distributionMaterials = onSave.mock.calls[0][2];
    const linkedDistribution = onSave.mock.calls[0][3];

    // Domyślnie materiały idą do osobnej, powiązanej dystrybucji — prelekcja nie liczy ich u siebie.
    expect(savedAction.materialsDistributedCount).toBe(0);
    expect(savedAction.materialId).toBeUndefined();
    expect(linkedDistribution).toMatchObject({
      title: "Dystrybucja materiałów – Warsztaty z materiałami",
      actionType: "Dystrybucja",
      numberOfActions: 1,
      participantsCount: 1,
      audienceGroup: savedAction.audienceGroup,
      facilityName: "Szkoła Podstawowa nr 1",
      date: "2026-05-10",
      leadEducator: "Jan Kowalski",
      materialId: "mat-broszura-1",
      materialsDistributedCount: 65,
      ezdStatus: "nie_dotyczy",
    });
    expect(distributionMaterials).toBeDefined();
    expect(distributionMaterials?.length).toBe(2);
    expect(distributionMaterials).toEqual([
      { materialId: "mat-broszura-1", quantity: 40, title: "Broszura o Zdrowiu", type: "broszura" },
      { materialId: "mat-ulotka-2", quantity: 25, title: "Ulotka Profilaktyczna", type: "ulotka" },
    ]);
  });

  it("keeps materials on the action itself when the separate distribution is switched off", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: [
          ...mockDictItems,
          { id: "dict-act-2", dictType: "activityType", code: "dystrybucja", label: "Dystrybucja materiałów", isSystem: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
        ],
        staff: mockStaff,
        materials: mockMaterials,
        onSave,
      })
    );
    act(() => result.current.handleAddMaterialItem("mat-ulotka-2", 30));
    expect(result.current.canSeparateDistribution).toBe(true);
    expect(result.current.separateDistribution).toBe(true);
    expect(result.current.distributionActionType).toBe("Dystrybucja materiałów");

    act(() => result.current.setSeparateDistribution(false));
    await act(async () => {
      await result.current.onSubmit({
        title: "Prelekcja z ulotkami",
        actionType: "Prelekcja",
        date: "2026-05-11",
        facilityName: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        topic: "zdrowie",
        audienceGroup: "Uczniowie",
        leadEducator: "Jan Kowalski",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 30,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
      });
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].materialsDistributedCount).toBe(30);
    expect(onSave.mock.calls[0][2]).toHaveLength(1);
    expect(onSave.mock.calls[0][3]).toBeUndefined();
  });

  it.each([
    ["Stoisko edukacyjno-informacyjne", true],
    ["Wizytacja", true],
    ["Szkolenie", true],
    ["Konkurs (quiz)", true],
    ["Happening (przemarsz, gra, event)", true],
    ["Rozmowa indywidualna (instruktaż)", true],
    ["Dystrybucja", false],
    ["Publikacja media (Facebook)", false],
  ])("offers a separate distribution for form %s: %s", async (actionType, expected) => {
    const { result } = renderHook(() =>
      useActionEditorState({ programs: mockPrograms, facilities: mockFacilities, dictionaryItems: mockDictItems, staff: mockStaff, materials: mockMaterials })
    );
    act(() => result.current.setValue("actionType", actionType));
    expect(result.current.canSeparateDistribution).toBe(expected);
  });

  it("adds a linked distribution when materials are added while editing an action without materials", async () => {
    const existing: OzipzAction = {
      id: "act-stoisko", title: "Stoisko na festynie", actionType: "Stoisko edukacyjno-informacyjne", date: "2026-06-20",
      facilityName: "Szkoła Podstawowa nr 1", municipality: "Myślibórz", topic: "zdrowie", audienceGroup: "Mieszkańcy - 80",
      leadEducator: "Jan Kowalski", participantsCount: 80, indirectRecipientsCount: 0, materialsDistributedCount: 0,
      status: "wykonane", ezdStatus: "do_ezd", createdAt: "2026-06-20T10:00:00Z", updatedAt: "2026-06-20T10:00:00Z",
    };
    const onUpdate = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms, facilities: mockFacilities, dictionaryItems: mockDictItems, staff: mockStaff,
        materials: mockMaterials, editingAction: existing, actions: [existing], distributions: [], onUpdate,
      })
    );
    expect(result.current.canSeparateDistribution).toBe(true);
    expect(result.current.separateDistribution).toBe(true);
    act(() => result.current.handleAddMaterialItem("mat-ulotka-2", 50));

    await act(async () => {
      await result.current.onSubmit({ ...existing, materialsDistributedCount: 50 });
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [id, payload, items, linked] = onUpdate.mock.calls[0];
    expect(id).toBe("act-stoisko");
    expect(payload).toMatchObject({ materialsDistributedCount: 0, materialId: undefined });
    expect(items).toEqual([{ materialId: "mat-ulotka-2", quantity: 50, title: "Ulotka Profilaktyczna", type: "ulotka" }]);
    expect(linked).toMatchObject({ title: "Dystrybucja materiałów – Stoisko na festynie", participantsCount: 1, materialsDistributedCount: 50 });
  });

  it("does not offer another distribution when the edited action already has one", () => {
    const parent = { id: "act-p", title: "Prelekcja", actionType: "Prelekcja" } as OzipzAction;
    const companion = { id: "act-d", title: "Dystrybucja materiałów – Prelekcja", actionType: "Dystrybucja", linkedActionId: "act-p" } as OzipzAction;
    const { result } = renderHook(() =>
      useActionEditorState({ programs: mockPrograms, facilities: mockFacilities, dictionaryItems: mockDictItems, staff: mockStaff, materials: mockMaterials, editingAction: parent, actions: [parent, companion] })
    );
    expect(result.current.linkedDistribution?.id).toBe("act-d");
    expect(result.current.canSeparateDistribution).toBe(false);
  });

  it("does not create a separate distribution when no materials were handed out", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({ programs: mockPrograms, facilities: mockFacilities, dictionaryItems: mockDictItems, staff: mockStaff, materials: mockMaterials, onSave })
    );
    await act(async () => {
      await result.current.onSubmit({
        title: "Prelekcja bez materiałów",
        actionType: "Prelekcja",
        date: "2026-05-12",
        facilityName: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        topic: "zdrowie",
        audienceGroup: "Uczniowie",
        leadEducator: "Jan Kowalski",
        participantsCount: 20,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
      });
    });
    expect(onSave.mock.calls[0][3]).toBeUndefined();
  });

  it("initializes edit mode from distributions without collapsing multiple materials into one", async () => {
    const existingAction: OzipzAction = {
      id: "act-existing-1",
      title: "Warsztaty z wieloma materiałami",
      actionType: "Prelekcja",
      date: "2026-05-10",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      topic: "zdrowie",
      audienceGroup: "Uczniowie",
      leadEducator: "Jan Kowalski",
      participantsCount: 30,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 75,
      materialId: "mat-broszura-1",
      status: "wykonane",
      ezdStatus: "nie_dotyczy",
      createdAt: "2026-05-10T10:00:00Z",
      updatedAt: "2026-05-10T10:00:00Z",
    };

    const mockDistributions: OzipzDistribution[] = [
      {
        id: "dist-1",
        actionId: "act-existing-1",
        materialId: "mat-broszura-1",
        materialTitle: "Broszura o Zdrowiu",
        recipientName: "Szkoła Podstawowa nr 1",
        distributionDate: "2026-05-10",
        assignedEducator: "Jan Kowalski",
        purpose: "Warsztaty",
        quantity: 50,
        createdAt: "2026-05-10T10:00:00Z",
        updatedAt: "2026-05-10T10:00:00Z",
      },
      {
        id: "dist-2",
        actionId: "act-existing-1",
        materialId: "mat-ulotka-2",
        materialTitle: "Ulotka Profilaktyczna",
        recipientName: "Szkoła Podstawowa nr 1",
        distributionDate: "2026-05-10",
        assignedEducator: "Jan Kowalski",
        purpose: "Warsztaty",
        quantity: 25,
        createdAt: "2026-05-10T10:00:00Z",
        updatedAt: "2026-05-10T10:00:00Z",
      },
    ];

    const onUpdate = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        editingAction: existingAction,
        distributions: mockDistributions,
        onUpdate,
      })
    );

    // Sprawdź czy obie pozycje zostały wczytane z ich osobnymi ilościami (50 i 25, a NIE 1 pozycja z 75)
    expect(result.current.materialItems.length).toBe(2);
    expect(result.current.materialItems[0].materialId).toBe("mat-broszura-1");
    expect(result.current.materialItems[0].quantity).toBe(50);
    expect(result.current.materialItems[1].materialId).toBe("mat-ulotka-2");
    expect(result.current.materialItems[1].quantity).toBe(25);
    expect(result.current.materialsDistributedCount).toBe(75);

    // Wywołaj aktualizację (onSubmit)
    await act(async () => {
      await result.current.onSubmit({
        title: "Warsztaty z wieloma materiałami (zaktualizowane)",
        actionType: "Prelekcja",
        date: "2026-05-10",
        facilityName: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        topic: "zdrowie",
        audienceGroup: "Uczniowie",
        leadEducator: "Jan Kowalski",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 75,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
      });
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const actionId = onUpdate.mock.calls[0][0];
    const distributionMaterials = onUpdate.mock.calls[0][2];

    expect(actionId).toBe("act-existing-1");
    // Stary wpis z materiałami: bez świadomego włączenia przełącznika nic się nie rozdziela.
    expect(result.current.separateDistribution).toBe(false);
    expect(onUpdate.mock.calls[0][3]).toBeUndefined();
    expect(distributionMaterials).toEqual([
      { materialId: "mat-broszura-1", quantity: 50, title: "Broszura o Zdrowiu", type: "broszura" },
      { materialId: "mat-ulotka-2", quantity: 25, title: "Ulotka Profilaktyczna", type: "ulotka" },
    ]);
  });

  it("duplicateActionDraft preserves multiple material items and passes them into new draft", () => {
    const sourceAction: OzipzAction = {
      id: "act-src-10",
      title: "Akcja Profilaktyczna",
      actionType: "Prelekcja",
      date: "2026-06-01",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      topic: "zdrowie",
      audienceGroup: "Uczniowie",
      leadEducator: "Jan Kowalski",
      participantsCount: 40,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 80,
      materialId: "mat-broszura-1",
      status: "wykonane",
      ezdStatus: "nie_dotyczy",
      createdAt: "2026-06-01T10:00:00Z",
      updatedAt: "2026-06-01T10:00:00Z",
    };

    const distributions: OzipzDistribution[] = [
      {
        id: "dist-10-a",
        actionId: "act-src-10",
        materialId: "mat-broszura-1",
        materialTitle: "Broszura o Zdrowiu",
        recipientName: "Szkoła Podstawowa nr 1",
        distributionDate: "2026-06-01",
        assignedEducator: "Jan Kowalski",
        purpose: "Warsztaty",
        quantity: 50,
        createdAt: "2026-06-01T10:00:00Z",
        updatedAt: "2026-06-01T10:00:00Z",
      },
      {
        id: "dist-10-b",
        actionId: "act-src-10",
        materialId: "mat-ulotka-2",
        materialTitle: "Ulotka Profilaktyczna",
        recipientName: "Szkoła Podstawowa nr 1",
        distributionDate: "2026-06-01",
        assignedEducator: "Jan Kowalski",
        purpose: "Warsztaty",
        quantity: 30,
        createdAt: "2026-06-01T10:00:00Z",
        updatedAt: "2026-06-01T10:00:00Z",
      },
    ];

    const draft = duplicateActionDraft(sourceAction, distributions);

    expect(draft.materialItems).toBeDefined();
    expect(draft.materialItems?.length).toBe(2);
    expect(draft.materialItems?.[0]).toEqual({ materialId: "mat-broszura-1", quantity: 50 });
    expect(draft.materialItems?.[1]).toEqual({ materialId: "mat-ulotka-2", quantity: 30 });

    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        editingAction: draft,
      })
    );

    expect(result.current.materialItems.length).toBe(2);
    expect(result.current.materialItems[0].quantity).toBe(50);
    expect(result.current.materialItems[1].quantity).toBe(30);
    expect(result.current.materialsDistributedCount).toBe(80);
  });

  it("falls back to single material item if action has only legacy single materialId without distributions", () => {
    const legacyAction: OzipzAction = {
      id: "act-legacy-1",
      title: "Starsze działanie",
      actionType: "Prelekcja",
      date: "2026-01-10",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      topic: "zdrowie",
      audienceGroup: "Uczniowie",
      leadEducator: "Jan Kowalski",
      participantsCount: 20,
      indirectRecipientsCount: 0,
      materialsDistributedCount: 15,
      materialId: "mat-broszura-1",
      status: "wykonane",
      ezdStatus: "nie_dotyczy",
      createdAt: "2026-01-10T10:00:00Z",
      updatedAt: "2026-01-10T10:00:00Z",
    };

    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        editingAction: legacyAction,
        distributions: [],
      })
    );

    expect(result.current.materialItems.length).toBe(1);
    expect(result.current.materialItems[0]).toMatchObject({
      materialId: "mat-broszura-1",
      quantity: 15,
    });
  });
});
