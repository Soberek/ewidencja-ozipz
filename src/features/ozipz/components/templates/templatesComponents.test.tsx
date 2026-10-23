import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { TemplatesSection } from "./TemplatesSection";
import { TemplateDialog, TemplateFormSchema } from "./TemplateDialog";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import type { OzipzDictionaryItem, OzipzMaterial, OzipzProgram, OzipzTemplate } from "../../types/ozipz.types";

const programs = [{ id: "prog-1", name: "Trzymaj Formę!", jrwaSymbol: "966.1" }] as OzipzProgram[];
const materials = [{ id: "mat-1", title: "Ulotka antynikotynowa" }, { id: "mat-2", title: "Plakat" }] as OzipzMaterial[];
const actionTypes = [
  { id: "a1", dictType: "activityType", code: "prelekcja", label: "Prelekcja (warsztat)" },
  { id: "a2", dictType: "activityType", code: "stoisko", label: "Stoisko informacyjno-edukacyjne" },
] as OzipzDictionaryItem[];

const fullTemplate: OzipzTemplate = {
  id: "tpl-full", title: "Trzymaj Formę — 2 klasy", topic: "", actionType: "Prelekcja (warsztat)", defaultAudience: "",
  descriptionTemplate: "Przebieg zajęć", createdAt: "", updatedAt: "",
  actionDefaults: {
    title: "", leadEducator: "Anna Nowak", campaignId: "", programId: "prog-1", jrwaSymbol: "", numberOfActions: 2,
    audienceGroups: [
      { name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }, { name: "Rodzice", ageFrom: null, ageTo: null }] },
      { name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }] },
    ],
    materialIds: ["mat-1"],
  },
};
// Szablon sprzed pełnego zapisu: program jako nazwa, odbiorcy jako spłaszczona lista z powtórzeniami.
const legacyTemplate: OzipzTemplate = {
  id: "tpl-old", title: "Punkt informacyjny", topic: "Trzymaj Formę!", actionType: "Stoisko informacyjno-edukacyjne",
  defaultAudience: "Uczniowie; Rodzice; Uczniowie", descriptionTemplate: "", suggestedMaterials: "Broszury", createdAt: "", updatedAt: "",
  actionDefaults: { title: "Trzymaj Formę!", leadEducator: "Anna Nowak", campaignId: "" },
};
const emptyImport = (id: string): OzipzTemplate => ({
  id, title: "Szablon zadania", topic: "inne", actionType: "Prelekcja (warsztat)", defaultAudience: "uczniowie_sp",
  descriptionTemplate: "", suggestedMaterials: "", createdAt: "", updatedAt: "",
});

const renderSection = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("Templates Module Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useOzipzDbStore.setState({ programs, materials, dictionaryItems: actionTypes, templates: [], staff: [] });
  });

  describe("TemplatesSection", () => {
    it("shows what each template fills in: form, program, audience and materials", () => {
      renderSection(<TemplatesSection templates={[fullTemplate, legacyTemplate]} onOpenAdd={vi.fn()} onOpenEdit={vi.fn()} onDelete={vi.fn()} />);
      const row = screen.getByText("Trzymaj Formę — 2 klasy").closest("tr")!;
      expect(row).toHaveTextContent("2 działania");
      expect(row).toHaveTextContent("Trzymaj Formę! (JRWA 966.1)");
      expect(row).toHaveTextContent("2 grupy: Uczniowie, Rodzice");
      expect(row).toHaveTextContent("Ulotka antynikotynowa");
      expect(row).toHaveTextContent("Prowadzi: Anna Nowak");
      // Starszy szablon czytany tak samo: program po nazwie, odbiorcy bez powtórzeń.
      const oldRow = screen.getByText("Punkt informacyjny").closest("tr")!;
      expect(oldRow).toHaveTextContent("Trzymaj Formę! (JRWA 966.1)");
      expect(oldRow).toHaveTextContent("Uczniowie, Rodzice");
    });

    it("searches in program, audience and materials too", () => {
      renderSection(<TemplatesSection templates={[fullTemplate, { ...legacyTemplate, topic: "" }]} onOpenAdd={vi.fn()} onOpenEdit={vi.fn()} onDelete={vi.fn()} />);
      fireEvent.change(screen.getByPlaceholderText(/Szukaj szablonu/), { target: { value: "ulotka" } });
      expect(screen.getByText("Trzymaj Formę — 2 klasy")).toBeDefined();
      expect(screen.queryByText("Punkt informacyjny")).toBeNull();
    });

    it("„Użyj” starts a new action from the template; clicking the row opens editing", () => {
      const onUse = vi.fn(), onOpenEdit = vi.fn();
      renderSection(<TemplatesSection templates={[fullTemplate]} onOpenAdd={vi.fn()} onOpenEdit={onOpenEdit} onDelete={vi.fn()} onUse={onUse} />);
      fireEvent.click(screen.getByRole("button", { name: "Użyj szablonu Trzymaj Formę — 2 klasy" }));
      expect(onUse).toHaveBeenCalledWith(expect.objectContaining({ id: "tpl-full" }));
      expect(onOpenEdit).not.toHaveBeenCalled();
      fireEvent.click(screen.getByText("Trzymaj Formę — 2 klasy"));
      expect(onOpenEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "tpl-full" }));
    });

    it("hides empty imported records by default and lets users reveal them", () => {
      renderSection(<TemplatesSection templates={[emptyImport("empty"), fullTemplate]} onOpenAdd={vi.fn()} onOpenEdit={vi.fn()} onDelete={vi.fn()} />);
      expect(screen.queryByText("Szablon zadania")).toBeNull();
      expect(screen.getByText(/Puste rekordy z importu: 1/)).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Pokaż" }));
      expect(screen.getByText("Szablon zadania")).toBeDefined();
    });

    it("deletes only empty imported records after confirmation", async () => {
      const onDeleteEmptyImports = vi.fn().mockResolvedValue(undefined);
      renderSection(<TemplatesSection templates={[emptyImport("empty-1"), emptyImport("empty-2"), fullTemplate]} onOpenAdd={vi.fn()}
        onOpenEdit={vi.fn()} onDelete={vi.fn()} onDeleteEmptyImports={onDeleteEmptyImports} />);

      fireEvent.click(screen.getByRole("button", { name: "Usuń puste rekordy" }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(/Zostanie usuniętych 2 szablonów/)).toBeDefined();
      expect(onDeleteEmptyImports).not.toHaveBeenCalled();
      fireEvent.click(within(dialog).getByRole("button", { name: /Usuń puste rekordy/ }));

      await waitFor(() => expect(onDeleteEmptyImports).toHaveBeenCalledWith(["empty-1", "empty-2"]));
    });
  });

  describe("TemplateDialog", () => {
    const dialogProps = { isOpen: true, onClose: vi.fn(), onSave: vi.fn(), onUpdate: vi.fn(), programs, materials, actionTypes, templates: [fullTemplate, legacyTemplate] };

    it("requires a name and a form; everything else is optional", async () => {
      expect(TemplateFormSchema.safeParse({ name: "  ", actionType: "Prelekcja", classification: "", title: "", campaignId: "", leadEducator: "", numberOfActions: 1, description: "" }).success).toBe(false);
      const onSave = vi.fn();
      render(<TemplateDialog {...dialogProps} editingTemplate={null} onSave={onSave} />);
      expect(screen.getByText("Nowy szablon")).toBeDefined();
      fireEvent.click(screen.getByRole("button", { name: "Utwórz szablon" }));
      expect(await screen.findAllByText(/Wpisz nazwę szablonu/)).not.toHaveLength(0);
      expect(onSave).not.toHaveBeenCalled();
    });

    it("creates a template with groups and catalogue materials, without counts", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined), onClose = vi.fn();
      render(<TemplateDialog {...dialogProps} editingTemplate={null} onSave={onSave} onClose={onClose} />);
      fireEvent.change(screen.getByLabelText(/Nazwa szablonu/), { target: { value: "Stoisko na festynie" } });
      fireEvent.click(screen.getByLabelText(/Forma działania/));
      fireEvent.click(screen.getByRole("option", { name: "Stoisko informacyjno-edukacyjne" }));
      fireEvent.click(screen.getByLabelText("Program lub klasyfikacja"));
      fireEvent.click(screen.getByRole("option", { name: /Trzymaj Formę!/ }));
      fireEvent.change(screen.getByLabelText("Kategoria odbiorców 1 (Grupa 1)"), { target: { value: "Mieszkańcy" } });
      fireEvent.click(screen.getByRole("button", { name: "Kopiuj ostatnią grupę" }));
      fireEvent.click(screen.getByRole("button", { name: "Dodaj materiał" }));
      fireEvent.click(screen.getByLabelText("Materiał 1"));
      fireEvent.click(screen.getByRole("option", { name: "Plakat" }));
      fireEvent.click(screen.getByRole("button", { name: "Utwórz szablon" }));

      await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
      expect(onSave.mock.calls[0][0]).toMatchObject({
        title: "Stoisko na festynie", actionType: "Stoisko informacyjno-edukacyjne", topic: "", defaultAudience: "",
        actionDefaults: {
          programId: "prog-1", jrwaSymbol: "", numberOfActions: 1, materialIds: ["mat-2"],
          audienceGroups: [{ name: "", items: [{ name: "Mieszkańcy" }] }, { name: "", items: [{ name: "Mieszkańcy" }] }],
        },
      });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("opens an older template in the new shape and saves it that way", async () => {
      const onUpdate = vi.fn().mockResolvedValue(undefined);
      render(<TemplateDialog {...dialogProps} editingTemplate={legacyTemplate} onUpdate={onUpdate} />);
      expect(screen.getByText("Edytuj szablon")).toBeDefined();
      expect(screen.getByDisplayValue("Punkt informacyjny")).toBeDefined();
      expect(screen.getByLabelText("Program lub klasyfikacja")).toHaveTextContent("Trzymaj Formę!");
      expect(screen.getByLabelText("Kategoria odbiorców 1 (Grupa 1)")).toHaveValue("Uczniowie");
      expect(screen.getByLabelText("Kategoria odbiorców 2 (Grupa 1)")).toHaveValue("Rodzice");
      expect(screen.queryByLabelText("Kategoria odbiorców 3 (Grupa 1)")).toBeNull();
      expect(screen.getByText(/Ze starszej wersji szablonu: „Broszury”/)).toBeDefined();

      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
      await waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
      expect(onUpdate).toHaveBeenCalledWith("tpl-old", expect.objectContaining({
        topic: "", defaultAudience: "",
        actionDefaults: expect.objectContaining({ programId: "prog-1", leadEducator: "Anna Nowak", audienceGroups: [
          { name: "", items: [{ name: "Uczniowie", ageFrom: null, ageTo: null }, { name: "Rodzice", ageFrom: null, ageTo: null }] },
        ] }),
      }));
      // Dawny tekst materiałów zostaje w bazie, dopóki użytkownik nie wybierze materiałów z katalogu.
      expect(onUpdate.mock.calls[0][1]).not.toHaveProperty("suggestedMaterials");
    });

    it("rejects a duplicate name and keeps the dialog open after a failed update", async () => {
      const onClose = vi.fn();
      const onUpdate = vi.fn().mockRejectedValueOnce(new Error("Baza niedostępna")).mockResolvedValueOnce(undefined);
      render(<TemplateDialog {...dialogProps} editingTemplate={fullTemplate} onUpdate={onUpdate} onClose={onClose} />);
      expect(screen.getByLabelText("Kategoria odbiorców 2 (Grupa 1)")).toHaveValue("Rodzice");

      fireEvent.change(screen.getByLabelText(/Nazwa szablonu/), { target: { value: "punkt informacyjny" } });
      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
      expect(await screen.findAllByText(/Szablon o tej nazwie już istnieje/)).not.toHaveLength(0);
      expect(onUpdate).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText(/Nazwa szablonu/), { target: { value: "Trzymaj Formę — 2 klasy" } });
      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
      expect(await screen.findByText("Baza niedostępna")).toBeDefined();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(onUpdate).toHaveBeenLastCalledWith("tpl-full", expect.objectContaining({
        actionDefaults: expect.objectContaining({ numberOfActions: 2, materialIds: ["mat-1"] }),
      }));
    });
  });
});
