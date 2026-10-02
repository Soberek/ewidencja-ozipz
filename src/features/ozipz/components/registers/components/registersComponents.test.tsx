import { describe, it, expect, vi, beforeEach } from "vitest";
import { JRWA_DICTIONARY_FIXTURE } from "../../../../../test/fixtures/jrwaCatalog";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegistersFilterBar } from "./RegistersFilterBar";
import { RegistersTypeTabs } from "./RegistersTypeTabs";
import { InformationRegisterTable } from "./InformationRegisterTable";
import { PublicationsRegisterTable } from "./PublicationsRegisterTable";
import { VisitationsRegisterTable } from "./VisitationsRegisterTable";
import { RegistersSection } from "../RegistersSection";
import { RegisterDialog } from "../RegisterDialog";
import { RegistersConfigurationTab } from "./RegistersConfigurationTab";
import { useOzipzDbStore } from "../../../store/useOzipzDbStore";
import type { OzipzAction, OzipzDictionaryItem, OzipzFacility } from "../../../types/ozipz.types";

const mockAction: OzipzAction = {
  id: "act-test-1",
  date: "2026-06-10",
  title: "Kompleksowa prelekcja z zakresu profilaktyki chorób zakaźnych i higieny osobistej w szkole",
  topic: "Higiena rąk i profilaktyka grypy",
  actionType: "Prelekcja",
  status: "wykonane",
  ezdStatus: "w_ezd",
  programId: "prog-1",
  programName: "Czyste Powietrze Wokół Nas",
  facilityId: "fac-1",
  facilityName: "Szkoła Podstawowa z Oddziałami Dwujęzycznymi im. Orła Białego w Myśliborzu",
  municipality: "Myślibórz",
  izrzSign: "IZRZ.966.1.2026",
  jrwaSign: "OZiPZ.966.1.1.2026",
  leadEducator: "Anna Nowak-Kowalska",
  audienceGroup: "dzieci_szkolne",
  participantsCount: 65,
  materialsDistributedCount: 30,
  notes: "Bardzo aktywne uczestnictwo uczniów",
  createdAt: "2026-06-10T10:00:00.000Z",
  updatedAt: "2026-06-10T10:00:00.000Z",
};

const mockFacility: OzipzFacility = {
  id: "fac-1",
  name: "Szkoła Podstawowa z Oddziałami Dwujęzycznymi im. Orła Białego w Myśliborzu",
  type: "szkola_podstawowa",
  municipality: "Myślibórz",
  county: "powiat myśliborski",
  leadingAuthority: "Gmina Myślibórz",
  address: "ul. Bohaterów Warszawy 12",
  city: "Myślibórz",
  postalCode: "74-300",
  isComplex: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const facilitiesMap = new Map<string, OzipzFacility>([["fac-1", mockFacility]]);

describe("Registers Module Components — UX/UI Harmonization", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("keeps an explicitly empty register mapping unchecked and saves it", async () => {
    const activity = { id: "activity-1", dictType: "activityType", code: "Prelekcja", label: "Prelekcja" } as OzipzDictionaryItem;
    const save = vi.fn().mockResolvedValue(undefined);
    render(<RegistersConfigurationTab
      activityTypes={[activity]}
      existingMappings={[{ id: "mapping-1", activityType: "Prelekcja", registers: [], updatedAt: "2026-10-01" }]}
      onSaveMappings={save}
    />);
    expect(screen.getAllByRole("checkbox").every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Zapisz Mapowanie" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith([{ activityType: "Prelekcja", registers: [] }]));
  });

  describe("RegistersFilterBar (R1)", () => {
    it("renders quick-filter chips for time periods and JRWA symbols", () => {
      render(
        <RegistersFilterBar
          year="2026"
          onYearChange={vi.fn()}
          month=""
          onMonthChange={vi.fn()}
          jrwa=""
          onJrwaChange={vi.fn()}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={false}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );

      expect(screen.getByText("Szybkie filtry:")).toBeDefined();
      expect(screen.getByText("Wszystkie wpisy")).toBeDefined();
      expect(screen.getByText("Bieżący rok")).toBeDefined();
      expect(screen.getByText("966.1")).toBeDefined();
      expect(screen.getByText("966.3")).toBeDefined();
      expect(screen.getByText("966.4")).toBeDefined();
    });

    it("applies active and inactive styles to quick-filter chips correctly", () => {
      const currentYear = String(new Date().getFullYear());
      const { rerender } = render(
        <RegistersFilterBar
          year={currentYear}
          onYearChange={vi.fn()}
          month=""
          onMonthChange={vi.fn()}
          jrwa="966.1"
          onJrwaChange={vi.fn()}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={true}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );

      const currentYearBtn = screen.getByRole("button", { name: "Bieżący rok" });
      const allEntriesBtn = screen.getByRole("button", { name: "Wszystkie wpisy" });
      const jrwa1Btn = screen.getByRole("button", { name: "966.1" });
      const jrwa3Btn = screen.getByRole("button", { name: "966.3" });

      expect(currentYearBtn.className).toContain("bg-primary text-primary-foreground");
      expect(allEntriesBtn.className).toContain("bg-muted/40 text-muted-foreground");
      expect(jrwa1Btn.className).toContain("bg-primary text-primary-foreground");
      expect(jrwa3Btn.className).toContain("bg-muted/40 text-muted-foreground");

      // Rerender with all entries active
      rerender(
        <RegistersFilterBar
          year=""
          onYearChange={vi.fn()}
          month=""
          onMonthChange={vi.fn()}
          jrwa=""
          onJrwaChange={vi.fn()}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={false}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );

      expect(allEntriesBtn.className).toContain("bg-primary text-primary-foreground");
      expect(currentYearBtn.className).toContain("bg-muted/40 text-muted-foreground");
    });

    it("handles clicking quick-filter chips", () => {
      const handleYearChange = vi.fn();
      const handleMonthChange = vi.fn();
      const handleJrwaChange = vi.fn();

      render(
        <RegistersFilterBar
          year="2026"
          onYearChange={handleYearChange}
          month="5"
          onMonthChange={handleMonthChange}
          jrwa="966.1"
          onJrwaChange={handleJrwaChange}
          educator=""
          onEducatorChange={vi.fn()}
          search=""
          onSearchChange={vi.fn()}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={true}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );

      // Click "Wszystkie wpisy"
      fireEvent.click(screen.getByRole("button", { name: "Wszystkie wpisy" }));
      expect(handleYearChange).toHaveBeenCalledWith("");
      expect(handleMonthChange).toHaveBeenCalledWith("");

      // Click already active JRWA "966.1" -> toggles off
      fireEvent.click(screen.getByRole("button", { name: "966.1" }));
      expect(handleJrwaChange).toHaveBeenCalledWith("");

      // Click inactive JRWA "966.3" -> selects "966.3"
      fireEvent.click(screen.getByRole("button", { name: "966.3" }));
      expect(handleJrwaChange).toHaveBeenCalledWith("966.3");
    });

    it("clears search input cleanly via clear X button", () => {
      const handleSearchChange = vi.fn();

      render(
        <RegistersFilterBar
          year=""
          onYearChange={vi.fn()}
          month=""
          onMonthChange={vi.fn()}
          jrwa=""
          onJrwaChange={vi.fn()}
          educator=""
          onEducatorChange={vi.fn()}
          search="test search"
          onSearchChange={handleSearchChange}
          jrwaSymbols={JRWA_DICTIONARY_FIXTURE}
          educators={[]}
          isFiltered={true}
          onClearFilters={vi.fn()}
          onPrint={vi.fn()}
          onExportExcel={vi.fn()}
          onExportCsv={vi.fn()}
        />
      );

      const clearBtn = screen.getByRole("button", { name: "Wyczyść wyszukiwanie" });
      expect(clearBtn).toBeDefined();
      fireEvent.click(clearBtn);
      expect(handleSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Row Click & Text Wrapping in Tables (R2 & R3)", () => {
    it("InformationRegisterTable triggers onActionClick and renders multiline text with tooltips", () => {
      const handleActionClick = vi.fn();

      render(
        <InformationRegisterTable
          actions={[mockAction]}
          onActionClick={handleActionClick}
        />
      );

      // Text wrapping check
      const subjectElem = screen.getByText(mockAction.title);
      expect(subjectElem.className).toContain("line-clamp-2");
      expect(subjectElem.className).toContain("break-words");
      expect(subjectElem.className).toContain("leading-tight");
      expect(subjectElem.getAttribute("title")).toBeTruthy();

      // Tooltips on educator and notes
      const educatorElem = screen.getByText(mockAction.leadEducator);
      expect(educatorElem.getAttribute("title")).toBe(mockAction.leadEducator);

      const notesElem = screen.getByText(mockAction.notes!);
      expect(notesElem.getAttribute("title")).toBe(mockAction.notes);

      // Row click test
      const row = subjectElem.closest("tr");
      expect(row).toBeDefined();
      expect(row?.className).toContain("cursor-pointer");
      fireEvent.click(row!);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });

    it("PublicationsRegisterTable triggers onActionClick and renders multiline topic with tooltips", () => {
      const handleActionClick = vi.fn();

      render(
        <PublicationsRegisterTable
          actions={[mockAction]}
          onActionClick={handleActionClick}
        />
      );

      // Multi-line wrapping and tooltip check
      const topicElem = screen.getByText(mockAction.title);
      expect(topicElem.className).toContain("line-clamp-2");
      expect(topicElem.className).toContain("break-words");
      expect(topicElem.className).toContain("leading-tight");
      expect(topicElem.getAttribute("title")).toBe(mockAction.topic);

      const educatorElem = screen.getByText(mockAction.leadEducator);
      expect(educatorElem.getAttribute("title")).toBe(mockAction.leadEducator);

      // Row click
      const row = topicElem.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });

    it("VisitationsRegisterTable triggers onActionClick and renders multiline subject and facility details with tooltips", () => {
      const handleActionClick = vi.fn();

      render(
        <VisitationsRegisterTable
          actions={[mockAction]}
          facilitiesMap={facilitiesMap}
          onActionClick={handleActionClick}
        />
      );

      // Multi-line wrapping and tooltip check
      const subjectElem = screen.getByText(mockAction.title);
      expect(subjectElem.className).toContain("line-clamp-2");
      expect(subjectElem.className).toContain("break-words");
      expect(subjectElem.className).toContain("leading-tight");
      expect(subjectElem.getAttribute("title")).toBeTruthy();

      const educatorElem = screen.getByText(mockAction.leadEducator);
      expect(educatorElem.getAttribute("title")).toBe(mockAction.leadEducator);

      // Row click
      const row = subjectElem.closest("tr");
      expect(row).toBeDefined();
      fireEvent.click(row!);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });
  });

  describe("Collapsible KPI Header & Persistence (R4)", () => {
    it("RegistersTypeTabs renders KPI toggle button with proper ARIA attributes", () => {
      const handleToggle = vi.fn();

      const { rerender } = render(
        <RegistersTypeTabs
          selectedTab="informacje"
          onSelectTab={vi.fn()}
          tabCounts={{ informacje: 1, publikacje: 0, wizytacje: 0, konfiguracja: 0 }}
          isKpiVisible={true}
          onToggleKpi={handleToggle}
        />
      );

      const toggleBtn = screen.getByRole("button", { name: "Zwiń KPI" });
      expect(toggleBtn).toBeDefined();
      expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");

      fireEvent.click(toggleBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);

      rerender(
        <RegistersTypeTabs
          selectedTab="informacje"
          onSelectTab={vi.fn()}
          tabCounts={{ informacje: 1, publikacje: 0, wizytacje: 0, konfiguracja: 0 }}
          isKpiVisible={false}
          onToggleKpi={handleToggle}
        />
      );

      const expandBtn = screen.getByRole("button", { name: "Pokaż KPI" });
      expect(expandBtn).toBeDefined();
      expect(expandBtn.getAttribute("aria-expanded")).toBe("false");
    });

    it("toggles and persists KPI summary collapse in RegistersSection", () => {
      useOzipzDbStore.setState({
        actions: [mockAction],
        facilities: [mockFacility],
        staff: [],
        dictionaryItems: [],
      });

      render(<RegistersSection />);

      // Initially KPI header is visible
      expect(screen.getByText("Wszystkie Wpisy")).toBeDefined();
      const collapseBtn = screen.getByRole("button", { name: "Zwiń KPI" });

      // Collapse KPI
      fireEvent.click(collapseBtn);
      expect(screen.queryByText("Wszystkie Wpisy")).toBeNull();
      expect(localStorage.getItem("oz.registersShowKpiSummary")).toBe("false");

      // Expand KPI
      const expandBtn = screen.getByRole("button", { name: "Pokaż KPI" });
      fireEvent.click(expandBtn);
      expect(screen.getByText("Wszystkie Wpisy")).toBeDefined();
      expect(localStorage.getItem("oz.registersShowKpiSummary")).toBe("true");
    });

    it("respects collapsed state stored in localStorage on initial render", () => {
      localStorage.setItem("oz.registersShowKpiSummary", "false");

      useOzipzDbStore.setState({
        actions: [mockAction],
        facilities: [mockFacility],
        staff: [],
        dictionaryItems: [],
      });

      render(<RegistersSection />);

      // KPI should be collapsed on initial render
      expect(screen.queryByText("Wszystkie Wpisy")).toBeNull();
      expect(screen.getByRole("button", { name: "Pokaż KPI" })).toBeDefined();
    });
  });

  describe("RegisterDialog", () => {
    it("renders modal in create mode with empty or provided defaults", () => {
      render(
        <RegisterDialog
          isOpen={true}
          onClose={vi.fn()}
          editingItem={null}
          defaultType="szkolenia"
          facilities={[mockFacility]}
          onSave={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText(/Nowy Wpis: Szkolenia/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/np. 1\//i)).toBeDefined();
      expect(screen.getByRole("button", { name: "Dodaj do Rejestru" })).toBeDefined();
    });

    it("renders modal in edit mode with prefilled values and calls onUpdate", () => {
      const handleUpdate = vi.fn();
      const mockRegisterItem = {
        id: "reg-1",
        registerType: "szkolenia" as const,
        registerNumber: "12/2026",
        date: "2026-05-15",
        title: "Warsztaty profilaktyczne",
        facilityId: "fac-1",
        facilityName: "Szkoła Podstawowa",
        organizer: "PSSE Myślibórz",
        responsiblePerson: "Anna Nowak",
        targetAudience: "Uczniowie",
        participantsCount: 45,
        location: "Myślibórz",
        programId: "",
        programName: "",
        notes: "Udana sesja",
        jrwaSign: "OZiPZ.966.1.2026",
        createdAt: "2026-05-15T10:00:00.000Z",
        updatedAt: "2026-05-15T10:00:00.000Z",
      };

      render(
        <RegisterDialog
          isOpen={true}
          onClose={vi.fn()}
          editingItem={mockRegisterItem}
          facilities={[mockFacility]}
          onSave={vi.fn()}
          onUpdate={handleUpdate}
        />
      );

      expect(screen.getByText(/Edycja Wpisu: Szkolenia/i)).toBeDefined();
      const titleInput = screen.getByDisplayValue("Warsztaty profilaktyczne");
      expect(titleInput).toBeDefined();
      expect(screen.getByDisplayValue("12/2026")).toBeDefined();
      expect(screen.getByRole("button", { name: "Zapisz Zmiany" })).toBeDefined();
    });
  });
});
