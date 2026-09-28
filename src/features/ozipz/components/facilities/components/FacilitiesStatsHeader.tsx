import { AlertTriangle, Building2, GraduationCap, Layers, MapPin } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";

export interface FacilitiesStatsHeaderProps {
  totalFacilities: number;
  educationCount: number;
  complexCount: number;
  municipalitiesCount: number;
  issuesCount: number;
}

export function FacilitiesStatsHeader({
  totalFacilities,
  educationCount,
  complexCount,
  municipalitiesCount,
  issuesCount,
}: FacilitiesStatsHeaderProps) {
  return (
    <StatsGrid columns={5}>
      <MetricCard title="Wszystkie placówki" value={totalFacilities} subtext="Szkoły, przedszkola i instytucje" icon={<Building2 className="size-4" />} />
      <MetricCard variant="blue" title="Placówki oświatowe" value={educationCount} subtext="Z określonym typem kształcenia" icon={<GraduationCap className="size-4" />} />
      <MetricCard variant="purple" title="Zespoły placówek" value={complexCount} subtext="Zespoły szkół i przedszkoli" icon={<Layers className="size-4" />} />
      <MetricCard variant="emerald" title="Gminy" value={municipalitiesCount} subtext="Obszar nadzoru PSSE" icon={<MapPin className="size-4" />} />
      <MetricCard
        variant={issuesCount > 0 ? "amber" : "emerald"}
        title="Do uzupełnienia"
        value={issuesCount}
        subtext="Placówki z brakami lub niespójnymi danymi"
        icon={<AlertTriangle className="size-4" />}
      />
    </StatsGrid>
  );
}
