import { Info, BookOpen, Eye, Users } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";

export interface RegistersStatsHeaderProps {
  totalCount: number;
  informacjeCount: number;
  totalRecipients: number;
  publikacjeCount: number;
  wizytacjeCount: number;
}

export function RegistersStatsHeader({
  totalCount,
  informacjeCount,
  totalRecipients,
  publikacjeCount,
  wizytacjeCount,
}: RegistersStatsHeaderProps) {
  return (
    <StatsGrid>
      <MetricCard title="Wszystkie Wpisy" value={totalCount} subtext="Rejestry urzędowe OZiPZ" icon={<Info className="size-4" />} />
      <MetricCard
        title="Rejestr Informacji"
        value={informacjeCount}
        subtext={`${totalRecipients.toLocaleString("pl-PL")} odbiorców zadania`}
        icon={<Users className="size-4" />}
        variant="blue"
      />
      <MetricCard title="Publikacje Medialne" value={publikacjeCount} subtext="Portal gov.pl, FB i prasa" icon={<BookOpen className="size-4" />} variant="purple" />
      <MetricCard title="Wizytacje i Kontrole" value={wizytacjeCount} subtext="Wizytacje w placówkach" icon={<Eye className="size-4" />} variant="emerald" />
    </StatsGrid>
  );
}
