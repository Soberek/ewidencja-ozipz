import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { DashboardMonthEventItem } from "./DashboardMonthEventItem";
import { getJrwaDetails } from "../../utils/programJrwaUtils";
import type { HealthPromotionTab, OzipzScheduleEvent, OzipzAction } from "../../types/ozipz.types";
import { useModalStore } from "../../store/useModalStore";
import { useOzipzDb } from "../../hooks/useOzipzDb";

const MONTH_NAMES_PL = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

interface DashboardCurrentMonthPlanCardProps {
  scheduleEvents: OzipzScheduleEvent[];
  actions?: OzipzAction[];
  onNavigateTab: (tab: HealthPromotionTab) => void;
}

export function DashboardCurrentMonthPlanCard({
  scheduleEvents,
  actions = [],
  onNavigateTab,
}: DashboardCurrentMonthPlanCardProps) {
  const db = useOzipzDb();
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const openModal = useModalStore((s) => s.openModal);

  // Helper do pobierania pełnej nazwy i opisu JRWA ze słownika bazy
  const getEventJrwaInfo = (ev: OzipzScheduleEvent) => {
    // 1. Sprawdź czy zadanie ma programId
    if (ev.programId) {
      const prog = db.programs.find((p) => p.id === ev.programId);
      if (prog) {
        const cleanSym = (prog.jrwaSymbol || ev.jrwa || "").replace(/[^0-9.]/g, "");
        const dictItem = cleanSym ? db.jrwaSymbols.find((d) => d.code === cleanSym) : null;
        return {
          symbol: cleanSym || prog.jrwaSymbol || "",
          label: prog.name,
          description: prog.description || dictItem?.description || prog.name,
        };
      }
    }

    // 2. Wyciągnij ze słownika JRWA przez getJrwaDetails
    const rawText = `${ev.jrwa || ""} ${ev.category || ""} ${ev.title || ""}`;
    const details = getJrwaDetails(rawText, db.programs);
    if (details) return details;

    if (ev.category && ev.category.trim() && !ev.category.toLowerCase().includes("ogólne")) {
      return {
        symbol: "",
        label: ev.category.trim(),
        description: ev.category.trim(),
      };
    }

    return null;
  };

  // Filtrowanie zadań dla wybranego miesiąca i roku
  const monthEvents = useMemo(() => {
    const monthStr = String(selectedMonth).padStart(2, "0");
    const prefix = `${selectedYear}-${monthStr}`;

    return scheduleEvents
      .filter((ev) => ev.eventDate.startsWith(prefix))
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }, [scheduleEvents, selectedMonth, selectedYear]);

  // Statystyki realizacji dla wybranego miesiąca
  const stats = useMemo(() => {
    const total = monthEvents.length;
    let completed = 0;
    let inProgress = 0;
    let planned = 0;
    let postponed = 0;

    for (const ev of monthEvents) {
      const isEvCompleted =
        ev.status === "wykonane" ||
        ev.status === "done" ||
        ev.status === "zrealizowane" ||
        Boolean(ev.actionId) ||
        actions.some((a) => a.scheduleEventId === ev.id);

      const isEvPostponed =
        ev.status === "odroczone" ||
        ev.status === "odwolane" ||
        ev.status === "postponed" ||
        ev.status === "cancelled";

      if (isEvCompleted) {
        completed++;
      } else if (ev.status === "w_toku" || ev.status === "in_progress") {
        inProgress++;
      } else if (isEvPostponed) {
        postponed++;
      } else {
        planned++;
      }
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, planned, postponed, percentage };
  }, [monthEvents, actions]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleRegisterActionForEvent = (event: OzipzScheduleEvent) => {
    openModal("action", {
      item: {
        title: event.title,
        date: event.eventDate,
        facilityId: event.facilityId || "",
        facilityName: event.location || "",
        programId: event.programId || "",
        topic: event.topic || "",
        scheduleEventId: event.id,
        notes: event.notes ? `Zadanie z planu pracy: ${event.notes}` : `Realizacja zadania: ${event.title}`,
      },
    });
  };

  return (
    <Card className="p-4 bg-card border border-border rounded-[3px] shadow-none space-y-3.5">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Plan Pracy i Zadania na {MONTH_NAMES_PL[selectedMonth - 1]} {selectedYear}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-6 w-6 p-0 rounded-[2px]"
            title="Poprzedni miesiąc"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="text-xs font-mono font-bold text-foreground min-w-[90px] text-center bg-muted/40 px-2 py-0.5 rounded">
            {MONTH_NAMES_PL[selectedMonth - 1]} {selectedYear}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-6 w-6 p-0 rounded-[2px]"
            title="Następny miesiąc"
          >
            <ChevronRight className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab("harmonogram")}
            className="h-6 text-[11px] text-primary hover:bg-primary/10 font-bold gap-0.5 px-2 ml-1 rounded-[2px]"
          >
            Pełny Plan <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* Progress Bar & KPI Summary */}
      <div className="p-3 bg-muted/20 border border-border/80 rounded-[3px] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Wykonanie planu miesięcznego:</span>
            <span className="font-mono font-bold text-primary">
              {stats.completed} z {stats.total} zadań
            </span>
          </div>
          <span className="font-mono font-extrabold text-xs text-foreground">
            {stats.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              stats.percentage >= 100
                ? "bg-emerald-500"
                : stats.percentage >= 50
                ? "bg-blue-500"
                : "bg-amber-500"
            }`}
            style={{ width: `${Math.min(100, stats.percentage)}%` }}
          />
        </div>

        {/* Status badges summary */}
        <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
            Zrealizowane: <strong className="text-foreground">{stats.completed}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-blue-500 inline-block" />
            Do realizacji: <strong className="text-foreground">{stats.planned}</strong>
          </span>
          {stats.inProgress > 0 && (
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500 inline-block" />
              W toku: <strong className="text-foreground">{stats.inProgress}</strong>
            </span>
          )}
          {stats.postponed > 0 && (
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500 inline-block" />
              Odroczone / Zmiany: <strong className="text-foreground">{stats.postponed}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Task List for Selected Month */}
      <div className="space-y-2">
        {monthEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-[3px]">
            Brak zaplanowanych zadań w miesięcznym planie pracy na ten miesiąc.
          </div>
        ) : (
          monthEvents.map((ev) => {
            const isCompleted =
              ev.status === "wykonane" ||
              ev.status === "done" ||
              ev.status === "zrealizowane" ||
              Boolean(ev.actionId) ||
              actions.some((a) => a.scheduleEventId === ev.id);

            const isPostponed =
              ev.status === "odroczone" ||
              ev.status === "odwolane" ||
              ev.status === "postponed" ||
              ev.status === "cancelled";

            const jrwaInfo = getEventJrwaInfo(ev);

            return (
              <DashboardMonthEventItem
                key={ev.id}
                event={ev}
                isCompleted={isCompleted}
                isPostponed={isPostponed}
                jrwaInfo={jrwaInfo}
                onRegisterAction={handleRegisterActionForEvent}
                onNavigateToActions={() => onNavigateTab("dzialania")}
              />
            );
          })
        )}
      </div>
    </Card>
  );
}
