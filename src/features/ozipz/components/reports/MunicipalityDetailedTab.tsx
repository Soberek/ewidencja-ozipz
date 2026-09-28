import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import type {
  OzipzAction,
  OzipzSchoolParticipation,
  OzipzFacility,
  OzipzDistribution,
} from "../../types/ozipz.types";
import { calculateMunicipalityDetailedBreakdown } from "../../utils/ozipzCalculations";
import { SearchInput } from "@/components/ui/search-input";

interface MunicipalityDetailedTabProps {
  participations: OzipzSchoolParticipation[];
  actions: OzipzAction[];
  facilities?: OzipzFacility[];
  distributions?: OzipzDistribution[];
  municipalities?: string[];
}

export function MunicipalityDetailedTab({
  participations,
  actions,
  facilities = [],
  distributions = [],
  municipalities = [],
}: MunicipalityDetailedTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(() => {
    return calculateMunicipalityDetailedBreakdown(
      participations,
      actions,
      facilities,
      distributions,
      municipalities
    );
  }, [participations, actions, facilities, distributions, municipalities]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((r) => r.municipality.toLowerCase().includes(query));
  }, [rows, searchQuery]);

  return (
    <div className="space-y-4 select-none">
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b pb-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-foreground">
              Zbiorcze Zestawienie Gminne (Teren Działania PSSE)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput
              size="sm"
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Filtruj gminy..."
              containerClassName="w-48 min-w-0 flex-none"
            />
            <Badge variant="success-soft" className="h-7">
              {filteredRows.length} {filteredRows.length === 1 ? "gmina" : filteredRows.length < 5 ? "gminy" : "gmin"}
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                <th className="py-2.5 px-3 font-semibold">Gmina</th>
                <th className="py-2.5 px-3 font-semibold text-right">Placówek</th>
                <th className="py-2.5 px-3 font-semibold text-right">Udziałów w Prog.</th>
                <th className="py-2.5 px-3 font-semibold text-right">Działań Terenowych</th>
                <th className="py-2.5 px-3 font-semibold text-right">Objętych Uczniów</th>
                <th className="py-2.5 px-3 font-semibold text-right">Objętych Rodziców</th>
                <th className="py-2.5 px-3 font-semibold text-right">Wydane Materiały</th>
                <th className="py-2.5 px-3 font-semibold text-right">Sprawozdawczość</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground italic">
                    Brak gmin spełniających kryteria wyszukiwania
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      <span className="line-clamp-2 break-words leading-tight">{r.municipality}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">{r.facilitiesCount}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{r.participationsCount}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-primary">{r.actionsCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
                      {r.pupilsCount.toLocaleString("pl-PL")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">
                      {r.parentsCount.toLocaleString("pl-PL")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-300 font-medium">
                      {r.materialsDistributed.toLocaleString("pl-PL")} szt.
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      <Badge variant={r.reportingRate >= 80 ? "default" : "secondary"} className="text-[10px]">
                        {r.reportingRate}% ({r.finalReportsCount}/{r.participationsCount})
                      </Badge>
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
