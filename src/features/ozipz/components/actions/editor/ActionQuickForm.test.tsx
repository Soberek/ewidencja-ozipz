import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ActionQuickForm } from "./ActionQuickForm";
import { ActionEditorFooter } from "./ActionEditorFooter";
import { useActionEditorState } from "./useActionEditorState";
import { localActionDate } from "./editorUtils";
import type { ActionEditorSectionProps } from "./editor.types";

const timestamps = { createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const data: ActionEditorSectionProps = {
  dictionaryItems: [
    ...["Prelekcja", "Publikacja media (Facebook)", "Dystrybucja"].map((label, i) => ({ ...timestamps, id: `a${i}`, code: `a${i}`, label, dictType: "activityType", isSystem: false })),
    { ...timestamps, id: "r1", code: "r1", label: "Uczniowie", dictType: "recipientGroup", isSystem: false },
  ],
  programs: [{ ...timestamps, id: "p1", code: "p1", name: "Program testowy", editionYear: "2026", jrwaSymbol: "966.1", targetAudience: "", description: "", status: "aktywny", participatingSchoolsCount: 0, totalPupilsReached: 0 }],
  facilities: [{ ...timestamps, id: "f1", name: "Szkoła testowa", type: "szkola", municipality: "Testowo", county: "", address: "Szkolna 1", city: "Miasto", postalCode: "00-001", leadingAuthority: "", isComplex: false }],
  municipalities: ["Gmina Testowo"],
  materials: [{ ...timestamps, id: "m1", title: "Ulotka testowa", materialType: "ulotka", topic: "", publisher: "" }],
};
const validAction = { title: "Spotkanie", actionType: "Prelekcja", date: "2026-09-09", facilityName: "Szkoła testowa", municipality: "Testowo", leadEducator: "Osoba testowa", audienceGroup: "Uczniowie - 12", participantsCount: 12 };

function Harness(props: ActionEditorSectionProps) {
  const state = useActionEditorState(props);
  return <form noValidate onSubmit={state.form.handleSubmit(state.onSubmit)}>
    <ActionQuickForm state={state} data={props} />
    {state.saveError && <p role="alert">{state.saveError}</p>}
    <ActionEditorFooter totalDirectParticipants={state.totalDirectParticipants} isSubmitting={state.isSubmitting} onCancel={props.onCancel ?? (() => {})} />
  </form>;
}
const disclosure = (title: string) => screen.getByText(title, { exact: true }).closest("details")!;
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
function select(label: string, option: string) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole("option", { name: option }));
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Quick action form", () => {
  it("saves a single action without opening additional sections, with one date and a dictionary facility", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    render(<Harness {...data} onSave={onSave} onCancel={onCancel} />);
    expect(disclosure("Kancelaria")).not.toHaveAttribute("open");
    expect(screen.getAllByLabelText("Data realizacji *")).toHaveLength(1);
    select("Forma działania *", "Prelekcja");
    fill("Tytuł działania *", "Spotkanie testowe");
    fill("Placówka lub miejsce *", "Szkoła");
    fireEvent.click(screen.getByRole("option", { name: /Szkoła testowa/ }));
    expect(screen.getByLabelText("Gmina *")).toHaveTextContent("Testowo");
    fill("Osoba prowadząca *", "Osoba testowa");
    fill("Kto? *", "Uczniowie");
    fill("Ile osób? *", "12");
    fireEvent.click(screen.getByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toMatchObject({ title: "Spotkanie testowe", facilityId: "f1", municipality: "Testowo", participantsCount: 12, audienceGroup: "Uczniowie - 12" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(disclosure("Materiały i zasięg")).not.toHaveAttribute("open");
  });

  it("adds a new place to the facility base without leaving the form and selects it", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onAddFacility = vi.fn(async (payload) => ({ ...payload, ...timestamps, id: "f-new" }));
    const dictionaryItems = [...data.dictionaryItems!,
      { ...timestamps, id: "lt1", code: "hala", label: "Hala sportowa", dictType: "locationType", isSystem: false },
      { ...timestamps, id: "g1", code: "g1", label: "Gmina Testowo", dictType: "municipality", isSystem: false, postalCode: "74-300" }];
    render(<Harness {...data} dictionaryItems={dictionaryItems} onSave={onSave} onAddFacility={onAddFacility} />);
    select("Gmina *", "Testowo");
    fill("Placówka lub miejsce *", "Hala OSiR");
    fireEvent.click(screen.getByRole("button", { name: "Dodaj „Hala OSiR” do bazy placówek" }));
    const dialog = await screen.findByRole("dialog", { name: "Nowe miejsce działania" });
    expect(screen.getByLabelText(/Pełna nazwa placówki/)).toHaveValue("Hala OSiR");
    expect(screen.getByLabelText(/Kod pocztowy/)).toHaveValue("74-300");
    expect(screen.getByLabelText(/Miejscowość/)).toHaveValue("Testowo");
    expect(screen.queryByLabelText("Uwagi")).toBeNull();
    fireEvent.click(screen.getByText("-- Wybierz typ placówki ze słownika --"));
    fireEvent.click(screen.getByRole("option", { name: "Hala sportowa" }));
    fill("Ulica i numer *", "Sportowa 1");
    fireEvent.click(screen.getByRole("button", { name: "Dodaj i wybierz" }));
    await waitFor(() => expect(onAddFacility).toHaveBeenCalledTimes(1));
    expect(onAddFacility.mock.calls[0][0]).toMatchObject({ name: "Hala OSiR", type: "hala", municipality: "Testowo", address: "Sportowa 1", postalCode: "74-300", city: "Testowo" });
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(screen.getByText("Sportowa 1, Testowo")).toBeInTheDocument();
    expect(screen.queryByText(/Miejsce spoza bazy placówek/)).toBeNull();
    // Zapis okna placówki nie może uruchomić walidacji ani zapisu formularza działania.
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps a custom title when selecting a program and fills an empty title", () => {
    render(<Harness {...data} />);
    select("Program lub klasyfikacja", "Program testowy");
    expect(screen.getByLabelText("Tytuł działania *")).toHaveValue("Program testowy");
    fill("Tytuł działania *", "Własny tytuł");
    select("Program lub klasyfikacja", "Program testowy");
    expect(screen.getByLabelText("Tytuł działania *")).toHaveValue("Własny tytuł");
  });

  it("keeps group details and counts when collapsed and expanded", () => {
    render(<Harness {...data} />);
    fill("Kto? *", "Uczniowie"); fill("Ile osób? *", "12");
    fireEvent.click(screen.getByRole("button", { name: "Dodaj wiek odbiorców" }));
    fill("Wiek od", "10"); fill("Wiek do", "12");
    fireEvent.click(screen.getByRole("button", { name: "Ukryj wiek odbiorców" }));
    expect(screen.queryByLabelText("Wiek od")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Dodaj wiek odbiorców" }));
    expect(screen.getByLabelText("Wiek od")).toHaveValue(10);
    expect(screen.getByLabelText("Ile osób? *")).toHaveValue(12);
  });

  it("opens populated details from a copied action but keeps office collapsed", () => {
    render(<Harness {...data} editingAction={{ ...validAction, audienceGroup: "Klasa A: Uczniowie (10-12 lat) - 12", notes: "Opis spotkania", materialsDistributedCount: 3 }} />);
    expect(screen.getByLabelText("Wiek od")).toHaveValue(10);
    expect(disclosure("Opis i dodatkowe informacje")).toHaveAttribute("open");
    expect(disclosure("Materiały i zasięg")).toHaveAttribute("open");
    expect(disclosure("Kancelaria")).not.toHaveAttribute("open");
  });

  it("focuses the first missing field and never saves incomplete data", async () => {
    const onSave = vi.fn();
    render(<Harness {...data} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(screen.getByText("Grupa odbiorców jest wymagana")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText("Forma działania *")).toHaveFocus());
    expect(onSave).not.toHaveBeenCalled();
  });

  it("retains entered data after failure and allows retry without double submission", async () => {
    let rejectSave: (error: Error) => void = () => {};
    const onSave = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rejectSave = reject; })).mockResolvedValue(undefined);
    const onCancel = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Harness {...data} editingAction={validAction} onSave={onSave} onCancel={onCancel} />);
    const button = screen.getByRole("button", { name: "Zapisz działanie" });
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Zapisywanie…" })).toBeDisabled();
    await act(async () => rejectSave(new Error("offline")));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Tytuł działania *")).toHaveValue("Spotkanie");
    expect(screen.getByRole("alert")).toHaveTextContent("Dane pozostały w formularzu");
    fireEvent.click(screen.getByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("shows publication reach and distribution materials and restores an audience row on type change", () => {
    render(<Harness {...data} />);
    select("Forma działania *", "Publikacja media (Facebook)");
    expect(disclosure("Materiały i zasięg")).toHaveAttribute("open");
    expect(screen.queryByLabelText("Kto? *")).toBeNull();
    expect(screen.queryByRole("button", { name: "Dodaj materiał" })).toBeNull();
    select("Forma działania *", "Dystrybucja");
    expect(screen.getByLabelText("Kto? *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dodaj materiał" })).toBeInTheDocument();
  });

  it("offers a separate distribution only for a new non-distribution action with materials, switched on by default", () => {
    render(<Harness {...data} />);
    select("Forma działania *", "Prelekcja");
    fireEvent.click(screen.getByText("Materiały i zasięg", { exact: true }));
    const toggleLabel = /Zapisz wydanie materiałów jako osobne działanie „Dystrybucja”/;
    expect(screen.queryByLabelText(toggleLabel)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Dodaj materiał" }));
    const toggle = screen.getByLabelText(toggleLabel);
    expect(toggle).toBeChecked();
    expect(screen.getByText(/Powstaną 2 wpisy/)).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/bez osobnej dystrybucji/)).toBeInTheDocument();

    select("Forma działania *", "Dystrybucja");
    expect(screen.queryByLabelText(toggleLabel)).toBeNull();
  });

  it("does not silently discard an incomplete material and opens its error section", async () => {
    const onSave = vi.fn();
    render(<Harness {...data} editingAction={validAction} onSave={onSave} />);
    fireEvent.click(screen.getByText("Materiały i zasięg", { exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Dodaj materiał" }));
    fireEvent.click(screen.getByText("Materiały i zasięg", { exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(screen.getByText(/Wybierz materiał i podaj dodatnią/)).toBeInTheDocument());
    await waitFor(() => expect(disclosure("Materiały i zasięg")).toHaveAttribute("open"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("allows multiple categories in Grupa 1 and duplicates Grupa 1 -> Grupa 2 -> Grupa 3", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<Harness {...data} onSave={onSave} />);
    select("Forma działania *", "Prelekcja");
    fill("Tytuł działania *", "Działanie wielogrupowe");
    fill("Placówka lub miejsce *", "Szkoła");
    fireEvent.click(screen.getByRole("option", { name: /Szkoła testowa/ }));
    fill("Osoba prowadząca *", "Osoba testowa");

    // Grupa 1 kategoria 1: Uczniowie - 18
    fill("Kto? *", "Uczniowie");
    fill("Ile osób? *", "18");

    // Dodaj kategorię 2 do Grupy 1: Opiekunowie - 2
    fireEvent.click(screen.getByRole("button", { name: "Dodaj kategorię odbiorców do grupy Grupa 1" }));
    fill("Kolejna kategoria *", "Opiekunowie");
    const countInputs = screen.getAllByLabelText("Ile osób? *");
    expect(countInputs).toHaveLength(2);
    fireEvent.change(countInputs[1], { target: { value: "2" } });

    // Kopiuj Grupa 1 -> powstaje Grupa 2
    fireEvent.click(screen.getByRole("button", { name: "Kopiuj jako kolejną grupę" }));
    expect(screen.getByDisplayValue("Grupa 2")).toBeInTheDocument();

    // Kopiuj Grupa 2 -> powstaje Grupa 3
    fireEvent.click(screen.getByRole("button", { name: "Kopiuj grupę Grupa 2" }));
    expect(screen.getByDisplayValue("Grupa 3")).toBeInTheDocument();

    // Zapisz formularz
    fireEvent.click(screen.getByRole("button", { name: "Zapisz działanie" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const saved = onSave.mock.calls[0][0];
    expect(saved.participantsCount).toBe(60);
    expect(saved.audienceGroup).toContain("Grupa 1: Uczniowie - 18, Opiekunowie - 2");
    expect(saved.audienceGroup).toContain("Grupa 2: Uczniowie - 18, Opiekunowie - 2");
    expect(saved.audienceGroup).toContain("Grupa 3: Uczniowie - 18, Opiekunowie - 2");
  });
});

describe("Shared date and material state", () => {
  it("recalculates independent JRWA sequences when selecting classifications and applying presets", () => {
    const existingAction = { ...validAction, ...timestamps, topic: "", ezdStatus: "w_ezd", status: "zrealizowane", indirectRecipientsCount: 0, materialsDistributedCount: 0 };
    const { result } = renderHook(() => useActionEditorState({
      ...data,
      editingAction: validAction,
      actions: [
        { ...existingAction, id: "a3", jrwaSign: "OZiPZ.966.3.1.2026" },
        { ...existingAction, id: "a6", jrwaSign: "OZiPZ.966.6.2.2026" },
      ],
    }));
    act(() => result.current.handleProgramOrJrwaSelect("jrwa:966.6"));
    expect(result.current.jrwaSign).toBe("OZiPZ.966.6.3.2026");
    act(() => result.current.applyPreset({
      id: "test", title: "Test", actionType: "Prelekcja", jrwaSymbol: "966.3",
      badge: "", subtitle: "", audienceGroups: [],
    }));
    expect(result.current.selectedJrwaSymbol).toBe("966.3");
    expect(result.current.jrwaSign).toBe("OZiPZ.966.3.2.2026");
    act(() => result.current.handleProgramOrJrwaSelect("jrwa:966.6"));
    expect(result.current.jrwaSign).toBe("OZiPZ.966.6.3.2026");
    act(() => result.current.handleDateChange("2027-01-02"));
    expect(result.current.jrwaSign).toBe("OZiPZ.966.6.1.2027");
  });

  it("keeps date, office numbers and new case metadata in the same year", async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useActionEditorState({ ...data, editingAction: validAction, onSave }));
    act(() => result.current.handleProgramOrJrwaSelect("prog:p1"));
    act(() => result.current.handleDateChange("2027-01-02"));
    await act(async () => result.current.form.handleSubmit(result.current.onSubmit)());
    expect(onSave.mock.calls[0][0].jrwaSign).toContain("2027");
    expect(onSave.mock.calls[0][1]).toMatchObject({ year: 2027, fullCaseSign: onSave.mock.calls[0][0].jrwaSign });
  });

  it("formats the local calendar date", () => {
    expect(localActionDate(new Date(2026, 0, 1, 0, 1))).toBe("2026-01-01");
  });

  it("clears the linked material and total when the last row is removed", () => {
    const { result } = renderHook(() => useActionEditorState(data));
    act(() => result.current.handleAddMaterialItem("m1", 7));
    expect(result.current.materialsDistributedCount).toBe(7);
    act(() => result.current.handleRemoveMaterialItem(0));
    expect(result.current.materialsDistributedCount).toBe(0);
    expect(result.current.materialId).toBe("");
  });
});
