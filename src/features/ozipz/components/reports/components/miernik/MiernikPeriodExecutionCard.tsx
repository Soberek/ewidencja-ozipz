import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import type { MiernikWykonanieResult } from "../../../../utils/ozipzCalculations";

interface MiernikPeriodExecutionCardProps {
  periodLabel: string;
  year: string;
  filteredActionsCount: number;
  miernik: MiernikWykonanieResult;
}

export function MiernikPeriodExecutionCard({
  periodLabel,
  year,
  filteredActionsCount,
  miernik,
}: MiernikPeriodExecutionCardProps) {
  const fmt = (num: number) => num.toLocaleString("pl-PL");

  return (
    <Card className="p-4 bg-card border shadow-none space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <Target className="size-4 text-primary" />
            Wykonanie w wybranym okresie
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Okres: <strong>{periodLabel}</strong> {year !== "all" ? `(${year})` : ""}
          </p>
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {filteredActionsCount} wpisów
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground text-left">
              <th className="py-2 px-3 font-semibold">Miernik / składowa</th>
              <th className="py-2 px-3 font-semibold text-right">Działania</th>
              <th className="py-2 px-3 font-semibold text-right">Uczestnicy</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="py-2 px-3 font-semibold text-foreground">
                20.5.1.W: Razem działania i uczestnicy
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                {fmt(miernik.razem.actions)}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                {fmt(miernik.razem.people)}
              </td>
            </tr>
            <tr className="bg-primary/5">
              <td className="py-2 px-3 font-semibold text-primary">
                20.5.1.2.W: Programowe działania i uczestnicy
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                {fmt(miernik.programowe.actions)}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                {fmt(miernik.programowe.people)}
              </td>
            </tr>
            <tr>
              <td className="py-2 px-3 text-muted-foreground">↳ Nieprogramowe (akcje jednorazowe)</td>
              <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                {fmt(miernik.akcje.actions)}
              </td>
              <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                {fmt(miernik.akcje.people)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
