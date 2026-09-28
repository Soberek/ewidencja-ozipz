import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AggregatedMiernikData } from "../../../../utils/reportAnnex";

interface MiernikAnnexProgramsTableProps {
  aggregatedData: AggregatedMiernikData;
}

export function MiernikAnnexProgramsTable({ aggregatedData }: MiernikAnnexProgramsTableProps) {
  const rows = useMemo(() => {
    const list: { lp: number; name: string; type: string; actionsCount: number; peopleCount: number }[] = [];
    let lp = 1;

    for (const [type, progs] of Object.entries(aggregatedData.aggregated || {})) {
      for (const [progName, actions] of Object.entries(progs || {})) {
        let totalActions = 0;
        let totalPeople = 0;
        for (const counts of Object.values(actions || {})) {
          totalActions += counts.actionNumber;
          totalPeople += counts.people;
        }
        list.push({
          lp: lp++,
          name: progName,
          type,
          actionsCount: totalActions,
          peopleCount: totalPeople,
        });
      }
    }
    return list;
  }, [aggregatedData]);

  return (
    <Card className="rounded-[3px] border border-border/80 bg-card shadow-none">
      <CardContent className="space-y-2 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Zestawienie Programów i Akcji Zdrowotnych (Dane do Załącznika nr 1 / Edu-Report)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Programy profilaktyczne oraz interwencje nieprogramowe.
            </p>
          </div>
          <Badge variant="outline" className="rounded-[2px] font-mono text-[10px]">
            {rows.length} pozycji
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-[3px] border border-border/80 bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="w-12 px-3 py-2 text-center">
                  Lp.
                </th>
                <th scope="col" className="px-3 py-2">
                  Nazwa Programu / Akcji
                </th>
                <th scope="col" className="w-32 px-3 py-2">
                  Typ
                </th>
                <th scope="col" className="w-28 px-3 py-2 text-right">
                  L. działań
                </th>
                <th scope="col" className="w-28 px-3 py-2 text-right">
                  L. osób (uczestników)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((item) => (
                <tr key={item.lp} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground font-semibold">
                    {item.lp}
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-foreground">
                    <span className="line-clamp-2 break-words leading-tight">{item.name}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {item.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                    {item.actionsCount.toLocaleString("pl-PL")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground">
                    {item.peopleCount.toLocaleString("pl-PL")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-muted/30 font-bold">
              <tr>
                <td colSpan={3} className="px-3 py-2.5 text-xs uppercase tracking-wider text-foreground">
                  Razem Działania Edukacyjne (20.5.1.W)
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm text-foreground">
                  {aggregatedData.allActions.toLocaleString("pl-PL")}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm text-foreground">
                  {aggregatedData.allPeople.toLocaleString("pl-PL")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
