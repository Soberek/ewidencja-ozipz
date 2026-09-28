import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SchoolParticipationsTab } from "./components/SchoolParticipationsTab";
import { SchoolParticipationsFilterBar } from "./components/SchoolParticipationsFilterBar";
import { ProgramsCatalogTab } from "./components/ProgramsCatalogTab";
import { ProgramsViewSwitcher } from "./components/ProgramsViewSwitcher";
import { ProgramsSection } from "./ProgramsSection";
import type { OzipzProgram, OzipzSchoolParticipation } from "../../types/ozipz.types";

const mockPrograms: OzipzProgram[] = [
  {
    id: "prog-adv-1",
    code: "BPZ",
    name: "Bieg po zdrowie — Ogólnopolski Program Edukacji Antytytoniowej dla Szkół Podstawowych i Przedszkoli",
    editionYear: "2025/2026",
    jrwaSymbol: "966.1",
    targetAudience: "Uczniowie klas IV szkół podstawowych",
    description: "Kompleksowy program profilaktyki palenia tytoniu i używania e-papierosów",
    status: "aktywny",
    participatingSchoolsCount: 5,
    totalPupilsReached: 240,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "prog-adv-2",
    code: "ARS",
    name: "ARS, czyli jak dbać o miłość? Nowoczesna profilaktyka uzależnień w szkołach ponadpodstawowych",
    editionYear: "2025/2026",
    jrwaSymbol: "966.4",
    targetAudience: "Młodzież szkół ponadpodstawowych",
    description: "Program profilaktyki szkód wynikających z używania substancji psychoaktywnych",
    status: "archiwalny",
    participatingSchoolsCount: 2,
    totalPupilsReached: 110,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

const mockParticipations: OzipzSchoolParticipation[] = [
  {
    id: "part-adv-1",
    programId: "prog-adv-1",
    programName: "Bieg po zdrowie — Ogólnopolski Program Edukacji Antytytoniowej dla Szkół Podstawowych i Przedszkoli",
    facilityId: "fac-adv-1",
    facilityName: "Szkoła Podstawowa z Oddziałami Integracyjnymi nr 3 im. Bohaterów Westerplatte w Barlinku przy ulicy Kombatantów",
    municipality: "Barlinek",
    schoolYear: "2025/2026",
    schoolCoordinatorName: "Monika Wiśniewska",
    schoolCoordinatorContact: "m.wisniewska@sp3barlinek.edu.pl",
    classesCount: 4,
    pupilsCount: 88,
    parentsCount: 75,
    hasDeclaration: true,
    hasFinalReport: true,
    evaluationGrade: "5",
    notes: "Pełna realizacja wszystkich modułów",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "part-adv-2",
    programId: "prog-adv-1",
    programName: "Bieg po zdrowie — Ogólnopolski Program Edukacji Antytytoniowej dla Szkół Podstawowych i Przedszkoli",
    facilityId: "fac-adv-2",
    facilityName: "Publiczne Przedszkole Samorządowe nr 1 Bajkowy Zakątek w Myśliborzu z Grupami Żłobkowymi",
    municipality: "Myślibórz",
    schoolYear: "2025/2026",
    schoolCoordinatorName: "Piotr Zieliński",
    schoolCoordinatorContact: "500100200",
    classesCount: 2,
    pupilsCount: 42,
    parentsCount: 38,
    hasDeclaration: true,
    hasFinalReport: false,
    evaluationGrade: "",
    notes: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "part-adv-3",
    programId: "prog-adv-2",
    programName: "ARS, czyli jak dbać o miłość? Nowoczesna profilaktyka uzależnień w szkołach ponadpodstawowych",
    facilityId: "fac-adv-3",
    facilityName: "Zespół Szkół Ogólnokształcących i Zawodowych im. Henryka Sienkiewicza w Dębnie",
    municipality: "Dębno",
    schoolYear: "2024/2025",
    schoolCoordinatorName: "Katarzyna Dąbrowska",
    schoolCoordinatorContact: "k.dabrowska@zsoiz-debno.pl",
    classesCount: 3,
    pupilsCount: 65,
    parentsCount: 20,
    hasDeclaration: true,
    hasFinalReport: true,
    evaluationGrade: "5",
    notes: "Koordynacja wzorowa",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
];

describe("Challenger 2 — Adversarial Stress Test Suite: Programs & Participations Module", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // CHALLENGE 1: EMPTY STATES & FILTER BOUNDARIES
  // =========================================================================
  describe("Challenge 1: Empty States & Filter Boundary Behaviors", () => {
    it("SchoolParticipationsTab: displays 'Brak zgłoszeń placówek' and calls onOpenAdd when list is empty without filters", () => {
      const handleOpenAdd = vi.fn();
      render(
        <SchoolParticipationsTab
          participations={[]}
          programs={mockPrograms}
          onOpenAdd={handleOpenAdd}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Brak zgłoszeń placówek")).toBeDefined();
      expect(
        screen.getByText(
          "Nie wprowadzono jeszcze deklaracji uczestnictwa szkół i przedszkoli w programach profilaktycznych."
        )
      ).toBeDefined();

      const addBtn = screen.getByRole("button", { name: "Dodaj pierwsze zgłoszenie" });
      fireEvent.click(addBtn);
      expect(handleOpenAdd).toHaveBeenCalledTimes(1);
    });

    it("SchoolParticipationsTab: displays 'Brak pasujących zgłoszeń szkół' with clear filters action when list is empty but filters are active", () => {
      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Search non-existent school
      const searchInput = screen.getByLabelText("Szukaj po szkole, gminie, koordynatorze");
      fireEvent.change(searchInput, { target: { value: "ZupełnieNieistniejącaSzkołaXYZ" } });

      expect(screen.getByText("Brak pasujących zgłoszeń szkół")).toBeDefined();
      expect(
        screen.getByText(
          "Żadne zgłoszenie nie odpowiada wprowadzonym kryteriom wyszukiwania lub filtrom."
        )
      ).toBeDefined();

      // Click clear filters button inside empty state
      const clearButtons = screen.getAllByRole("button", { name: "Wyczyść filtry" });
      expect(clearButtons.length).toBeGreaterThan(0);
      fireEvent.click(clearButtons[0]);

      // All participations should be visible again
      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[2].facilityName)).toBeDefined();
    });

    it("ProgramsCatalogTab: displays 'Katalog programów jest pusty' and triggers onOpenAdd when programs array is empty", () => {
      const handleOpenAdd = vi.fn();
      render(
        <ProgramsCatalogTab
          programs={[]}
          onOpenAdd={handleOpenAdd}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText("Katalog programów jest pusty")).toBeDefined();
      expect(
        screen.getByText("W bazie nie ma jeszcze zarejestrowanych programów profilaktycznych GIS/MZ.")
      ).toBeDefined();

      const addBtn = screen.getByRole("button", { name: "Dodaj pierwszy program" });
      fireEvent.click(addBtn);
      expect(handleOpenAdd).toHaveBeenCalledTimes(1);
    });

    it("ProgramsCatalogTab: displays 'Brak pasujących programów' and allows clearing when search yields 0 matches", () => {
      render(
        <ProgramsCatalogTab
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText("Szukaj programu po nazwie, symbolu JRWA...");
      fireEvent.change(searchInput, { target: { value: "NieznanyProgramABC" } });
      expect(screen.getByText("Brak pasujących programów")).toBeDefined();

      // In ProgramsCatalogTab, when filtered out:
      // The search clear button is shown
      const clearBtn = screen.getByRole("button", { name: "Wyczyść filtry" });
      fireEvent.click(clearBtn);

      expect(screen.getByText(mockPrograms[0].name)).toBeDefined();
      expect(screen.getByText(mockPrograms[1].name)).toBeDefined();
    });
  });

  // =========================================================================
  // CHALLENGE 2: FILTER BAR TOKEN CONSISTENCY & COMBINATIONS
  // =========================================================================
  describe("Challenge 2: Filter Bar Token & Styling Consistency vs Design System", () => {
    it("Quick-filter chips match design system primary token (bg-primary text-primary-foreground) and muted inactive (bg-muted/40 text-muted-foreground)", () => {
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
          statusFilter="submitted"
          onStatusFilterChange={vi.fn()}
          programs={mockPrograms}
          schoolYears={["2025/2026", "2024/2025"]}
          municipalities={["Barlinek", "Dębno", "Myślibórz"]}
          onClearFilters={vi.fn()}
          hasActiveFilters={true}
          activeFiltersCount={1}
        />
      );

      const allChip = screen.getByRole("button", { name: "Wszystkie zgłoszenia" });
      const submittedChip = screen.getByRole("button", { name: "Sprawozdanie złożone" });
      const pendingChip = screen.getByRole("button", { name: "Oczekuje na sprawozdanie" });

      // Submitted is active:
      expect(submittedChip.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(submittedChip.className).toContain("font-semibold");
      expect(submittedChip.getAttribute("aria-pressed")).toBe("true");

      // Inactive chips:
      expect(allChip.className).toContain("bg-muted/40 text-muted-foreground border-border");
      expect(allChip.className).toContain("font-medium");
      expect(allChip.getAttribute("aria-pressed")).toBe("false");
      expect(pendingChip.className).toContain("bg-muted/40 text-muted-foreground border-border");
    });

    it("Municipality quick chips toggle between active primary and inactive muted", () => {
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
          municipalities={["Barlinek", "Dębno", "Myślibórz"]}
          onClearFilters={vi.fn()}
          hasActiveFilters={true}
          activeFiltersCount={1}
        />
      );

      const barlinekButtons = screen.getAllByRole("button", { name: "Barlinek" });
      // The quick-filter chip is the second button (the first is the Select trigger)
      const barlinekChip = barlinekButtons[barlinekButtons.length - 1];
      const debnoChip = screen.getByRole("button", { name: "Dębno" });

      expect(barlinekChip.className).toContain("bg-primary text-primary-foreground border-primary");
      expect(debnoChip.className).toContain("bg-muted/40 text-muted-foreground border-border");

      // Clicking active municipality chip toggles it back to "all"
      fireEvent.click(barlinekChip);
      expect(handleMunicipalityChange).toHaveBeenCalledWith("all");

      // Clicking inactive municipality chip sets it
      fireEvent.click(debnoChip);
      expect(handleMunicipalityChange).toHaveBeenCalledWith("Dębno");
    });

    it("Combines multiple filters in SchoolParticipationsTab: status + municipality + year", () => {
      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Filter: Sprawozdanie złożone -> items 0 and 2
      fireEvent.click(screen.getByRole("button", { name: "Sprawozdanie złożone" }));
      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[2].facilityName)).toBeDefined();
      expect(screen.queryByText(mockParticipations[1].facilityName)).toBeNull();

      // Filter: Gmina Dębno -> only item 2
      fireEvent.click(screen.getByRole("button", { name: "Dębno" }));
      expect(screen.queryByText(mockParticipations[0].facilityName)).toBeNull();
      expect(screen.getByText(mockParticipations[2].facilityName)).toBeDefined();

      // Clear filters -> all items restore
      const clearBtn = screen.getByRole("button", { name: /wyczyść/i });
      fireEvent.click(clearBtn);
      expect(screen.getByText(mockParticipations[0].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[1].facilityName)).toBeDefined();
      expect(screen.getByText(mockParticipations[2].facilityName)).toBeDefined();
    });
  });

  // =========================================================================
  // CHALLENGE 3: EVENT BUBBLING & STOP PROPAGATION ISOLATION
  // =========================================================================
  describe("Challenge 3: Event Bubbling & stopPropagation Isolation on Tables", () => {
    it("SchoolParticipationsTab: Edit button triggers onEdit exactly ONCE and stops propagation from row onEdit", () => {
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

      const editButtons = screen.getAllByRole("button", { name: "Edytuj zgłoszenie" });
      expect(editButtons.length).toBeGreaterThan(0);

      // Click edit button
      fireEvent.click(editButtons[0]);

      // Crucial assertion: handleEdit should be invoked ONCE, not twice (no bubbling to row click)
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleDelete).not.toHaveBeenCalled();
    });

    it("SchoolParticipationsTab: Delete button triggers onDelete and strictly prevents row onEdit", () => {
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

      const deleteButtons = screen.getAllByRole("button", { name: "Usuń zgłoszenie" });
      // Alphabetical order: mockParticipations[1] ("Publiczne...") is index 0
      fireEvent.click(deleteButtons[0]);

      // Crucial assertion: handleDelete called with ID, handleEdit NEVER called
      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledWith(mockParticipations[1].id);
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("SchoolParticipationsTab: Actions cell container absorbs clicks and prevents row trigger", () => {
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
      const actionsWrapper = editBtn.parentElement;
      expect(actionsWrapper).toBeDefined();

      // Click on wrapper between/around buttons
      fireEvent.click(actionsWrapper!);

      // handleEdit must NOT be called from wrapper click
      expect(handleEdit).not.toHaveBeenCalled();
    });

    it("ProgramsCatalogTab: Edit and Delete buttons stop propagation cleanly", () => {
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

      // Alphabetical order: mockPrograms[1] ("ARS...") is index 0, mockPrograms[0] ("Bieg...") is index 1
      // 1. Direct row click invokes handleEdit
      const progRowCell = screen.getByText(mockPrograms[0].name);
      const row = progRowCell.closest("tr");
      fireEvent.click(row!);
      expect(handleEdit).toHaveBeenCalledTimes(1);
      expect(handleEdit).toHaveBeenCalledWith(mockPrograms[0]);

      // 2. Edit button click invokes handleEdit once more (total 2)
      const editButtons = screen.getAllByRole("button", { name: "Edytuj program" });
      fireEvent.click(editButtons[0]);
      expect(handleEdit).toHaveBeenCalledTimes(2);
      expect(handleEdit).toHaveBeenLastCalledWith(mockPrograms[1]);

      // 3. Delete button click invokes handleDelete, does NOT invoke handleEdit
      const deleteButtons = screen.getAllByRole("button", { name: "Usuń program" });
      fireEvent.click(deleteButtons[0]);
      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleDelete).toHaveBeenCalledWith(mockPrograms[1].id);
      expect(handleEdit).toHaveBeenCalledTimes(2); // still 2
    });
  });

  // =========================================================================
  // CHALLENGE 4: KEYBOARD ACCESSIBILITY & ARIA ATTRIBUTES
  // =========================================================================
  describe("Challenge 4: Keyboard Accessibility & ARIA Attributes", () => {
    it("Action buttons have descriptive aria-labels and are keyboard-focusable", () => {
      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const editBtn = screen.getAllByRole("button", { name: "Edytuj zgłoszenie" })[0];
      const deleteBtn = screen.getAllByRole("button", { name: "Usuń zgłoszenie" })[0];

      expect(editBtn.getAttribute("aria-label")).toBe("Edytuj zgłoszenie");
      act(() => {
        editBtn.focus();
      });
      expect(document.activeElement).toBe(editBtn);

      act(() => {
        deleteBtn.focus();
      });
      expect(document.activeElement).toBe(deleteBtn);
    });

    it("Search input in SchoolParticipationsFilterBar has aria-label and accessible clear button", () => {
      const handleSearchChange = vi.fn();
      render(
        <SchoolParticipationsFilterBar
          searchQuery="Test"
          onSearchChange={handleSearchChange}
          selectedProgramId="all"
          onProgramChange={vi.fn()}
          selectedSchoolYear="all"
          onSchoolYearChange={vi.fn()}
          selectedMunicipality="all"
          onMunicipalityChange={vi.fn()}
          statusFilter="all"
          onStatusFilterChange={vi.fn()}
          programs={mockPrograms}
          schoolYears={["2025/2026"]}
          municipalities={["Barlinek"]}
          onClearFilters={vi.fn()}
          hasActiveFilters={true}
          activeFiltersCount={1}
        />
      );

      const input = screen.getByLabelText("Szukaj po szkole, gminie, koordynatorze");
      expect(input).toBeDefined();

      const clearSearchBtn = screen.getByLabelText("Wyczyść wyszukiwanie");
      expect(clearSearchBtn).toBeDefined();
      fireEvent.click(clearSearchBtn);
      expect(handleSearchChange).toHaveBeenCalledWith("");
    });

    it("KPI toggle button in ProgramsViewSwitcher has proper aria-expanded and aria-label", () => {
      const handleToggle = vi.fn();
      const { rerender } = render(
        <ProgramsViewSwitcher
          activeTab="schools"
          onTabChange={vi.fn()}
          participationsCount={10}
          programsCount={2}
          onOpenAddParticipation={vi.fn()}
          onOpenAddProgram={vi.fn()}
          isKpiVisible={true}
          onToggleKpi={handleToggle}
        />
      );

      const kpiBtn = screen.getByRole("button", { name: "Zwiń KPI" });
      expect(kpiBtn.getAttribute("aria-expanded")).toBe("true");
      expect(kpiBtn.getAttribute("aria-label")).toBe("Zwiń KPI");

      fireEvent.click(kpiBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);

      rerender(
        <ProgramsViewSwitcher
          activeTab="schools"
          onTabChange={vi.fn()}
          participationsCount={10}
          programsCount={2}
          onOpenAddParticipation={vi.fn()}
          onOpenAddProgram={vi.fn()}
          isKpiVisible={false}
          onToggleKpi={handleToggle}
        />
      );

      const expandedKpiBtn = screen.getByRole("button", { name: "Pokaż KPI" });
      expect(expandedKpiBtn.getAttribute("aria-expanded")).toBe("false");
      expect(expandedKpiBtn.getAttribute("aria-label")).toBe("Pokaż KPI");
    });
  });

  // =========================================================================
  // CHALLENGE 5: MULTI-LINE TEXT WRAPPING & ERGONOMICS
  // =========================================================================
  describe("Challenge 5: Multi-line Wrapping & Layout Ergonomics", () => {
    it("Facility names wrap cleanly on 2 lines with title tooltip and top-aligned icon", () => {
      render(
        <SchoolParticipationsTab
          participations={mockParticipations}
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const longFacilityName = mockParticipations[0].facilityName!;
      const element = screen.getByText(longFacilityName);

      expect(element.className).toContain("line-clamp-2");
      expect(element.className).toContain("break-words");
      expect(element.className).toContain("leading-tight");
      expect(element.className).not.toContain("truncate");
      expect(element.getAttribute("title")).toBe(longFacilityName);

      const flexContainer = element.closest(".flex");
      expect(flexContainer?.className).toContain("items-start");
    });

    it("Program names in ProgramsCatalogTab wrap cleanly on 2 lines with title tooltip", () => {
      render(
        <ProgramsCatalogTab
          programs={mockPrograms}
          onOpenAdd={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const longProgramName = mockPrograms[0].name;
      const element = screen.getByText(longProgramName);

      expect(element.className).toContain("line-clamp-2");
      expect(element.className).toContain("break-words");
      expect(element.className).toContain("leading-tight");
      expect(element.className).not.toContain("truncate");
      expect(element.getAttribute("title")).toBe(longProgramName);
    });
  });

  // =========================================================================
  // CHALLENGE 6: STORAGE RESILIENCE & FAILURE MODES
  // =========================================================================
  describe("Challenge 6: LocalStorage Resilience & Failure Modes", () => {
    it("ProgramsSection persists KPI collapse state across re-renders in localStorage", () => {
      render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);

      // Initial: KPI is visible
      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();

      // Click collapse
      const collapseBtn = screen.getByRole("button", { name: "Zwiń KPI" });
      fireEvent.click(collapseBtn);

      expect(screen.queryByText("Programy Profilaktyczne")).toBeNull();
      expect(localStorage.getItem("oz.programsShowKpiSummary")).toBe("false");

      // Click expand
      const expandBtn = screen.getByRole("button", { name: "Pokaż KPI" });
      fireEvent.click(expandBtn);

      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();
      expect(localStorage.getItem("oz.programsShowKpiSummary")).toBe("true");
    });

    it("ProgramsSection survives when localStorage throws SecurityError or QuotaExceededError", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Quota exceeded.", "QuotaExceededError");
      });

      // Mount should NOT throw
      expect(() => {
        render(<ProgramsSection programs={mockPrograms} participations={mockParticipations} />);
      }).not.toThrow();

      expect(screen.getByText("Programy Profilaktyczne")).toBeDefined();

      // Toggle should NOT throw
      const collapseBtn = screen.getByRole("button", { name: "Zwiń KPI" });
      expect(() => {
        fireEvent.click(collapseBtn);
      }).not.toThrow();

      // KPI successfully collapsed in memory
      expect(screen.queryByText("Programy Profilaktyczne")).toBeNull();
    });
  });
});
