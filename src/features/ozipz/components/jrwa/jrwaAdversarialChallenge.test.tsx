import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { JrwaCasesTable } from "./components/JrwaCasesTable";
import { JrwaSignGeneratorCard } from "./components/JrwaSignGeneratorCard";
import { JrwaCaseDetailsDialog } from "./JrwaCaseDetailsDialog";
import { JrwaCasesFilterBar } from "./components/JrwaCasesFilterBar";
import { JrwaSection } from "./JrwaSection";
import { ActionsFilterBar } from "../actions/list/ActionsFilterBar";
import { ScheduleFilterBar } from "../schedule/components/ScheduleFilterBar";
import { FacilitiesFilterBar } from "../facilities/components/FacilitiesFilterBar";
import { EMPTY_FACILITY_FILTERS } from "../../utils/facilityUtils";
import { ReportFilterBar } from "../reports/components/ReportFilterBar";
import type { OzipzJrwaCase, OzipzAction } from "../../types/ozipz.types";

describe("Challenger 2 — Adversarial Stress Test Suite", () => {
  const originalClipboard = { ...navigator.clipboard };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  const sampleCase: OzipzJrwaCase = {
    id: "case-adv-1",
    section: "PSSE.OZiPZ",
    jrwaSymbol: "9011",
    caseNumber: 42,
    year: 2026,
    fullCaseSign: "PSSE.OZiPZ.9011.42.2026",
    title: "Akcja Edukacyjna z Bardzo Długim Tytułem dla Placówki Szkolnej",
    assignedEducator: "Referent Do Testów",
    status: "w_toku",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  };

  /* =====================================================================
   * Challenge 1: JRWA Case Sign Copying across Table, Dialog, Generator
   * ===================================================================== */
  describe("Challenge 1: JRWA Case Sign Copying", () => {
    it("Table: clicking copy button copies sign and does NOT trigger onOpenDetails (event stopPropagation)", () => {
      const handleCopySign = vi.fn();
      const handleOpenDetails = vi.fn();

      render(
        <JrwaCasesTable
          cases={[sampleCase]}
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
      fireEvent.click(copyBtn);

      expect(handleCopySign).toHaveBeenCalledTimes(1);
      expect(handleCopySign).toHaveBeenCalledWith("case-adv-1", "PSSE.OZiPZ.9011.42.2026");
      expect(handleOpenDetails).not.toHaveBeenCalled();
    });

    it("Table: visual checkmark appears when copiedId matches case ID and reverts", () => {
      const { rerender } = render(
        <JrwaCasesTable
          cases={[sampleCase]}
          copiedId={null}
          onCopySign={vi.fn()}
          onOpenDetails={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const copyBtn = screen.getByTitle("Kopiuj pełny znak sprawy do schowka");
      expect(copyBtn.querySelector(".lucide-copy")).not.toBeNull();
      expect(copyBtn.querySelector(".lucide-check")).toBeNull();

      // Rerender with copiedId
      rerender(
        <JrwaCasesTable
          cases={[sampleCase]}
          copiedId="case-adv-1"
          onCopySign={vi.fn()}
          onOpenDetails={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      expect(copyBtn.querySelector(".lucide-check")).not.toBeNull();
      expect(copyBtn.querySelector(".lucide-copy")).toBeNull();
    });

    it("Dialog: clicking handleCopySign writes to clipboard, sets visual confirmation, and reverts after timeout", () => {
      render(
        <JrwaCaseDetailsDialog
          isOpen={true}
          onClose={vi.fn()}
          jrwaCase={sampleCase}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          actions={[]}
        />
      );

      const copyBtn = screen.getByRole("button", { name: /Kopiuj Znak/i });
      expect(screen.getByText("Kopiuj Znak")).toBeDefined();

      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("PSSE.OZiPZ.9011.42.2026");
      expect(screen.getByText("Skopiowano!")).toBeDefined();

      // Advance timers by 2000ms
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Kopiuj Znak")).toBeDefined();
    });

    it("Generator Card: copies sign when present and displays visual confirmation", () => {
      render(
        <JrwaSignGeneratorCard
          section="PSSE.OZiPZ"
          onSectionChange={vi.fn()}
          jrwaSymbol="9011"
          onJrwaSymbolChange={vi.fn()}
          caseNumber={5}
          onCaseNumberChange={vi.fn()}
          year={2026}
          onYearChange={vi.fn()}
          fullCaseSign="PSSE.OZiPZ.9011.5.2026"
          jrwaDictItems={[]}
          onSelectQuickSymbol={vi.fn()}
        />
      );

      const copyBtn = screen.getByTitle("Kopiuj pełny znak sprawy do schowka");
      expect(screen.getByText("Kopiuj")).toBeDefined();

      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("PSSE.OZiPZ.9011.5.2026");
      expect(screen.getByText("Skopiowano")).toBeDefined();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Kopiuj")).toBeDefined();
    });

    it("Adversarial: Generator Card with empty sign disables copy button and does NOT invoke writeText", () => {
      render(
        <JrwaSignGeneratorCard
          section="PSSE.OZiPZ"
          onSectionChange={vi.fn()}
          jrwaSymbol=""
          onJrwaSymbolChange={vi.fn()}
          caseNumber={1}
          onCaseNumberChange={vi.fn()}
          year={2026}
          onYearChange={vi.fn()}
          fullCaseSign=""
          jrwaDictItems={[]}
          onSelectQuickSymbol={vi.fn()}
        />
      );

      const copyBtn = screen.getByTitle("Kopiuj pełny znak sprawy do schowka") as HTMLButtonElement;
      expect(copyBtn.disabled).toBe(true);

      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it("Adversarial: clipboard undefined (insecure context) does NOT crash dialog or generator", () => {
      // simulate missing navigator.clipboard
      (navigator as any).clipboard = undefined;

      // In Dialog
      render(
        <JrwaCaseDetailsDialog
          isOpen={true}
          onClose={vi.fn()}
          jrwaCase={sampleCase}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          actions={[]}
        />
      );

      const dialogCopyBtn = screen.getByRole("button", { name: /Kopiuj Znak/i });
      expect(() => fireEvent.click(dialogCopyBtn)).not.toThrow();
      expect(screen.getByText("Skopiowano!")).toBeDefined();

      // In Generator
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

      const genCopyBtn = screen.getAllByTitle("Kopiuj pełny znak sprawy do schowka")[0];
      expect(() => fireEvent.click(genCopyBtn)).not.toThrow();
    });
  });

  /* =====================================================================
   * Challenge 2: EZD Status Calculations and "! Wymaga EZD" Alert Badges
   * ===================================================================== */
  describe("Challenge 2: EZD Status Calculations and Alerts", () => {
    it("JrwaSection: correctly computes pendingEzd when action has ezdStatus: 'do_ezd'", () => {
      const actWithDoEzd: OzipzAction = {
        id: "act-do-ezd",
        title: "Działanie wymagające EZD",
        actionType: "Prelekcja",
        date: "2026-03-01",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: "do_ezd",
        status: "wykonane",
        participantsCount: 20,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-01",
        updatedAt: "2026-03-01",
      };

      render(
        <JrwaSection
          cases={[sampleCase]}
          actions={[actWithDoEzd]}
          dictionaryItems={[]}
          staff={[]}
        />
      );

      // Should render the alert badge in the table
      const badge = screen.getByText("! Wymaga EZD (1)");
      expect(badge).toBeDefined();
      expect(badge.className).toContain("text-destructive");
      expect(badge.className).toContain("bg-destructive/10");
    });

    it("JrwaSection: correctly computes pendingEzd when action LACKS ezdStatus (undefined/empty) and is not 'Publikacja media'", () => {
      const actLackingEzd: OzipzAction = {
        id: "act-no-ezd-status",
        title: "Działanie bez przypisanego statusu EZD",
        actionType: "Warsztaty",
        date: "2026-03-02",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: undefined as any, // Missing
        status: "wykonane",
        participantsCount: 25,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-02",
        updatedAt: "2026-03-02",
      };

      render(
        <JrwaSection
          cases={[sampleCase]}
          actions={[actLackingEzd]}
          dictionaryItems={[]}
          staff={[]}
        />
      );

      // Must be counted as pending EZD because regular educational activities require EZD entry
      const badge = screen.getByText("! Wymaga EZD (1)");
      expect(badge).toBeDefined();
    });

    it("JrwaSection: does NOT increment pendingEzd if action lacking ezdStatus is 'Publikacja media'", () => {
      const pubAction: OzipzAction = {
        id: "act-pub",
        title: "Post w social mediach",
        actionType: "Publikacja media",
        date: "2026-03-03",
        facilityName: "Media",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Społeczność lokalna",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: undefined as any, // Missing but media publication doesn't require EZD
        status: "wykonane",
        participantsCount: 0,
        indirectRecipientsCount: 500,
        materialsDistributedCount: 0,
        createdAt: "2026-03-03",
        updatedAt: "2026-03-03",
      };

      render(
        <JrwaSection
          cases={[sampleCase]}
          actions={[pubAction]}
          dictionaryItems={[]}
          staff={[]}
        />
      );

      // Should show 'w EZD (1)' because total=1 and pendingEzd=0
      expect(screen.getByText("w EZD (1)")).toBeDefined();
      expect(screen.queryByText(/! Wymaga EZD \(/)).toBeNull();
    });

    it("JrwaSection: filter chip '! Wymaga EZD' isolates only cases requiring EZD registration", () => {
      const caseWithEzdOk: OzipzJrwaCase = {
        ...sampleCase,
        id: "case-ok",
        fullCaseSign: "PSSE.OZiPZ.9011.99.2026",
        title: "Sprawa w Pełni w EZD",
      };

      const actOk: OzipzAction = {
        id: "act-ok",
        title: "Zarejestrowane działanie",
        actionType: "Prelekcja",
        date: "2026-03-04",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: "case-ok",
        jrwaSign: "PSSE.OZiPZ.9011.99.2026",
        ezdStatus: "w_ezd",
        status: "wykonane",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-04",
        updatedAt: "2026-03-04",
      };

      const actPending: OzipzAction = {
        id: "act-pending",
        title: "Niezarejestrowane działanie",
        actionType: "Prelekcja",
        date: "2026-03-04",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: "do_ezd",
        status: "wykonane",
        participantsCount: 30,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-04",
        updatedAt: "2026-03-04",
      };

      render(
        <JrwaSection
          cases={[sampleCase, caseWithEzdOk]}
          actions={[actPending, actOk]}
          dictionaryItems={[]}
          staff={[]}
        />
      );

      expect(screen.getByText("Akcja Edukacyjna z Bardzo Długim Tytułem dla Placówki Szkolnej")).toBeDefined();
      expect(screen.getByText("Sprawa w Pełni w EZD")).toBeDefined();

      const ezdFilterChip = screen.getByRole("button", { name: "! Wymaga EZD" });
      fireEvent.click(ezdFilterChip);

      // Only sampleCase has pending EZD
      expect(screen.getByText("Akcja Edukacyjna z Bardzo Długim Tytułem dla Placówki Szkolnej")).toBeDefined();
      expect(screen.queryByText("Sprawa w Pełni w EZD")).toBeNull();
    });
  });

  /* =====================================================================
   * Challenge 3: Filter Bar Token Consistency & Active State Palette
   * ===================================================================== */
  describe("Challenge 3: Filter Bar Token Consistency", () => {
    it("ActionsFilterBar: '! Wymaga EZD' uses destructive tokens; standard active filters use primary tokens", () => {
      const { rerender } = render(
        <ActionsFilterBar
          search=""
          onSearchChange={vi.fn()}
          selectedMonth=""
          onMonthChange={vi.fn()}
          statusFilter="wszystkie"
          onStatusFilterChange={vi.fn()}
          quickFilterEzd={true}
          onToggleEzd={vi.fn()}
          quickFilterProgramOnly={false}
          onToggleProgramOnly={vi.fn()}
          quickFilterInProgress={false}
          onToggleInProgress={vi.fn()}
          materialsOnlyFilter={false}
          onToggleMaterialsOnly={vi.fn()}
          publicationsMode="ukryte"
          onPublicationsModeChange={vi.fn()}
          isAdvancedOpen={false}
          onToggleAdvanced={vi.fn()}
          advancedFiltersCount={0}
        />
      );

      const ezdBtn = screen.getByRole("button", { name: "! Wymaga EZD" });
      // Verify destructive tokens
      expect(ezdBtn.className).toContain("bg-destructive");
      expect(ezdBtn.className).toContain("text-destructive-foreground");
      expect(ezdBtn.className).toContain("border-destructive");

      // Verify standard inactive filter uses muted styling
      const programBtn = screen.getByRole("button", { name: "Tylko programowe" });
      expect(programBtn.className).toContain("bg-muted/40");
      expect(programBtn.className).toContain("text-muted-foreground");

      // Now rerender with standard filter active
      rerender(
        <ActionsFilterBar
          search=""
          onSearchChange={vi.fn()}
          selectedMonth=""
          onMonthChange={vi.fn()}
          statusFilter="wszystkie"
          onStatusFilterChange={vi.fn()}
          quickFilterEzd={false}
          onToggleEzd={vi.fn()}
          quickFilterProgramOnly={true}
          onToggleProgramOnly={vi.fn()}
          quickFilterInProgress={false}
          onToggleInProgress={vi.fn()}
          materialsOnlyFilter={false}
          onToggleMaterialsOnly={vi.fn()}
          publicationsMode="ukryte"
          onPublicationsModeChange={vi.fn()}
          isAdvancedOpen={false}
          onToggleAdvanced={vi.fn()}
          advancedFiltersCount={0}
        />
      );

      // Now programBtn should use primary tokens
      expect(programBtn.className).toContain("bg-primary");
      expect(programBtn.className).toContain("text-primary-foreground");
      expect(programBtn.className).toContain("border-primary");

      // And ezdBtn should be muted
      expect(ezdBtn.className).toContain("bg-muted/40");
      expect(ezdBtn.className).toContain("text-muted-foreground");
    });

    it("JrwaCasesFilterBar: '! Wymaga EZD' uses destructive tokens; standard active filters use primary tokens", () => {
      const { rerender } = render(
        <JrwaCasesFilterBar
          search=""
          onSearchChange={vi.fn()}
          selectedSymbol="all"
          onSymbolChange={vi.fn()}
          selectedYear="all"
          onYearChange={vi.fn()}
          selectedStatus="w_toku"
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
          activeFiltersCount={1}
          activeQuickFilter="w_toku"
          onQuickFilterChange={vi.fn()}
          requiresEzdFilter={false}
          onToggleRequiresEzd={vi.fn()}
        />
      );

      const inProgressBtn = screen.getByRole("button", { name: "W toku" });
      expect(inProgressBtn.className).toContain("bg-primary");
      expect(inProgressBtn.className).toContain("text-primary-foreground");
      expect(inProgressBtn.className).toContain("border-primary");

      const ezdBtn = screen.getByRole("button", { name: "! Wymaga EZD" });
      expect(ezdBtn.className).toContain("bg-muted/40");
      expect(ezdBtn.className).toContain("text-muted-foreground");

      // Toggle requiresEzdFilter to true
      rerender(
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
          activeFiltersCount={1}
          activeQuickFilter="all"
          onQuickFilterChange={vi.fn()}
          requiresEzdFilter={true}
          onToggleRequiresEzd={vi.fn()}
        />
      );

      expect(ezdBtn.className).toContain("bg-destructive");
      expect(ezdBtn.className).toContain("text-destructive-foreground");
      expect(ezdBtn.className).toContain("border-destructive");
    });

    it("ScheduleFilterBar: active month button uses primary tokens; inactive uses muted tokens", () => {
      render(
        <ScheduleFilterBar
          search=""
          onSearchChange={vi.fn()}
          selectedYear={2026}
          availableYears={[2026]}
          onSelectYear={vi.fn()}
          currentMonth={9}
          selectedMonth={3}
          onSelectMonth={vi.fn()}
          filterType="all"
          onFilterTypeChange={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
          viewMode="table"
          onViewModeChange={vi.fn()}
          onOpenCopyPlan={vi.fn()}
        />
      );

      // Month 3 is "Mar"
      const marBtn = screen.getByRole("button", { name: /Mar/i });
      expect(marBtn.className).toContain("bg-primary");
      expect(marBtn.className).toContain("text-primary-foreground");
      expect(marBtn.className).toContain("border-primary");

      // Month 1 is "Sty"
      const styBtn = screen.getByRole("button", { name: /Sty/i });
      expect(styBtn.className).toContain("bg-muted/40");
      expect(styBtn.className).toContain("text-muted-foreground");
    });

    it("FacilitiesFilterBar: active quick filter chip uses primary tokens; inactive uses muted tokens", () => {
      render(
        <FacilitiesFilterBar
          filters={{ ...EMPTY_FACILITY_FILTERS, structure: "complex" }}
          onFiltersChange={vi.fn()}
          onClearFilters={vi.fn()}
          activeFiltersCount={1}
          resultsCount={0}
          typeOptions={[]}
          municipalityOptions={[]}
          issuesCount={0}
          onOpenEmailsCopy={vi.fn()}
          onOpenAdd={vi.fn()}
        />
      );

      const complexBtn = screen.getByRole("button", { name: "Zespoły szkół" });
      expect(complexBtn.className).toContain("bg-primary");
      expect(complexBtn.className).toContain("text-primary-foreground");
      expect(complexBtn.className).toContain("border-primary");

      const allBtn = screen.getByRole("button", { name: "Wszystkie placówki" });
      expect(allBtn.className).toContain("bg-muted/40");
      expect(allBtn.className).toContain("text-muted-foreground");
    });

    it("ReportFilterBar: active view mode and presets use primary tokens; inactive use muted/card tokens", () => {
      render(
        <ReportFilterBar
          reportMode="miernik"
          onReportModeChange={vi.fn()}
          months={[1, 2, 3]}
          onMonthsChange={vi.fn()}
        />
      );

      const activeViewBtn = screen.getByRole("button", { name: "Wykonanie miernika" });
      expect(activeViewBtn.getAttribute("aria-pressed")).toBe("true");
      expect(activeViewBtn.className).toContain("font-semibold");

      const inactiveViewBtn = screen.getByRole("button", { name: "Wszystkie działania" });
      expect(inactiveViewBtn.className).toContain("text-muted-foreground");

      // Q1 preset [1, 2, 3] matches months
      const q1Btn = screen.getByRole("button", { name: "I Kwartał" });
      expect(q1Btn.className).toContain("bg-primary");
      expect(q1Btn.className).toContain("text-primary-foreground");

      // Q2 preset [4, 5, 6] does not match
      const q2Btn = screen.getByRole("button", { name: "II Kwartał" });
      expect(q2Btn.className).toContain("bg-muted/40");
      expect(q2Btn.className).toContain("text-muted-foreground");
    });
  });

  /* =====================================================================
   * Challenge 4: Deep Adversarial Edge Cases & Structural Resiliency
   * ===================================================================== */
  describe("Challenge 4: Edge Cases & Structural Resiliency", () => {
    it("JrwaCasesTable: gracefully handles undefined or missing ezdStatusMap", () => {
      render(
        <JrwaCasesTable
          cases={[sampleCase]}
          copiedId={null}
          onCopySign={vi.fn()}
          onOpenDetails={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
          ezdStatusMap={undefined}
        />
      );

      // When ezdStatusMap is undefined, should display 'Brak pism'
      expect(screen.getByText("Brak pism")).toBeDefined();
    });

    it("JrwaCaseDetailsDialog: renders 'Wymaga wpisu do EZD' header badge and '! Do EZD' when actions require EZD", () => {
      const act1: OzipzAction = {
        id: "act-1",
        title: "Działanie w toku",
        actionType: "Prelekcja",
        date: "2026-03-01",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: "do_ezd",
        status: "wykonane",
        participantsCount: 15,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-01",
        updatedAt: "2026-03-01",
      };

      const act2: OzipzAction = {
        id: "act-2",
        title: "Działanie zakończone",
        actionType: "Prelekcja",
        date: "2026-03-02",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: "w_ezd",
        status: "wykonane",
        participantsCount: 20,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-02",
        updatedAt: "2026-03-02",
      };

      render(
        <JrwaCaseDetailsDialog
          isOpen={true}
          onClose={vi.fn()}
          jrwaCase={sampleCase}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          actions={[act1, act2]}
        />
      );

      // Related actions section
      expect(screen.getByText("Powiązane Działania Edukacyjne (2)")).toBeDefined();
      expect(screen.getByText("Wymaga wpisu do EZD")).toBeDefined();
      expect(screen.getByText("! Do EZD")).toBeDefined();
      expect(screen.getByText("w EZD")).toBeDefined();
    });

    it("JrwaCaseDetailsDialog: renders 'Wszystkie w EZD' when all actions are completed in EZD", () => {
      const actOk: OzipzAction = {
        id: "act-ok",
        title: "Działanie zarejestrowane",
        actionType: "Prelekcja",
        date: "2026-03-01",
        facilityName: "Szkoła Podstawowa",
        municipality: "Myślibórz",
        topic: "Zdrowie",
        audienceGroup: "Dzieci",
        leadEducator: "Jan Nowak",
        jrwaCaseId: sampleCase.id,
        jrwaSign: sampleCase.fullCaseSign,
        ezdStatus: "w_ezd",
        status: "wykonane",
        participantsCount: 15,
        indirectRecipientsCount: 0,
        materialsDistributedCount: 0,
        createdAt: "2026-03-01",
        updatedAt: "2026-03-01",
      };

      render(
        <JrwaCaseDetailsDialog
          isOpen={true}
          onClose={vi.fn()}
          jrwaCase={sampleCase}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          actions={[actOk]}
        />
      );

      expect(screen.getByText("Powiązane Działania Edukacyjne (1)")).toBeDefined();
      expect(screen.getByText("Wszystkie w EZD")).toBeDefined();
    });

    it("JrwaSection: KPI summary toggle respects and persists state to localStorage", () => {
      render(
        <JrwaSection
          cases={[sampleCase]}
          actions={[]}
          dictionaryItems={[]}
          staff={[]}
        />
      );

      // Initially open
      expect(screen.getByText("Wszystkie Sprawy")).toBeDefined();
      const toggleBtn = screen.getByRole("button", { name: /Zwiń KPI/i });

      // Click to collapse
      fireEvent.click(toggleBtn);
      expect(screen.queryByText("Wszystkie Sprawy")).toBeNull();
      expect(localStorage.getItem("oz.jrwaShowKpiSummary")).toBe("false");

      // Click to re-expand
      const expandBtn = screen.getByRole("button", { name: /Pokaż KPI/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Sprawy")).toBeDefined();
      expect(localStorage.getItem("oz.jrwaShowKpiSummary")).toBe("true");
    });
  });
});
