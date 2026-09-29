import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { DictionaryDialog } from "./DictionaryDialog";
import type { OzipzDictionaryItem } from "../../types/ozipz.types";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";

describe("DictionaryDialog Component", () => {
  it("renders JRWA classification selector when category is jrwaSymbol", () => {
    render(
      <DictionaryDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onUpdate={vi.fn()}
        editingItem={null}
        defaultCategory="jrwaSymbol"
      />
    );

    expect(screen.getByText(/Klasyfikacja Interwencji JRWA/)).toBeDefined();
    expect(screen.getByText(/-- Wybierz rodzaj interwencji/)).toBeDefined();
  });

  it("does not render JRWA classification selector when category is activityType", () => {
    render(
      <DictionaryDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onUpdate={vi.fn()}
        editingItem={null}
        defaultCategory="activityType"
      />
    );

    expect(screen.queryByText(/Klasyfikacja Interwencji JRWA/)).toBeNull();
  });

  it("calls onSave with chosen kind when submitting a new JRWA symbol", async () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <DictionaryDialog
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        onUpdate={vi.fn()}
        editingItem={null}
        defaultCategory="jrwaSymbol"
      />
    );

    const labelInput = screen.getByPlaceholderText("np. Prelekcja multimedialna, Spotkanie z rodzicami...");
    fireEvent.change(labelInput, { target: { value: "Nowy Program Profilaktyczny" } });

    const codeInput = screen.getByPlaceholderText("np. prelekcja_multimedialna lub kod edu-report (np. 5xwky)");
    fireEvent.change(codeInput, { target: { value: "966.99" } });

    const kindSelect = screen.getByDisplayValue(/-- Wybierz rodzaj interwencji/);
    fireEvent.change(kindSelect, { target: { value: "PROGRAMOWE" } });

    const submitBtn = screen.getByRole("button", { name: /Dodaj do Słownika/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          dictType: "jrwaSymbol",
          code: "966.99",
          label: "Nowy Program Profilaktyczny",
          kind: "PROGRAMOWE",
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("pre-populates kind when editing an existing JRWA symbol and calls onUpdate", async () => {
    const handleUpdate = vi.fn();
    const handleClose = vi.fn();

    const existing: OzipzDictionaryItem = {
      id: "dict-jrwa-14",
      dictType: "jrwaSymbol",
      code: "966.14",
      label: "Bezpieczne Wakacje",
      description: "Wypoczynek letni",
      kind: "NIEPROGRAMOWE",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    render(
      <DictionaryDialog
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
        onUpdate={handleUpdate}
        editingItem={existing}
        defaultCategory="jrwaSymbol"
      />
    );

    expect(screen.getByDisplayValue("NIEPROGRAMOWE (Akcja własna / interwencja doraźna / dzień zdrowia)")).toBeDefined();

    // Change classification to PROGRAMOWE
    const kindSelect = screen.getByDisplayValue("NIEPROGRAMOWE (Akcja własna / interwencja doraźna / dzień zdrowia)");
    fireEvent.change(kindSelect, { target: { value: "PROGRAMOWE" } });

    const submitBtn = screen.getByRole("button", { name: /Zapisz zmiany/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith(
        "dict-jrwa-14",
        expect.objectContaining({
          kind: "PROGRAMOWE",
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });
  it("saves and pre-populates the GIS report area for JRWA symbols", async () => {
    const handleUpdate = vi.fn();
    const existing: OzipzDictionaryItem = {
      id: "dict-jrwa-16",
      dictType: "jrwaSymbol",
      code: "966.16",
      label: "Promocja Zdrowia Psychicznego",
      kind: "NIEPROGRAMOWE",
      gisCategory: "inne",
      isSystem: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    render(
      <DictionaryDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onUpdate={handleUpdate}
        editingItem={existing}
        defaultCategory="jrwaSymbol"
      />
    );

    expect(screen.getByText(/Obszar Sprawozdania GIS/)).toBeDefined();
    const gisSelect = screen.getByDisplayValue("INNE");
    fireEvent.change(gisSelect, { target: { value: "uzaleznienia" } });
    fireEvent.click(screen.getByRole("button", { name: /Zapisz zmiany/i }));

    await waitFor(() => {
      expect(handleUpdate).toHaveBeenCalledWith("dict-jrwa-16", expect.objectContaining({ gisCategory: "uzaleznienia" }));
    });
  });

  it("auto-generates the code from the name and blocks duplicates within the category", async () => {
    useOzipzDbStore.setState({
      dictionaryItems: [
        {
          id: "dict-quiz",
          dictType: "activityType",
          code: "quiz_wiedzy",
          label: "Quiz o zdrowiu",
          isSystem: false,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
    });
    const handleSave = vi.fn();

    render(
      <DictionaryDialog
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        onUpdate={vi.fn()}
        editingItem={null}
        defaultCategory="activityType"
      />
    );

    fireEvent.change(screen.getByPlaceholderText("np. Prelekcja multimedialna, Spotkanie z rodzicami..."), {
      target: { value: "Quiz wiedzy" },
    });
    expect(screen.getByDisplayValue("quiz_wiedzy")).toBeDefined();
    expect(screen.getByText(/Kod jest już zajęty/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Dodaj do Słownika/i }));
    await waitFor(() => expect(screen.getAllByText(/jest już używany przez pozycję/).length).toBeGreaterThan(0));
    expect(handleSave).not.toHaveBeenCalled();
    cleanup();
    useOzipzDbStore.setState({ dictionaryItems: [] });
  });
});
