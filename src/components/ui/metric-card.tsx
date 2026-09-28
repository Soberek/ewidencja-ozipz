import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MetricCardVariant =
  | "default"
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "rose"
  | "indigo"
  | "primary";

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtext?: string;
  icon: React.ReactNode;
  variant?: MetricCardVariant;
  onClick?: () => void;
  className?: string;
  badge?: React.ReactNode;
  active?: boolean;
  compact?: boolean;
  /** Dodatkowa treść pod podpisem (np. pasek postępu). */
  footer?: React.ReactNode;
  /** Opis akcji karty klikalnej (tooltip). */
  hint?: string;
}

const VARIANT_STYLES: Record<
  MetricCardVariant,
  {
    border: string;
    bg: string;
    title: string;
    value: string;
    iconBg: string;
    iconText: string;
    subtext: string;
  }
> = {
  default: {
    border: "border-border",
    bg: "bg-card",
    title: "text-muted-foreground",
    value: "text-foreground",
    iconBg: "bg-muted",
    iconText: "text-foreground",
    subtext: "text-muted-foreground",
  },
  primary: {
    border: "border-primary/25 dark:border-primary/30",
    bg: "bg-primary/5 dark:bg-primary/10",
    title: "text-primary",
    value: "text-primary",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconText: "text-primary",
    subtext: "text-primary/80",
  },
  blue: {
    border: "border-blue-500/25 dark:border-blue-500/30",
    bg: "bg-blue-500/5 dark:bg-blue-500/10",
    title: "text-blue-600 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    iconText: "text-blue-600 dark:text-blue-400",
    subtext: "text-blue-600/80 dark:text-blue-400/80",
  },
  emerald: {
    border: "border-emerald-500/25 dark:border-emerald-500/30",
    bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    title: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    iconText: "text-emerald-600 dark:text-emerald-400",
    subtext: "text-emerald-600/80 dark:text-emerald-400/80",
  },
  purple: {
    border: "border-purple-500/25 dark:border-purple-500/30",
    bg: "bg-purple-500/5 dark:bg-purple-500/10",
    title: "text-purple-600 dark:text-purple-400",
    value: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
    iconText: "text-purple-600 dark:text-purple-400",
    subtext: "text-purple-600/80 dark:text-purple-400/80",
  },
  amber: {
    border: "border-amber-500/25 dark:border-amber-500/30",
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    title: "text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    iconText: "text-amber-600 dark:text-amber-400",
    subtext: "text-amber-600/80 dark:text-amber-400/80",
  },
  rose: {
    border: "border-rose-500/25 dark:border-rose-500/30",
    bg: "bg-rose-500/5 dark:bg-rose-500/10",
    title: "text-rose-600 dark:text-rose-400",
    value: "text-rose-700 dark:text-rose-300",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
    iconText: "text-rose-600 dark:text-rose-400",
    subtext: "text-rose-600/80 dark:text-rose-400/80",
  },
  indigo: {
    border: "border-indigo-500/25 dark:border-indigo-500/30",
    bg: "bg-indigo-500/5 dark:bg-indigo-500/10",
    title: "text-indigo-600 dark:text-indigo-400",
    value: "text-indigo-700 dark:text-indigo-300",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    iconText: "text-indigo-600 dark:text-indigo-400",
    subtext: "text-indigo-600/80 dark:text-indigo-400/80",
  },
};

export function MetricCard({
  title,
  value,
  subtext,
  icon,
  variant = "default",
  onClick,
  className,
  badge,
  active,
  compact = false,
  footer,
  hint,
}: MetricCardProps) {
  const styles = VARIANT_STYLES[variant];
  const isClickable = Boolean(onClick);
  const titleNode = (
    <p className={cn("text-[10px] font-bold uppercase tracking-wider truncate", styles.title)}>{title}</p>
  );

  return (
    <Card
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      aria-pressed={isClickable && active !== undefined ? active : undefined}
      title={hint}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      } : undefined}
      className={cn(
        "group w-full rounded-[3px] border text-left shadow-none transition-all",
        compact ? "p-2" : "p-3",
        styles.border,
        styles.bg,
        isClickable && "cursor-pointer select-none hover:shadow-xs hover:border-foreground/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active && "ring-1 ring-primary ring-offset-1",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {badge ? (
            <div className="flex items-center gap-1.5">
              {titleNode}
              {badge}
            </div>
          ) : (
            titleNode
          )}
          <p
            className={cn(
              "font-mono font-bold tabular-nums truncate",
              compact ? "mt-0.5 text-lg leading-tight" : "mt-1 text-xl leading-none",
              styles.value
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full flex items-center justify-center transition-transform",
            compact ? "p-1.5" : "p-2",
            styles.iconBg,
            styles.iconText,
            isClickable && "group-hover:scale-105"
          )}
        >
          {icon}
        </div>
      </div>
      {subtext && (
        <p className={cn("text-[10px] truncate mt-1", styles.subtext)}>
          {subtext}
        </p>
      )}
      {footer}
    </Card>
  );
}

const STATS_GRID_COLUMNS = {
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5",
} as const;

export interface StatsGridProps {
  children: React.ReactNode;
  columns?: keyof typeof STATS_GRID_COLUMNS;
  className?: string;
}

/** Siatka kart KPI (`MetricCard`) — jednolite odstępy i punkty łamania we wszystkich sekcjach. */
export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return (
    <div className={cn("grid gap-3 select-none", STATS_GRID_COLUMNS[columns], className)}>
      {children}
    </div>
  );
}
