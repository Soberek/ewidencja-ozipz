import { FileText, Calendar, Award, FileCheck2 } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import type { OzipzScan } from "../../../types/ozipz.types";

export interface ScansStatsHeaderProps {
  scans: OzipzScan[];
}

export function ScansStatsHeader({ scans }: ScansStatsHeaderProps) {
  const currentYear = String(new Date().getFullYear());

  const totalScans = scans.length;
  const currentYearScans = scans.filter((s) => (s.scanDate || "").startsWith(currentYear)).length;
  const reportsCount = scans.filter((s) => {
    const t = (s.documentType || "").toLowerCase();
    return t.includes("sprawozdanie") || t.includes("protokol") || t.includes("raport");
  }).length;
  const declarationsCount = scans.filter((s) => {
    const t = (s.documentType || "").toLowerCase();
    return t.includes("deklaracja") || t.includes("zgoda") || t.includes("porozumienie");
  }).length;

  return (
    <StatsGrid>
      <MetricCard
        title="Wszystkie Dokumenty"
        value={totalScans}
        subtext="Zarejestrowane skany PDF"
        icon={<FileText className="size-4" />}
        variant="default"
      />

      <MetricCard
        title={`Rok ${currentYear}`}
        value={currentYearScans}
        subtext="Skany z bieżącego roku"
        icon={<Calendar className="size-4" />}
        variant="blue"
      />

      <MetricCard
        title="Sprawozdania i Protokoły"
        value={reportsCount}
        subtext="Dokumentacja rozliczeniowa"
        icon={<FileCheck2 className="size-4" />}
        variant="emerald"
      />

      <MetricCard
        title="Deklaracje i Zgody"
        value={declarationsCount}
        subtext="Przystąpienia i porozumienia"
        icon={<Award className="size-4" />}
        variant="purple"
      />
    </StatsGrid>
  );
}
