import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Podpowiedź; dla opcji bez etykiety służy też jako nazwa dostępna. */
  title?: string;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedControlOption<T>[];
  "aria-label": string;
  size?: "sm" | "md";
  className?: string;
}

/** Przełącznik widoków / zakładek (Tabela | Kanban | Kalendarz itp.). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-[3px] border border-border bg-muted/60 p-0.5",
        size === "sm" ? "h-7" : "h-8",
        className
      )}
    >
      {options.map(({ value: optionValue, label, icon: Icon, title, count }) => {
        const isActive = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={isActive}
            aria-label={label ? undefined : title}
            title={title}
            onClick={() => onChange(optionValue)}
            className={cn(
              "inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[2px] text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              label ? "px-2.5" : "aspect-square px-0",
              isActive
                ? "bg-card font-semibold text-foreground shadow-xs ring-1 ring-border/60"
                : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            {label && <span>{label}</span>}
            {count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 font-mono text-[10px] leading-4 tabular-nums",
                  isActive ? "bg-primary/10 text-primary" : "bg-background/80 text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
