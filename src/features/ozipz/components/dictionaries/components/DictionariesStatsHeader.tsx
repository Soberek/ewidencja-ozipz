import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck, UserPlus, Link2, CircleOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "../dictionaryCategoryMeta";

export interface DictionariesStatsHeaderProps {
  categoryKey: string;
  categoryLabel: string;
  categoryDescription?: string;
  totalCount: number;
  systemCount: number;
  userCount: number;
  /** Pozycje wykorzystywane w co najmniej jednym rekordzie; undefined = kategoria bez śledzenia użycia. */
  usedCount?: number;
  /** Łączna liczba odwołań z rekordów do pozycji kategorii. */
  referencesCount?: number;
  usageModules?: Array<{ module: string; route: string }>;
  onShowUnused?: () => void;
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "neutral" | "emerald" | "amber" | "blue" | "rose";
  onClick?: () => void;
}) {
  const toneClass = {
    neutral: "text-muted-foreground",
    emerald: "text-emerald-700 dark:text-emerald-400",
    amber: "text-amber-700 dark:text-amber-400",
    blue: "text-blue-700 dark:text-blue-400",
    rose: "text-rose-700 dark:text-rose-400",
  }[tone];

  const content = (
    <>
      <Icon className={cn("size-3.5", toneClass)} />
      <span className="font-mono text-sm font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-[3px] px-1.5 py-0.5 -mx-1.5 hover:bg-muted cursor-pointer"
        title="Pokaż tylko nieużywane pozycje"
      >
        {content}
      </button>
    );
  }
  return <div className="flex items-center gap-1.5">{content}</div>;
}

export function DictionariesStatsHeader({
  categoryKey,
  categoryLabel,
  categoryDescription,
  totalCount,
  systemCount,
  userCount,
  usedCount,
  referencesCount,
  usageModules = [],
  onShowUnused,
}: DictionariesStatsHeaderProps) {
  const Icon = getCategoryIcon(categoryKey);
  const unusedCount = usedCount === undefined ? undefined : totalCount - usedCount;

  return (
    <header className="rounded-[3px] border border-border bg-card p-4 select-none">
      <div className="flex items-start gap-3">
        <div className="rounded-[3px] bg-muted p-2 text-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground leading-tight">{categoryLabel}</h2>
          {categoryDescription && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{categoryDescription}</p>
          )}
          {usageModules.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground">Wykorzystywany w:</span>
              {usageModules.map((m) => (
                <Link
                  key={m.module}
                  to={m.route}
                  className="inline-flex items-center gap-0.5 rounded-[2px] border border-border px-1.5 py-px font-medium text-foreground hover:bg-muted"
                >
                  {m.module}
                  <ArrowUpRight className="size-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3">
        <Stat icon={Icon} label="pozycji" value={totalCount} tone="neutral" />
        <Stat icon={ShieldCheck} label="systemowych" value={systemCount} tone="emerald" />
        <Stat icon={UserPlus} label="własnych" value={userCount} tone="amber" />
        {referencesCount !== undefined && (
          <Stat icon={Link2} label="odwołań w rekordach" value={referencesCount} tone="blue" />
        )}
        {unusedCount !== undefined && (
          <Stat
            icon={CircleOff}
            label="nieużywanych"
            value={unusedCount}
            tone="rose"
            onClick={unusedCount > 0 ? onShowUnused : undefined}
          />
        )}
      </div>
    </header>
  );
}
