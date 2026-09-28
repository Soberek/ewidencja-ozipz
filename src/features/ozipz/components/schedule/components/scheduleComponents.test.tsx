import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScheduleStatsHeader } from "./ScheduleStatsHeader";
import { ScheduleFilterBar } from "./ScheduleFilterBar";
import { ScheduleTableView } from "./ScheduleTableView";
import { ScheduleKanbanView } from "../ScheduleKanbanView";
import { ScheduleCalendarView } from "../ScheduleCalendarView";
import { ScheduleSection } from "../ScheduleSection";
import type { EnrichedScheduleEvent } from "../../../utils/scheduleExecutionUtils";

const mockEvent: EnrichedScheduleEvent = {
  id: "sch-1",
  title: "Pogadanka o zdrowym odżywianiu w szkole podstawowej z rozszerzonym programem",
  eventDate: "2026-08-15",
  status: "zaplanowane",
  location: "Szkoła Podstawowa nr 1 im. Mikołaja Kopernika w Myśliborzu",
  responsiblePerson: "Jan Nowak",
  programName: "Skąd się biorą produkty ekologiczne",
  resolvedProgramName: "Skąd się biorą produkty ekologiczne",
  effectiveStatus: "zaplanowane",
  isAutoDone: false,
  isProgrammatic: true,
  matchedActions: [],
  computedCompletedCount: 0,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const mockAnnotatedEvent: EnrichedScheduleEvent = {
  ...mockEvent,
  id: "sch-2",
  title: "Zadanie z odroczonym terminem realizacji",
  annotationReasonCode: "FERIE",
  annotationReasonLabel: "Zmiana terminu z uwagi na ferie zimowe",
  effectiveStatus: "odroczone",
};

const mockAutoDoneEvent: EnrichedScheduleEvent = {
  ...mockEvent,
  id: "sch-3",
  title: "Zadanie rozliczone automatycznie przez powiązane działanie",
  effectiveStatus: "wykonane",
  isAutoDone: true,
};

describe("Schedule Module Components", () => {
  it("renders ScheduleStatsHeader with execution metrics", () => {
    render(
      <ScheduleStatsHeader
        totalTasks={20}
        completedTasks={15}
        pendingTasks={5}
        annotatedTasks={2}
        compliancePercent={75}
      />
    );

    expect(screen.getByText("Zadania Planu")).toBeDefined();
    expect(screen.getByText("20")).toBeDefined();
    expect(screen.getByText("Zrealizowane")).toBeDefined();
    expect(screen.getByText(/75%/)).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
  });

  it("renders ScheduleFilterBar and handles month selection and view switching", () => {
    const handleSelectMonth = vi.fn();
    const handleSelectYear = vi.fn();
    const handleViewMode = vi.fn();

    render(
      <ScheduleFilterBar
        search=""
        onSearchChange={vi.fn()}
        selectedYear={2026}
        availableYears={[2026, 2025]}
        onSelectYear={handleSelectYear}
        selectedMonth={null}
        onSelectMonth={handleSelectMonth}
        currentMonth={8}
        filterType="all"
        onFilterTypeChange={vi.fn()}
        viewMode="table"
        onViewModeChange={handleViewMode}
        onOpenCopyPlan={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    expect(screen.getByText("Cały Rok")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Rok harmonogramu"), { target: { value: "2025" } });
    expect(handleSelectYear).toHaveBeenCalledWith(2025);
    const sieBtn = screen.getByText("Sie");
    fireEvent.click(sieBtn);
    expect(handleSelectMonth).toHaveBeenCalledWith(8);

    const kanbanBtn = screen.getByTitle("Widok tablicy Kanban");
    fireEvent.click(kanbanBtn);
    expect(handleViewMode).toHaveBeenCalledWith("kanban");
  });

  it("renders KPI toggle button in ScheduleFilterBar and toggles visibility", () => {
    const handleToggleKpi = vi.fn();
    const { rerender } = render(
      <ScheduleFilterBar
        search=""
        onSearchChange={vi.fn()}
        selectedYear={2026}
        availableYears={[2026]}
        onSelectYear={vi.fn()}
        selectedMonth={null}
        onSelectMonth={vi.fn()}
        currentMonth={8}
        filterType="all"
        onFilterTypeChange={vi.fn()}
        viewMode="table"
        onViewModeChange={vi.fn()}
        onOpenCopyPlan={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
        isKpiVisible={true}
        onToggleKpi={handleToggleKpi}
      />
    );

    const toggleBtn = screen.getByText("Zwiń KPI");
    expect(toggleBtn).toBeDefined();
    fireEvent.click(toggleBtn);
    expect(handleToggleKpi).toHaveBeenCalledTimes(1);

    rerender(
      <ScheduleFilterBar
        search=""
        onSearchChange={vi.fn()}
        selectedYear={2026}
        availableYears={[2026]}
        onSelectYear={vi.fn()}
        selectedMonth={null}
        onSelectMonth={vi.fn()}
        currentMonth={8}
        filterType="all"
        onFilterTypeChange={vi.fn()}
        viewMode="table"
        onViewModeChange={vi.fn()}
        onOpenCopyPlan={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
        isKpiVisible={false}
        onToggleKpi={handleToggleKpi}
      />
    );

    expect(screen.getByText("Pokaż KPI")).toBeDefined();
  });

  it("renders quick filter chips in ScheduleFilterBar and triggers onFilterTypeChange", () => {
    const handleFilterChange = vi.fn();
    render(
      <ScheduleFilterBar
        search=""
        onSearchChange={vi.fn()}
        selectedYear={2026}
        availableYears={[2026]}
        onSelectYear={vi.fn()}
        selectedMonth={null}
        onSelectMonth={vi.fn()}
        currentMonth={8}
        filterType="all"
        onFilterTypeChange={handleFilterChange}
        viewMode="table"
        onViewModeChange={vi.fn()}
        onOpenCopyPlan={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    const doRealizacjiChip = screen.getByText("Do realizacji");
    fireEvent.click(doRealizacjiChip);
    expect(handleFilterChange).toHaveBeenCalledWith("do_realizacji");

    const zrealizowaneChip = screen.getByText("Zrealizowane");
    fireEvent.click(zrealizowaneChip);
    expect(handleFilterChange).toHaveBeenCalledWith("zrealizowane");

    const zAdnotacjaChip = screen.getByText("Z adnotacją");
    fireEvent.click(zAdnotacjaChip);
    expect(handleFilterChange).toHaveBeenCalledWith("z_adnotacja");
  });

  it("handles table row click to edit and confirms deletion without opening the editor", async () => {
    const handleEdit = vi.fn();
    const handleToggle = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenAdnotacja = vi.fn();

    render(
      <ScheduleTableView
        events={[mockEvent]}
        onToggleStatus={handleToggle}
        onOpenAdnotacja={handleOpenAdnotacja}
        onViewAdnotacja={vi.fn()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    // Clicking row content triggers onEdit
    const titleElem = screen.getByText(mockEvent.title);
    fireEvent.click(titleElem);
    expect(handleEdit).toHaveBeenCalledWith(mockEvent);
    handleEdit.mockClear();

    // Clicking status button triggers handleToggle and NOT handleEdit
    const statusBtn = screen.getByTitle("Kliknij, aby zmienić status");
    fireEvent.click(statusBtn);
    expect(handleToggle).toHaveBeenCalledWith("sch-1", "zaplanowane");
    expect(handleEdit).not.toHaveBeenCalled();

    // Clicking adnotacja button triggers handleOpenAdnotacja and NOT handleEdit
    const addAdnotacjaBtn = screen.getByText("+ Dodaj");
    fireEvent.click(addAdnotacjaBtn);
    expect(handleOpenAdnotacja).toHaveBeenCalledWith(mockEvent);
    expect(handleEdit).not.toHaveBeenCalled();

    // Clicking delete button triggers handleDelete and NOT handleEdit
    const deleteBtn = screen.getByTitle("Usuń zadanie");
    fireEvent.click(deleteBtn);
    expect(handleDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Usuń zadanie" }).at(-1)!);
    await waitFor(() => expect(handleDelete).toHaveBeenCalledWith("sch-1"));
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it("applies line-clamp-2 break-words and titles in ScheduleTableView", () => {
    render(
      <ScheduleTableView
        events={[mockEvent]}
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

    const titleEl = screen.getByTitle(mockEvent.title);
    expect(titleEl.className).toContain("line-clamp-2");
    expect(titleEl.className).toContain("break-words");

    const locEl = screen.getByTitle(mockEvent.location);
    expect(locEl.className).toContain("line-clamp-2");
    expect(locEl.className).toContain("break-words");

    const progBadge = screen.getByTitle("Skąd się biorą produkty ekologiczne");
    expect(progBadge).toBeDefined();
    expect(progBadge.querySelector("svg")).toBeDefined();
  });

  it("renders adnotacja button for annotated event and isolates click", () => {
    const handleViewAdnotacja = vi.fn();
    const handleEdit = vi.fn();

    render(
      <ScheduleTableView
        events={[mockAnnotatedEvent]}
        onToggleStatus={vi.fn()}
        onOpenAdnotacja={vi.fn()}
        onViewAdnotacja={handleViewAdnotacja}
        onEdit={handleEdit}
        onDelete={vi.fn()}
        onOpenAdd={vi.fn()}
        onClearFilters={vi.fn()}
        isFiltered={false}
      />
    );

    const adnotacjaBtn = screen.getByRole("button", { name: /adnotacja/i });
    fireEvent.click(adnotacjaBtn);
    expect(handleViewAdnotacja).toHaveBeenCalledWith(mockAnnotatedEvent);
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it("renders ScheduleKanbanView, allows card click to edit, and isolates button clicks", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <ScheduleKanbanView
        plannedEvents={[mockEvent]}
        doneEvents={[]}
        postponedEvents={[]}
        onOpenEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    const titleEl = screen.getByTitle(mockEvent.title);
    expect(titleEl.className).toContain("line-clamp-2");
    expect(titleEl.className).toContain("break-words");

    const locEl = screen.getByTitle(mockEvent.location);
    expect(locEl.className).toContain("line-clamp-2");
    expect(locEl.className).toContain("break-words");

    // Click card
    fireEvent.click(titleEl);
    expect(handleEdit).toHaveBeenCalledWith(mockEvent);
    handleEdit.mockClear();

    // Click edit button
    const editBtn = screen.getByTitle("Edytuj zadanie");
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockEvent);
    handleEdit.mockClear();

    // Click delete button
    const deleteBtn = screen.getByTitle("Usuń zadanie");
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockEvent.id);
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it("renders ScheduleCalendarView, handles event click, and recognizes auto-done status", () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const dayGroups: Array<[string, EnrichedScheduleEvent[]]> = [
      ["2026-08-15", [mockAutoDoneEvent, mockAnnotatedEvent]],
    ];

    render(
      <ScheduleCalendarView
        dayGroups={dayGroups}
        onOpenEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    // Check auto-done badge
    expect(screen.getByText(/Zrealizowane \(Auto\)/)).toBeDefined();
    // Check postponed badge
    expect(screen.getByText("Odroczone")).toBeDefined();

    // Check title wrapping and tooltip
    const autoDoneTitle = screen.getByTitle(mockAutoDoneEvent.title);
    expect(autoDoneTitle.className).toContain("line-clamp-2");
    expect(autoDoneTitle.className).toContain("break-words");

    // Click event item
    fireEvent.click(autoDoneTitle);
    expect(handleEdit).toHaveBeenCalledWith(mockAutoDoneEvent);
    handleEdit.mockClear();

    // Click delete button on annotated event
    const deleteBtns = screen.getAllByTitle("Usuń zadanie");
    fireEvent.click(deleteBtns[1]);
    expect(handleDelete).toHaveBeenCalledWith(mockAnnotatedEvent.id);
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it("persists and toggles showKpiSummary in ScheduleSection via localStorage", () => {
    localStorage.clear();
    render(
      <ScheduleSection
        scheduleEvents={[mockEvent]}
        actions={[]}
        programs={[]}
      />
    );

    // KPI header should be visible initially
    expect(screen.getByText("Zadania Planu")).toBeDefined();
    const toggleBtn = screen.getByText("Zwiń KPI");

    // Click toggle to hide KPI
    fireEvent.click(toggleBtn);
    expect(screen.queryByText("Zadania Planu")).toBeNull();
    expect(localStorage.getItem("oz.scheduleShowKpiSummary")).toBe("false");
    expect(screen.getByText("Pokaż KPI")).toBeDefined();

    // Click toggle to show KPI again
    const showBtn = screen.getByText("Pokaż KPI");
    fireEvent.click(showBtn);
    expect(screen.getByText("Zadania Planu")).toBeDefined();
    expect(localStorage.getItem("oz.scheduleShowKpiSummary")).toBe("true");
  });

  it("copies leap-day tasks safely and skips tasks already in the destination year", async () => {
    const leap = { ...mockEvent, id: "leap", title: "Zadanie przestępne", eventDate: "2024-02-29", month: 2, year: 2024 };
    const existingSource = { ...mockEvent, id: "source", title: "Zadanie istniejące", eventDate: "2024-12-30", month: 12, year: 2024 };
    const existingTarget = { ...existingSource, id: "target", eventDate: "2025-12-30", year: 2025 };
    const onAddEvent = vi.fn().mockResolvedValue(undefined);
    render(<ScheduleSection scheduleEvents={[leap, existingSource, existingTarget]} actions={[]} programs={[]} onAddEvent={onAddEvent} />);

    fireEvent.click(screen.getByRole("button", { name: "Kopiuj Plan" }));
    const [fromYear, toYear] = screen.getAllByRole("spinbutton");
    fireEvent.change(fromYear, { target: { value: "2024" } });
    fireEvent.change(toYear, { target: { value: "2025" } });
    fireEvent.click(screen.getByRole("button", { name: "Kopiuj Plan Pracy" }));

    await waitFor(() => expect(onAddEvent).toHaveBeenCalledTimes(1));
    expect(onAddEvent).toHaveBeenCalledWith(expect.objectContaining({
      title: "Zadanie przestępne", eventDate: "2025-02-28", month: 2, year: 2025,
      status: "zaplanowane", completedCount: 0,
    }));
  });
});
