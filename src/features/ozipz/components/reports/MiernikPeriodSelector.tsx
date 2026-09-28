import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface MiernikPeriodSelectorProps {
  year: string;
  periodLabel: string;
  selectedMonths: number[];
  onSelectAll: () => void;
  onSelectHalfYear: (half: 1 | 2) => void;
  onSelectQuarter: (q: 1 | 2 | 3 | 4) => void;
  onToggleMonth: (m: number) => void;
}

const MONTH_NAMES = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
  "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
];

export function MiernikPeriodSelector({
  year,
  periodLabel,
  selectedMonths,
  onSelectAll,
  onSelectHalfYear,
  onSelectQuarter,
  onToggleMonth,
}: MiernikPeriodSelectorProps) {
  return (
    <Card className="p-3.5 bg-card border shadow-none space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <span className="font-bold text-foreground text-xs">Wybór Okresu Sprawozdawczego ({year}):</span>
          <Badge variant="outline" className="font-mono text-[11px] bg-primary/5 text-primary border-primary/20">
            {periodLabel} {year !== "all" ? year : ""}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-6 px-2 text-[11px]"
          >
            Wszystkie (I–XII)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectHalfYear(1)}
            className="h-6 px-2 text-[11px]"
          >
            I Półrocze (I–VI)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectHalfYear(2)}
            className="h-6 px-2 text-[11px]"
          >
            II Półrocze (VII–XII)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectQuarter(1)}
            className="h-6 px-1.5 text-[11px]"
          >
            Q1
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectQuarter(2)}
            className="h-6 px-1.5 text-[11px]"
          >
            Q2
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectQuarter(3)}
            className="h-6 px-1.5 text-[11px]"
          >
            Q3
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectQuarter(4)}
            className="h-6 px-1.5 text-[11px]"
          >
            Q4
          </Button>
        </div>
      </div>

      {/* Chipy miesięcy (1..12) */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {MONTH_NAMES.map((name, idx) => {
          const m = idx + 1;
          const isSelected = selectedMonths.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => onToggleMonth(m)}
              aria-pressed={isSelected}
              className={`h-8 px-2 rounded-[3px] text-xs font-bold transition-colors cursor-pointer border text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
