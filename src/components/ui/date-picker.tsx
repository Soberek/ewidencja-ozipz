import * as React from "react";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePickerPopover } from "./DatePickerPopover";

export interface DatePickerProps {
  value?: string; // Format ISO: YYYY-MM-DD
  onChange?: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showShortcuts?: boolean;
  allowClear?: boolean;
  align?: "left" | "right";
  id?: string;
  name?: string;
}

import {
  formatDateDisplay,
  getDayOfWeekShort,
  generateCalendarDays,
  getQuickDateIso,
  isQuickDateDisabled,
  type DatePickerQuickSelectType,
} from "./datePickerUtils";

export function DatePicker({
  value = "",
  onChange,
  placeholder = "Wybierz datę...",
  minDate,
  maxDate,
  disabled = false,
  required = false,
  className,
  size = "sm",
  showShortcuts = true,
  allowClear = false,
  align = "left",
  id,
  name,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Parsowanie wartości początkowej do widoku kalendarza
  const initialDate = React.useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = React.useState(initialDate.year);
  const [viewMonth, setViewMonth] = React.useState(initialDate.month);

  // Synchronizacja widoku przy zmianie wartości z zewnątrz
  React.useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  // Obsługa kliknięcia poza komponentem oraz klawisza Escape (zamknięcie popovera)
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Obliczanie dni w bieżącym miesiącu do siatki 6x7
  const calendarDays = React.useMemo(() => {
    return generateCalendarDays({ viewYear, viewMonth, value, minDate, maxDate });
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (dateIso: string) => {
    if (disabled) return;
    if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return;
    if (minDate && dateIso < minDate) return;
    if (maxDate && dateIso > maxDate) return;
    onChange?.(dateIso);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleQuickSelect = (type: DatePickerQuickSelectType) => {
    if (isQuickDateDisabled(type, minDate, maxDate)) return;
    const iso = getQuickDateIso(type);
    handleSelectDate(iso);
  };

  const handleClear = () => {
    onChange?.("");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-2.5",
    md: "h-9 text-xs px-3",
    lg: "h-10 text-sm px-3.5",
  };

  const dayOfWeek = getDayOfWeekShort(value);
  const formattedDisplay = formatDateDisplay(value);

  return (
    <div
      ref={containerRef}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOpen(false);
      }}
      className={cn("relative inline-block w-full select-none", className)}
    >
      {/* Wartość dla formularza; walidacja pól wymaganych należy do formularza. */}
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}

      {/* Przycisk wyzwalający DatePicker */}
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-required={required || undefined}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "flex w-full items-center justify-between gap-1.5 rounded-[3px] border border-input bg-background font-mono transition-colors text-left shadow-none",
            sizeClasses[size],
            disabled
              ? "cursor-not-allowed bg-muted opacity-60 text-muted-foreground"
              : "cursor-pointer hover:border-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring",
            isOpen && "ring-2 ring-ring/20 border-ring",
            !value && "text-muted-foreground font-sans font-normal"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <CalendarIcon className={cn("size-3.5 shrink-0 transition-colors", value ? "text-primary" : "text-muted-foreground")} />
            {value ? (
              <span className="font-bold text-foreground font-mono tracking-tight">
                {formattedDisplay}
                {dayOfWeek && (
                  <span className="ml-1 text-[10px] font-sans font-medium text-muted-foreground lowercase">
                    ({dayOfWeek})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">{placeholder}</span>
            )}
          </div>

          <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", allowClear && value && !disabled && "ml-7", isOpen && "rotate-180")} />
        </button>

        {allowClear && value && !disabled && (
          <button
            type="button"
            aria-label="Wyczyść datę"
            onClick={handleClear}
            className="absolute right-7 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Popover Kalendarza */}
      {isOpen && (
        <DatePickerPopover
          align={align}
          showShortcuts={showShortcuts}
          minDate={minDate}
          maxDate={maxDate}
          viewYear={viewYear}
          viewMonth={viewMonth}
          calendarDays={calendarDays}
          value={value}
          formattedDisplay={formattedDisplay}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={handleSelectDate}
          onQuickSelect={handleQuickSelect}
        />
      )}
    </div>
  );
}
