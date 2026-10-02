import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionEditorState } from "./useActionEditorState";
import { ACTION_CARD_PRESETS } from "./presetsConfig";
import type {
  OzipzProgram,
  OzipzFacility,
  OzipzDictionaryItem,
  OzipzStaff,
  OzipzTemplate,
  OzipzMaterial,
  OzipzAction,
} from "../../../types/ozipz.types";

describe("useActionEditorState Hook", () => {
  const mockPrograms: OzipzProgram[] = [
    {
      id: "prog-trzymaj-forme",
      code: "TF",
      name: "Trzymaj Formę!",
      editionYear: "2026",
      targetAudience: "Uczniowie klas 5-8",
      description: "Program edukacji żywieniowej",
      status: "aktywny",
      jrwaSymbol: "966.1",
      participatingSchoolsCount: 10,
      totalPupilsReached: 250,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const mockFacilities: OzipzFacility[] = [
    {
      id: "fac-sp1",
      name: "Szkoła Podstawowa nr 1",
      type: "szkola_podstawowa",
      municipality: "Myślibórz",
      county: "powiat myśliborski",
      address: "ul. Piłsudskiego 10",
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
      id: "dict-act-prelekcja",
      dictType: "activityType",
      code: "prelekcja",
      label: "Prelekcja (warsztat)",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "dict-act-pub-x",
      dictType: "activityType",
      code: "publikacja_x",
      label: "Publikacja media (Portal X)",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "dict-muni-mysliborz",
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
      role: "Młodszy asystent",
      email: "jan@psse.gov.pl",
      phone: "123456789",
      active: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  it("fills the first database person when staff loads after opening", () => {
    const { result, rerender } = renderHook(({ staff }) => useActionEditorState({ staff }), {
      initialProps: { staff: [] as OzipzStaff[] },
    });
    expect(result.current.leadEducator).toBe("");
    rerender({ staff: mockStaff });
    expect(result.current.leadEducator).toBe("Jan Kowalski");
    act(() => result.current.setValue("leadEducator", "Inna osoba"));
    rerender({ staff: [...mockStaff] });
    expect(result.current.leadEducator).toBe("Inna osoba");
  });

  const mockMaterials: OzipzMaterial[] = [
    {
      id: "mat-ulotka",
      title: "Ulotka Zdrowe Żywienie",
      materialType: "ulotka",
      topic: "zdrowy_styl_zycia",
      publisher: "GIS",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  const mockTemplates: OzipzTemplate[] = [
    {
      id: "tpl-warsztaty",
      title: "Warsztaty Profilaktyczne",
      topic: "tyton",
      actionType: "Prelekcja (warsztat)",
      defaultAudience: "Uczniowie klas 7-8",
      descriptionTemplate: "Szczegółowy przebieg warsztatów...",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  it("initializes form with default values", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
      })
    );

    expect(result.current.title).toBe("");
    expect(result.current.actionType).toBe("");
    expect(result.current.leadEducator).toBe("Jan Kowalski");
    expect(result.current.isPublication).toBe(false);
  });

  it("applies action presets correctly", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
      })
    );

    const preset = ACTION_CARD_PRESETS[0];
    act(() => {
      result.current.applyPreset(preset);
    });

    expect(result.current.actionType).toBe(preset.actionType);
    expect(result.current.selectedJrwaSymbol).toBe(preset.jrwaSymbol);
    if (preset.titlePrefix) {
      expect(result.current.title).toBe(preset.titlePrefix);
    }
  });

  it("auto-matches facility by name and populates address and municipality", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
      })
    );

    act(() => {
      result.current.handleFacilityNameInput("Szkoła Podstawowa nr 1");
    });

    expect(result.current.facilityId).toBe("fac-sp1");
    expect(result.current.municipality).toBe("Myślibórz");
    expect(result.current.facilityAddress).toContain("ul. Piłsudskiego 10");
  });

  it("locks EZD, IZRZ, JRWA and zeros recipients when action type is publication", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
      })
    );

    act(() => {
      result.current.setValue("actionType", "Publikacja media (Portal X)");
    });

    expect(result.current.isPublication).toBe(true);
    expect(result.current.ezdStatus).toBe("nie_dotyczy");
    expect(result.current.izrzSign).toBe("");
    expect(result.current.jrwaSign).toBe("");
    expect(result.current.totalDirectParticipants).toBe(0);
    expect(result.current.facilityName).toBe("PSSE Myślibórz (media / publikacja internetowa)");
  });

  it("manages dynamic distributed material items and synchronizes total MAT count", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
      })
    );

    act(() => {
      result.current.handleAddMaterialItem("mat-ulotka", 15);
    });

    expect(result.current.materialItems.length).toBe(1);
    expect(result.current.materialItems[0].quantity).toBe(15);
    expect(result.current.materialsDistributedCount).toBe(15);

    act(() => {
      result.current.handleAddMaterialItem("mat-ulotka", 10);
    });
    expect(result.current.materialItems.length).toBe(2);
    expect(result.current.materialsDistributedCount).toBe(25);

    act(() => {
      result.current.handleRemoveMaterialItem(0);
    });
    expect(result.current.materialItems.length).toBe(1);
    expect(result.current.materialsDistributedCount).toBe(10);
  });

  it("applies template to fill title, topic, audience and description", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
      })
    );

    act(() => {
      result.current.handleApplyTemplate("tpl-warsztaty");
    });

    expect(result.current.title).toBe("Warsztaty Profilaktyczne");
    expect(result.current.activitiesDescription).toContain("Szczegółowy przebieg warsztatów...");
    expect(result.current.audienceGroups.length).toBeGreaterThan(0);
  });

  it("calls onSave when submitting a new prefilled action (without id)", async () => {
    const onSave = vi.fn();
    const onUpdate = vi.fn();
    const onCancel = vi.fn();

    const prefilledAction: Partial<OzipzAction> = {
      title: "Akcja z planu pracy",
      date: "2026-09-02",
      facilityName: "Szkoła Podstawowa nr 1",
      scheduleEventId: "ev-999",
    };

    const { result } = renderHook(() =>
      useActionEditorState({
        editingAction: prefilledAction,
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
        onSave,
        onUpdate,
        onCancel,
      })
    );

    act(() => {
      result.current.setValue("title", "Zatwierdzona akcja z planu");
      result.current.setValue("actionType", "Prelekcja (warsztat)");
      result.current.setValue("facilityName", "Szkoła Podstawowa nr 1");
      result.current.setValue("municipality", "Myślibórz");
      result.current.setValue("topic", "zdrowy_styl_zycia");
      result.current.setValue("audienceGroup", "Dzieci");
      result.current.setValue("leadEducator", "Jan Kowalski");
    });

    await act(async () => {
      await result.current.onSubmit({
        title: "Zatwierdzona akcja z planu",
        actionType: "Prelekcja (warsztat)",
        date: "2026-09-02",
        facilityName: "Szkoła Podstawowa nr 1",
        municipality: "Myślibórz",
        topic: "zdrowy_styl_zycia",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Kowalski",
        participantsCount: 20,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "w_ezd",
      });
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("strictly prevents generating or assigning jrwaSign when actionType is a publication", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
        onSave,
      })
    );

    // 1. Wybierz działanie: Publikacja w mediach społecznościowych
    act(() => {
      result.current.setValue("actionType", "Publikacja media (Portal X)");
    });

    expect(result.current.isPublication).toBe(true);
    expect(result.current.isNoJrwa).toBe(true);
    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");
    expect(result.current.ezdStatus).toBe("nie_dotyczy");

    // 2. Próba wybrania programu dla publikacji NIE może nadać znaku sprawy
    act(() => {
      result.current.handleProgramOrJrwaSelect("prog:prog-trzymaj-forme");
    });

    expect(result.current.programId).toBe("prog-trzymaj-forme");
    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 3. Próba zmiany daty
    act(() => {
      result.current.setQuickDate("today");
    });

    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 4. Próba zmiany placówki
    act(() => {
      result.current.setValue("facilityName", "PSSE Myślibórz");
    });

    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 5. Ręczne wywołanie handleGenerateJrwaSign jest ignorowane
    act(() => {
      result.current.handleGenerateJrwaSign();
    });

    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 6. Przy zapisie (onSubmit) payload nie ma znaku sprawy ani sprawy JRWA
    await act(async () => {
      await result.current.onSubmit({
        title: "Post na portalu X o zdrowiu",
        actionType: "Publikacja media (Portal X)",
        date: "2026-09-03",
        facilityName: "PSSE Myślibórz (media / publikacja internetowa)",
        municipality: "Myślibórz",
        topic: "zdrowy_styl_zycia",
        audienceGroup: "",
        leadEducator: "Jan Kowalski",
        participantsCount: 0,
        materialsDistributedCount: 0,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
      });
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedAction = onSave.mock.calls[0][0];
    const autoCreateJrwa = onSave.mock.calls[0][1];

    expect(savedAction.jrwaSign).toBeUndefined();
    expect(savedAction.jrwaCaseId).toBeUndefined();
    expect(savedAction.izrzSign).toBeUndefined();
    expect(savedAction.ezdStatus).toBe("nie_dotyczy");
    expect(autoCreateJrwa).toBeUndefined();
  });

  it("strictly prevents generating or assigning jrwaSign for standalone distribution (samoistna dystrybucja)", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useActionEditorState({
        programs: mockPrograms,
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
        staff: mockStaff,
        materials: mockMaterials,
        templates: mockTemplates,
        onSave,
      })
    );

    // 1. Wybierz działanie: Dystrybucja
    act(() => {
      result.current.setValue("actionType", "Dystrybucja");
    });

    expect(result.current.isDistribution).toBe(true);
    expect(result.current.isNoJrwa).toBe(true);
    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");
    expect(result.current.ezdStatus).toBe("nie_dotyczy");

    // 2. Próba wybrania programu dla dystrybucji NIE może nadać znaku sprawy
    act(() => {
      result.current.handleProgramOrJrwaSelect("prog:prog-trzymaj-forme");
    });

    expect(result.current.programId).toBe("prog-trzymaj-forme");
    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 3. Próba zmiany daty
    act(() => {
      result.current.setQuickDate("today");
    });

    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 4. Ręczne wywołanie handleGenerateJrwaSign jest ignorowane
    act(() => {
      result.current.handleGenerateJrwaSign();
    });

    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");

    // 5. Dodaj materiały (dystrybucja ZACHOWUJE materiały oświatowe)
    act(() => {
      result.current.handleAddMaterialItem("mat-ulotka", 50);
    });

    expect(result.current.materialsDistributedCount).toBe(50);

    // 6. Przy zapisie (onSubmit) payload nie ma znaku sprawy ani sprawy JRWA, ale ma materiały
    await act(async () => {
      await result.current.onSubmit({
        title: "Dystrybucja ulotek w przychodni",
        actionType: "Dystrybucja",
        date: "2026-09-03",
        facilityName: "NZOZ Przychodnia Rodzinna",
        municipality: "Myślibórz",
        topic: "zdrowy_styl_zycia",
        audienceGroup: "",
        leadEducator: "Jan Kowalski",
        participantsCount: 0,
        materialsDistributedCount: 50,
        status: "wykonane",
        ezdStatus: "nie_dotyczy",
      });
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedAction = onSave.mock.calls[0][0];
    const autoCreateJrwa = onSave.mock.calls[0][1];

    expect(savedAction.jrwaSign).toBeUndefined();
    expect(savedAction.jrwaCaseId).toBeUndefined();
    expect(savedAction.izrzSign).toBeUndefined();
    expect(savedAction.ezdStatus).toBe("nie_dotyczy");
    expect(savedAction.materialsDistributedCount).toBe(50);
    expect(autoCreateJrwa).toBeUndefined();
  });

  it("handles facility name input matching and empty string edge cases safely", () => {
    const { result } = renderHook(() =>
      useActionEditorState({
        facilities: mockFacilities,
        dictionaryItems: mockDictItems,
      })
    );

    // Matching facility name
    act(() => {
      result.current.handleFacilityNameInput("Szkoła Podstawowa nr 1");
    });
    expect(result.current.form.getValues("facilityId")).toBe("fac-sp1");
    expect(result.current.form.getValues("municipality")).toBe("Myślibórz");

    // Empty or whitespace input
    act(() => {
      result.current.handleFacilityNameInput("   ");
    });
    expect(result.current.form.getValues("facilityId")).toBe("");
    expect(result.current.facilityAddress).toBe("");

    // Custom unmatched facility name
    act(() => {
      result.current.handleFacilityNameInput("Nieistniejący Ośrodek Kultury");
    });
    expect(result.current.form.getValues("facilityId")).toBe("");
    expect(result.current.form.getValues("facilityName")).toBe("Nieistniejący Ośrodek Kultury");
  });

  it("preserves numberOfActions and guards matchFacilityInfo against non-array facilities", async () => {
    const { buildActionCleanPayload, matchFacilityInfo } = await import("./actionEditorSubmitUtils");

    // Guard test: non-array facilities
    expect(matchFacilityInfo("Test", null as any)).toBeNull();
    expect(matchFacilityInfo("Test", undefined as any)).toBeNull();

    // Preservation test: numberOfActions
    const payload = buildActionCleanPayload({
      data: {
        title: "Działanie cykliczne",
        actionType: "Prelekcja (warsztat)",
        date: "2026-05-10",
        leadEducator: "Jan Kowalski",
        numberOfActions: 3,
        participantsCount: 45,
        materialsDistributedCount: 0,
      } as any,
      campaignDict: [],
      activitiesDescription: "",
      additionalNotes: "",
      isPublication: false,
      isNoJrwa: true,
      formattedAudienceString: "Uczniowie",
      totalDirectParticipants: 45,
    });

    expect(payload.numberOfActions).toBe(3);

    // Default fallback when omitted
    const defaultPayload = buildActionCleanPayload({
      data: {
        title: "Pojedyncze działanie",
        actionType: "Prelekcja (warsztat)",
        date: "2026-05-10",
        leadEducator: "Jan Kowalski",
        participantsCount: 20,
        materialsDistributedCount: 0,
      } as any,
      campaignDict: [],
      activitiesDescription: "",
      additionalNotes: "",
      isPublication: false,
      isNoJrwa: true,
      formattedAudienceString: "Uczniowie",
      totalDirectParticipants: 20,
    });

    expect(defaultPayload.numberOfActions).toBe(1);
  });
});
