import { Bookmark, FolderOpen, CheckCircle2, Clock } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";

export interface JrwaStatsHeaderProps {
  totalCases: number;
  inProgressCases: number;
  completedCases: number;
  distinctSymbolsCount: number;
}

export function JrwaStatsHeader({
  totalCases,
  inProgressCases,
  completedCases,
  distinctSymbolsCount,
}: JrwaStatsHeaderProps) {
  return (
    <StatsGrid>
      <MetricCard title="Wszystkie Sprawy" value={totalCases} subtext="Zarejestrowane teczki JRWA" icon={<FolderOpen className="size-4" />} />
      <MetricCard title="W Toku" value={inProgressCases} subtext="Niezakończone postępowania" icon={<Clock className="size-4" />} variant="amber" />
      <MetricCard title="Zakończone" value={completedCases} subtext="Zamknięte teczki spraw" icon={<CheckCircle2 className="size-4" />} variant="emerald" />
      <MetricCard title="Symbole JRWA" value={distinctSymbolsCount} subtext="Użyte hasła klasyfikacyjne" icon={<Bookmark className="size-4" />} variant="blue" />
    </StatsGrid>
  );
}
