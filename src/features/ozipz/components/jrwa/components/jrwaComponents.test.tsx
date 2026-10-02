import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JrwaStatsHeader } from "./JrwaStatsHeader";
import { JrwaCasesFilterBar } from "./JrwaCasesFilterBar";
import { JrwaKnowledgeGuide } from "./JrwaKnowledgeGuide";
import { JrwaCasesTable } from "./JrwaCasesTable";
import { JrwaSignGeneratorCard } from "./JrwaSignGeneratorCard";
import { JrwaCaseDetailsDialog } from "../JrwaCaseDetailsDialog";
import { JrwaSection } from "../JrwaSection";
import type { OzipzJrwaCase, OzipzAction } from "../../../types/ozipz.types";

describe("JRWA Module Components", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    localStorage.clear();
  });

  const mockCases: OzipzJrwaCase[] = [
    {
      id: "case-1",
      section: "PSSE.OZiPZ",
      jrwaSymbol: "9011",
      caseNumber: 1,
      year: 2026,
      fullCaseSign: "PSSE.OZiPZ.9011.1.2026",
      title: "Bieg po zdrowie edycja 2026",
      assignedEducator: "Jan Nowak",
      status: "w_toku",
      createdAt: "2026-01-10",
      updatedAt: "2026-01-10",
    },
    {
      id: "case-2",
      section: "PSSE.OZiPZ",
      jrwaSymbol: "9011",
      caseNumber: 2,
      year: 2026,
      fullCaseSign: "PSSE.OZiPZ.9011.2.2026",
      title: "Czyste powietrze wokół nas",
      assignedEducator: "Anna Kowalska",
      status: "zakonczona",
      createdAt: "2026-01-15",
      updatedAt: "2026-01-20",
    },
    {
      id: "case-3",
      section: "PSSE.OZiPZ",
      jrwaSymbol: "9010",
      caseNumber: 1,
      year: 2026,
      fullCaseSign: "PSSE.OZiPZ.9010.1.2026",
      title: "Sprawa bez pism i działań",
      assignedEducator: "Jan Nowak",
      status: "w_toku",
      createdAt: "2026-01-18",
      updatedAt: "2026-01-18",
    },
  ];

  const mockActions: OzipzAction[] = [
    {
      id: "act-1",
      title: "Prelekcja dla klas I-III",
      actionType: "Prelekcja",
      date: "2026-02-10",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      topic: "",
      audienceGroup: "Dzieci w wieku przedszkolnym i wczesnoszkolnym",
      leadEducator: "Jan Nowak",
      jrwaCaseId: "case-1",
      jrwaSign: "PSSE.OZiPZ.9011.1.2026",
      ezdStatus: "do_ezd",
      status: "wykonane",
      participantsCount: 45,
      materialsDistributedCount: 0,
      createdAt: "2026-02-10",
      updatedAt: "2026-02-10",
    },
    {
      id: "act-2",
      title: "Warsztat antytytoniowy",
      actionType: "Warsztat",
      date: "2026-02-15",
      facilityName: "Przedszkole Miejskie",
      municipality: "Barlinek",
      topic: "",
      audienceGroup: "Dzieci w wieku przedszkolnym i wczesnoszkolnym",
      leadEducator: "Anna Kowalska",
      jrwaCaseId: "case-2",
      jrwaSign: "PSSE.OZiPZ.9011.2.2026",
      ezdStatus: "w_ezd",
      status: "wykonane",
      participantsCount: 30,
      materialsDistributedCount: 0,
      createdAt: "2026-02-15",
      updatedAt: "2026-02-15",
    },
  ];

  it("renders JrwaStatsHeader with correct metrics", () => {
    render(
      <JrwaStatsHeader
        totalCases={18}
        inProgressCases={12}
        completedCases={6}
        distinctSymbolsCount={5}
      />
    );

    expect(screen.getByText("Wszystkie Sprawy")).toBeDefined();
    expect(screen.getByText("18")).toBeDefined();
    expect(screen.getByText("W Toku")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("Zakończone")).toBeDefined();
    expect(screen.getByText("6")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("renders JrwaCasesFilterBar and handles search, guide toggle and add", () => {
    const handleSearch = vi.fn();
    const handleToggleGuide = vi.fn();
    const handleAdd = vi.fn();

    render(
      <JrwaCasesFilterBar
        search="bezpieczne"
        onSearchChange={handleSearch}
        selectedSymbol="all"
        onSymbolChange={vi.fn()}
        selectedYear="all"
        onYearChange={vi.fn()}
        selectedStatus="all"
        onStatusChange={vi.fn()}
        selectedEducator="all"
        onEducatorChange={vi.fn()}
        availableYears={[2026, 2025]}
        jrwaDictItems={[]}
        staff={[]}
        isGuideOpen={false}
        onToggleGuide={handleToggleGuide}
        onOpenAdd={handleAdd}
        onClearFilters={vi.fn()}
        activeFiltersCount={1}
      />
    );

    const guideBtn = screen.getByText("Wykaz JRWA");
    fireEvent.click(guideBtn);
    expect(handleToggleGuide).toHaveBeenCalled();

    const addBtn = screen.getByText("Nowa Sprawa");
    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalled();
  });

  it("renders JrwaKnowledgeGuide with JRWA classification items", () => {
    render(<JrwaKnowledgeGuide />);
    expect(screen.getByText("9010")).toBeDefined();
    expect(screen.getByText("9011")).toBeDefined();
    expect(screen.getByText("9013")).toBeDefined();
    expect(screen.getByText("9020")).toBeDefined();
  });

  it("renders JrwaCasesTable with cases and handles details click", () => {
    const handleDetails = vi.fn();

    render(
      <JrwaCasesTable
        cases={mockCases}
        copiedId={null}
        onCopySign={vi.fn()}
        onOpenDetails={handleDetails}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    expect(screen.getByText("PSSE.OZiPZ.9011.1.2026")).toBeDefined();
    expect(screen.getByText("Bieg po zdrowie edycja 2026")).toBeDefined();
  });

  it("triggers onOpenDetails when table row is clicked directly", () => {
    const handleOpenDetails = vi.fn();

    render(
      <JrwaCasesTable
        cases={[mockCases[0]]}
        copiedId={null}
        onCopySign={vi.fn()}
        onOpenDetails={handleOpenDetails}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    const titleElement = screen.getByText("Bieg po zdrowie edycja 2026");
    fireEvent.click(titleElement);
    expect(handleOpenDetails).toHaveBeenCalledTimes(1);
    expect(handleOpenDetails).toHaveBeenCalledWith(mockCases[0]);
  });

  it("stops propagation on action buttons so clicking Edit or Delete does NOT trigger onOpenDetails", () => {
    const handleOpenDetails = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <JrwaCasesTable
        cases={[mockCases[0]]}
        copiedId={null}
        onCopySign={vi.fn()}
        onOpenDetails={handleOpenDetails}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    const editBtn = screen.getByRole("button", { name: "Edytuj sprawę" });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockCases[0]);
    expect(handleOpenDetails).not.toHaveBeenCalled();

    const deleteBtn = screen.getByRole("button", { name: "Usuń sprawę" });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockCases[0].id);
    expect(handleOpenDetails).not.toHaveBeenCalled();
  });

  it("handles case sign copying with visual Checkmark confirmation", () => {
    const handleCopySign = vi.fn();
    const handleOpenDetails = vi.fn();

    const { rerender } = render(
      <JrwaCasesTable
        cases={[mockCases[0]]}
        copiedId={null}
        onCopySign={handleCopySign}
        onOpenDetails={handleOpenDetails}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    const copyBtn = screen.getByTitle("Kopiuj pełny znak sprawy do schowka");
    expect(copyBtn.querySelector("svg.lucide-copy")).toBeDefined();

    fireEvent.click(copyBtn);
    expect(handleCopySign).toHaveBeenCalledWith("case-1", "PSSE.OZiPZ.9011.1.2026");
    expect(handleOpenDetails).not.toHaveBeenCalled();

    // Rerender with copiedId active
    rerender(
      <JrwaCasesTable
        cases={[mockCases[0]]}
        copiedId="case-1"
        onCopySign={handleCopySign}
        onOpenDetails={handleOpenDetails}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    const checkIcon = copyBtn.querySelector("svg.lucide-check");
    expect(checkIcon).toBeDefined();
  });

  it("renders EZD status badges correctly: '! Wymaga EZD', 'w EZD', and 'Brak pism'", () => {
    const ezdStatusMap = new Map<string, { total: number; pendingEzd: number }>();
    ezdStatusMap.set("case-1", { total: 1, pendingEzd: 1 });
    ezdStatusMap.set("case-2", { total: 1, pendingEzd: 0 });
    ezdStatusMap.set("case-3", { total: 0, pendingEzd: 0 });

    render(
      <JrwaCasesTable
        cases={mockCases}
        copiedId={null}
        onCopySign={vi.fn()}
        onOpenDetails={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
        ezdStatusMap={ezdStatusMap}
      />
    );

    expect(screen.getByText("! Wymaga EZD (1)")).toBeDefined();
    expect(screen.getByText("w EZD (1)")).toBeDefined();
    expect(screen.getByText("Brak pism")).toBeDefined();
  });

  it("renders quick filter chips and handles filter changes in JrwaCasesFilterBar", () => {
    const handleQuickFilterChange = vi.fn();
    const handleToggleRequiresEzd = vi.fn();
    const handleToggleKpi = vi.fn();

    render(
      <JrwaCasesFilterBar
        search=""
        onSearchChange={vi.fn()}
        selectedSymbol="all"
        onSymbolChange={vi.fn()}
        selectedYear="all"
        onYearChange={vi.fn()}
        selectedStatus="all"
        onStatusChange={vi.fn()}
        selectedEducator="all"
        onEducatorChange={vi.fn()}
        availableYears={[2026]}
        jrwaDictItems={[]}
        staff={[]}
        isGuideOpen={false}
        onToggleGuide={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        activeFiltersCount={0}
        activeQuickFilter="all"
        onQuickFilterChange={handleQuickFilterChange}
        requiresEzdFilter={false}
        onToggleRequiresEzd={handleToggleRequiresEzd}
        isKpiVisible={true}
        onToggleKpi={handleToggleKpi}
      />
    );

    expect(screen.getByText("Wszystkie sprawy")).toBeDefined();
    expect(screen.getByText("W toku")).toBeDefined();
    expect(screen.getByText("Zakończone")).toBeDefined();
    expect(screen.getByText("! Wymaga EZD")).toBeDefined();
    expect(screen.getByText("Zwiń KPI")).toBeDefined();

    fireEvent.click(screen.getByText("W toku"));
    expect(handleQuickFilterChange).toHaveBeenCalledWith("w_toku");

    fireEvent.click(screen.getByText("Zakończone"));
    expect(handleQuickFilterChange).toHaveBeenCalledWith("zakonczona");

    fireEvent.click(screen.getByText("! Wymaga EZD"));
    expect(handleToggleRequiresEzd).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Zwiń KPI"));
    expect(handleToggleKpi).toHaveBeenCalled();
  });

  it("copies generated sign to clipboard in JrwaSignGeneratorCard", () => {
    render(
      <JrwaSignGeneratorCard
        section="PSSE.OZiPZ"
        onSectionChange={vi.fn()}
        jrwaSymbol="9011"
        onJrwaSymbolChange={vi.fn()}
        caseNumber={1}
        onCaseNumberChange={vi.fn()}
        year={2026}
        onYearChange={vi.fn()}
        fullCaseSign="PSSE.OZiPZ.9011.1.2026"
        jrwaDictItems={[]}
        onSelectQuickSymbol={vi.fn()}
      />
    );

    const copyBtn = screen.getByTitle("Kopiuj pełny znak sprawy do schowka");
    expect(screen.getByText("Kopiuj")).toBeDefined();

    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("PSSE.OZiPZ.9011.1.2026");
    expect(screen.getByText("Skopiowano")).toBeDefined();
  });

  it("copies sign to clipboard with visual confirmation in JrwaCaseDetailsDialog", () => {
    render(
      <JrwaCaseDetailsDialog
        isOpen={true}
        onClose={vi.fn()}
        jrwaCase={mockCases[0]}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        actions={mockActions}
      />
    );

    expect(screen.getByText("Metryka Sprawy i Teczka Aktowa")).toBeDefined();
    expect(screen.getByText("Powiązane Działania Edukacyjne (1)")).toBeDefined();
    expect(screen.getByText("! Do EZD")).toBeDefined();

    const copyBtn = screen.getByText("Kopiuj Znak");
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("PSSE.OZiPZ.9011.1.2026");
    expect(screen.getByText("Skopiowano!")).toBeDefined();
  });

  it("integrates quick filters and collapsible KPI inside JrwaSection", () => {
    render(
      <JrwaSection
        cases={mockCases}
        actions={mockActions}
        dictionaryItems={[]}
        staff={[]}
      />
    );

    // Initial state: KPI visible
    expect(screen.getByText("Wszystkie Sprawy")).toBeDefined();
    expect(screen.getByText("Bieg po zdrowie edycja 2026")).toBeDefined();
    expect(screen.getByText("Czyste powietrze wokół nas")).toBeDefined();

    // Toggle "! Wymaga EZD" quick filter
    const ezdFilterBtn = screen.getByRole("button", { name: "! Wymaga EZD" });
    fireEvent.click(ezdFilterBtn);

    // Only case-1 requires EZD (act-1 has ezdStatus: do_ezd)
    expect(screen.getByText("Bieg po zdrowie edycja 2026")).toBeDefined();
    expect(screen.queryByText("Czyste powietrze wokół nas")).toBeNull();

    // Collapse KPI header
    const toggleKpiBtn = screen.getByText("Zwiń KPI");
    fireEvent.click(toggleKpiBtn);

    // KPI header is hidden
    expect(screen.queryByText("Wszystkie Sprawy")).toBeNull();
    expect(screen.getByText("Pokaż KPI")).toBeDefined();

    // Re-expand KPI header
    fireEvent.click(screen.getByText("Pokaż KPI"));
    expect(screen.getByText("Wszystkie Sprawy")).toBeDefined();
  });
});
