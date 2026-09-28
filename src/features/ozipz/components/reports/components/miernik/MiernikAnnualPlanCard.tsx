import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import type { MiernikPlanInput, MiernikWykonanieResult } from "../../../../utils/ozipzCalculations";

interface MiernikAnnualPlanCardProps {
  year: string;
  plan: MiernikPlanInput;
  miernik: MiernikWykonanieResult;
  onPlanChange: (key: keyof MiernikPlanInput, value: string) => void;
}

export function MiernikAnnualPlanCard({
  year,
  plan,
  miernik,
  onPlanChange,
}: MiernikAnnualPlanCardProps) {
  const pct = (val: number | null) => (val === null ? "—" : `${val}%`);

  return (
    <Card className="p-4 bg-card border shadow-none space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <Sparkles className="size-4 text-amber-500" />
            Roczny Plan Bazowy ({year})
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Wartości oczekiwane według planu pracy WSSE Szczecin
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          Edytowalny
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground text-left">
              <th className="py-2 px-3 font-semibold">Miernik</th>
              <th className="py-2 px-3 font-semibold text-center w-24">Plan dział.</th>
              <th className="py-2 px-3 font-semibold text-right w-16">%</th>
              <th className="py-2 px-3 font-semibold text-center w-24">Plan ucz.</th>
              <th className="py-2 px-3 font-semibold text-right w-16">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="py-2 px-3 font-semibold text-foreground">20.5.1.W (Razem)</td>
              <td className="py-1.5 px-2 text-center">
                <Input
                  type="number"
                  value={plan.razem_dzialania ?? ""}
                  onChange={(e) => onPlanChange("razem_dzialania", e.target.value)}
                  className="h-7 text-xs font-mono text-center px-1"
                />
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold text-foreground">
                {pct(miernik.procenty.razemDzialania)}
              </td>
              <td className="py-1.5 px-2 text-center">
                <Input
                  type="number"
                  value={plan.razem_uczestnicy ?? ""}
                  onChange={(e) => onPlanChange("razem_uczestnicy", e.target.value)}
                  className="h-7 text-xs font-mono text-center px-1"
                />
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold text-foreground">
                {pct(miernik.procenty.razemUczestnicy)}
              </td>
            </tr>
            <tr className="bg-primary/5">
              <td className="py-2 px-3 font-semibold text-primary">20.5.1.2.W (Programy)</td>
              <td className="py-1.5 px-2 text-center">
                <Input
                  type="number"
                  value={plan.programy_dzialania ?? ""}
                  onChange={(e) => onPlanChange("programy_dzialania", e.target.value)}
                  className="h-7 text-xs font-mono text-center px-1"
                />
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold text-primary">
                {pct(miernik.procenty.programyDzialania)}
              </td>
              <td className="py-1.5 px-2 text-center">
                <Input
                  type="number"
                  value={plan.programy_uczestnicy ?? ""}
                  onChange={(e) => onPlanChange("programy_uczestnicy", e.target.value)}
                  className="h-7 text-xs font-mono text-center px-1"
                />
              </td>
              <td className="py-2 px-2 text-right font-mono font-bold text-primary">
                {pct(miernik.procenty.programyUczestnicy)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
