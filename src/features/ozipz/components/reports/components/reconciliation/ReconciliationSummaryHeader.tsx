import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, RotateCcw, ChevronUp, ChevronDown, Table as TableIcon } from "lucide-react";

interface ReconciliationSummaryHeaderProps {
  year: string;
  isOpen: boolean;
  mismatchesCount: number;
  hasAnyInputs: boolean;
  onToggleOpen: () => void;
  onAutofill: () => void;
  onClear: () => void;
}

export function ReconciliationSummaryHeader({
  year,
  isOpen,
  mismatchesCount,
  hasAnyInputs,
  onToggleOpen,
  onAutofill,
  onClear,
}: ReconciliationSummaryHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-[3px] bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <TableIcon className="size-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">
              Weryfikacja Miesięczna: Programowe / Nieprogramowe ({year})
            </h3>
            {hasAnyInputs && (
              <Badge
                variant="outline"
                className={`font-mono text-[10px] font-bold ${
                  mismatchesCount === 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                }`}
              >
                {mismatchesCount === 0 ? "✓ Wszystkie zgodne" : `⚠️ Różnice w ${mismatchesCount} msc`}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Wpisz swoje wartości oczekiwane dla każdego miesiąca, aby skontrolować poprawność zliczeń z bazą.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAutofill}
                className="h-7 px-2 text-[11px] gap-1 font-semibold"
              >
                <Copy className="size-3" />
                Kopiuj z bazy
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              Wypełnij wartości oczekiwane aktualnymi danymi z bazy
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Wyczyść wartości oczekiwane</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleOpen}
          className="h-7 w-7 p-0"
        >
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
