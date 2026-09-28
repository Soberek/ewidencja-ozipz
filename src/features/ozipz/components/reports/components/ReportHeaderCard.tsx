import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  Calendar,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  User,
} from "lucide-react";
import type { OzipzAction } from "../../../types/ozipz.types";
import {
  downloadHealthPromotionReportCsv,
} from "../../../utils/reportExport";
import { useStaff } from "../../../store/useOzipzDbStore";

interface ReportPerson {
  readonly id: string;
  readonly name: string;
}

interface ReportHeaderCardProps {
  miernikMode?: boolean;
  onOpenMiernikExport?: () => void;
  year: number;
  onYearChange: (year: number) => void;
  months: number[];
  actions: OzipzAction[];
  preparedPersonId: string;
  onPreparedPersonChange: (person: string) => void;
  persons: ReportPerson[];
  exportPending: "xlsx" | "annex-1" | "annex-2" | null;
  exportError: string | null;
  exportSuccess: string | null;
  onExportWorkbook: () => void;
  onExportAnnex: (annexNumber: 1 | 2) => void;
}

export function ReportHeaderCard({
  miernikMode = false,
  onOpenMiernikExport,
  year,
  onYearChange,
  months,
  actions,
  preparedPersonId,
  onPreparedPersonChange,
  persons,
  exportPending,
  exportError,
  exportSuccess,
  onExportWorkbook,
  onExportAnnex,
}: ReportHeaderCardProps) {
  const staffStore = useStaff();
  const dbStaff = staffStore?.staff || [];

  const staffOptions = useMemo(() => {
    const names = new Set<string>();
    for (const s of dbStaff) {
      if (s.fullName && s.fullName.trim().length > 0) {
        names.add(s.fullName.trim());
      }
    }
    for (const p of persons || []) {
      if (p.name && p.name.trim().length > 0) {
        names.add(p.name.trim());
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "pl"));
  }, [dbStaff, persons]);

  return (
    <Card className="rounded-[3px] border border-border bg-card shadow-none select-none">
      <CardContent className="space-y-3.5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-[3px] border border-primary/30 bg-primary/10 text-primary">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  {miernikMode ? "Miernik budżetowy" : "Sprawozdawczość OZiPZ"}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {miernikMode ? "Realizacja planu rocznego i dane do sprawozdania." : "Generowanie sprawozdań okresowych, szablonów załączników 1 i 2 oraz mierników wykonania."}
              </p>
            </div>
          </div>

          {miernikMode ? (
            <Button onClick={onOpenMiernikExport} className="gap-2"><Download className="size-4" />Eksportuj</Button>
          ) : <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-[3px] border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-none hover:bg-muted cursor-pointer"
              disabled={exportPending !== null || actions.length === 0}
              onClick={onExportWorkbook}
              title="Pobierz skoroszyt sprawozdawczy ze wszystkimi arkuszami"
            >
              {exportPending === "xlsx" ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : (
                <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400 mr-1" />
              )}
              Eksport XLS
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-[3px] border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-none hover:bg-muted cursor-pointer"
              disabled={exportPending !== null || actions.length === 0}
              onClick={() => onExportAnnex(1)}
              title="Pobierz Załącznik nr 1 do sprawozdania"
            >
              {exportPending === "annex-1" ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : (
                <Download className="size-3.5 text-primary mr-1" />
              )}
              Załącznik 1
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-[3px] border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-none hover:bg-muted cursor-pointer"
              disabled={exportPending !== null || actions.length === 0}
              onClick={() => onExportAnnex(2)}
              title="Pobierz Załącznik nr 2 do sprawozdania"
            >
              {exportPending === "annex-2" ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : (
                <Download className="size-3.5 text-primary mr-1" />
              )}
              Załącznik 2
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-[3px] border-border bg-background px-2.5 text-xs font-semibold text-foreground shadow-none hover:bg-muted cursor-pointer"
              disabled={actions.length === 0}
              onClick={() => downloadHealthPromotionReportCsv(actions, year, months)}
            >
              <FileText className="size-3.5 text-muted-foreground mr-1" />
              CSV
            </Button>
          </div>}
        </div>

        {/* Form Controls: Year and Responsible Person */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 border-t border-border/70 pt-3">
          <div className="space-y-1">
            <Label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Rok sprawozdawczy
            </Label>
            <div className="relative">
              <Input
                type="number"
                min={2020}
                max={2035}
                value={year}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (Number.isInteger(val) && val >= 2020 && val <= 2035) {
                    onYearChange(val);
                  }
                }}
                className="h-8 rounded-[3px] font-mono text-xs font-semibold pl-8"
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            </div>
          </div>

          {!miernikMode && <div className="space-y-1 sm:col-span-1 md:col-span-2">
            <Label className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              Osoba sporządzająca sprawozdanie
            </Label>
            <div className="relative">
              <select
                value={preparedPersonId}
                onChange={(e) => onPreparedPersonChange(e.target.value)}
                className="h-8 w-full rounded-[3px] border border-border bg-background pl-8 pr-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="">-- Wybierz osobę sporządzającą --</option>
                {staffOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>}
        </div>

        {exportError && (
          <Alert variant="destructive" className="mt-2.5 rounded-[3px] py-1.5 text-xs">
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}
        {exportSuccess && (
          <Alert className="mt-2.5 rounded-[3px] border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 mr-1 inline" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-300 font-medium inline">
              {exportSuccess}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

