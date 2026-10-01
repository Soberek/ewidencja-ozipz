import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActionEditorState } from "./useActionEditorState";
import { duplicateActionDraft, getDefaultActionFormValues, getSoleActiveStaffName } from "./editorUtils";
import {
  buildActionCleanPayload,
  describeSaveError,
  findDuplicateAction,
  resolveActionInitialMaterials,
} from "./actionEditorSubmitUtils";
import type { ActionFormOutput } from "./editor.types";
import type { OzipzAction, OzipzJrwaCase, OzipzProgram, OzipzStaff } from "../../../types/ozipz.types";
import { PUBLICATION_DEFAULTS } from "../../../constants";

const ts = { createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const programs: OzipzProgram[] = [{
  ...ts, id: "prog-tf", code: "TF", name: "Trzymaj Formę!", editionYear: "2026", jrwaSymbol: "966.1",
  targetAudience: "", description: "", status: "aktywny", participatingSchoolsCount: 0, totalPupilsReached: 0,
}];
const person = (id: string, fullName: string, active = true): OzipzStaff =>
  ({ ...ts, id, fullName, role: "Edukator", email: "", phone: "", active });
const staff = [person("s1", "Jan Kowalski")];

const registered: OzipzAction = {
  ...ts, id: "act-1", title: "Trzymaj Formę!", actionType: "Prelekcja (warsztat)", date: "2026-09-10",
  facilityName: "SP1", municipality: "Myślibórz", programId: "prog-tf", programName: "Trzymaj Formę!",
  topic: "", audienceGroup: "Klasa 5 - 20", participantsCount: 20, leadEducator: "Jan Kowalski",
  jrwaSign: "OZiPZ.966.1.3.2026", jrwaCaseId: "case-3", izrzSign: "40/2026", ezdStatus: "w_ezd", status: "wykonane",
  numberOfActions: 1, indirectRecipientsCount: 0, materialsDistributedCount: 0,
};
const other: OzipzAction = { ...registered, id: "act-2", jrwaSign: "OZiPZ.966.1.7.2026", izrzSign: "55/2026", jrwaCaseId: "case-7" };
const cases: OzipzJrwaCase[] = [{
  ...ts, id: "case-3", section: "OZiPZ", jrwaSymbol: "966.1", caseNumber: 3, year: 2026,
  fullCaseSign: "OZiPZ.966.1.3.2026", title: "", status: "w_toku", assignedEducator: "Jan Kowalski",
}];

const submit = async (result: { current: ReturnType<typeof useActionEditorState> }) => {
  await act(async () => { await result.current.onSubmit(result.current.form.getValues() as ActionFormOutput); });
};

describe("Edycja działania nie zmienia nadanego znaku sprawy ani numeru IZRZ", () => {
  const renderEdit = (action: OzipzAction, onUpdate = vi.fn()) => renderHook(() => useActionEditorState({
    editingAction: action, actions: [action, other], programs, jrwaCases: cases, staff, onUpdate, onCancel: vi.fn(),
  }));

  it("zmiana daty w tym samym roku zostawia znak, IZRZ i sprawę", async () => {
    const onUpdate = vi.fn();
    const { result } = renderEdit(registered, onUpdate);
    act(() => result.current.handleDateChange("2026-09-11"));
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.3.2026");
    expect(result.current.izrzSign).toBe("40/2026");
    await submit(result);
    expect(onUpdate.mock.calls[0][1]).toMatchObject({
      date: "2026-09-11", jrwaSign: "OZiPZ.966.1.3.2026", izrzSign: "40/2026", jrwaCaseId: "case-3",
    });
  });

  it("zmiana lub wyczyszczenie programu nie nadpisuje znaku", () => {
    const { result } = renderEdit(registered);
    act(() => result.current.handleProgramOrJrwaSelect("jrwa:966.6"));
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.3.2026");
    act(() => result.current.handleProgramOrJrwaSelect(""));
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.3.2026");
    expect(result.current.izrzSign).toBe("40/2026");
  });

  it("otwarcie starego działania programowego bez znaku nie nadaje nowego numeru", () => {
    const noSign = { ...registered, id: "act-ns", jrwaSign: undefined, izrzSign: undefined, jrwaCaseId: undefined };
    const { result } = renderEdit(noSign);
    expect(result.current.jrwaSign).toBe("");
    expect(result.current.izrzSign).toBe("");
  });

  it("jawne Auto-Generuj nadaje nowy znak i odpina starą sprawę", () => {
    const { result } = renderEdit(registered);
    act(() => result.current.handleGenerateJrwaSign());
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.8.2026");
    expect(result.current.form.getValues("jrwaCaseId")).toBe("");
  });
});

describe("Nowe działanie: znak JRWA i status EZD", () => {
  const fillNew = (result: { current: ReturnType<typeof useActionEditorState> }, facility = "SP1") => {
    act(() => {
      result.current.setValue("actionType", "Prelekcja (warsztat)");
      result.current.handleProgramOrJrwaSelect("prog:prog-tf");
      result.current.setAudienceGroups([{ id: "g1", name: "G1", items: [{ id: "i1", name: "Klasa 5", count: 20 }] }]);
      result.current.setValue("facilityName", facility);
      result.current.setValue("municipality", "Myślibórz");
    });
  };

  it("bez wyboru statusu zapisuje się jako 'do EZD', nigdy jako 'w EZD'", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useActionEditorState({ programs, staff, onSave, onCancel: vi.fn() }));
    fillNew(result);
    await submit(result);
    expect(onSave.mock.calls[0][0].ezdStatus).toBe("do_ezd");
  });

  it("'Zapisz i dodaj podobne' daje kolejnemu działaniu następny wolny znak", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useActionEditorState({
      programs, staff, actions: [other], jrwaCases: cases, onSave, onCancel: vi.fn(),
    }));
    fillNew(result);
    await act(async () => { await result.current.onSaveAndAddSimilar(); });
    expect(onSave.mock.calls[0][0].jrwaSign).toBe("OZiPZ.966.1.8.2026");
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.9.2026");

    act(() => {
      result.current.setAudienceGroups([{ id: "g2", name: "G2", items: [{ id: "i2", name: "Klasa 6", count: 18 }] }]);
      result.current.setValue("facilityName", "SP2");
      result.current.setValue("municipality", "Barlinek");
    });
    await act(async () => { await result.current.onSaveAndAddSimilar(); });
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave.mock.calls[1][0]).toMatchObject({ jrwaSign: "OZiPZ.966.1.9.2026", ezdStatus: "do_ezd" });
    expect(onSave.mock.calls[1][1]).toMatchObject({ caseNumber: 9, fullCaseSign: "OZiPZ.966.1.9.2026" });
  });

  it("zmiana daty w nowym działaniu przelicza znak tylko przy zmianie roku", () => {
    const { result } = renderHook(() => useActionEditorState({ programs, staff, actions: [other], jrwaCases: cases }));
    act(() => { result.current.handleDateChange("2026-03-01"); });
    act(() => { result.current.handleProgramOrJrwaSelect("prog:prog-tf"); });
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.8.2026");
    act(() => { result.current.handleDateChange("2026-04-01"); });
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.8.2026");
    act(() => { result.current.handleDateChange("2027-01-05"); });
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.1.2027");
  });

  it("ostrzega przed identycznym działaniem i zapisuje dopiero po ponownym potwierdzeniu", async () => {
    const onSave = vi.fn();
    const same = { ...registered, facilityName: "SP1", date: "2026-09-10" };
    const { result } = renderHook(() => useActionEditorState({
      programs, staff, actions: [same], jrwaCases: cases, onSave, onCancel: vi.fn(),
    }));
    fillNew(result);
    act(() => { result.current.handleDateChange("2026-09-10"); });
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    await submit(result);
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.saveError).toContain("takie samo działanie");
    // Przypadkowy dwuklik nie zatwierdza duplikatu.
    now.mockReturnValue(1_000_200);
    await submit(result);
    expect(onSave).not.toHaveBeenCalled();
    now.mockReturnValue(1_002_000);
    await submit(result);
    expect(onSave).toHaveBeenCalledTimes(1);
    now.mockRestore();
  });

  it("pokazuje przyczynę błędu zapisu z bazy danych", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onSave = vi.fn().mockRejectedValue(new Error("error returned from database: (code: 1811) Miesiąc jest zamknięty."));
    const { result } = renderHook(() => useActionEditorState({ programs, staff, onSave, onCancel: vi.fn() }));
    fillNew(result);
    await submit(result);
    expect(result.current.saveError).toContain("Miesiąc jest zamknięty.");
    expect(result.current.saveError).toContain("Dane pozostały w formularzu");
  });
});

describe("Kopia działania", () => {
  it("nie przenosi sprawy JRWA ani statusu 'w EZD' źródła", () => {
    const draft = duplicateActionDraft({ ...registered, programId: undefined });
    expect(draft).toMatchObject({ jrwaCaseId: undefined, jrwaSign: undefined, izrzSign: undefined, ezdStatus: "" });
  });

  it("dla publikacji zostawia status 'nie dotyczy'", () => {
    const draft = duplicateActionDraft({ ...registered, actionType: "Publikacja media (Facebook)" });
    expect(draft.ezdStatus).toBe("nie_dotyczy");
  });
});

describe("Starsze dystrybucje z samą liczbą materiałów", () => {
  const legacy = { ...registered, id: "better-oz-1105", actionType: "Dystrybucja", programId: undefined,
    jrwaSign: undefined, izrzSign: undefined, jrwaCaseId: undefined, ezdStatus: "nie_dotyczy",
    materialId: undefined, materialsDistributedCount: 10 };

  it("nie tworzą pustej pozycji materiału", () => {
    expect(resolveActionInitialMaterials(legacy, [])).toEqual([]);
    expect(resolveActionInitialMaterials({ ...legacy, materialId: "m1" }, [])).toEqual([{ materialId: "m1", quantity: 10 }]);
  });

  it("dają się zapisać po edycji z zachowaniem liczby materiałów", async () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useActionEditorState({ editingAction: legacy, actions: [legacy], staff, onUpdate, onCancel: vi.fn() }));
    await submit(result);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][1].materialsDistributedCount).toBe(10);
    expect(onUpdate.mock.calls[0][2]).toEqual([]);
  });
});

describe("Publikacje i dystrybucje", () => {
  it("zachowują wybraną klasyfikację JRWA bez programu jako symbol", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useActionEditorState({ staff, onSave, onCancel: vi.fn() }));
    act(() => {
      result.current.setValue("actionType", "Publikacja media (Facebook)");
      result.current.setValue("title", "Post o HPV");
    });
    act(() => { result.current.handleProgramOrJrwaSelect("jrwa:966.7"); });
    await submit(result);
    expect(onSave.mock.calls[0][0]).toMatchObject({ jrwaSign: "966.7", ezdStatus: "nie_dotyczy", izrzSign: undefined });
  });

  it("po zmianie formy z publikacji usuwają automatycznie wpisane miejsce", () => {
    const { result } = renderHook(() => useActionEditorState({ staff }));
    act(() => { result.current.setValue("actionType", "Publikacja media (Facebook)"); });
    expect(result.current.facilityName).toBe(PUBLICATION_DEFAULTS.facilityName);
    act(() => { result.current.setValue("actionType", "Pismo (list intencyjny)"); });
    expect(result.current.facilityName).toBe("");
    expect(result.current.municipality).toBe("");
  });

  it("zostawiają miejsce wpisane ręcznie", () => {
    const { result } = renderHook(() => useActionEditorState({ staff }));
    act(() => { result.current.setValue("actionType", "Publikacja media (Facebook)"); });
    act(() => { result.current.setValue("facilityName", "Radio Pomorze"); });
    act(() => { result.current.setValue("actionType", "Pismo (list intencyjny)"); });
    expect(result.current.facilityName).toBe("Radio Pomorze");
  });
});

describe("Osoba prowadząca", () => {
  it("jest podpowiadana tylko przy jednej aktywnej osobie w kadrze", () => {
    expect(getSoleActiveStaffName([person("s1", "Jan Kowalski")])).toBe("Jan Kowalski");
    expect(getSoleActiveStaffName([person("s1", "Jan Kowalski"), person("s2", "Anna Nowak")])).toBe("");
    expect(getSoleActiveStaffName([person("s1", "Jan Kowalski"), person("s2", "Anna Nowak", false)])).toBe("Jan Kowalski");
    expect(getDefaultActionFormValues([], [person("s1", "A"), person("s2", "B")]).leadEducator).toBe("");
  });

  it("nie jest wybierana arbitralnie, gdy w kadrze jest kilka osób", () => {
    const { result } = renderHook(() => useActionEditorState({ staff: [person("s1", "Jan Kowalski"), person("s2", "Anna Nowak")] }));
    expect(result.current.leadEducator).toBe("");
  });
});

describe("Pomocnicze funkcje zapisu", () => {
  it("wykrywają identyczne działanie po dacie, tytule, miejscu i formie", () => {
    const payload = buildActionCleanPayload({
      data: { ...registered, title: " trzymaj formę! ", facilityName: "sp1" } as ActionFormOutput,
      campaignDict: [], activitiesDescription: "", additionalNotes: "", isPublication: false, isNoJrwa: false,
      formattedAudienceString: "Klasa 5 - 20", totalDirectParticipants: 20,
    });
    expect(findDuplicateAction(payload, [registered])?.id).toBe("act-1");
    expect(findDuplicateAction({ ...payload, date: "2026-09-11" }, [registered])).toBeUndefined();
    // Te same dane, ale inny program lub kampania – to osobne działanie.
    expect(findDuplicateAction({ ...payload, programId: "prog-inny", programName: "Inny program" }, [registered])).toBeUndefined();
    expect(findDuplicateAction({ ...payload, campaignId: "hpv" }, [registered])).toBeUndefined();
  });

  it("zapisują kampanię kodem słownika, także gdy formularz ma starszą etykietę lub id pozycji", () => {
    const campaignDict = [
      { id: "dict_camp_hpv", dictType: "campaign", code: "nie_odbieraj_sobie_glosu_hpv", label: "Nie odbieraj sobie głosu (HPV)", isSystem: true, createdAt: "", updatedAt: "" },
    ];
    for (const campaignId of ["nie_odbieraj_sobie_glosu_hpv", "Nie odbieraj sobie głosu (HPV)", "dict_camp_hpv"]) {
      const payload = buildActionCleanPayload({
        data: { ...registered, campaignId } as ActionFormOutput,
        campaignDict, activitiesDescription: "", additionalNotes: "", isPublication: false, isNoJrwa: false,
        formattedAudienceString: "", totalDirectParticipants: 0,
      });
      expect(payload.campaignId).toBe("nie_odbieraj_sobie_glosu_hpv");
      expect(payload.campaignName).toBe("Nie odbieraj sobie głosu (HPV)");
    }
  });

  it("wyciągają czytelną przyczynę błędu", () => {
    expect(describeSaveError(new Error("error returned from database: (code: 787) FOREIGN KEY constraint failed"))).toBe("FOREIGN KEY constraint failed");
    expect(describeSaveError(new Error("Zadanie harmonogramu jest już powiązane z innym działaniem."))).toBe("Zadanie harmonogramu jest już powiązane z innym działaniem.");
    expect(describeSaveError(undefined)).toBe("");
  });
});
