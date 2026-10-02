import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useActionEditorState } from "./useActionEditorState";
import { ActionQuickForm } from "./ActionQuickForm";
import { ActionEditorFooter } from "./ActionEditorFooter";
import { actionDraftKey, clearActionDraft, hasActionDraftContent, loadActionDraft, saveActionDraft, type ActionDraft } from "./actionDraft";
import { getMissingActionFields, buildActionCleanPayload } from "./actionEditorSubmitUtils";
import { handleActionSaveShortcut } from "./editorShortcuts";
import { useDiscardConfirmation } from "./useDiscardConfirmation";
import { getDefaultActionFormValues } from "./editorUtils";
import { filterActionsList } from "../hooks/actionsFilterLogic";
import type { ActionEditorSectionProps, ActionFormOutput } from "./editor.types";
import type { OzipzAction, OzipzProgram } from "../../../types/ozipz.types";

const ts = { createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const programs: OzipzProgram[] = [{
  ...ts, id: "p1", code: "p1", name: "Program testowy", editionYear: "2026", jrwaSymbol: "966.1",
  targetAudience: "", description: "", status: "aktywny", participatingSchoolsCount: 0, totalPupilsReached: 0,
}];
const data: ActionEditorSectionProps = {
  programs,
  dictionaryItems: [{ ...ts, id: "a1", code: "prelekcja", label: "Prelekcja", dictType: "activityType", isSystem: false }],
  facilities: [{ ...ts, id: "f1", name: "Szkoła testowa", type: "szkola", municipality: "Myślibórz", county: "", address: "Szkolna 1", city: "Golenice", postalCode: "74-300", leadingAuthority: "", isComplex: false }],
  municipalities: ["Gmina Myślibórz", "Gmina Dębno"],
};

function Harness(props: ActionEditorSectionProps) {
  const state = useActionEditorState(props);
  return <ActionQuickForm state={state} data={props} />;
}

const emptyContent = () => ({
  values: getDefaultActionFormValues(),
  audienceGroups: [{ id: "g", name: "Grupa 1", items: [{ id: "i", name: "", count: 0 }] }],
  materialItems: [],
  activitiesDescription: "",
  additionalNotes: "",
});

beforeEach(() => clearActionDraft());
afterEach(() => { cleanup(); vi.useRealTimers(); clearActionDraft(); });

describe("Szkic nowego działania", () => {
  it("rozpoznaje dane wpisane przez użytkownika i ignoruje wartości startowe", () => {
    expect(hasActionDraftContent(emptyContent())).toBe(false);
    expect(hasActionDraftContent({ ...emptyContent(), values: { ...getDefaultActionFormValues(), title: "Pogadanka" } })).toBe(true);
    expect(hasActionDraftContent({ ...emptyContent(), activitiesDescription: "Opis" })).toBe(true);
    const base = emptyContent();
    expect(actionDraftKey(base)).toBe(actionDraftKey({ ...base, values: { ...base.values, leadEducator: "Ktoś", audienceGroup: "x" } }));
  });

  it("odrzuca uszkodzony lub pusty szkic z pamięci przeglądarki", () => {
    localStorage.setItem("oz.actionDraft.v1", "{nie-json");
    expect(loadActionDraft()).toBeNull();
    saveActionDraft({ ...emptyContent(), savedAt: "2026-09-27T10:00:00Z", selectedJrwaSymbol: "", autoSign: false });
    expect(loadActionDraft()).toBeNull();
  });

  it("zapisuje szkic automatycznie i czyści go po zapisie działania", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useActionEditorState({ ...data, enableDraft: true, onSave, onCancel: vi.fn() }));
    expect(result.current.hasUnsavedContent).toBe(false);
    act(() => {
      result.current.setValue("actionType", "Prelekcja");
      result.current.setValue("title", "Higiena rąk");
      result.current.setAudienceGroups([{ id: "g", name: "Grupa 1", items: [{ id: "i", name: "Uczniowie", count: 20 }] }]);
      result.current.setValue("facilityName", "Szkoła testowa");
      result.current.setValue("municipality", "Myślibórz");
    });
    expect(result.current.hasUnsavedContent).toBe(true);
    act(() => { vi.advanceTimersByTime(600); });
    expect(loadActionDraft()?.values.title).toBe("Higiena rąk");

    await act(async () => { await result.current.onSubmit(result.current.form.getValues() as ActionFormOutput); });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(loadActionDraft()).toBeNull();
  });

  it("proponuje przywrócenie szkicu i przywraca pola, odbiorców oraz aktualny znak sprawy", () => {
    const draft: ActionDraft = {
      savedAt: "2026-09-27T18:49:00Z",
      values: { ...getDefaultActionFormValues(), actionType: "Prelekcja", title: "Program testowy", programId: "p1", programName: "Program testowy",
        facilityName: "Szkoła testowa", facilityId: "f1", municipality: "Myślibórz", jrwaSign: "OZiPZ.966.1.1.2026", izrzSign: "1/2026" },
      audienceGroups: [{ id: "g", name: "Grupa 1", items: [{ id: "i", name: "Uczniowie", count: 18 }] }],
      materialItems: [],
      activitiesDescription: "Pogadanka",
      additionalNotes: "",
      selectedJrwaSymbol: "966.1",
      autoSign: true,
    };
    saveActionDraft(draft);
    const taken: OzipzAction = { ...ts, id: "x", title: "Inne", actionType: "Prelekcja", date: "2026-09-01", facilityName: "A", municipality: "B",
      topic: "", audienceGroup: "U - 1", participantsCount: 1, leadEducator: "L", ezdStatus: "w_ezd", status: "wykonane",
      materialsDistributedCount: 0, jrwaSign: "OZiPZ.966.1.1.2026", izrzSign: "1/2026" };
    const { result } = renderHook(() => useActionEditorState({ ...data, actions: [taken], enableDraft: true }));
    expect(result.current.pendingDraft?.values.title).toBe("Program testowy");
    act(() => result.current.restoreDraft());
    expect(result.current.pendingDraft).toBeNull();
    expect(result.current.title).toBe("Program testowy");
    expect(result.current.facilityAddress).toBe("Szkolna 1, Golenice");
    expect(result.current.totalDirectParticipants).toBe(18);
    expect(result.current.activitiesDescription).toBe("Pogadanka");
    // Numer 1 jest już zajęty — przywrócony szkic dostaje kolejny wolny numer zamiast starego.
    expect(result.current.jrwaSign).toBe("OZiPZ.966.1.2.2026");
  });

  it("nie proponuje szkicu przy edycji ani gdy użytkownik go odrzuci", () => {
    saveActionDraft({ ...emptyContent(), values: { ...getDefaultActionFormValues(), title: "Szkic" }, savedAt: "2026-09-27T10:00:00Z", selectedJrwaSymbol: "", autoSign: false });
    const edit = renderHook(() => useActionEditorState({ ...data, editingAction: { id: "a", title: "Edycja" }, enableDraft: true }));
    expect(edit.result.current.pendingDraft).toBeNull();
    expect(loadActionDraft()).not.toBeNull();
    const fresh = renderHook(() => useActionEditorState({ ...data, enableDraft: true }));
    act(() => fresh.result.current.dismissDraft());
    expect(fresh.result.current.pendingDraft).toBeNull();
    expect(loadActionDraft()).toBeNull();
  });

  it("pokazuje baner szkicu z tytułem w formularzu", () => {
    saveActionDraft({ ...emptyContent(), values: { ...getDefaultActionFormValues(), title: "Stoisko na festynie" }, savedAt: "2026-09-27T10:00:00Z", selectedJrwaSymbol: "", autoSign: false });
    render(<Harness {...data} enableDraft />);
    expect(screen.getByRole("status")).toHaveTextContent("Stoisko na festynie");
    fireEvent.click(screen.getByRole("button", { name: "Przywróć szkic" }));
    expect(screen.getByLabelText("Tytuł działania *")).toHaveValue("Stoisko na festynie");
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Porzucanie i skróty klawiszowe", () => {
  it("pyta o potwierdzenie tylko, gdy wpisano dane", () => {
    const onDiscard = vi.fn();
    const withData = renderHook(() => useDiscardConfirmation({ hasUnsavedContent: true, onDiscard }));
    act(() => withData.result.current.requestCancel());
    expect(onDiscard).not.toHaveBeenCalled();
    render(withData.result.current.confirmDialog);
    expect(screen.getByText("Porzucić nowe działanie?")).toBeInTheDocument();

    const empty = renderHook(() => useDiscardConfirmation({ hasUnsavedContent: false, onDiscard }));
    act(() => empty.result.current.requestCancel());
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("⌘/Ctrl+Enter zapisuje, a z Shiftem zapisuje i dodaje podobne", () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    const onSaveAndAddSimilar = vi.fn();
    render(<form data-testid="f" onSubmit={(e) => onSubmit(e.nativeEvent)}
      onKeyDown={(e) => handleActionSaveShortcut(e, { enabled: true, onSaveAndAddSimilar })}><input aria-label="pole" /></form>);
    fireEvent.keyDown(screen.getByLabelText("pole"), { key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByLabelText("pole"), { key: "Enter", metaKey: true, shiftKey: true });
    expect(onSaveAndAddSimilar).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByLabelText("pole"), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("nie reaguje na skrót, gdy zapis jest zablokowany", () => {
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(<form onSubmit={(e) => onSubmit(e.nativeEvent)} onKeyDown={(e) => handleActionSaveShortcut(e, { enabled: false })}><input aria-label="pole" /></form>);
    fireEvent.keyDown(screen.getByLabelText("pole"), { key: "Enter", ctrlKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("Stopka i podpowiedzi", () => {
  it("wymienia brakujące pola, a po uzupełnieniu pokazuje gotowość i skrót", () => {
    expect(getMissingActionFields({}, { isPublication: false, hasNamedAudience: false }))
      .toEqual(["forma działania", "tytuł", "data", "miejsce", "gmina", "osoba prowadząca", "odbiorcy"]);
    expect(getMissingActionFields({ actionType: "Post" }, { isPublication: true, hasNamedAudience: false })).not.toContain("odbiorcy");
    const { rerender } = render(<ActionEditorFooter totalDirectParticipants={0} onCancel={vi.fn()} ezdStatus="do_ezd" missingFields={["tytuł", "miejsce"]} />);
    expect(screen.getByText("Uzupełnij: tytuł, miejsce")).toBeInTheDocument();
    expect(screen.getByText("Do EZD")).toBeInTheDocument();
    rerender(<ActionEditorFooter totalDirectParticipants={0} onCancel={vi.fn()} missingFields={[]} />);
    expect(screen.getByText(/Gotowe do zapisu/)).toBeInTheDocument();
  });

  it("pod polem placówki pokazuje adres z bazy albo ostrzega o miejscu spoza bazy", () => {
    render(<Harness {...data} />);
    fireEvent.change(screen.getByLabelText("Placówka lub miejsce *"), { target: { value: "Szkoła testowa" } });
    expect(screen.getByText("Szkolna 1, Golenice")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Placówka lub miejsce *"), { target: { value: "Park miejski" } });
    expect(screen.getByText(/Miejsce spoza bazy placówek/)).toBeInTheDocument();
  });

  it("wczytuje wbudowany wzorzec z pola szybkiego startu", () => {
    render(<Harness {...data} />);
    fireEvent.click(screen.getByLabelText("Szybki start: szablon lub wzorzec"));
    fireEvent.click(screen.getByRole("option", { name: /2 Grupy/ }));
    expect(screen.getByLabelText("Tytuł działania *")).toHaveValue("Cykl prelekcji edukacyjnych w szkole podstawowej");
    expect(screen.getAllByLabelText("Nazwa grupy")).toHaveLength(2);
  });
});

describe("Odbiorcy", () => {
  it("przy jednej grupie nie pokazuje nagłówka grupy, a po dodaniu grupy pokazuje nazwy", () => {
    render(<Harness {...data} />);
    expect(screen.queryByLabelText("Nazwa grupy")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dodaj grupę" }));
    expect(screen.getAllByLabelText("Nazwa grupy").map((el) => (el as HTMLInputElement).value)).toEqual(["Grupa 1", "Grupa 2"]);
    fireEvent.click(screen.getByRole("button", { name: "Usuń grupę Grupa 2" }));
    expect(screen.queryByLabelText("Nazwa grupy")).toBeNull();
  });
});

describe("Gmina bez prefiksu „Gmina”", () => {
  it("formularz pokazuje nazwę gminy tak, jak zapisują ją placówki i działania", () => {
    const { result } = renderHook(() => useActionEditorState({ ...data }));
    act(() => result.current.handleFacilityNameInput("Szkoła testowa"));
    render(<ActionQuickForm state={result.current} data={data} />);
    expect(screen.getByLabelText("Gmina *")).toHaveTextContent("Myślibórz");
  });

  it("zapisuje gminę bez prefiksu i filtr rejestru łączy oba zapisy", () => {
    const payload = buildActionCleanPayload({
      data: { ...getDefaultActionFormValues(), title: "T", actionType: "Prelekcja", facilityName: "A", municipality: "Gmina Myślibórz", leadEducator: "L" } as ActionFormOutput,
      campaignDict: [], activitiesDescription: "", additionalNotes: "", isPublication: false, isNoJrwa: false,
      formattedAudienceString: "U - 1", totalDirectParticipants: 1,
    });
    expect(payload.municipality).toBe("Myślibórz");
    const action = (id: string, municipality: string): OzipzAction => ({ ...ts, id, title: id, actionType: "Prelekcja", date: "2026-09-01",
      facilityName: "A", municipality, topic: "", audienceGroup: "U - 1", participantsCount: 1, leadEducator: "L", ezdStatus: "do_ezd", status: "wykonane",
      materialsDistributedCount: 0 });
    const filtered = filterActionsList([action("a", "Myślibórz"), action("b", "Gmina Myślibórz"), action("c", "Dębno")], {
      search: "", effectivePeriod: "", statusFilter: "wszystkie", quickFilterEzd: false,
      quickFilterProgramOnly: false, materialsOnlyFilter: false, quickFilterPublications: false,
      hidePublications: false, selectedMunicipalities: ["Gmina Myślibórz"], selectedPrograms: [], selectedActivityTypes: [],
      selectedTopics: [], educatorFilter: "", ezdFilter: "all",
    });
    expect(filtered.map((a) => a.id).sort()).toEqual(["a", "b"]);
  });
});
