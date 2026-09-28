import * as React from "react";
import { ChevronDown, ChevronUp, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface FilterBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Główne kontrolki filtrów (wyszukiwarka, listy wyboru) — lewa strona. */
  children?: React.ReactNode;
  /** Przyciski akcji (KPI, eksport, „Nowy…”) — prawa strona. */
  actions?: React.ReactNode;
  /** Dodatkowe wiersze (np. grupy chipów) oddzielone linią od głównego wiersza. */
  rows?: React.ReactNode;
}

/**
 * Wspólny pasek narzędzi sekcji: karta z wyszukiwarką i filtrami po lewej,
 * akcjami po prawej oraz opcjonalnymi wierszami szybkich filtrów pod spodem.
 * Wszystkie kontrolki w pasku mają wysokość h-8.
 */
export function FilterBar({ children, actions, rows, className, ...props }: FilterBarProps) {
  return (
    <div
      className={cn("rounded-[3px] border border-border bg-card p-2.5 space-y-2 select-none", className)}
      {...props}
    >
      {(children || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {children && <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>}
          {actions && <div className="ml-auto flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
      )}
      {rows && (
        <div className={cn("space-y-2", (children || actions) && "border-t border-border/60 pt-2")}>{rows}</div>
      )}
    </div>
  );
}

export interface KpiToggleButtonProps {
  visible: boolean;
  onToggle: () => void;
  className?: string;
}

/** Przycisk zwijania/rozwijania kart podsumowania KPI — identyczny w każdej sekcji. */
export function KpiToggleButton({ visible, onToggle, className }: KpiToggleButtonProps) {
  const label = visible ? "Zwiń KPI" : "Pokaż KPI";
  return (
    <Button
      variant="outline"
      onClick={onToggle}
      aria-expanded={visible}
      aria-label={label}
      title={visible ? "Zwiń karty podsumowania KPI" : "Rozwiń karty podsumowania KPI"}
      className={cn("gap-1.5 font-medium", className)}
    >
      {visible ? (
        <ChevronUp className="size-3.5 text-muted-foreground" />
      ) : (
        <ChevronDown className="size-3.5 text-muted-foreground" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export interface ClearFiltersButtonProps {
  onClick: () => void;
  /** Liczba aktywnych filtrów; pomijana, gdy 0 lub brak. */
  count?: number;
  label?: string;
  className?: string;
}

export function ClearFiltersButton({ onClick, count, label = "Wyczyść", className }: ClearFiltersButtonProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn("gap-1 px-2 font-medium text-muted-foreground hover:text-foreground", className)}
    >
      <FilterX className="size-3.5" />
      <span>
        {label}
        {count ? ` (${count})` : ""}
      </span>
    </Button>
  );
}

export interface ResultsCountProps {
  shown: number;
  total?: number;
  label?: string;
  className?: string;
}

/** Licznik wyników filtrowania („Wyniki: 12 z 95”) z `aria-live`. */
export function ResultsCount({ shown, total, label = "Wyniki", className }: ResultsCountProps) {
  return (
    <span className={cn("text-[11px] text-muted-foreground", className)} aria-live="polite">
      {label}: <strong className="font-mono text-foreground tabular-nums">{shown}</strong>
      {total !== undefined && total !== shown && (
        <>
          {" "}z <span className="font-mono tabular-nums">{total}</span>
        </>
      )}
    </span>
  );
}
