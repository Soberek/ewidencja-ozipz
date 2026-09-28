import { GraduationCap, Users, Building2, BookOpen } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";

export interface ProgramsStatsHeaderProps {
  programsCount: number;
  participationsCount: number;
  uniqueSchoolsCount: number;
  reportedCoordinatorsCount: number;
}

export function ProgramsStatsHeader({
  programsCount,
  participationsCount,
  uniqueSchoolsCount,
  reportedCoordinatorsCount,
}: ProgramsStatsHeaderProps) {
  return (
    <StatsGrid>
      <MetricCard title="Programy Profilaktyczne" value={programsCount} subtext="W katalogu programów" icon={<BookOpen className="size-4" />} />
      <MetricCard title="Zgłoszenia Szkół" value={participationsCount} subtext="Wszystkie deklaracje" icon={<GraduationCap className="size-4" />} variant="purple" />
      <MetricCard title="Unikalne Placówki" value={uniqueSchoolsCount} subtext="Zaangażowane szkoły i przedszkola" icon={<Building2 className="size-4" />} variant="blue" />
      <MetricCard title="Koordynatorzy" value={reportedCoordinatorsCount} subtext="Osoby do kontaktu" icon={<Users className="size-4" />} variant="emerald" />
    </StatsGrid>
  );
}
