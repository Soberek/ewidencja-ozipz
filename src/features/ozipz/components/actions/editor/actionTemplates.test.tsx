import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { useActionEditorState } from "./useActionEditorState";
import { ActionQuickForm } from "./ActionQuickForm";
import type { ActionEditorSectionProps } from "./editor.types";
import type { OzipzDictionaryItem, OzipzMaterial, OzipzProgram, OzipzTemplate } from "../../../types/ozipz.types";

const store = vi.hoisted(() => ({ templates: [], addTemplate: vi.fn(), updateTemplate: vi.fn() }));
vi.mock("../../../store/useOzipzDbStore", () => ({ useTemplates: () => store }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

const draft = { title: "Higiena rąk", actionType: "Prelekcja", facilityName: "Szkoła", municipality: "Myślibórz", leadEducator: "Anna", audienceGroup: "Uczniowie - 20", participantsCount: 20 };
const programs = [{ id: "prog-1", name: "Program testowy", jrwaSymbol: "966.1" }] as OzipzProgram[];
const materials = [{ id: "mat-1", title: "Ulotka o higienie" }] as OzipzMaterial[];
const dictionaryItems = [{ id: "d1", dictType: "activityType", code: "prelekcja", label: "Prelekcja" }] as OzipzDictionaryItem[];
const fullTemplate: OzipzTemplate = {
  id: "t-full", title: "4 prelekcje", topic: "", actionType: "prelekcja", defaultAudience: "", descriptionTemplate: "Opis wzorcowy",
  createdAt: "", updatedAt: "",
  actionDefaults: {
    title: "", leadEducator: "Jan", campaignId: "", programId: "prog-1", jrwaSymbol: "", numberOfActions: 4,
    audienceGroups: [
      { name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }, { name: "Rodzice", ageFrom: null, ageTo: null }] },
      { name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }] },
    ],
    materialIds: ["mat-1", "mat-usuniety"],
  },
};
const data = { programs, materials, dictionaryItems, templates: [fullTemplate] };

function Harness(props: ActionEditorSectionProps) {
  const state = useActionEditorState(props);
  return <ActionQuickForm state={state} data={props} />;
}
const templatesRegion = () => within(screen.getByRole("region", { name: "Szablony" }));

describe("Action templates and repeated entry", () => {
  it("omits empty imported placeholders from the template list without removing them", () => {
    // Forma działania w bazie idzie za słownikiem: stary kod „prelekcja” i obecna etykieta to ten sam pusty rekord.
    const empty = { title: "Szablon zadania", topic: "inne", defaultAudience: "uczniowie_sp", descriptionTemplate: "", createdAt: "", updatedAt: "" };
    render(<Harness templates={[
      { ...empty, id: "empty-code", actionType: "prelekcja" },
      { ...empty, id: "empty-label", actionType: "Prelekcja (warsztat)" },
      { id: "real", title: "Prelekcja — higiena", topic: "", actionType: "Prelekcja (warsztat)", defaultAudience: "Uczniowie", descriptionTemplate: "", createdAt: "", updatedAt: "" },
    ]} />);
    const chips = templatesRegion().getAllByRole("button", { pressed: false });
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveTextContent("Prelekcja — higiena");
    expect(screen.getByText(/Pominięto puste rekordy z importu/)).toHaveTextContent("(2)");
  });

  it("without templates explains how to create the first one", () => {
    render(<Harness templates={[]} />);
    expect(templatesRegion().getByText(/Nie masz jeszcze szablonów/)).toBeInTheDocument();
    expect(templatesRegion().queryByRole("button", { pressed: false })).toBeNull();
  });

  it("fills program, count, audience groups, materials and description in one click, keeping place and dropping counts", () => {
    const { result } = renderHook(() => useActionEditorState({ editingAction: draft, ...data }));
    act(() => result.current.applyTemplate("t-full"));
    act(() => result.current.applyTemplate("t-full"));
    expect(result.current.form.getValues()).toMatchObject({
      actionType: "Prelekcja", programId: "prog-1", title: "Program testowy", numberOfActions: 4, leadEducator: "Jan", facilityName: "Szkoła",
    });
    expect(result.current.selectedJrwaSymbol).toBe("966.1");
    expect(result.current.audienceGroups.map((g) => g.items.map((i) => [i.name, i.count]))).toEqual([
      [["Uczniowie", 0], ["Rodzice", 0]], [["Uczniowie", 0]],
    ]);
    // Materiał usunięty z katalogu pomijamy; liczbę sztuk wpisuje się przy działaniu.
    expect(result.current.materialItems).toEqual([{ materialId: "mat-1", quantity: 0 }]);
    expect(result.current.missingFields).toContain("materiał i liczba sztuk");
    expect(result.current.activitiesDescription).toBe("Opis wzorcowy");
    expect(result.current.isTemplateChanged).toBe(false);
    // Szablon wpisuje kategorie bez liczb — stopka przypomina o liczbie osób, ale zapisu nie blokuje.
    expect(result.current.saveWarnings).toEqual(["liczba osób w odbiorcach to 0"]);
    expect(result.current.missingFields).not.toContain("odbiorcy");
  });

  it("reads an older template: program by name and a flattened recipient list as one group", () => {
    const old: OzipzTemplate = { id: "t-old", title: "Wzorzec", topic: "Program testowy", actionType: "Prelekcja", defaultAudience: "Uczniowie - 30; Rodzice; Uczniowie",
      descriptionTemplate: "", createdAt: "", updatedAt: "", actionDefaults: { title: "Tytuł działania", leadEducator: "", campaignId: "Kampania" } };
    const { result } = renderHook(() => useActionEditorState({ editingAction: draft, ...data, templates: [old] }));
    act(() => result.current.applyTemplate("t-old"));
    expect(result.current.form.getValues()).toMatchObject({ programId: "prog-1", title: "Tytuł działania", campaignId: "Kampania", leadEducator: "Anna" });
    expect(result.current.audienceGroups).toHaveLength(1);
    expect(result.current.audienceGroups[0].items.map((i) => i.name)).toEqual(["Uczniowie", "Rodzice"]);
    expect(result.current.totalDirectParticipants).toBe(0);
  });

  it("undo restores the form from before the template", () => {
    const { result } = renderHook(() => useActionEditorState({ editingAction: draft, ...data }));
    act(() => result.current.applyTemplate("t-full"));
    act(() => result.current.undoTemplate());
    expect(result.current.form.getValues()).toMatchObject({ title: "Higiena rąk", programId: "", numberOfActions: 1, leadEducator: "Anna" });
    expect(result.current.totalDirectParticipants).toBe(20);
    expect(result.current.saveWarnings).toEqual([]);
    expect(result.current.materialItems).toEqual([]);
    expect(result.current.selectedTemplateId).toBe("");
  });

  it("offers saving form changes back into the loaded template", async () => {
    store.updateTemplate.mockResolvedValue(undefined);
    render(<Harness {...data} />);
    fireEvent.click(templatesRegion().getByRole("button", { name: /4 prelekcje/ }));
    expect(templatesRegion().getByRole("button", { name: /4 prelekcje/ })).toHaveAttribute("aria-pressed", "true");
    expect(templatesRegion().queryByRole("button", { name: "Zapisz zmiany w szablonie" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Liczba działań [DZ] *"), { target: { value: "3" } });
    fireEvent.click(templatesRegion().getByRole("button", { name: "Zapisz zmiany w szablonie" }));

    await waitFor(() => expect(store.updateTemplate).toHaveBeenCalledOnce());
    const [id, payload] = store.updateTemplate.mock.calls[0];
    expect(id).toBe("t-full");
    expect(payload).toMatchObject({ title: "4 prelekcje", actionType: "Prelekcja", actionDefaults: { programId: "prog-1", numberOfActions: 3, materialIds: ["mat-1"] } });
  });

  it("saves a named template without saving the action, retaining the original title and educator", async () => {
    store.addTemplate.mockResolvedValue({ id: "saved" });
    const onSave = vi.fn();
    render(<Harness editingAction={draft} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz jako szablon" }));
    expect(screen.getByText(/Szablon zapamięta: Prelekcja · odbiorcy: Uczniowie · prowadzi: Anna/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nazwa nowego szablonu"), { target: { value: "Mój wzorzec" } });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz szablon" }));
    await waitFor(() => expect(store.addTemplate).toHaveBeenCalledOnce());
    expect(store.addTemplate.mock.calls[0][0]).toMatchObject({
      title: "Mój wzorzec",
      defaultAudience: "",
      actionDefaults: { title: "Higiena rąk", leadEducator: "Anna", audienceGroups: [{ name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }] }] },
    });
    expect(store.addTemplate.mock.calls[0][0]).not.toHaveProperty("facilityName");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps the template name and shows an error when persistence fails", async () => {
    store.addTemplate.mockRejectedValue(new Error("offline"));
    render(<Harness editingAction={draft} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz jako szablon" }));
    fireEvent.click(screen.getByRole("button", { name: "Zapisz szablon" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się zapisać szablonu"));
    expect(screen.getByLabelText("Nazwa nowego szablonu")).toHaveValue(draft.title);
  });

  it("applies the template chosen with „Użyj” when the form opens", () => {
    const { result } = renderHook(() => useActionEditorState({ ...data, initialTemplateId: "t-full" }));
    expect(result.current.selectedTemplateId).toBe("t-full");
    expect(result.current.form.getValues()).toMatchObject({ programId: "prog-1", numberOfActions: 4 });
  });

  it("saves once and prepares a new entry without old recipients, place or case links", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined), onCancel = vi.fn();
    const { result } = renderHook(() => useActionEditorState({ editingAction: { ...draft, jrwaCaseId: "old", scheduleEventId: "event" }, onSave, onCancel }));
    await act(async () => { await result.current.onSaveAndAddSimilar(); });
    expect(onSave).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(result.current.form.getValues()).toMatchObject({ title: draft.title, leadEducator: "Anna", facilityName: "", participantsCount: 0, jrwaCaseId: "", scheduleEventId: "" });
    await act(async () => { await result.current.onSaveAndAddSimilar(); });
    expect(onSave).toHaveBeenCalledOnce();
  });
});
