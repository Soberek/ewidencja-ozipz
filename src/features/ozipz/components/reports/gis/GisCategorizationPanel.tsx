import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { GisCategorizationStats, GisUnclassifiedAction } from "../../../utils/gis";

interface GisCategorizationPanelProps {
  stats: GisCategorizationStats;
}

function describeReason({ reason, symbol }: GisUnclassifiedAction): string {
  if (reason === "brak-symbolu") return "Brak symbolu JRWA — przypisz program lub znak sprawy";
  if (reason === "brak-kategorii") return `JRWA ${symbol} bez kategorii GIS — ustaw ją w Słownikach`;
  return `JRWA ${symbol} — oznaczony jako poza sprawozdaniem GIS`;
}

export function GisCategorizationPanel({ stats }: GisCategorizationPanelProps) {
  const [showRows, setShowRows] = useState(false);
  const problems = stats.unclassified.filter((row) => row.reason !== "poza-sprawozdaniem");
  const excludedCount = stats.unclassified.length - problems.length;
  const fullyCategorized = stats.categorizedActions === stats.totalActions;

  return (
    <Card className="rounded-[3px] border border-border shadow-none">
      <CardContent className="space-y-2 p-3.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Nadzór kategoryzacji (wszystkie działania okresu vs przypisane do obszarów GIS)
          </h4>
        </div>

        <p className="text-xs text-muted-foreground">
          Łącznie w okresie: <strong className="text-foreground">Działania: {stats.totalActions}</strong> |{" "}
          <strong className="text-foreground">Odbiorcy: {stats.totalRecipients}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Złapane przez obszary GIS:{" "}
          <span className={cn("font-bold", fullyCategorized ? "text-emerald-600" : "text-amber-600")}>
            Działania: {stats.categorizedActions} ({stats.categorizedPercentage.toFixed(1)}%) | Odbiorcy: {stats.categorizedRecipients}
          </span>
        </p>

        {problems.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-[3px] border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>
              <strong>{problems.length}</strong> działań nie trafiło do żadnego obszaru — uzupełnij symbol JRWA lub kategorię GIS w Słownikach.
            </span>
          </div>
        )}
        {excludedCount > 0 && (
          <div className="flex items-start gap-2.5 rounded-[3px] border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="text-foreground">{excludedCount}</strong> działań ma symbol JRWA oznaczony w Słownikach jako „nie wchodzi do
              sprawozdania GIS” (np. 0442, 9011).
            </span>
          </div>
        )}

        {stats.unclassified.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowRows((open) => !open)}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {showRows ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              {showRows ? "Ukryj" : "Pokaż"} działania spoza obszarów GIS ({stats.unclassified.length})
            </button>
            {showRows && (
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-[3px] border border-border bg-muted/30 p-3 font-mono text-xs">
                {stats.unclassified.map((row) => (
                  <div key={row.action.id} className="truncate border-b border-border/60 py-0.5 last:border-0">
                    <span className="text-muted-foreground">{row.action.date} · </span>
                    <span className="font-semibold text-foreground">{row.action.programName || row.action.title}</span>
                    <span
                      className={cn(
                        "font-semibold",
                        row.reason === "poza-sprawozdaniem" ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400"
                      )}
                    >
                      {" "}| {describeReason(row)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
