import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgramsStatsHeader } from "./ProgramsStatsHeader";
import { ProgramsViewSwitcher } from "./ProgramsViewSwitcher";
import { SchoolParticipationsTab } from "./SchoolParticipationsTab";
import { SchoolParticipationsFilterBar } from "./SchoolParticipationsFilterBar";
import { ProgramsCatalogTab } from "./ProgramsCatalogTab";
import { ProgramsSection } from "../ProgramsSection";
import type { OzipzProgram, OzipzSchoolParticipation } from "../../../types/ozipz.types";

const mockPrograms: OzipzProgram[] = [
  {
    id: "prog-1",
    code: "BPZ",
    name: "Bieg po zdrowie — Ogólnopolski Program Edukacji Antytytoniowej",
    editionYear: "2025/2026",
    jrwaSymbol: "9011",
    targetAudience: "Uczniowie klas IV szkół podstawowych",
    description: "Nowoczesny program antynikotynowy dla klas czwartych",
    status: "aktywny",
    participatingSchoolsCount: 2,
    totalPupilsReached: 120,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "prog-2",
    code: "CPWN",
    name: "Czyste Powietrze Wokół Nas",
    editionYear: "2025/2026",
    jrwaSymbol: "9012",
    targetAudience: "Dzieci 5-6 letnie w przedszkolach",
    description: "Program edukacji przedszkolnej o ochronie przed dymem",
    status: "aktywny",
    participatingSchoolsCount: 1,
    totalPupilsReached: 45,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

const mockParticipations: OzipzSchoolParticipation[] = [
  {
    id: "part-1",
    programId: "prog-1",
    programName: "Bieg po zdrowie — Ogólnopolski Program Edukacji Antytytoniowej",
    facilityId: "fac-1",
    facilityName: "Szkoła Podstawowa z Oddziałami Integracyjnymi im. Bohaterów Westerplatte w Barlinku",
    municipality: "Barlinek",
    schoolYear: "2025/2026",
    schoolCoordinatorName: "Anna Kowalska",
    schoolCoordinatorContact: "anna.kowalska@sp-barlinek.pl",
    classesCount: 3, pupilsCount: 65, parentsCount: 40,
    hasDeclaration: true, hasFinalReport: true, evaluationGrade: "5", notes: "Wzorowa realizacja",
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
  {
    id: "part-2",
    programId: "prog-1",
    programName: "Bieg po zdrowie — Ogólnopolski Program Edukacji Antytytoniowej",
    facilityId: "fac-2",
    facilityName: "Zespół Szkół i Placówek Oświatowych im. Noblistów Polskich w Myśliborzu",
    municipality: "Myślibórz",
    schoolYear: "2025/2026",
    schoolCoordinatorName: "Jan Nowak",
    schoolCoordinatorContact: "j.nowak@zsipo.pl",
    classesCount: 2, pupilsCount: 55, parentsCount: 30,
    hasDeclaration: true, hasFinalReport: false, evaluationGrade: "", notes: "",
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
];

const defaultFilterProps = {
  searchQuery: "",
  onSearchChange: vi.fn(),
  selectedProgramId: "all",
  onProgramChange: vi.fn(),
  selectedSchoolYear: "all",
  onSchoolYearChange: vi.fn(),
  selectedMunicipality: "all",
  onMunicipalityChange: vi.fn(),
  statusFilter: "all" as const,
  onStatusFilterChange: vi.fn(),
  programs: mockPrograms,
  schoolYears: ["2025/2026"],
  municipalities: ["Barlinek", "Myślibórz"],
  onClearFilters: vi.fn(),
  hasActiveFilters: false,
};

const defaultTabProps = {
  participations: mockParticipations,
  programs: mockPrograms,
  onOpenAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("Programs Module Components — Comprehensive Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // --- R1: Filter Bar, Selects & Quick Chips ---
  describe("R1: Filter Bar & Quick Chips Harmonization", () => {
    it("renders Design System Select triggers and zero native HTML select elements", () => {
      const { container } = render(<SchoolParticipationsFilterBar {...defaultFilterProps} />);

      expect(container.querySelectorAll("select").length).toBe(0);
      expect(screen.getByText("Wszystkie programy")).toBeDefined();
      expect(screen.getByText("Wszystkie lata szkolne")).toBeDefined();
      expect(screen.getByText("Wszystkie gminy")).toBeDefined();
    });

    it("renders quick-filter chips with correct active and inactive styling", () => {
      render(<SchoolParticipationsFilterBar {...defaultFilterProps} statusFilter="submitted" />);

      const submittedChip = screen.getByRole("button", { name: "Sprawozdanie złożone" });
      const pendingChip = screen.getByRole("button", { name: "Oczekuje na sprawozdanie" });

      expect(submittedChip.className).toContain("bg-primary text-primary-foreground");
      expect(pendingChip.className).toContain("bg-muted/40");
    });

    it("filters rows in SchoolParticipationsTab via quick chips, search, and clear", () => {
      render(<SchoolParticipationsTab {...defaultTabProps} />);

      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();

      // Filter by submitted report
      fireEvent.click(screen.getByRole("button", { name: "Sprawozdanie złożone" }));
      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.queryByText(mockParticipations[1].facilityName)).toBeNull();

      // Filter by pending report
      fireEvent.click(screen.getByRole("button", { name: "Oczekuje na sprawozdanie" }));
      expect(screen.queryByText(mockParticipations[0].facilityName)).toBeNull();
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();

      // Search input & clear search button
      const searchInput = screen.getByLabelText("Szukaj po szkole, gminie, koordynatorze");
      fireEvent.change(searchInput, { target: { value: "Nowak" } });
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();

      fireEvent.click(screen.getByLabelText("Wyczyść wyszukiwanie"));

      // Clear all filters button
      fireEvent.click(screen.getByRole("button", { name: /wyczyść/i }));
      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();
    });
  });

  // --- R2: Collapsible KPI Summary & Persistence ---
  describe("R2: Collapsible KPI Header & Persistence", () => {
    it("counts one school across multiple years even if its stored name changed", () => {
      const laterYear = {
        ...mockParticipations[0],
        id: "part-later",
        facilityName: "Nowa nazwa tej samej szkoły",
        schoolYear: "2026/2027",
      };
      render(<ProgramsSection programs={mockPrograms} participations={[mockParticipations[0], laterYear]} />);

      expect(screen.getByText("Unikalne Placówki").parentElement?.textContent).toContain("1");
    });

    it("renders KPI summary by default, toggles collapse and persists in localStorage", () => {
      render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);

      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();
      const collapseBtn = screen.getByRole("button", { name: /zwiń kpi/i });

      fireEvent.click(collapseBtn);
      expect(screen.queryByText("Programy Profilaktyczne")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
      expect(localStorage.getItem("oz.programsShowKpiSummary")).toBe("false");

      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();
      expect(localStorage.getItem("oz.programsShowKpiSummary")).toBe("true");
    });

    it("honors pre-existing collapsed state from localStorage on mount", () => {
      localStorage.setItem("oz.programsShowKpiSummary", "false");
      render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);

      expect(screen.queryByText("Programy Profilaktyczne")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();
    });

    it("gracefully handles localStorage exceptions without crashing", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: Access denied");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);
      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();

      const collapseBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(() => fireEvent.click(collapseBtn)).not.toThrow();
      expect(screen.queryByText("Programy Profilaktyczne")).toBeNull();
    });
  });

  // --- R3: Direct Row Interaction & Event Isolation ---
  describe("R3: Direct Row Interaction & Event Isolation", () => {
    it("shows each program status and opens a school participation with that program selected", () => {
      const statuses = [
        ["aktywny", "Aktywny"],
        ["zakonczony", "Zakończony"],
        ["zawieszony", "Zawieszony"],
        ["archiwalny", "Archiwalny"],
        ["nieznany", "nieznany"],
      ] as const;
      const programs = statuses.map(([status], index) => ({
        ...mockPrograms[0],
        id: `program-${index}`,
        name: `Program ${status}`,
        status,
      }));
      const onOpenAddParticipation = vi.fn();
      const onOpenEditProgram = vi.fn();

      render(
        <ProgramsSection
          programs={programs}
          participations={[]}
          onOpenAddParticipation={onOpenAddParticipation}
          onOpenEditProgram={onOpenEditProgram}
        />
      );

      for (const [, label] of statuses) {
        expect(screen.getByText(label)).toBeDefined();
      }

      fireEvent.click(screen.getByRole("button", { name: "Dodaj zgłoszenie do programu Program zawieszony" }));
      expect(onOpenAddParticipation).toHaveBeenCalledWith("program-2");
      expect(onOpenEditProgram).not.toHaveBeenCalled();
    });

    it("triggers onEdit on row click and isolates Edit and Delete buttons in SchoolParticipationsTab", () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(<SchoolParticipationsTab {...defaultTabProps} onEdit={handleEdit} onDelete={handleDelete} />);

      // Direct row click
      const cell = screen.getByText(mockParticipations[0].facilityName);
      const row = cell.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockParticipations[0]);

      // Edit button isolation (no double invocation)
      const editButtons = screen.getAllByRole("button", { name: "Edytuj zgłoszenie" });
      fireEvent.click(editButtons[0]);
      expect(handleEdit).toHaveBeenCalledTimes(2);

      // Delete button isolation (does not trigger onEdit)
      const deleteButtons = screen.getAllByRole("button", { name: "Usuń zgłoszenie" });
      fireEvent.click(deleteButtons[0]);
      expect(handleDelete).toHaveBeenCalledWith(mockParticipations[0].id);
      expect(handleEdit).toHaveBeenCalledTimes(2);
    });

    it("triggers onEdit on row click and isolates Edit and Delete buttons in ProgramsCatalogTab", () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <ProgramsCatalogTab
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );

      // Direct row click
      const cell = screen.getByText(mockPrograms[0].name);
      const row = cell.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockPrograms[0]);

      // Edit button isolation
      const editButtons = screen.getAllByRole("button", { name: "Edytuj program" });
      fireEvent.click(editButtons[0]);
      expect(handleEdit).toHaveBeenCalledTimes(2);

      // Delete button isolation
      const deleteButtons = screen.getAllByRole("button", { name: "Usuń program" });
      fireEvent.click(deleteButtons[0]);
      expect(handleDelete).toHaveBeenCalledWith(mockPrograms[0].id);
      expect(handleEdit).toHaveBeenCalledTimes(2);
    });
  });

  // --- R4: Multi-line Wrapping & Tooltips ---
  describe("R4: Multi-line Wrapping & Tooltips", () => {
    it("renders facility names with multi-line wrapping, items-start icon and title tooltip", () => {
      render(<SchoolParticipationsTab {...defaultTabProps} />);

      const facilityNameSpan = screen.getByText(mockParticipations[0].facilityName);
      expect(facilityNameSpan.className).toContain("line-clamp-2");
      expect(facilityNameSpan.className).toContain("break-words");
      expect(facilityNameSpan.className).toContain("leading-tight");
      expect(facilityNameSpan.className).not.toContain("truncate");
      expect(facilityNameSpan.getAttribute("title")).toBe(mockParticipations[0].facilityName);

      const iconContainer = facilityNameSpan.closest(".flex");
      expect(iconContainer?.className).toContain("items-start");
    });

    it("renders program names with multi-line wrapping and title tooltip", () => {
      render(
        <ProgramsCatalogTab
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const progNameSpan = screen.getByText(mockPrograms[0].name);
      expect(progNameSpan.className).toContain("line-clamp-2");
      expect(progNameSpan.className).toContain("break-words");
      expect(progNameSpan.className).toContain("leading-tight");
      expect(progNameSpan.getAttribute("title")).toBe(mockPrograms[0].name);
    });
  });

  // --- Baseline Components ---
  describe("Baseline Programs Components", () => {
    it("renders ProgramsStatsHeader with counts", () => {
      render(
        <ProgramsStatsHeader
          programsCount={7}
          participationsCount={42}
          uniqueSchoolsCount={18}
          reportedCoordinatorsCount={25}
        />
      );

      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();
      expect(screen.getByText("7")).toBeDefined();
      expect(screen.getByText("42")).toBeDefined();
      expect(screen.getByText("18")).toBeDefined();
      expect(screen.getByText("25")).toBeDefined();
    });

    it("renders ProgramsViewSwitcher and handles tab change", () => {
      const handleTabChange = vi.fn();
      const handleAddSchool = vi.fn();

      render(
        <ProgramsViewSwitcher
          activeTab="schools"
          onTabChange={handleTabChange}
          participationsCount={42}
          programsCount={7}
          onOpenAddParticipation={handleAddSchool}
          onOpenAddProgram={vi.fn()}
        />
      );

      expect(screen.getByText("Zgłoszenia Szkół")).toBeDefined();
      fireEvent.click(screen.getByText("Katalog Programów"));
      expect(handleTabChange).toHaveBeenCalledWith("programs");

      fireEvent.click(screen.getByText("Dodaj Zgłoszenie"));
      expect(handleAddSchool).toHaveBeenCalled();
    });
  });
});
