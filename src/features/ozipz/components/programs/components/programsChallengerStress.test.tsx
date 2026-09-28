import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SchoolParticipationsTab } from "./SchoolParticipationsTab";
import { SchoolParticipationsFilterBar } from "./SchoolParticipationsFilterBar";
import { ProgramsCatalogTab } from "./ProgramsCatalogTab";
import { ProgramsSection } from "../ProgramsSection";
import type { OzipzProgram, OzipzSchoolParticipation } from "../../../types/ozipz.types";

const mockPrograms: OzipzProgram[] = [
  {
    id: "prog-1",
    code: "BPZ",
    name: "Bieg po zdrowie",
    editionYear: "2025/2026",
    jrwaSymbol: "9011",
    targetAudience: "Uczniowie klas IV szkół podstawowych",
    description: "Program antynikotynowy",
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
    targetAudience: "Przedszkolaki 5-6 lat",
    description: "Program przedszkolny",
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
    programName: "Bieg po zdrowie",
    facilityId: "fac-1",
    facilityName: "Szkoła Podstawowa nr 1 w Barlinku",
    municipality: "Barlinek",
    schoolYear: "2025/2026",
    schoolCoordinatorName: "Janina Kowalska",
    schoolCoordinatorContact: "j.kowalska@sp1.pl",
    classesCount: 3,
    pupilsCount: 65,
    parentsCount: 40,
    hasDeclaration: true,
    hasFinalReport: true,
    evaluationGrade: "5",
    notes: "Wzorowo",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "part-2",
    programId: "prog-2",
    programName: "Czyste Powietrze Wokół Nas",
    facilityId: "fac-2",
    facilityName: "Przedszkole Miejskie w Myśliborzu",
    municipality: "Myślibórz",
    schoolYear: "2024/2025",
    schoolCoordinatorName: "Piotr Nowak",
    schoolCoordinatorContact: "p.nowak@pm.pl",
    classesCount: 2,
    pupilsCount: 40,
    parentsCount: 35,
    hasDeclaration: true,
    hasFinalReport: false,
    evaluationGrade: "",
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("Challenger 1 — Empirical Stress Tests & Adversarial Verification", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. EVENT BUBBLING & ACTION ISOLATION
  // =========================================================================
  describe("Adversarial: Event Bubbling & Action Isolation", () => {
    it("safely isolates nested SVG icon clicks inside Edit and Delete buttons from row click", () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      );

      const editBtn = screen.getAllByRole("button", { name: "Edytuj zgłoszenie" })[0];
      const deleteBtn = screen.getAllByRole("button", { name: "Usuń zgłoszenie" })[0];

      // Click the SVG or its path element directly
      const svgInEdit = editBtn.querySelector("svg");
      expect(svgInEdit).not.toBeNull();
      fireEvent.click(svgInEdit!);

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleDelete).not.toHaveBeenCalled();

      // Click the SVG in delete button
      const svgInDelete = deleteBtn.querySelector("svg");
      expect(svgInDelete).not.toBeNull();
      fireEvent.click(svgInDelete!);

      expect(handleDelete).toHaveBeenCalledTimes(1);
      // handleEdit should STILL be 1 (not invoked by delete button click!)
      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it("prevents row-click when clicking the action container cell padding/margin", () => {
      const handleEdit = vi.fn();

      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
        />
      );

      const editBtn = screen.getAllByRole("button", { name: "Edytuj zgłoszenie" })[0];
      const actionContainerDiv = editBtn.closest(".flex.items-center.gap-1.justify-end");
      expect(actionContainerDiv).not.toBeNull();

      fireEvent.click(actionContainerDiv!);
      // Row-click should NOT fire because the container stops propagation
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("safely handles rapid repeated clicks on Edit button without double-invoking row handler", () => {
      const handleEdit = vi.fn();

      render(
        <ProgramsCatalogTab
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
        />
      );

      const editBtn = screen.getAllByRole("button", { name: "Edytuj program" })[0];

      for (let i = 0; i < 10; i++) {
        fireEvent.click(editBtn);
      }

      // Exactly 10 calls to handleEdit (from the button itself), zero spurious row clicks
      expect(handleEdit).toHaveBeenCalledTimes(10);
    });

    it("fires onEdit when clicking non-action table cells", () => {
      const handleEdit = vi.fn();

      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={handleEdit}
          onDelete={vi.fn()}
        />
      );

      // Click the facility name text
      const facilityCell = screen.getByText("Szkoła Podstawowa nr 1 w Barlinku");
      fireEvent.click(facilityCell);

      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockParticipations[0]);
    });
  });

  // =========================================================================
  // 2. LOCALSTORAGE RESILIENCE & ADVERSARIAL STORAGE STATES
  // =========================================================================
  describe("Adversarial: LocalStorage Resilience", () => {
    it(
      "handles corrupt, unexpected, or non-boolean strings in localStorage without crashing",
      () => {
        const invalidValues = ["banana", "", "0", "undefined"];

        for (const val of invalidValues) {
          localStorage.setItem("oz.programsShowKpiSummary", val);

          const { unmount } = render(
            <ProgramsSection programs={mockPrograms} participations={mockParticipations} />
          );

          // When saved is not "true", it evaluates saved === "true" (false)
          // Header will be collapsed, but UI MUST NOT crash
          expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();

          unmount();
        }
      },
      15000
    );

    it("survives SecurityError when localStorage is blocked (e.g. cross-origin iframe)", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        const error = new Error("The operation is insecure.");
        error.name = "SecurityError";
        throw error;
      });

      render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);

      // Gracefully falls back to default true
      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();
      expect(screen.getByRole("button", { name: /zwiń kpi/i })).toBeDefined();
    });

    it("survives QuotaExceededError on localStorage.setItem during toggle", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        const error = new Error("QuotaExceededError");
        error.name = "QuotaExceededError";
        throw error;
      });

      render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);

      const toggleBtn = screen.getByRole("button", { name: /zwiń kpi/i });
      expect(() => fireEvent.click(toggleBtn)).not.toThrow();

      // UI state toggles to collapsed despite storage error
      expect(screen.queryByText("Programy Profilaktyczne")).toBeNull();
      expect(screen.getByRole("button", { name: /pokaż kpi/i })).toBeDefined();

      // Expand again
      const expandBtn = screen.getByRole("button", { name: /pokaż kpi/i });
      expect(() => fireEvent.click(expandBtn)).not.toThrow();
      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();
    });
  });

  // =========================================================================
  // 3. MULTI-LINE TEXT WRAPPING & EXTREME STRINGS
  // =========================================================================
  describe("Adversarial: Multi-line Text Wrapping & Extreme Strings", () => {
    it("safely handles 500-character unbroken string in facility name without layout explosion", () => {
      const extremeParticipation: OzipzSchoolParticipation = {
        ...mockParticipations[0],
        id: "extreme-1",
        facilityName: "Szkoła" + "X".repeat(500),
      };

      render(
        <SchoolParticipationsTab
          participations={[extremeParticipation]}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const span = screen.getByTitle(extremeParticipation.facilityName);
      expect(span).toBeDefined();
      expect(span.className).toContain("break-words");
      expect(span.className).toContain("line-clamp-2");
      expect(span.className).toContain("leading-tight");
      expect(span.className).not.toContain("truncate");
    });

    it("safely handles extreme Unicode, emojis, diacritics and special characters", () => {
      const unicodeName = "Zespół Szkół Ogólnokształcących 🌿 Zażółć Gęślą Jaźń 🚀 123";
      const unicodeProgram: OzipzProgram = {
        ...mockPrograms[0],
        id: "uni-prog",
        name: unicodeName,
      };

      render(
        <ProgramsCatalogTab
          programs={[unicodeProgram]}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const nameSpan = screen.getByTitle(unicodeName);
      expect(nameSpan).toBeDefined();
      expect(nameSpan.textContent).toContain(unicodeName);
      expect(nameSpan.className).toContain("line-clamp-2");
      expect(nameSpan.className).toContain("break-words");
    });

    it("safely handles missing, empty, or nullish fields in school participations", () => {
      const emptyParticipation: OzipzSchoolParticipation = {
        id: "empty-1",
        programId: "non-existent-prog",
        programName: "",
        facilityId: "empty-fac",
        facilityName: "",
        municipality: "",
        schoolYear: "",
        schoolCoordinatorName: "",
        schoolCoordinatorContact: "",
        classesCount: 0,
        pupilsCount: 0,
        parentsCount: 0,
        evaluationGrade: "",
        notes: "",
        hasDeclaration: false,
        hasFinalReport: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };

      render(
        <SchoolParticipationsTab
          participations={[emptyParticipation]}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Falls back to "Brak nazwy"
      expect(screen.getByText("Brak nazwy")).toBeDefined();
      // Program badge falls back to "Program" with title="Program"
      const programBadge = screen.getByTitle("Program");
      expect(programBadge).toBeDefined();
      expect(programBadge.className).toContain("line-clamp-2");
      expect(programBadge.className).toContain("break-words");
      // Status is "Oczekuje"
      expect(screen.getByText("Oczekuje")).toBeDefined();
    });
  });

  // =========================================================================
  // 4. COMPLEX FILTER COMBINATIONS & EDGE CASES
  // =========================================================================
  describe("Adversarial: Complex Filter Combinations", () => {
    it("handles regex metacharacters in search query without throwing", () => {
      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByLabelText("Szukaj po szkole, gminie, koordynatorze");

      // Regex special characters that break `new RegExp()` if not escaped
      const maliciousInputs = ["[a-z]+", ".*", "(Barlink|Myślibórz)", "\\d{3}", "^Szkoła$"];

      for (const input of maliciousInputs) {
        expect(() => {
          fireEvent.change(searchInput, { target: { value: input } });
        }).not.toThrow();
      }
    });

    it("displays EmptyState with clear button when complex filter combination yields 0 results", () => {
      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Search for something that doesn't exist
      const searchInput = screen.getByLabelText("Szukaj po szkole, gminie, koordynatorze");
      fireEvent.change(searchInput, { target: { value: "ZupełnieNieistniejącaSzkoła" } });

      expect(screen.getByText("Brak pasujących zgłoszeń szkół")).toBeDefined();
      const clearBtn = screen.getByRole("button", { name: "Wyczyść filtry" });
      expect(clearBtn).toBeDefined();

      // Click clear filters
      fireEvent.click(clearBtn);

      // Both items restored
      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();
    });

    it("allows toggling off an active municipality quick-chip", () => {
      const handleMunicipalityChange = vi.fn();

      render(
        <SchoolParticipationsFilterBar
          searchQuery=""
          onSearchChange={vi.fn()}
          selectedProgramId="all"
          onProgramChange={vi.fn()}
          selectedSchoolYear="all"
          onSchoolYearChange={vi.fn()}
          selectedMunicipality="Barlinek"
          onMunicipalityChange={handleMunicipalityChange}
          statusFilter="all"
          onStatusFilterChange={vi.fn()}
          programs={mockPrograms}
          schoolYears={["2025/2026"]}
          municipalities={["Barlinek", "Myślibórz"]}
          onClearFilters={vi.fn()}
          hasActiveFilters={true}
          activeFiltersCount={1}
        />
      );

      // Select trigger button and quick filter chip both have name "Barlinek", select the quick chip (with bg-primary)
      const buttons = screen.getAllByRole("button", { name: "Barlinek" });
      const barlinekChip = buttons.find((b) => b.className.includes("bg-primary"));
      expect(barlinekChip).toBeDefined();

      // Clicking active chip calls onMunicipalityChange("all")
      fireEvent.click(barlinekChip!);
      expect(handleMunicipalityChange).toHaveBeenCalledWith("all");
    });

    it("renders smoothly with zero items in all collections", () => {
      render(
        <SchoolParticipationsFilterBar
          searchQuery=""
          onSearchChange={vi.fn()}
          selectedProgramId="all"
          onProgramChange={vi.fn()}
          selectedSchoolYear="all"
          onSchoolYearChange={vi.fn()}
          selectedMunicipality="all"
          onMunicipalityChange={vi.fn()}
          statusFilter="all"
          onStatusFilterChange={vi.fn()}
          programs={[]}
          schoolYears={[]}
          municipalities={[]}
          onClearFilters={vi.fn()}
          hasActiveFilters={false}
          activeFiltersCount={0}
        />
      );

      // Quick filter chips still render
      expect(screen.getByText("Wszystkie zgłoszenia")).toBeDefined();
      expect(screen.getByText("Sprawozdanie złożone")).toBeDefined();
      expect(screen.getByText("Oczekuje na sprawozdanie")).toBeDefined();
    });
  });
});
