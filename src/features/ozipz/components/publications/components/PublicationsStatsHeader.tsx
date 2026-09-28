import { useMemo } from "react";
import { Globe, Eye, Calendar, Share2 } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import type { OzipzPublication } from "../../../types/ozipz.types";

interface PublicationsStatsHeaderProps {
  publications?: OzipzPublication[];
  total?: number;
  totalReach?: number;
  currentYearCount?: number;
  withLinksCount?: number;
}

export function PublicationsStatsHeader({
  publications,
  total: explicitTotal,
  totalReach: explicitTotalReach,
  currentYearCount: explicitCurrentYearCount,
  withLinksCount: explicitWithLinksCount,
}: PublicationsStatsHeaderProps) {
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    if (
      explicitTotal !== undefined &&
      explicitTotalReach !== undefined &&
      explicitCurrentYearCount !== undefined &&
      explicitWithLinksCount !== undefined
    ) {
      return {
        total: explicitTotal,
        totalReach: explicitTotalReach,
        currentYearCount: explicitCurrentYearCount,
        withLinksCount: explicitWithLinksCount,
      };
    }

    const list = publications ?? [];
    const total = list.length;
    const totalReach = list.reduce((sum, p) => sum + (p.reachCount || 0), 0);
    const currentYearCount = list.filter((p) => p.publicationDate?.startsWith(String(currentYear))).length;
    const withLinksCount = list.filter((p) => Boolean(p.link && p.link.trim())).length;

    return {
      total: explicitTotal ?? total,
      totalReach: explicitTotalReach ?? totalReach,
      currentYearCount: explicitCurrentYearCount ?? currentYearCount,
      withLinksCount: explicitWithLinksCount ?? withLinksCount,
    };
  }, [
    publications,
    explicitTotal,
    explicitTotalReach,
    explicitCurrentYearCount,
    explicitWithLinksCount,
    currentYear,
  ]);

  return (
    <StatsGrid>
      <MetricCard
        title="Wszystkie Publikacje"
        value={stats.total}
        subtext="Ewidencja wpisów i postów"
        variant="default"
        icon={<Globe className="size-4" />}
      />

      <MetricCard
        title="Łączny Zasięg"
        value={`${stats.totalReach.toLocaleString("pl-PL")} os.`}
        subtext="Szacowani czytelnicy"
        variant="amber"
        icon={<Eye className="size-4" />}
      />

      <MetricCard
        title={`Bieżący Rok (${currentYear})`}
        value={stats.currentYearCount}
        subtext="Posty i komunikaty"
        variant="emerald"
        icon={<Calendar className="size-4" />}
      />

      <MetricCard
        title="Z Odnośnikiem WWW"
        value={stats.withLinksCount}
        subtext="Dostępne w internecie"
        variant="blue"
        icon={<Share2 className="size-4" />}
      />
    </StatsGrid>
  );
}
