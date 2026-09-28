import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Download,
  Sparkles,
  TrendingUp,
  User,
  Building2,
  Loader2,
  Layers,
} from "lucide-react";
import { STATION_COUNTIES } from "../../../../utils/reportAnnex";

interface MiernikExportCardProps {
  stationName: string;
  preparedBy: string;
  customHeaderTitle: string;
  defaultHeaderTitleZal1: string;
  isExporting: string | null;
  totalActions: number;
  yearActionsCount: number;
  onStationNameChange: (val: string) => void;
  onPreparedByChange: (val: string) => void;
  onCustomHeaderTitleChange: (val: string) => void;
  onExportZal1: () => void;
  onExportZal2: () => void;
  onExportStandardExcel: () => void;
  onExportFullWorkbook: () => void;
}

export function MiernikExportCard({
  stationName,
  preparedBy,
  customHeaderTitle,
  defaultHeaderTitleZal1,
  isExporting,
  totalActions,
  yearActionsCount,
  onStationNameChange,
  onPreparedByChange,
  onCustomHeaderTitleChange,
  onExportZal1,
  onExportZal2,
  onExportStandardExcel,
  onExportFullWorkbook,
}: MiernikExportCardProps) {
  return (
    <Card className="rounded-[3px] border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-none p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded">
            <FileSpreadsheet className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Pliki Excel i załączniki
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Generowanie oficjalnych załączników sprawozdawczych i skoroszytów analitycznych .xlsx
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-[10px] font-mono border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Wzorzec WSSE/GIS
        </Badge>
      </div>

      {/* Konfiguracja parametrów nagłówka raportu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1">
            <Building2 className="size-3 text-muted-foreground" />
            Stacja Sanitarno-Epidemiologiczna:
          </label>
          <select
            aria-label="Stacja Sanitarno-Epidemiologiczna"
            value={stationName}
            onChange={(e) => onStationNameChange(e.target.value)}
            className="h-8 px-2 rounded-[2px] border border-input bg-background text-xs font-medium text-foreground w-full focus:outline-none"
          >
            {STATION_COUNTIES.map((c) => (
              <option key={c} value={c}>
                PSSE — {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1">
            <User className="size-3 text-muted-foreground" />
            Sporządził/a (podpis w arkuszu):
          </label>
          <Input
            type="text"
            aria-label="Osoba sporządzająca raport"
            value={preparedBy}
            onChange={(e) => onPreparedByChange(e.target.value)}
            placeholder="Imię i nazwisko pracownika..."
            className="h-8 text-xs font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-primary" />
            Tytuł raportu (opcjonalnie):
          </label>
          <Input
            type="text"
            aria-label="Tytuł raportu"
            value={customHeaderTitle}
            onChange={(e) => onCustomHeaderTitleChange(e.target.value)}
            placeholder={defaultHeaderTitleZal1}
            className="h-8 text-xs font-medium"
            title="Pozostaw puste, aby generować automatycznie z wybranej stacji i okresu"
          />
        </div>
      </div>

      {/* Przyciski generowania plików Excel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        <Button
          onClick={onExportZal1}
          disabled={isExporting !== null || totalActions === 0}
          className="h-10 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-none justify-start px-3"
        >
          {isExporting === "zal1" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          <div className="text-left leading-tight">
            <span>Załącznik nr 1 (.xlsx)</span>
            <span className="block text-[10px] font-normal opacity-90">Szablon Raportu</span>
          </div>
        </Button>

        <Button
          onClick={onExportZal2}
          disabled={isExporting !== null || totalActions === 0}
          className="h-10 text-xs font-bold gap-2 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-none justify-start px-3"
        >
          {isExporting === "zal2" ? <Loader2 className="size-4 animate-spin" /> : <TrendingUp className="size-4" />}
          <div className="text-left leading-tight">
            <span>Załącznik nr 2 (.xlsx)</span>
            <span className="block text-[10px] font-normal opacity-90">Raport Narastający</span>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={onExportStandardExcel}
          disabled={isExporting !== null || totalActions === 0}
          className="h-10 text-xs font-bold gap-2 text-foreground border-input hover:bg-muted cursor-pointer justify-start px-3"
        >
          {isExporting === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4 text-emerald-600" />}
          <div className="text-left leading-tight">
            <span>Miernik Budżetowy</span>
            <span className="block text-[10px] font-normal text-muted-foreground">Standardowy Excel</span>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={onExportFullWorkbook}
          disabled={isExporting !== null || yearActionsCount === 0}
          className="h-10 text-xs font-bold gap-2 text-foreground border-input hover:bg-muted cursor-pointer justify-start px-3"
        >
          {isExporting === "full" ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4 text-purple-600" />}
          <div className="text-left leading-tight">
            <span>Pełny Skoroszyt</span>
            <span className="block text-[10px] font-normal text-muted-foreground">4 Arkusze Analityczne</span>
          </div>
        </Button>
      </div>
    </Card>
  );
}
