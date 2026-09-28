import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { useActionEditorState } from "./useActionEditorState";
import { ActionQuickForm } from "./ActionQuickForm";
import type { ActionEditorSectionProps } from "./editor.types";

const store = vi.hoisted(() => ({ templates: [], addTemplate: vi.fn() }));
vi.mock("../../../store/useOzipzDbStore", () => ({ useTemplates: () => store }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const draft = { title: "Higiena rąk", actionType: "Prelekcja", facilityName: "Szkoła", municipality: "Myślibórz", leadEducator: "Anna", audienceGroup: "Uczniowie - 20", participantsCount: 20 };
function Harness(props: ActionEditorSectionProps) {
  const state = useActionEditorState(props);
  return <ActionQuickForm state={state} data={props} />;
}
describe("Action templates and repeated entry", () => {
  it("omits empty imported placeholders from quick selection without removing them", () => {
    render(<Harness templates={[{ id: "empty", title: "Szablon zadania", topic: "inne", actionType: "prelekcja", defaultAudience: "uczniowie_sp", descriptionTemplate: "", createdAt: "", updatedAt: "" }]} />);
    fireEvent.click(screen.getByLabelText("Szybki start: szablon lub wzorzec"));
    expect(screen.queryByRole("option", { name: /Szablon zadania/ })).toBeNull();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    expect(screen.getByText(/Pominięto puste rekordy z importu/)).toHaveTextContent("(1)");
  });
  it("saves a named template without saving the action, retaining the original title and educator", async () => {
    store.addTemplate.mockResolvedValue({ id: "saved" });
    const onSave = vi.fn();
    render(<Harness editingAction={draft} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz jako szablon" }));
    fireEvent.change(screen.getByLabelText("Nazwa szablonu"), { target: { value: "Mój wzorzec" } });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz szablon" }));
    await waitFor(() => expect(store.addTemplate).toHaveBeenCalledOnce());
    expect(store.addTemplate.mock.calls[0][0]).toMatchObject({ title: "Mój wzorzec", actionDefaults: { title: "Higiena rąk", leadEducator: "Anna" }, defaultAudience: "Uczniowie" });
    expect(store.addTemplate.mock.calls[0][0]).not.toHaveProperty("facilityName");
    expect(onSave).not.toHaveBeenCalled();
  });
  it("keeps the template name and shows an error when persistence fails", async () => {
    store.addTemplate.mockRejectedValue(new Error("offline"));
    render(<Harness editingAction={draft} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz jako szablon" }));
    fireEvent.click(screen.getByRole("button", { name: "Zapisz szablon" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nie udało się zapisać szablonu"));
    expect(screen.getByLabelText("Nazwa szablonu")).toHaveValue(draft.title);
  });
  it("replaces template contents idempotently and resets historic recipient counts", () => {
    const { result } = renderHook(() => useActionEditorState({ editingAction: draft, templates: [{ id: "t1", title: "Wzorzec", topic: "higiena", actionType: "Prelekcja", defaultAudience: "Uczniowie - 30", descriptionTemplate: "Opis wzorcowy", createdAt: "", updatedAt: "", actionDefaults: { title: "Tytuł działania", leadEducator: "Jan", campaignId: "Kampania" } }] }));
    act(() => result.current.handleApplyTemplate("t1"));
    act(() => result.current.handleApplyTemplate("t1"));
    expect(result.current.activitiesDescription).toBe("Opis wzorcowy");
    expect(result.current.title).toBe("Tytuł działania");
    expect(result.current.leadEducator).toBe("Jan");
    expect(result.current.totalDirectParticipants).toBe(0);
    expect(result.current.facilityName).toBe("Szkoła");
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
