import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MiernikWykonanieResult } from "../../utils/ozipzCalculations";

interface MiernikKpiCardsProps {
  miernik: MiernikWykonanieResult;
}

export function MiernikKpiCards({ miernik }: MiernikKpiCardsProps) {
  const fmt = (num: number) => num.toLocaleString("pl-PL");
  const pct = (val: number | null) => (val === null ? "—" : `${val}%`);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
      <Card className="p-3.5 bg-card border shadow-none space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">20.5.1.W Działania Ogółem</span>
          <Badge variant="outline" className="font-bold text-primary font-mono">
            {pct(miernik.procenty.razemDzialania)}
          </Badge>
        </div>
        <div className="text-xl font-black text-foreground">
          {fmt(miernik.razem.actions)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            / {fmt(miernik.planowane.razemDzialania)} plan
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, miernik.procenty.razemDzialania || 0)}%` }}
          />
        </div>
      </Card>

      <Card className="p-3.5 bg-card border shadow-none space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">20.5.1.W Uczestnicy Ogółem</span>
          <Badge variant="outline" className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {pct(miernik.procenty.razemUczestnicy)}
          </Badge>
        </div>
        <div className="text-xl font-black text-foreground">
          {fmt(miernik.razem.people)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            / {fmt(miernik.planowane.razemUczestnicy)} plan
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, miernik.procenty.razemUczestnicy || 0)}%` }}
          />
        </div>
      </Card>

      <Card className="p-3.5 bg-card border shadow-none space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">20.5.1.2.W Działania Programowe</span>
          <Badge variant="outline" className="font-bold text-sky-700 dark:text-sky-300 font-mono">
            {pct(miernik.procenty.programyDzialania)}
          </Badge>
        </div>
        <div className="text-xl font-black text-foreground">
          {fmt(miernik.programowe.actions)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            / {fmt(miernik.planowane.programyDzialania)} plan
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-sky-600 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, miernik.procenty.programyDzialania || 0)}%` }}
          />
        </div>
      </Card>

      <Card className="p-3.5 bg-card border shadow-none space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">20.5.1.2.W Uczestnicy Programów</span>
          <Badge variant="outline" className="font-bold text-purple-700 dark:text-purple-300 font-mono">
            {pct(miernik.procenty.programyUczestnicy)}
          </Badge>
        </div>
        <div className="text-xl font-black text-foreground">
          {fmt(miernik.programowe.people)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            / {fmt(miernik.planowane.programyUczestnicy)} plan
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-purple-600 h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, miernik.procenty.programyUczestnicy || 0)}%` }}
          />
        </div>
      </Card>
    </div>
  );
}
