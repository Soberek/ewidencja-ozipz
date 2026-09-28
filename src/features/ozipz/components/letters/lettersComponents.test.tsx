import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LettersSection } from "./LettersSection";
import { LetterDialog } from "./LetterDialog";
import { LettersStatsHeader } from "./components/LettersStatsHeader";
import type {
  OzipzLetter,
  OzipzFacility,
  OzipzProgram,
  OzipzJrwaCase,
  OzipzStaff,
} from "../../types/ozipz.types";

describe("Letters Module Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockLetters: OzipzLetter[] = [
    {
      id: "let-1",
      direction: "wychodzace",
      letterNumber: "OZiPZ.966.1.1.2026",
      letterDate: "2026-03-10",
      caseSign: "OZiPZ.966.1.1.2026",
      senderRecipient: "Szkoła Podstawowa nr 1 w Myśliborzu",
      subject: "Zaproszenie do programu Trzymaj Formę!",
      status: "wyslane",
      assignedPerson: "Jan Kowalski",
      createdAt: "2026-03-10",
      updatedAt: "2026-03-10",
    },
    {
      id: "let-2",
      direction: "przychodzace",
      letterNumber: "SP2/123/2026",
      letterDate: "2026-03-15",
      senderRecipient: "Szkoła Podstawowa nr 2 w Barlinku",
      subject: "Zgłoszenie do konkursu wiedzy o zdrowiu",
      status: "zalatwione",
      assignedPerson: "Anna Nowak",
      createdAt: "2026-03-15",
      updatedAt: "2026-03-15",
    },
  ];

  describe("LettersStatsHeader", () => {
    it("renders all 4 KPI cards with explicit count props", () => {
      render(
        <LettersStatsHeader
          total={10}
          outgoing={6}
          incoming={4}
          withCaseSign={3}
        />
      );

      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      expect(screen.getByText("10")).toBeDefined();
      expect(screen.getByText("Pisma Wychodzące")).toBeDefined();
      expect(screen.getByText("6")).toBeDefined();
      expect(screen.getByText("Pisma Przychodzące")).toBeDefined();
      expect(screen.getByText("4")).toBeDefined();
      expect(screen.getByText("Ze Znakiem Sprawy JRWA")).toBeDefined();
      expect(screen.getByText("3")).toBeDefined();
    });

    it("calculates metrics correctly when passing letters array", () => {
      render(<LettersStatsHeader letters={mockLetters} />);

      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      expect(screen.getByText("2")).toBeDefined();
      expect(screen.getByText("Pisma Wychodzące")).toBeDefined();
      expect(screen.getByText("Pisma Przychodzące")).toBeDefined();
      expect(screen.getByText("Ze Znakiem Sprawy JRWA")).toBeDefined();
      // Outgoing (1), incoming (1), and withCaseSign (1) are all 1
      expect(screen.getAllByText("1")).toHaveLength(3);
    });
  });

  describe("LettersSection", () => {
    it("renders table with letters list, counts, and KPI cards", () => {
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Zaproszenie do programu Trzymaj Formę!")).toBeDefined();
      expect(screen.getByText("Zgłoszenie do konkursu wiedzy o zdrowiu")).toBeDefined();
      expect(screen.getAllByText("OZiPZ.966.1.1.2026").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("SP2/123/2026")).toBeDefined();
      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
    });

    it("filters letters by search keyword in subject or letter number", () => {
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Szukaj pisma, numeru, odbiorcy/i);
      fireEvent.change(searchInput, { target: { value: "konkursu" } });

      expect(screen.queryByText("Zaproszenie do programu Trzymaj Formę!")).toBeNull();
      expect(screen.getByText("Zgłoszenie do konkursu wiedzy o zdrowiu")).toBeDefined();
    });

    it("clears search keyword when clicking the clear X button", () => {
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Szukaj pisma, numeru, odbiorcy/i);
      fireEvent.change(searchInput, { target: { value: "konkursu" } });
      expect(screen.queryByText("Zaproszenie do programu Trzymaj Formę!")).toBeNull();

      const clearBtn = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      fireEvent.click(clearBtn);

      expect(screen.getByText("Zaproszenie do programu Trzymaj Formę!")).toBeDefined();
      expect(screen.getByText("Zgłoszenie do konkursu wiedzy o zdrowiu")).toBeDefined();
    });

    it("filters letters using quick-filter chips for direction", () => {
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Click "Wychodzące" chip
      const wychodzaceChip = screen.getByRole("button", { name: "Wychodzące" });
      fireEvent.click(wychodzaceChip);
      expect(screen.getByText("Zaproszenie do programu Trzymaj Formę!")).toBeDefined();
      expect(screen.queryByText("Zgłoszenie do konkursu wiedzy o zdrowiu")).toBeNull();

      // Click "Przychodzące" chip
      const przychodzaceChip = screen.getByRole("button", { name: "Przychodzące" });
      fireEvent.click(przychodzaceChip);
      expect(screen.queryByText("Zaproszenie do programu Trzymaj Formę!")).toBeNull();
      expect(screen.getByText("Zgłoszenie do konkursu wiedzy o zdrowiu")).toBeDefined();

      // Reset with "Wszystkie pisma" chip
      const allChips = screen.getAllByRole("button", { name: "Wszystkie pisma" });
      fireEvent.click(allChips[allChips.length - 1]);
      expect(screen.getByText("Zaproszenie do programu Trzymaj Formę!")).toBeDefined();
      expect(screen.getByText("Zgłoszenie do konkursu wiedzy o zdrowiu")).toBeDefined();
    });

    it("triggers onOpenEdit when directly clicking a table row", () => {
      const handleOpenEdit = vi.fn();
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleOpenEdit}
          onDelete={vi.fn()}
        />
      );

      const cell = screen.getByText("Zaproszenie do programu Trzymaj Formę!");
      const row = cell.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);

      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetters[0]);
    });

    it("isolates action buttons with stopPropagation and does not fire duplicate row edit", () => {
      const handleOpenEdit = vi.fn();
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleOpenEdit}
          onDelete={vi.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button", { name: /edytuj pismo/i });
      // Table is sorted descending by date: row 0 is let-2 (2026-03-15), row 1 is let-1 (2026-03-10)
      fireEvent.click(editButtons[0]);

      // Triggered only once from button, not twice from row bubble
      expect(handleOpenEdit).toHaveBeenCalledTimes(1);
      expect(handleOpenEdit).toHaveBeenCalledWith(mockLetters[1]);
    });

    it("stops propagation on delete button and calls onDelete after confirm", () => {
      const handleOpenEdit = vi.fn();
      const handleDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      );

      const deleteButtons = screen.getAllByRole("button", { name: /usuń pismo/i });
      // Table sorted descending by date: row 0 is let-2
      fireEvent.click(deleteButtons[0]);

      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledWith(mockLetters[1].id);
      expect(handleOpenEdit).not.toHaveBeenCalled();
    });

    it("applies multi-line text wrapping classes and title tooltips", () => {
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const subjectEl = screen.getByText("Zaproszenie do programu Trzymaj Formę!");
      expect(subjectEl.className).toContain("line-clamp-2");
      expect(subjectEl.className).toContain("break-words");
      expect(subjectEl.className).toContain("leading-tight");
      expect(subjectEl.getAttribute("title")).toBe("Zaproszenie do programu Trzymaj Formę!");

      const senderEl = screen.getByText("Szkoła Podstawowa nr 1 w Myśliborzu");
      expect(senderEl.getAttribute("title")).toBe("Szkoła Podstawowa nr 1 w Myśliborzu");

      const assignedEl = screen.getByText("Jan Kowalski");
      expect(assignedEl.getAttribute("title")).toBe("Jan Kowalski");
    });

    it("toggles collapsible KPI header and persists state to localStorage", () => {
      render(
        <LettersSection
          letters={mockLetters}
          onOpenAdd={vi.fn()}
          onOpenEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Initially visible
      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

      // Click to collapse
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("Wszystkie Pisma")).toBeNull();
      expect(localStorage.getItem("oz.lettersShowKpiSummary")).toBe("false");

      // Click to expand
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      expect(expandBtn.getAttribute("aria-expanded")).toBe("false");
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Pisma")).toBeDefined();
      expect(localStorage.getItem("oz.lettersShowKpiSummary")).toBe("true");
    });
  });

  describe("LetterDialog", () => {
    const mockFacilities: OzipzFacility[] = [
      {
        id: "fac-1",
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

    const mockJrwa: OzipzJrwaCase[] = [
      {
        id: "case-1",
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 1,
        year: 2026,
        fullCaseSign: "OZiPZ.966.1.1.2026",
        title: "Sprawa Trzymaj Formę",
        status: "w_toku",
        assignedEducator: "Jan Kowalski",
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

    it("renders modal dialog in edit mode with populated letter data", () => {
      render(
        <LetterDialog
          isOpen={true}
          onClose={vi.fn()}
          editingLetter={mockLetters[0]}
          facilities={mockFacilities}
          programs={mockPrograms}
          jrwaCases={mockJrwa}
          staff={mockStaff}
          onSave={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Edycja Pisma Urzędowego")).toBeDefined();
      expect(screen.getByDisplayValue("OZiPZ.966.1.1.2026")).toBeDefined();
      expect(screen.getByDisplayValue("Zaproszenie do programu Trzymaj Formę!")).toBeDefined();
    });

    it("renders modal dialog in create mode with new letter header", () => {
      const onSave = vi.fn();
      render(
        <LetterDialog
          isOpen={true}
          onClose={vi.fn()}
          editingLetter={null}
          facilities={mockFacilities}
          programs={mockPrograms}
          jrwaCases={mockJrwa}
          staff={mockStaff}
          onSave={onSave}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Nowe Pismo w Dzienniku Korespondencji")).toBeDefined();
    });
  });
});
