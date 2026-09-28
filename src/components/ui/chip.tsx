import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-[3px] border px-2.5 text-[11px] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        primary: "",
        destructive: "",
        warning: "",
        info: "",
        success: "",
      },
      active: {
        true: "font-semibold",
        // Nieaktywny chip jest zawsze neutralny — ton ujawnia się dopiero po włączeniu filtra.
        false: "font-medium bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      },
    },
    compoundVariants: [
      { active: true, tone: "primary", className: "bg-primary text-primary-foreground border-primary hover:bg-primary/90" },
      { active: true, tone: "destructive", className: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90" },
      { active: true, tone: "warning", className: "bg-warning text-warning-foreground border-warning hover:bg-warning/90" },
      { active: true, tone: "info", className: "bg-info text-info-foreground border-info hover:bg-info/90" },
      { active: true, tone: "success", className: "bg-success text-success-foreground border-success hover:bg-success/90" },
    ],
    defaultVariants: { tone: "primary", active: false },
  }
);

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">,
    Omit<VariantProps<typeof chipVariants>, "active"> {
  active?: boolean;
  /** Licznik wyświetlany jako mała pigułka po etykiecie. */
  count?: number;
  icon?: React.ReactNode;
}

/** Przełączalny filtr szybki („chip”) — spójny wygląd i `aria-pressed` w całej aplikacji. */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, tone, count, icon, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={cn(chipVariants({ tone, active }), className)}
      {...props}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 font-mono text-[10px] leading-4 tabular-nums",
            active ? "bg-black/15 dark:bg-white/20" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
);
Chip.displayName = "Chip";

export interface ChipGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Etykieta grupy, np. „Szybkie filtry”. Dwukropek dodawany jest automatycznie. */
  label?: React.ReactNode;
  /** Treść wyrównana do prawej krawędzi wiersza (np. licznik wyników). */
  trailing?: React.ReactNode;
}

export function ChipGroup({ label, trailing, className, children, ...props }: ChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={typeof label === "string" ? label : undefined}
      className={cn("flex flex-wrap items-center gap-1.5 text-xs", className)}
      {...props}
    >
      {label && (
        <span className="mr-0.5 text-[11px] font-semibold text-muted-foreground">
          {label}:
        </span>
      )}
      {children}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

export { chipVariants };
