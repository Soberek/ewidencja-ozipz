import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TemplatesSection } from "./TemplatesSection";
import { TemplateDialog, TemplateFormSchema } from "./TemplateDialog";
import { TemplatesStatsHeader } from "./components/TemplatesStatsHeader";
import type {
  OzipzTemplate,
  OzipzDictionaryItem,
  OzipzProgram,
} from "../../types/ozipz.types";

describe("Templates Module Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockTemplates: OzipzTemplate[] = [
    {
      id: "tpl-1",
      title: "Warsztaty profilaktyki antynikotynowej",
      topic: "tyton",
      actionType: "Prelekcja (warsztat)",
      defaultAudience: "Uczniowie",
      descriptionTemplate: "Przeprowadzono warsztaty w oparciu o prezentację multimedialną i dyskusję.",
      suggestedMaterials: "Ulotki antynikotynowe",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "tpl-2",
      title: "Punkt informacyjny podczas festynu",
      topic: "zdrowy_styl_zycia",
      actionType: "Stoisko informacyjno-edukacyjne",
      defaultAudience: "Mieszkańcy",
      descriptionTemplate: "Dystrybucja materiałów oświatowych, pomiary ciśnienia, poradnictwo.",
      suggestedMaterials: "Broszury i plakaty",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];

  describe("TemplatesStatsHeader", () => {
    it("renders all 4 KPI metric cards correctly", () => {
      render(<TemplatesStatsHeader templates={mockTemplates} />);

      expect(screen.getByText("Wszystkie Szablony")).toBeDefined();
      expect(screen.getByText("Formy Działań")).toBeDefined();
      expect(screen.getByText("Obszary Tematyczne")).toBeDefined();
      expect(screen.getByText("Grupy Docelowe")).toBeDefined();
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });

    it("counts distinct audience names inside grouped templates", () => {
      render(<TemplatesStatsHeader templates={[
        { ...mockTemplates[0], defaultAudience: "Uczniowie; Rodzice" },
        { ...mockTemplates[0], id: "tpl-3", defaultAudience: "Uczniowie; Nauczyciele" },
        { ...mockTemplates[0], id: "tpl-4", defaultAudience: "" },
      ]} />);

      expect(screen.getAllByText("3")).toHaveLength(2);
    });
  });

  describe("TemplatesSection", () => {
    it("renders templates table with template titles and descriptions", () => {
      render(
        <TemplatesSection
          templates={mockTemplates}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Warsztaty profilaktyki antynikotynowej")).toBeDefined();
      expect(screen.getByText("Punkt informacyjny podczas festynu")).toBeDefined();
      expect(screen.getByText(/Przeprowadzono warsztaty/)).toBeDefined();
      expect(screen.getByText(/Dystrybucja materiałów oświatowych/)).toBeDefined();
    });

    it("filters templates by search term", () => {
      render(
        <TemplatesSection
          templates={mockTemplates}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText("Szukaj w szablonach zadań...");
      fireEvent.change(searchInput, { target: { value: "festynu" } });

      expect(screen.queryByText("Warsztaty profilaktyki antynikotynowej")).toBeNull();
      expect(screen.getByText("Punkt informacyjny podczas festynu")).toBeDefined();
    });

    it("copies template description to clipboard", async () => {
      const originalClipboard = navigator.clipboard;
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <TemplatesSection
          templates={mockTemplates}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const copyBtn = document.querySelector(".lucide-copy")?.closest("button");
      expect(copyBtn).toBeDefined();
      if (copyBtn) fireEvent.click(copyBtn);

      expect(writeTextMock).toHaveBeenCalled();
      await waitFor(() => expect(copyBtn?.querySelector(".lucide-check")).not.toBeNull());

      // restore
      Object.assign(navigator, { clipboard: originalClipboard });
    });

    it("opens full template preview dialog on eye button click", () => {
      render(
        <TemplatesSection
          templates={mockTemplates}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const previewButtons = screen.getAllByRole("button", { name: /podgląd szablonu/i });
      fireEvent.click(previewButtons[0]);

      expect(screen.getByText("Podgląd szablonu zadania")).toBeDefined();
      expect(screen.getByText("Opis zadania")).toBeDefined();
      expect(screen.getByRole("button", { name: /kopiuj opis/i })).toBeDefined();
    });

    it("toggles KPI summary visibility", () => {
      render(
        <TemplatesSection
          templates={mockTemplates}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Wszystkie Szablony")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      fireEvent.click(toggleBtn);

      expect(screen.queryByText("Wszystkie Szablony")).toBeNull();
    });

    it("hides empty imported records by default and lets users reveal them", () => {
      const empty = { ...mockTemplates[0], id: "empty", title: "Szablon zadania", topic: "inne", actionType: "prelekcja", defaultAudience: "uczniowie_sp", descriptionTemplate: "", suggestedMaterials: "" };
      render(<TemplatesSection templates={[empty, mockTemplates[0]]} onOpenAdd={vi.fn()} onOpenEdit={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.queryByText("Szablon zadania")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: /Puste rekordy z importu: 1 · Pokaż/ }));
      expect(screen.getByText("Szablon zadania")).toBeDefined();
    });
  });

  describe("TemplateDialog", () => {
    const mockTopics: OzipzDictionaryItem[] = [
      {
        id: "topic-1",
        dictType: "topic",
        code: "tyton",
        label: "Profilaktyka tytoniowa",
        isSystem: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const mockPrograms: OzipzProgram[] = [
      {
        id: "prog-1",
        code: "TF",
        name: "Trzymaj Formę!",
        editionYear: "2026",
        targetAudience: "Młodzież",
        description: "Program",
        status: "aktywny",
        jrwaSymbol: "966.1",
        participatingSchoolsCount: 5,
        totalPupilsReached: 120,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    it("renders modal in create mode", () => {
      render(
        <TemplateDialog
          isOpen={true}
          onClose={vi.fn()}
          editingTemplate={null}
          topics={mockTopics}
          programs={mockPrograms}
          onSave={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Nowy szablon zadania")).toBeDefined();
    });

    it("renders modal in edit mode with prefilled values", () => {
      render(
        <TemplateDialog
          isOpen={true}
          onClose={vi.fn()}
          editingTemplate={mockTemplates[0]}
          topics={mockTopics}
          programs={mockPrograms}
          onSave={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Edytuj szablon zadania")).toBeDefined();
      expect(screen.getByDisplayValue("Warsztaty profilaktyki antynikotynowej")).toBeDefined();
    });

    it("rejects blank content and keeps a prefilled template open after a failed update", async () => {
      expect(TemplateFormSchema.safeParse({ title: "  ", actionType: "Prelekcja", defaultAudience: "Uczniowie", descriptionTemplate: "  " }).success).toBe(false);

      const onClose = vi.fn();
      const onUpdate = vi.fn().mockRejectedValueOnce(new Error("Baza niedostępna")).mockResolvedValueOnce(undefined);
      const template = { ...mockTemplates[0], defaultAudience: "Uczniowie; Rodzice", actionDefaults: { title: "Działanie", leadEducator: "Anna", campaignId: "" } };
      render(<TemplateDialog isOpen onClose={onClose} editingTemplate={template} onSave={vi.fn()} onUpdate={onUpdate} />);

      expect((screen.getByLabelText(/Grupy odbiorców/) as HTMLTextAreaElement).value).toBe("Uczniowie; Rodzice");
      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
      expect(await screen.findByText("Baza niedostępna")).toBeDefined();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate).toHaveBeenLastCalledWith(template.id, expect.objectContaining({ defaultAudience: "Uczniowie; Rodzice" }));
    });

    it("allows editing a settings-only template without inventing a description or audience", async () => {
      const onClose = vi.fn();
      const onUpdate = vi.fn().mockResolvedValue(undefined);
      const template = {
        ...mockTemplates[0],
        descriptionTemplate: "",
        defaultAudience: "",
        actionDefaults: { title: "Działanie", leadEducator: "Anna", campaignId: "" },
      };

      render(<TemplateDialog isOpen onClose={onClose} editingTemplate={template} onSave={vi.fn()} onUpdate={onUpdate} />);
      fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(onUpdate).toHaveBeenCalledWith(template.id, expect.objectContaining({ descriptionTemplate: "", defaultAudience: "" }));
    });
  });
});
