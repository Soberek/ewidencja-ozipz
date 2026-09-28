import { Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";

export interface ScheduleStatsHeaderProps {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  annotatedTasks: number;
  compliancePercent: number;
}

export function ScheduleStatsHeader({
  totalTasks,
  completedTasks,
  pendingTasks,
  annotatedTasks,
  compliancePercent,
}: ScheduleStatsHeaderProps) {
  return (
    <StatsGrid>
      <MetricCard title="Zadania Planu" value={totalTasks} subtext="W wybranym okresie" icon={<Calendar className="size-4" />} />
      <MetricCard
        title="Zrealizowane"
        value={
          <>
            {completedTasks}{" "}
            <span className="text-xs font-normal opacity-80">({compliancePercent}%)</span>
          </>
        }
        subtext="Wykonane lub powiązane z działaniem"
        icon={<CheckCircle2 className="size-4" />}
        variant="emerald"
      />
      <MetricCard title="Do Realizacji" value={pendingTasks} subtext="Zaplanowane lub w toku" icon={<Clock className="size-4" />} variant="amber" />
      <MetricCard title="Z Adnotacją" value={annotatedTasks} subtext="Odroczone / zmienione" icon={<AlertTriangle className="size-4" />} variant="rose" />
    </StatsGrid>
  );
}
