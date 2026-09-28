import type { ReactNode } from "react";
import { toast } from "sonner";
import { AlertCircle, Copy, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

interface GisReportListItemProps {
  label: string;
  value?: string | number;
  /** Własna prezentacja wartości (np. badge); kopiowany jest nadal `value` */
  display?: ReactNode;
  /** Pole bez danych w ewidencji — do uzupełnienia ręcznie */
  manualHint?: string;
  manualBadgeText?: string;
}

export async function copyGisValue(label: string, value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`Skopiowano: ${label}`);
  } catch {
    toast.error("Nie udało się skopiować do schowka");
  }
}

export function GisReportListItem({
  label,
  value,
  display,
  manualHint,
  manualBadgeText = "Do sprawdzenia samemu",
}: GisReportListItemProps) {
  const isManual = Boolean(manualHint);
  const text = value === undefined ? "" : typeof value === "number" ? String(value) : value;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-dashed px-4 py-2.5 transition-colors last:border-0 sm:flex-row sm:items-center sm:justify-between",
        isManual
          ? "border-amber-200/70 border-l-4 border-l-amber-500 bg-amber-50/40 pl-3.5 dark:border-amber-900/50 dark:bg-amber-950/20"
          : "border-border hover:bg-muted/40"
      )}
    >
      <div className="min-w-0 flex-1 pr-2">
        <span className={cn("block text-xs leading-relaxed text-foreground", isManual ? "font-bold" : "font-semibold")}>
          {label}
        </span>
        {manualHint && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300">
            <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
            <span>{manualHint}</span>
          </span>
        )}
      </div>

      <div className="flex min-w-[140px] shrink-0 items-center gap-1.5 sm:justify-end">
        {isManual ? (
          <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-amber-300 bg-amber-100/90 px-2.5 py-1 text-xs font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <FileEdit className="size-3 shrink-0" aria-hidden="true" />
            <span>{manualBadgeText}</span>
          </span>
        ) : (
          <>
            {display ?? (
              <span className="inline-block rounded-[2px] border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                {text || "-"}
              </span>
            )}
            <button
              type="button"
              onClick={() => copyGisValue(label, text)}
              disabled={!text}
              title="Kopiuj wartość"
              aria-label={`Kopiuj: ${label}`}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
