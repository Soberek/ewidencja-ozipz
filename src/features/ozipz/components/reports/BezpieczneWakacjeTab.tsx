import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Sun, Users, Package, Activity } from "lucide-react";
import type { OzipzAction } from "../../types/ozipz.types";
import {
  buildBezpieczneWakacjeSummary,
  BEZPIECZNE_WAKACJE_JRWA,
} from "../../utils/bezpieczneWakacjeUtils";
import { Chip } from "@/components/ui/chip";


interface BezpieczneWakacjeTabProps {
  actions: OzipzAction[];
  year: string;
}

const SUMMER_MONTHS = [6, 7, 8];
const WINTER_MONTHS = [1, 2];

export function BezpieczneWakacjeTab({ actions, year }: BezpieczneWakacjeTabProps) {
  const rok = parseInt(year, 10) || new Date().getFullYear();
  const [selectedMonths, setSelectedMonths] = useState<number[]>(SUMMER_MONTHS);

  const toggleMonth = (m: number) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const summary = useMemo(() => {
    return buildBezpieczneWakacjeSummary(actions, {
      rok,
      months: selectedMonths,
      jrwa: BEZPIECZNE_WAKACJE_JRWA,
    });
  }, [actions, rok, selectedMonths]);

  return (
    <div className="space-y-4">
      {/* Pasek wyboru okresu (Wakacje / Ferie / Miesiące) */}
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-[3px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Sun className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Bezpieczne Wakacje i Ferie (JRWA 966.14)
              </h3>
              <p className="text-xs text-muted-foreground">
                Raport z wypoczynku letniego i zimowego dla roku {rok}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Chip className="h-8 px-3 text-xs" active={selectedMonths.length === 3 && SUMMER_MONTHS.every((m) => selectedMonths.includes(m))} onClick={() => setSelectedMonths(SUMMER_MONTHS)}>
              🏖 Wakacje (VI–VIII)
            </Chip>
            <Chip className="h-8 px-3 text-xs" active={selectedMonths.length === 2 && WINTER_MONTHS.every((m) => selectedMonths.includes(m))} onClick={() => setSelectedMonths(WINTER_MONTHS)}>
              ❄ Ferie (I–II)
            </Chip>
          </div>
        </div>

        {/* Chipy miesięcy */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const isSelected = selectedMonths.includes(m);
            const names = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
            return (
              <Chip key={m} active={isSelected} onClick={() => toggleMonth(m)} className="text-xs">
                {names[m - 1]}
              </Chip>
            );
          })}
        </div>
      </Card>

      {/* Główne KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-card border shadow-none space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Zadań / Interwencji</span>
          <div className="text-2xl font-black text-foreground">{summary.zadaniaCount}</div>
          <span className="text-[11px] text-muted-foreground">
            {summary.allActions} zrealizowanych działań
          </span>
        </Card>

        <Card className="p-4 bg-card border shadow-none space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Odbiorcy Łącznie</span>
          <div className="text-2xl font-black text-primary">
            {summary.allPeople.toLocaleString("pl-PL")}
          </div>
          <span className="text-[11px] text-muted-foreground">uczestników wypoczynku</span>
        </Card>

        <Card className="p-4 bg-card border shadow-none space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Dzieci (z podanym wiekiem)</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {summary.odbiorcySplit.zWiekiem.toLocaleString("pl-PL")}
          </div>
          <span className="text-[11px] text-muted-foreground">
            + {summary.odbiorcySplit.dorosli} dorosłych
          </span>
        </Card>

        <Card className="p-4 bg-card border shadow-none space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">Wydane Materiały</span>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
            {summary.allMaterialy.toLocaleString("pl-PL")}
          </div>
          <span className="text-[11px] text-muted-foreground">sztuk ulotek i poradników</span>
        </Card>
      </div>

      {/* Panele analityczne */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formy działań */}
        <Card className="p-4 bg-card border shadow-none space-y-3">
          <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
            <Activity className="size-4 text-primary" />
            Formy Działań Edukacyjnych
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="py-2 px-2.5 text-left">Forma</th>
                  <th className="py-2 px-2.5 text-right">Zadań</th>
                  <th className="py-2 px-2.5 text-right">Działań</th>
                  <th className="py-2 px-2.5 text-right">Odbiorców</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.byDzialanie.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                      Brak działań w wybranym okresie
                    </td>
                  </tr>
                ) : (
                  summary.byDzialanie.map((d, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2.5 font-medium">{d.name}</td>
                      <td className="py-2 px-2.5 text-right">{d.zadania}</td>
                      <td className="py-2 px-2.5 text-right font-semibold">{d.actions}</td>
                      <td className="py-2 px-2.5 text-right font-bold text-primary">
                        {d.people.toLocaleString("pl-PL")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Grupy wiekowe */}
        <Card className="p-4 bg-card border shadow-none space-y-3">
          <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
            <Users className="size-4 text-emerald-600" />
            Przedziały Wiekowe Odbiorców
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="py-2 px-2.5 text-left">Przedział Wieku</th>
                  <th className="py-2 px-2.5 text-right">Liczba Osób</th>
                  <th className="py-2 px-2.5 text-right">Pozycji</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.byWiek.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground italic">
                      Brak odbiorców z wypełnionym wiekiem
                    </td>
                  </tr>
                ) : (
                  summary.byWiek.map((w, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2.5 font-medium">{w.label}</td>
                      <td className="py-2 px-2.5 text-right font-bold text-emerald-700 dark:text-emerald-300">
                        {w.people.toLocaleString("pl-PL")}
                      </td>
                      <td className="py-2 px-2.5 text-right text-muted-foreground">{w.rows}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Materiały */}
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
          <Package className="size-4 text-amber-600" />
          Rozdystrybuowane Materiały Oświatowe
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-2 px-2.5 text-left">Tytuł Materiału</th>
                <th className="py-2 px-2.5 text-left">Typ</th>
                <th className="py-2 px-2.5 text-right">Liczba Sztuk</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {summary.byMaterial.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground italic">
                    Brak rozdanych materiałów w wybranym okresie
                  </td>
                </tr>
              ) : (
                summary.byMaterial.map((m, i) => (
                  <tr key={i}>
                    <td className="py-2 px-2.5 font-medium">{m.name}</td>
                    <td className="py-2 px-2.5 text-muted-foreground">{m.typ}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-amber-700 dark:text-amber-300">
                      {m.sztuki.toLocaleString("pl-PL")} szt.
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
