import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ActionEditorSection } from "./ActionEditorSection";
import { ActionDialog } from "./ActionDialog";
import { combineActionNotes } from "./editor/actionEditorSubmitUtils";

const store = vi.hoisted(() => ({
  saveActionWithRelations: vi.fn(),
  refreshClosedMonths: vi.fn().mockResolvedValue(undefined), closedMonths: [] as string[],
  actions: [], programs: [], materials: [], facilities: [], jrwaCases: [], staff: [], templates: [],
  dictionaryItems: [], municipalities: [], scheduleEvents: [], distributions: [],
}));
vi.mock("../../store/useOzipzDbStore", () => ({
  useOzipzDbStore: (selector: (state: typeof store) => unknown) => selector(store),
  useActions: () => store, usePrograms: () => store, useMaterials: () => store,
  useFacilities: () => store, useJrwa: () => store, useDictionaries: () => store,
  useStaff: () => store, useTemplates: () => store, useSchedule: () => store,
}));
const action = { title: "Test integracji", actionType: "Prelekcja", date: "2026-09-09", facilityName: "Miejsce testowe", municipality: "Gmina testowa", leadEducator: "Osoba testowa", audienceGroup: "Uczniowie - 12", participantsCount: 12 };
afterEach(() => { cleanup(); vi.restoreAllMocks(); store.closedMonths = []; });

describe("Quick form integration", () => {
  it("keeps the page editor open after a failed default save, then navigates after retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    store.saveActionWithRelations.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    render(<MemoryRouter initialEntries={["/dzialania/nowe"]}><Routes>
      <Route path="/dzialania/nowe" element={<ActionEditorSection editingAction={action} />} />
      <Route path="/dzialania" element={<p>Lista działań</p>} />
    </Routes></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Dane pozostały w formularzu"));
    expect(screen.getByLabelText("Tytuł działania *")).toHaveValue(action.title);
    expect(screen.queryByText("Lista działań")).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(screen.getByText("Lista działań")).toBeInTheDocument());
  });

  it("uses the same compact layout and async close behavior in the dialog", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ActionDialog isOpen onClose={onClose} editingAction={action} onSave={onSave} onUpdate={vi.fn()} />);
    expect(screen.getAllByLabelText("Data realizacji *")).toHaveLength(1);
    expect(screen.getByText("Kancelaria", { exact: true }).closest("details")).not.toHaveAttribute("open");
    fireEvent.click(await screen.findByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("blocks a new action dated in a closed month until its date changes", async () => {
    store.closedMonths = ["2026-09"];
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ActionDialog isOpen onClose={vi.fn()} editingAction={action} onSave={onSave} onUpdate={vi.fn()} />);
    const save = await screen.findByRole("button", { name: "Zapisz działanie" });
    await waitFor(() => expect(screen.getByLabelText("Data realizacji *")).toBeEnabled());
    expect(save).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Miesiąc wybranej daty jest zamknięty");
    fireEvent.submit(screen.getByRole("dialog", { name: "Nowe działanie edukacyjne" }).querySelector("form")!);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Data realizacji *"));
    fireEvent.click(screen.getByRole("button", { name: "Następny miesiąc" }));
    fireEvent.click(screen.getByRole("button", { name: "9 Październik 2026" }));
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it("keeps a new page action editable while blocking its closed date", async () => {
    store.closedMonths = ["2026-09"];
    render(<MemoryRouter initialEntries={["/dzialania/nowe"]}><Routes>
      <Route path="/dzialania/nowe" element={<ActionEditorSection editingAction={action} />} />
    </Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText("Data realizacji *")).toBeEnabled());
    expect(screen.getByRole("button", { name: "Zapisz działanie" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Miesiąc wybranej daty jest zamknięty");
  });

  it("opens an action from a closed month in read-only mode", async () => {
    store.closedMonths = ["2026-09"];
    render(<MemoryRouter initialEntries={["/dzialania/act-1/edytuj"]}><Routes>
      <Route path="/dzialania/:id/edytuj" element={<ActionEditorSection editingAction={{ ...action, id: "act-1" }} />} />
    </Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/Miesiąc jest zamknięty/)).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Podgląd działania" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zapisz zmiany" })).toBeNull();
    expect(screen.getByLabelText("Tytuł działania *")).toBeDisabled();
  });

  it("does not turn a stale edit link into a new action", async () => {
    render(<MemoryRouter initialEntries={["/dzialania/missing/edytuj"]}><Routes>
      <Route path="/dzialania/:id/edytuj" element={<ActionEditorSection />} />
    </Routes></MemoryRouter>);
    // Edytor po wyrenderowaniu wczytuje w tle blokady miesięcy — czekamy, aż skończy.
    await act(async () => {});
    expect(screen.getByRole("alert")).toHaveTextContent("Nie znaleziono działania");
    expect(screen.queryByRole("button", { name: "Zapisz działanie" })).toBeNull();
  });

  it("preserves both the description and additional notes in a copy", () => {
    expect(combineActionNotes(" Opis ", " Wnioski ")).toBe("Opis\n\nUwagi: Wnioski");
  });
});
