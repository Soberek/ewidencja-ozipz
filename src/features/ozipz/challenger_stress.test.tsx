import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Components under test
import { ScheduleTableView } from "./components/schedule/components/ScheduleTableView";
import { ScheduleKanbanView } from "./components/schedule/ScheduleKanbanView";
import { ScheduleCalendarView } from "./components/schedule/ScheduleCalendarView";
import { FacilitiesTableView } from "./components/facilities/components/FacilitiesTableView";
import { JrwaCasesTable } from "./components/jrwa/components/JrwaCasesTable";
import { ScheduleSection } from "./components/schedule/ScheduleSection";
import { ReportsSection } from "./components/reports/ReportsSection";
import { FacilitiesSection } from "./components/facilities/FacilitiesSection";
import { JrwaSection } from "./components/jrwa/JrwaSection";

// Types
import type { OzipzFacility, OzipzJrwaCase } from "./types/ozipz.types";
import type { EnrichedScheduleEvent } from "./utils/scheduleExecutionUtils";

describe("Challenger 1 — Empirical Verification & Stress Test", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createScheduleEvent = (overrides: Partial<EnrichedScheduleEvent> = {}): EnrichedScheduleEvent => ({
    id: "event-1",
    title: "Pomiary ciśnienia tętniczego i edukacja seniorów",
    eventDate: "2026-05-10",
    year: 2026,
    month: 5,
    status: "planned",
    effectiveStatus: "zaplanowane",
    isAutoDone: false,
    isProgrammatic: true,
    programId: "prog-1",
    programName: "Program Profilaktyki Kardiologicznej",
    resolvedProgramName: "Program Profilaktyki Kardiologicznej",
    resolvedJrwaSymbol: "966.1",
    location: "Klub Seniora, Myślibórz",
    responsiblePerson: "Jan Kowalski",
    annotationReasonCode: undefined,
    matchedActions: [],
    computedCompletedCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  });

  const createFacility = (overrides: Partial<OzipzFacility> = {}): OzipzFacility => ({
    id: "fac-1",
    name: "Szkoła Podstawowa nr 1",
    type: "Szkoła Podstawowa",
    address: "ul. Spokojna 1",
    city: "Myślibórz",
    postalCode: "74-300",
    municipality: "Myślibórz",
    county: "myśliborski",
    leadingAuthority: "Gmina Myślibórz",
    isComplex: false,
    defaultCoordinatorEmail: "kontakt@sp1.pl",
    defaultCoordinatorPhone: "123-456-789",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  });

  const createJrwaCase = (overrides: Partial<OzipzJrwaCase> = {}): OzipzJrwaCase => ({
    id: "case-1",
    fullCaseSign: "OZiPZ.966.1.1.2026",
    section: "OZiPZ",
    jrwaSymbol: "966.1",
    caseNumber: 1,
    year: 2026,
    title: "Ewidencja programów profilaktyki tytoniowej",
    status: "w_toku",
    assignedEducator: "Jan Kowalski",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  });

  // =========================================================================
  // 1. EVENT BUBBLING CHALLENGE
  // =========================================================================
  describe("1. Event Bubbling Isolation", () => {
    it("ScheduleTableView: status toggle button does NOT trigger row onEdit", () => {
      const onToggleStatus = vi.fn();
      const onEdit = vi.fn();

      render(
        <ScheduleTableView
          events={[createScheduleEvent()]}
          onToggleStatus={onToggleStatus}
          onOpenAdnotacja={vi.fn()}
          onViewAdnotacja={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const statusBtn = screen.getByTitle("Kliknij, aby zmienić status");
      fireEvent.click(statusBtn);

      expect(onToggleStatus).toHaveBeenCalledTimes(1);
      expect(onToggleStatus).toHaveBeenCalledWith("event-1", "planned");
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("ScheduleTableView: adnotacja button does NOT trigger row onEdit", () => {
      const onOpenAdnotacja = vi.fn();
      const onEdit = vi.fn();

      render(
        <ScheduleTableView
          events={[createScheduleEvent()]}
          onToggleStatus={vi.fn()}
          onOpenAdnotacja={onOpenAdnotacja}
          onViewAdnotacja={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const addAdnotacjaBtn = screen.getByText("+ Dodaj");
      fireEvent.click(addAdnotacjaBtn);

      expect(onOpenAdnotacja).toHaveBeenCalledTimes(1);
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("ScheduleTableView: edit button triggers onEdit exactly ONCE (not twice via bubbling)", () => {
      const onEdit = vi.fn();

      render(
        <ScheduleTableView
          events={[createScheduleEvent()]}
          onToggleStatus={vi.fn()}
          onOpenAdnotacja={vi.fn()}
          onViewAdnotacja={vi.fn()}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const editBtn = screen.getByTitle("Edytuj zadanie");
      fireEvent.click(editBtn);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

  it("ScheduleTableView: confirms deletion without triggering row onEdit", () => {
      const onDelete = vi.fn();
      const onEdit = vi.fn();

      render(
        <ScheduleTableView
          events={[createScheduleEvent()]}
          onToggleStatus={vi.fn()}
          onOpenAdnotacja={vi.fn()}
          onViewAdnotacja={vi.fn()}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

    const deleteBtn = screen.getByTitle("Usuń zadanie");
    fireEvent.click(deleteBtn);

    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Usuń zadanie" }).at(-1)!);
    expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("event-1");
      expect(onEdit).not.toHaveBeenCalled();
    });

    it("FacilitiesTableView: action buttons and mailto link do NOT bubble to row onEdit", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <FacilitiesTableView
          facilities={[createFacility()]}
          childrenMap={new Map()}
          parentMap={new Map()}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      // 1. Delete button
      const deleteBtn = screen.getByLabelText("Usuń placówkę");
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onEdit).not.toHaveBeenCalled();

      // 2. Mailto link (prevent jsdom navigation error while testing click bubbling)
      const emailLink = screen.getByText("kontakt@sp1.pl");
      emailLink.addEventListener("click", (e) => e.preventDefault(), { once: true });
      fireEvent.click(emailLink);
      expect(onEdit).not.toHaveBeenCalled();

      // 3. Edit button should only call onEdit ONCE
      const editBtn = screen.getByLabelText("Edytuj placówkę");
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("JrwaCasesTable: copy button, edit button, and delete button do NOT bubble to onOpenDetails", () => {
      const onCopySign = vi.fn();
      const onOpenDetails = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <JrwaCasesTable
          cases={[createJrwaCase()]}
          copiedId={null}
          onCopySign={onCopySign}
          onOpenDetails={onOpenDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      // 1. Copy sign button
      const copyBtn = screen.getByTitle("Kopiuj pełny znak sprawy do schowka");
      fireEvent.click(copyBtn);
      expect(onCopySign).toHaveBeenCalledTimes(1);
      expect(onOpenDetails).not.toHaveBeenCalled();

      // 2. Edit button
      const editBtn = screen.getByLabelText("Edytuj sprawę");
      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onOpenDetails).not.toHaveBeenCalled();

      // 3. Delete button
      const deleteBtn = screen.getByLabelText("Usuń sprawę");
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onOpenDetails).not.toHaveBeenCalled();

      // 4. Details eye button triggers onOpenDetails ONCE
      const eyeBtn = screen.getByLabelText("Metryka i szczegóły sprawy");
      fireEvent.click(eyeBtn);
      expect(onOpenDetails).toHaveBeenCalledTimes(1);
    });

    it("ScheduleKanbanView: action buttons isolate propagation from card onOpenEdit", () => {
      const onOpenEdit = vi.fn();
      const onDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <ScheduleKanbanView
          plannedEvents={[createScheduleEvent()]}
          doneEvents={[]}
          postponedEvents={[]}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
        />
      );

      // Click delete button
      const deleteBtn = screen.getByTitle("Usuń zadanie");
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onOpenEdit).not.toHaveBeenCalled();

      // Click edit button -> called 1 time
      const editBtn = screen.getByTitle("Edytuj zadanie");
      fireEvent.click(editBtn);
      expect(onOpenEdit).toHaveBeenCalledTimes(1);
    });

    it("ScheduleCalendarView: action buttons isolate propagation from cell onOpenEdit", () => {
      const onOpenEdit = vi.fn();
      const onDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);

      const dayGroups: Array<[string, EnrichedScheduleEvent[]]> = [
        ["2026-05-10", [createScheduleEvent()]],
      ];

      render(
        <ScheduleCalendarView
          dayGroups={dayGroups}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
        />
      );

      // Click delete button
      const deleteBtn = screen.getByTitle("Usuń zadanie");
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onOpenEdit).not.toHaveBeenCalled();

      // Click edit button -> called 1 time
      const editBtn = screen.getByTitle("Edytuj zadanie");
      fireEvent.click(editBtn);
      expect(onOpenEdit).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 2. EXTREME STRINGS & TEXT WRAPPING STRESS TEST
  // =========================================================================
  describe("2. Extreme Strings & Text Wrapping Resilience", () => {
    const extremeTitle = "BARDZO_DLUGI_TYTUL_ZADANIA_BEZ_SPACJI_".repeat(15) + " Końcówka z polskimi znakami: Zażółć gęślą jaźń!";
    const extremeLocation = "ZESPÓŁ_SZKÓŁ_OGÓLNOKSZTAŁCĄCYCH_I_ZAWODOWYCH_IMIENIA_BOHATERÓW_WALK_O_POLSKOŚĆ_I_WOLNOŚĆ_W_MYŚLIBORZU_FILIA_NR_9999";
    const extremeNotes = "NOTATKA_".repeat(40);

    it("ScheduleTableView handles 500+ character continuous unbroken string without crashing and applies break-words", () => {
      const extremeEvent = createScheduleEvent({
        id: "ext-event-1",
        title: extremeTitle,
        eventDate: "2026-06-15",
        year: 2026,
        month: 6,
        status: "planned",
        effectiveStatus: "zaplanowane",
        isAutoDone: false,
        location: extremeLocation,
        responsiblePerson: "Marek Nowak",
      });

      const { container } = render(
        <ScheduleTableView
          events={[extremeEvent]}
          onToggleStatus={vi.fn()}
          onOpenAdnotacja={vi.fn()}
          onViewAdnotacja={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      // Title element checks
      const titleEl = container.querySelector('p[title*="BARDZO_DLUGI_TYTUL"]');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.className).toContain("line-clamp-2");
      expect(titleEl?.className).toContain("break-words");
      expect(titleEl?.getAttribute("title")).toBe(extremeTitle);

      // Location element checks
      const locEl = container.querySelector('span[title*="ZESPÓŁ_SZKÓŁ"]');
      expect(locEl).not.toBeNull();
      expect(locEl?.className).toContain("line-clamp-2");
      expect(locEl?.className).toContain("break-words");
      expect(locEl?.getAttribute("title")).toBe(extremeLocation);
    });

    it("FacilitiesTableView handles extreme school name and notes with line-clamp-2 and break-words", () => {
      const extremeFacility = createFacility({
        id: "fac-ext",
        name: extremeLocation,
        notes: extremeNotes,
      });

      const { container } = render(
        <FacilitiesTableView
          facilities={[extremeFacility]}
          childrenMap={new Map()}
          parentMap={new Map()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onOpenAdd={vi.fn()}
          onClearFilters={vi.fn()}
          isFiltered={false}
        />
      );

      const nameEl = container.querySelector('span[title*="ZESPÓŁ_SZKÓŁ"]');
      expect(nameEl).not.toBeNull();
      expect(nameEl?.className).toContain("line-clamp-2");
      expect(nameEl?.className).toContain("break-words");
      expect(nameEl?.getAttribute("title")).toBe(extremeLocation);
    });

    it("JrwaCasesTable handles extreme title with line-clamp-2 and break-words", () => {
      const extremeCase = createJrwaCase({
        id: "case-ext",
        fullCaseSign: "OZiPZ.966.1.99.2026",
        caseNumber: 99,
        year: 2026,
        title: extremeTitle,
        notes: extremeNotes,
      });

      const { container } = render(
        <JrwaCasesTable
          cases={[extremeCase]}
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

      const titleEl = container.querySelector('span[title*="BARDZO_DLUGI_TYTUL"]');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.className).toContain("line-clamp-2");
      expect(titleEl?.className).toContain("break-words");
      expect(titleEl?.getAttribute("title")).toBe(extremeTitle);
    });
  });

  // =========================================================================
  // 3. LOCALSTORAGE FAILURE MODES & RESILIENCE
  // =========================================================================
  describe("3. LocalStorage Failure Modes Resilience", () => {
    it("ScheduleSection survives when localStorage throws SecurityError on read and set", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Access denied by user settings", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The operation is insecure", "SecurityError");
      });

      render(
        <ScheduleSection
          scheduleEvents={[]}
          programs={[]}
          actions={[]}
        />
      );

      // Verify toggle button exists and does not throw on click
      const kpiToggleBtn = screen.getByTitle(/Zwiń karty podsumowania KPI|Rozwiń karty podsumowania KPI/);
      expect(kpiToggleBtn).toBeDefined();

      // Click to collapse
      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();

      // Click to expand
      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
    });

    it("ReportsSection survives when localStorage throws QuotaExceededError", () => {
      vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

      render(
        <ReportsSection
          actions={[]}
          programs={[]}
          facilities={[]}
        />
      );

      const kpiToggleBtn = screen.getByTitle(/Zwiń karty podsumowania KPI|Pokaż karty podsumowania KPI/);
      expect(kpiToggleBtn).toBeDefined();

      // Toggling should handle error gracefully without throwing uncaught exception
      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
    });

    it("FacilitiesSection survives when localStorage throws errors", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Generic storage error");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Generic write error");
      });

      render(<FacilitiesSection facilities={[]} />);

      const kpiToggleBtn = screen.getByTitle(/Zwiń karty podsumowania KPI|Rozwiń karty podsumowania KPI/);
      expect(kpiToggleBtn).toBeDefined();

      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
    });

    it("JrwaSection survives when localStorage throws errors", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Security error", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Quota error", "QuotaExceededError");
      });

      render(
        <JrwaSection
          cases={[]}
          dictionaryItems={[]}
          staff={[]}
          actions={[]}
        />
      );

      const kpiToggleBtn = screen.getByTitle(/Zwiń karty podsumowania KPI|Rozwiń karty podsumowania KPI/);
      expect(kpiToggleBtn).toBeDefined();

      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
      expect(() => fireEvent.click(kpiToggleBtn)).not.toThrow();
    });
  });
});
