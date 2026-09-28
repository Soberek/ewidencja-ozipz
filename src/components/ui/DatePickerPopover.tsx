import * as React from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MONTH_NAMES_PL,
  WEEKDAY_NAMES_PL,
  isQuickDateDisabled,
  type CalendarDayItem,
  type DatePickerQuickSelectType,
} from "./datePickerUtils";

export interface DatePickerPopoverProps {
  align?: "left" | "right";
  showShortcuts?: boolean;
  minDate?: string;
  maxDate?: string;
  viewYear: number;
  viewMonth: number;
  calendarDays: CalendarDayItem[];
  value?: string;
  formattedDisplay: string;
  onPrevMonth: (e: React.MouseEvent) => void;
  onNextMonth: (e: React.MouseEvent) => void;
  onSelectDate: (dateIso: string) => void;
  onQuickSelect: (type: DatePickerQuickSelectType) => void;
}

export function DatePickerPopover({
  align = "left",
  showShortcuts = true,
  minDate,
  maxDate,
  viewYear,
  viewMonth,
  calendarDays,
  value,
  formattedDisplay,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onQuickSelect,
}: DatePickerPopoverProps) {
  return (
    <div
      role="dialog"
      aria-label="Wybierz datę"
      className={cn(
        "absolute z-50 mt-1 min-w-[280px] max-w-[calc(100vw-2rem)] p-2.5 rounded-[3px] border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100 [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-ring",
        align === "right" ? "right-0" : "left-0"
      )}
    >
      {/* Szybkie skróty */}
      {showShortcuts && (
        <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-border/60">
          <button
            type="button"
            disabled={isQuickDateDisabled("today", minDate, maxDate)}
            onClick={() => onQuickSelect("today")}
            className={cn(
              "px-2 py-1.5 text-[11px] font-semibold rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer",
              isQuickDateDisabled("today", minDate, maxDate) && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            Dziś
          </button>
          <button
            type="button"
            disabled={isQuickDateDisabled("yesterday", minDate, maxDate)}
            onClick={() => onQuickSelect("yesterday")}
            className={cn(
              "px-2 py-1.5 text-[11px] font-medium rounded bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer",
              isQuickDateDisabled("yesterday", minDate, maxDate) && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            Wczoraj
          </button>
          <button
            type="button"
            disabled={isQuickDateDisabled("lastWeek", minDate, maxDate)}
            onClick={() => onQuickSelect("lastWeek")}
            className={cn(
              "px-2 py-1.5 text-[11px] font-medium rounded bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer",
              isQuickDateDisabled("lastWeek", minDate, maxDate) && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            -7 dni
          </button>
          <button
            type="button"
            disabled={isQuickDateDisabled("startOfMonth", minDate, maxDate)}
            onClick={() => onQuickSelect("startOfMonth")}
            className={cn(
              "px-2 py-1.5 text-[11px] font-medium rounded bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer",
              isQuickDateDisabled("startOfMonth", minDate, maxDate) && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            1. dzień m-ca
          </button>
        </div>
      )}

      {/* Nagłówek Kalendarza: Miesiąc, Rok, Nawigacja */}
      <div className="flex items-center justify-between gap-1 mb-2 px-1">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Poprzedni miesiąc"
          className="size-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Poprzedni miesiąc"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1 font-bold text-xs">
          <span className="text-foreground">{MONTH_NAMES_PL[viewMonth]}</span>
          <span className="text-muted-foreground font-mono">{viewYear}</span>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Następny miesiąc"
          className="size-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          title="Następny miesiąc"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Dni tygodnia */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAY_NAMES_PL.map((w, idx) => (
          <span
            key={w}
            className={cn(
              "text-[10px] font-bold py-0.5",
              idx >= 5 ? "text-amber-600/80 dark:text-amber-400/80" : "text-muted-foreground"
            )}
          >
            {w}
          </span>
        ))}
      </div>

      {/* Siatka Dni */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((day, idx) => (
          <button
            key={`${day.dateIso}-${idx}`}
            type="button"
            aria-label={`${day.dayNum} ${MONTH_NAMES_PL[Number(day.dateIso.slice(5, 7)) - 1]} ${day.dateIso.slice(0, 4)}`}
            aria-pressed={day.isSelected}
            aria-current={day.isToday ? "date" : undefined}
            disabled={day.isDisabled}
            onClick={() => !day.isDisabled && onSelectDate(day.dateIso)}
            className={cn(
              "h-8 w-8 mx-auto rounded text-xs font-mono flex items-center justify-center transition-colors cursor-pointer",
              day.isSelected
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : day.isToday
                ? "border border-primary font-bold text-primary hover:bg-primary/15"
                : day.isCurrentMonth
                ? day.isWeekend
                  ? "text-amber-700 dark:text-amber-300 hover:bg-muted font-medium"
                  : "text-foreground hover:bg-muted"
                : "text-muted-foreground/40 hover:bg-muted/50 text-[11px]",
              day.isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            {day.dayNum}
          </button>
        ))}
      </div>

      {/* Stopka z aktualnie wybraną datą */}
      {value && (
        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="size-3 text-primary" /> {formattedDisplay}
          </span>
          <button
            type="button"
            disabled={isQuickDateDisabled("today", minDate, maxDate)}
            onClick={() => onQuickSelect("today")}
            className={cn(
              "text-[10px] text-primary hover:underline font-semibold cursor-pointer",
              isQuickDateDisabled("today", minDate, maxDate) && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            Ustaw dzisiejszą
          </button>
        </div>
      )}
    </div>
  );
}
