import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { OzipzScheduleEvent, OzipzAction, OzipzProgram } from "../../types/ozipz.types";
import { useSchedule, useActions, usePrograms } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { ScheduleKanbanView } from "./ScheduleKanbanView";
import { ScheduleCalendarView } from "./ScheduleCalendarView";
import { AdnotacjaDialog } from "./AdnotacjaDialog";
import { AdnotacjeListDialog } from "./AdnotacjeListDialog";
import { CopyYearPlanDialog } from "./CopyYearPlanDialog";
import {
  enrichScheduleEvents,
  getEventMonth,
  getEventYear,
} from "../../utils/scheduleExecutionUtils";
import { ScheduleStatsHeader } from "./components/ScheduleStatsHeader";
import { ScheduleFilterBar, type ScheduleFilterMode } from "./components/ScheduleFilterBar";
import { ScheduleTableView } from "./components/ScheduleTableView";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { getTodayIsoDate, safeParseDate } from "../../utils/dateUtils";
import { POLISH_MONTHS_NOMINATIVE } from "../../utils/adnotacjaUtils";
import { addYears } from "date-fns";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

function shiftDate(value: string, yearOffset: number): string | undefined {
  const date = safeParseDate(value);
  return date ? getTodayIsoDate(addYears(date, yearOffset)) : undefined;
}

function copyKey(event: Pick<OzipzScheduleEvent, "eventDate" | "title" | "location" | "programId" | "responsiblePerson">): string {
  return [event.eventDate, event.title.trim(), event.location, event.programId, event.responsiblePerson].join("\u0000");
}

export interface ScheduleSectionProps {
  scheduleEvents?: OzipzScheduleEvent[];
  actions?: OzipzAction[];
  programs?: OzipzProgram[];
  onOpenAdd?: () => void;
  onOpenEdit?: (event: OzipzScheduleEvent) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onUpdateEvent?: (id: string, updates: Partial<OzipzScheduleEvent>) => Promise<void> | void;
  onAddEvent?: (event: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">) => Promise<OzipzScheduleEvent> | void;
}

export function ScheduleSection(props: ScheduleSectionProps) {
  const scheduleStore = useSchedule();
  const actionsStore = useActions();
  const programsStore = usePrograms();
  const openModal = useModalStore((s) => s.openModal);

  const scheduleEvents = props.scheduleEvents ?? scheduleStore.scheduleEvents;
  const actions = props.actions ?? actionsStore.actions;
  const programs = props.programs ?? programsStore.programs;

  const onOpenAdd = props.onOpenAdd ?? (() => openModal("schedule"));
  const onOpenEdit =
    props.onOpenEdit ?? ((event: OzipzScheduleEvent) => openModal("schedule", { item: event }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      await scheduleStore.deleteScheduleEvent(id);
      toast.success("Usunięto zadanie z harmonogramu");
    });

  const onToggleStatus = props.onToggleStatus ?? scheduleStore.toggleScheduleStatus;
  const handleToggleStatus = async (id: string, status: string) => {
    try {
      await onToggleStatus(id, status);
    } catch {
      toast.error("Nie udało się zmienić statusu zadania");
    }
  };
  const onUpdateEvent = props.onUpdateEvent ?? scheduleStore.updateScheduleEvent;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<ScheduleFilterMode>("all");
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "calendar">("table");

  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("schedule");

  // Skróty klawiszowe 1, 2, 3 do przełączania widoków
  useKeyboardShortcuts({
    onScheduleViewChange: (viewIndex) => {
      if (viewIndex === 1) setViewMode("table");
      else if (viewIndex === 2) setViewMode("kanban");
      else if (viewIndex === 3) setViewMode("calendar");
    },
    onOpenNewAction: () => onOpenAdd(),
  });

  // Dialogi adnotacji i kopiowania planu
  const [adnotacjaEvent, setAdnotacjaEvent] = useState<OzipzScheduleEvent | null>(null);
  const [viewAdnotacjaEvent, setViewAdnotacjaEvent] = useState<OzipzScheduleEvent | null>(null);
  const [isCopyPlanOpen, setIsCopyPlanOpen] = useState(false);

  // Wzbogacenie o powiązane działania i adnotacje
  const enrichedEvents = useMemo(() => {
    return enrichScheduleEvents(scheduleEvents, actions, programs);
  }, [scheduleEvents, actions, programs]);

  const availableYears = useMemo(() =>
    Array.from(new Set([currentYear, ...scheduleEvents.map(getEventYear)])).sort((a, b) => b - a),
    [currentYear, scheduleEvents]
  );

  // Filtrowanie zadań
  const filteredEvents = useMemo(() => {
    return enrichedEvents.filter((event) => {
      if (getEventYear(event) !== selectedYear) return false;
      // Filtr miesiąca
      if (selectedMonth !== null) {
        const evMonth = getEventMonth(event);
        if (evMonth !== selectedMonth) return false;
      }

      // Filtr statusu wykonania i adnotacji
      const isDone = event.effectiveStatus === "wykonane";
      const isAnnotated = Boolean(event.annotationReasonCode) || event.effectiveStatus === "odroczone";

      if (filterType === "zrealizowane" && !isDone) return false;
      if (filterType === "do_realizacji" && event.effectiveStatus !== "zaplanowane" && event.effectiveStatus !== "w_trakcie") return false;
      if (filterType === "niezrealizowane" && isDone) return false;
      if (filterType === "z_adnotacja" && !isAnnotated) return false;

      // Szukajka tekstowa
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = (event.title || "").toLowerCase().includes(q);
        const mLoc = (event.location || "").toLowerCase().includes(q);
        const mProg = (event.resolvedProgramName || event.programName || "").toLowerCase().includes(q);
        const mResp = (event.responsiblePerson || "").toLowerCase().includes(q);
        if (!mTitle && !mLoc && !mProg && !mResp) return false;
      }

      return true;
    }).sort((a, b) => (a.eventDate || "").localeCompare(b.eventDate || ""));
  }, [enrichedEvents, selectedYear, selectedMonth, filterType, search]);

  // Statystyki
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const completed = filteredEvents.filter((e) => e.effectiveStatus === "wykonane").length;
    const pending = filteredEvents.filter((e) => e.effectiveStatus === "zaplanowane" || e.effectiveStatus === "w_trakcie").length;
    const annotated = filteredEvents.filter((e) => Boolean(e.annotationReasonCode) || e.effectiveStatus === "odroczone").length;
    const compliance = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      annotated,
      compliance,
    };
  }, [filteredEvents]);

  // Grupowanie dla Kanban
  const kanbanPlanned = useMemo(
    () => filteredEvents.filter((e) => e.effectiveStatus === "zaplanowane" || e.effectiveStatus === "w_trakcie"),
    [filteredEvents]
  );
  const kanbanDone = useMemo(
    () => filteredEvents.filter((e) => e.effectiveStatus === "wykonane"),
    [filteredEvents]
  );
  const kanbanPostponed = useMemo(
    () => filteredEvents.filter((e) => e.effectiveStatus === "odroczone" || e.effectiveStatus === "odwolane"),
    [filteredEvents]
  );

  // Grupowanie dla Kalendarza
  const calendarDayGroups = useMemo(() => {
    const map = new Map<string, typeof filteredEvents>();
    filteredEvents.forEach((e) => {
      const dateKey = e.eventDate || "Bez określonej daty";
      const list = map.get(dateKey) || [];
      list.push(e);
      map.set(dateKey, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedYear(currentYear);
    setSelectedMonth(null);
    setFilterType("all");
  }, [currentYear]);

  return (
    <div className="space-y-4">
      {/* KPI Stats Header */}
      {showKpiSummary && (
        <ScheduleStatsHeader
          totalTasks={stats.total}
          completedTasks={stats.completed}
          pendingTasks={stats.pending}
          annotatedTasks={stats.annotated}
          compliancePercent={stats.compliance}
        />
      )}

      {/* Pasek miesięcy, filtrów i przełącznik widoku */}
      <ScheduleFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onSelectYear={setSelectedYear}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        currentMonth={currentMonth}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenCopyPlan={() => setIsCopyPlanOpen(true)}
        onOpenAdd={onOpenAdd}
        onClearFilters={handleClearFilters}
        isFiltered={!!search.trim() || selectedYear !== currentYear || selectedMonth !== null || filterType !== "all"}
        isKpiVisible={showKpiSummary}
        onToggleKpi={toggleKpiSummary}
      />

      {/* Widok w zależności od trybu: Tabela / Kanban / Kalendarz */}
      {viewMode === "table" && (
        <ScheduleTableView
          events={filteredEvents}
          onToggleStatus={handleToggleStatus}
          onOpenAdnotacja={(event) => setAdnotacjaEvent(event)}
          onViewAdnotacja={(event) => setViewAdnotacjaEvent(event)}
          onEdit={onOpenEdit}
          onDelete={onDelete}
          onOpenAdd={onOpenAdd}
          onClearFilters={handleClearFilters}
          isFiltered={!!search.trim() || selectedYear !== currentYear || selectedMonth !== null || filterType !== "all"}
        />
      )}

      {viewMode === "kanban" && (
        <ScheduleKanbanView
          plannedEvents={kanbanPlanned}
          doneEvents={kanbanDone}
          postponedEvents={kanbanPostponed}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
        />
      )}

      {viewMode === "calendar" && (
        <ScheduleCalendarView
          dayGroups={calendarDayGroups}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
        />
      )}

      {/* Dialogi obsługi adnotacji */}
      <AdnotacjaDialog
        open={!!adnotacjaEvent}
        onOpenChange={(open) => !open && setAdnotacjaEvent(null)}
        event={adnotacjaEvent}
        onSave={async (eventId, adnotacja) => {
          await onUpdateEvent(eventId, {
              annotationReasonCode: adnotacja.powodKod,
              annotationReasonLabel: adnotacja.powodTytul,
              annotationText: adnotacja.tresc,
            status: "odroczone",
          });
          setAdnotacjaEvent(null);
          toast.success("Zapisano adnotację do zadania");
        }}
      />

      <AdnotacjeListDialog
        open={!!viewAdnotacjaEvent}
        onOpenChange={(open) => !open && setViewAdnotacjaEvent(null)}
        event={viewAdnotacjaEvent}
        onRemoveAnnotation={async (eventId) => {
          await onUpdateEvent(eventId, {
              annotationReasonCode: undefined,
              annotationReasonLabel: undefined,
              annotationText: undefined,
            status: "zaplanowane",
          });
          setViewAdnotacjaEvent(null);
          toast.success("Usunięto adnotację");
        }}
      />

      {/* Dialog kopiowania planu rocznego */}
      <CopyYearPlanDialog
        open={isCopyPlanOpen}
        onOpenChange={setIsCopyPlanOpen}
        currentYear={currentYear}
        onCopyYear={async (fromYear, toYear) => {
          const fromEvents = scheduleEvents.filter((event) => getEventYear(event) === fromYear);
          if (fromEvents.length === 0) throw new Error(`Brak zadań w planie na rok ${fromYear}.`);

          const existingKeys = new Set(scheduleEvents.filter((event) => getEventYear(event) === toYear).map(copyKey));
          const addEvent = props.onAddEvent ?? scheduleStore.addScheduleEvent;
          let copiedCount = 0;
          let skippedCount = 0;
          for (const ev of fromEvents) {
            const originalDate = safeParseDate(ev.eventDate);
            const yearOffset = toYear - (originalDate?.getFullYear() ?? fromYear);
            const month = getEventMonth(ev) ?? 1;
            const newDate = shiftDate(ev.eventDate, yearOffset) ?? `${toYear}-${String(month).padStart(2, "0")}-01`;
            const newEndDate = ev.endDate ? shiftDate(ev.endDate, yearOffset) : undefined;
            const key = copyKey({ ...ev, eventDate: newDate });
            if (existingKeys.has(key)) {
              skippedCount++;
              continue;
            }

            try {
              await addEvent({
              title: ev.title,
              activityTypeCode: ev.activityTypeCode,
              activityTypeName: ev.activityTypeName,
              eventDate: newDate,
              endDate: newEndDate,
              category: ev.category,
              topic: ev.topic,
              programId: ev.programId,
              programName: ev.programName,
              campaignId: ev.campaignId,
              campaignName: ev.campaignName,
              recipientGroup: ev.recipientGroup,
              location: ev.location || "",
              facilityId: ev.facilityId,
              status: "zaplanowane",
              responsiblePerson: ev.responsiblePerson || "",
              month: Number(newDate.slice(5, 7)),
              monthName: POLISH_MONTHS_NOMINATIVE[Number(newDate.slice(5, 7))],
              year: toYear,
              plannedCount: ev.plannedCount ?? 1,
              completedCount: 0,
              manuallyCompleted: false,
              jrwa: ev.jrwa,
              notes: ev.notes,
              });
            } catch {
              throw new Error(`Kopiowanie przerwane. Skopiowano ${copiedCount} z ${fromEvents.length} zadań; sprawdź plan roku ${toYear} przed ponowieniem.`);
            }
            existingKeys.add(key);
            copiedCount++;
          }
          setSelectedYear(toYear);
          const message = `Skopiowano ${copiedCount} zadań do roku ${toYear}${skippedCount ? `, pominięto ${skippedCount} istniejących` : ""}.`;
          if (copiedCount) toast.success(message);
          else toast.info(message);
          return { copiedCount };
        }}
      />
    </div>
  );
}

export default ScheduleSection;
