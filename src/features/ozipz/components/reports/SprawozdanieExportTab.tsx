import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, UserCheck } from "lucide-react";
import type { OzipzAction } from "../../types/ozipz.types";
import { downloadAnnexReportExcel, buildReportAnnexRows } from "../../utils/reportAnnex";

interface SprawozdanieExportTabProps {
  actions: OzipzAction[];
  year: string;
}

export function SprawozdanieExportTab({ actions, year }: SprawozdanieExportTabProps) {
  const [preparedBy, setPreparedBy] = useState(() => {
    return localStorage.getItem("oz.sprawozdanie.preparedBy") || "Pracownik OZiPZ";
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  const handlePreparedByChange = (val: string) => {
    setPreparedBy(val);
    localStorage.setItem("oz.sprawozdanie.preparedBy", val);
  };

  const yearActions = actions.filter(
    (a) => (!a.date || year === "all" || a.date.startsWith(year)) && a.status !== "odroczone"
  );
  const totalActions = yearActions.reduce((acc, a) => acc + (Number(a.numberOfActions) || 1), 0);
  const totalPeople = yearActions.reduce((acc, a) => acc + (Number(a.participantsCount) || 0), 0);

  const handleExportAnnex = async (annexType: "annex1" | "annex2") => {
    setDownloading(annexType);
    try {
      const numericYear = parseInt(year, 10) || new Date().getFullYear();
      const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
      const rows = buildReportAnnexRows(yearActions);
      await downloadAnnexReportExcel(
        rows,
        annexType === "annex1" ? 1 : 2,
        numericYear,
        allMonths,
        preparedBy
      );

    } finally {
      setDownloading(null);
    }
  };


  return (
    <div className="space-y-4">
      {/* Osoba sporządzająca */}
      <Card className="p-4 bg-card border shadow-none space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="size-4 text-primary" />
          <h3 className="font-bold text-xs text-foreground">Osoba Odpowiedzialna za Sporządzenie Sprawozdania</h3>
        </div>
        <div className="max-w-md space-y-1">
          <Label className="text-xs text-muted-foreground">Imię i nazwisko / stanowisko służbowe</Label>
          <Input
            value={preparedBy}
            onChange={(e) => handlePreparedByChange(e.target.value)}
            placeholder="np. Jan Kowalski - Starszy Asystent"
            className="h-9 text-xs"
          />
        </div>
      </Card>

      {/* Karty Załączników GIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Załącznik nr 1 */}
        <Card className="p-5 bg-card border shadow-none space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-primary">Załącznik 01</span>
              <Badge variant="outline" className="bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                Sprawozdanie Okresowe
              </Badge>
            </div>
            <h4 className="font-bold text-base text-foreground">Załącznik nr 1 do Sprawozdania GIS</h4>
            <p className="text-xs text-muted-foreground">
              Mierniki działalności oświatowo-zdrowotnej za wybrany okres sprawozdawczy (rok {year}). W arkuszu zawarte są formuły kalkulacji sum oraz struktura programowa.
            </p>
            <div className="text-xs text-foreground font-semibold pt-1">
              Podsumowanie: {totalActions} działań · {totalPeople.toLocaleString("pl-PL")} uczestników
            </div>
          </div>

          <Button
            onClick={() => handleExportAnnex("annex1")}
            disabled={downloading !== null}
            className="gap-2 w-full mt-2"
          >
            <FileSpreadsheet className="size-4" />
            {downloading === "annex1" ? "Generowanie..." : "Pobierz Załącznik nr 1 (.xlsx)"}
          </Button>
        </Card>

        {/* Załącznik nr 2 */}
        <Card className="p-5 bg-card border shadow-none space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">Załącznik 02</span>
              <Badge variant="outline" className="bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                Sprawozdanie Narastające
              </Badge>
            </div>
            <h4 className="font-bold text-base text-foreground">Załącznik nr 2 (Układ Narastający)</h4>
            <p className="text-xs text-muted-foreground">
              Zbiorcze zestawienie narastające ze wszystkimi zrealizowanymi działaniami i rozszerzonymi kolumnami wizytacji oraz prelekcji.
            </p>
            <div className="text-xs text-foreground font-semibold pt-1">
              Podsumowanie: {totalActions} działań · {totalPeople.toLocaleString("pl-PL")} uczestników
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => handleExportAnnex("annex2")}
            disabled={downloading !== null}
            className="gap-2 w-full mt-2"
          >
            <FileSpreadsheet className="size-4" />
            {downloading === "annex2" ? "Generowanie..." : "Pobierz Załącznik nr 2 (.xlsx)"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
