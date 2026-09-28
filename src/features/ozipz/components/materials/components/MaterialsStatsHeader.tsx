import { Package, Layers, Send, TrendingUp } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";

export interface MaterialsStatsHeaderProps {
  totalTitles: number;
  totalStock: number;
  totalDistributed: number;
  distributionsCount: number;
}

export function MaterialsStatsHeader({
  totalTitles,
  totalStock,
  totalDistributed,
  distributionsCount,
}: MaterialsStatsHeaderProps) {
  return (
    <StatsGrid>
      <MetricCard title="Tytuły Materiałów" value={totalTitles} subtext="Pozycje w ewidencji" icon={<Package className="size-4" />} />
      <MetricCard title="Stan Magazynowy" value={totalStock.toLocaleString("pl-PL")} subtext="Egzemplarze na stanie" icon={<Layers className="size-4" />} variant="amber" />
      <MetricCard title="Wydane Egzemplarze" value={totalDistributed.toLocaleString("pl-PL")} subtext="Rozdysponowane w działaniach" icon={<Send className="size-4" />} variant="blue" />
      <MetricCard title="Rozdzielniki" value={distributionsCount} subtext="Zrealizowane protokoły" icon={<TrendingUp className="size-4" />} variant="emerald" />
    </StatsGrid>
  );
}
