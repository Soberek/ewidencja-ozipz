import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import type { OzipzAction } from "../../types/ozipz.types";
import { compareJrwa, isProgramAction, extractCleanJrwaSymbol } from "../../utils/ozipzCalculations";
import { useDictionaries } from "../../store/useOzipzDbStore";

interface ProgramBreakdownTabProps {
  actions: OzipzAction[];
  year: string;
}

const isNumericJrwa = (val?: string | null) => Boolean(val && /^\d{3,4}(\.\d+)?$/.test(val));

const sanitizeJrwa = (jrwaSign?: string | null, jrwaCaseId?: string | null) => {
  if (jrwaSign && jrwaSign.trim()) return jrwaSign.trim();
  if (jrwaCaseId && isNumericJrwa(jrwaCaseId.trim())) return jrwaCaseId.trim();
  return "";
};

export function ProgramBreakdownTab({ actions, year }: ProgramBreakdownTabProps) {
  const { jrwaInterventionKindMap, jrwaInterventionNamesMap } = useDictionaries();

  const grouped = useMemo(() => {
    const yearActions = actions.filter(
      (a) => (!a.date || year === "all" || a.date.startsWith(year)) && a.status !== "odroczone"
    );

    const progMap = new Map<string, {
      jrwa: string;
      name: string;
      isProgramowe: boolean;
      totalActions: number;
      totalPeople: number;
      actionTypes: Map<string, { actions: number; people: number }>;
    }>();

    for (const a of yearActions) {
      const isProg = isProgramAction(a, jrwaInterventionKindMap);
      const cleanJrwa = extractCleanJrwaSymbol(a) || sanitizeJrwa(a.jrwaSign, a.jrwaCaseId);
      const name = a.programName || (cleanJrwa && jrwaInterventionNamesMap.get(cleanJrwa)) || (isProg ? "Program Profilaktyczny" : a.title || "Inicjatywa doraźna");
      const key = `${isProg ? "P" : "N"}|${cleanJrwa}|${name}`;

      if (!progMap.has(key)) {
        progMap.set(key, {
          jrwa: cleanJrwa,
          name,
          isProgramowe: isProg,
          totalActions: 0,
          totalPeople: 0,
          actionTypes: new Map(),
        });
      }

      const entry = progMap.get(key)!;
      const count = Number(a.numberOfActions) || 1;
      const people = Number(a.participantsCount) || 0;
      const form = a.title || a.actionType || "Działanie";

      entry.totalActions += count;
      entry.totalPeople += people;

      if (!entry.actionTypes.has(form)) {
        entry.actionTypes.set(form, { actions: 0, people: 0 });
      }
      const act = entry.actionTypes.get(form)!;
      act.actions += count;
      act.people += people;
    }

    const list = Array.from(progMap.values());
    list.sort((a, b) => {
      if (a.isProgramowe !== b.isProgramowe) return a.isProgramowe ? -1 : 1;
      const jCmp = compareJrwa(a.jrwa, b.jrwa);
      if (jCmp !== 0) return jCmp;
      return a.name.localeCompare(b.name, "pl");
    });

    const programowe = list.filter((p) => p.isProgramowe);
    const nieprogramowe = list.filter((p) => !p.isProgramowe);

    return { programowe, nieprogramowe };
  }, [actions, year, jrwaInterventionKindMap, jrwaInterventionNamesMap]);

  return (
    <div className="space-y-4">
      {/* Programowe */}
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-sky-600" />
            <h3 className="font-bold text-sm text-foreground">Programy Profilaktyczne (Programowe)</h3>
          </div>
          <Badge variant="outline" className="bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300">
            {grouped.programowe.length} programów
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                <th className="py-2.5 px-3 font-semibold">JRWA / Program</th>
                <th className="py-2.5 px-3 font-semibold">Forma Działania</th>
                <th className="py-2.5 px-3 font-semibold text-right">Liczba Działań</th>
                <th className="py-2.5 px-3 font-semibold text-right">Uczestnicy (osoby)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grouped.programowe.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                    Brak działań programowych w wybranym okresie
                  </td>
                </tr>
              ) : (
                grouped.programowe.map((p, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium align-top">
                      <div className="font-bold text-foreground line-clamp-2 break-words leading-tight">{p.name}</div>
                      {p.jrwa ? (
                        <div className="text-[11px] font-mono text-muted-foreground">JRWA: {p.jrwa}</div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic">Brak znaku EZD</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground align-top">
                      <div className="space-y-1">
                        {Array.from(p.actionTypes.entries()).map(([form, data], fi) => (
                          <div key={fi} className="flex justify-between gap-4">
                            <span>• {form}</span>
                            <span className="font-mono text-[11px] opacity-80">
                              {data.actions} dz. / {data.people} os.
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-700 dark:text-sky-300 align-top">
                      {p.totalActions}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-sky-700 dark:text-sky-300 align-top">
                      {p.totalPeople.toLocaleString("pl-PL")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Nieprogramowe */}
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Akcje i Inicjatywy Nieprogramowe</h3>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300">
            {grouped.nieprogramowe.length} obszarów
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                <th className="py-2.5 px-3 font-semibold">JRWA / Temat</th>
                <th className="py-2.5 px-3 font-semibold">Forma Działania</th>
                <th className="py-2.5 px-3 font-semibold text-right">Liczba Działań</th>
                <th className="py-2.5 px-3 font-semibold text-right">Uczestnicy (osoby)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grouped.nieprogramowe.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                    Brak działań nieprogramowych w wybranym okresie
                  </td>
                </tr>
              ) : (
                grouped.nieprogramowe.map((p, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium align-top">
                      <div className="font-bold text-foreground line-clamp-2 break-words leading-tight">{p.name}</div>
                      {p.jrwa ? (
                        <div className="text-[11px] font-mono text-muted-foreground">JRWA: {p.jrwa}</div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic">Brak znaku EZD</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground align-top">
                      <div className="space-y-1">
                        {Array.from(p.actionTypes.entries()).map(([form, data], fi) => (
                          <div key={fi} className="flex justify-between gap-4">
                            <span>• {form}</span>
                            <span className="font-mono text-[11px] opacity-80">
                              {data.actions} dz. / {data.people} os.
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-purple-700 dark:text-purple-300 align-top">
                      {p.totalActions}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-purple-700 dark:text-purple-300 align-top">
                      {p.totalPeople.toLocaleString("pl-PL")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
