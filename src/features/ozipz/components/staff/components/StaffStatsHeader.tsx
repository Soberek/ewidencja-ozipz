import { Users, UserCheck, ShieldCheck, PhoneCall } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import type { OzipzStaff } from "../../../types/ozipz.types";

export interface StaffStatsHeaderProps {
  staff: OzipzStaff[];
}

export function StaffStatsHeader({ staff }: StaffStatsHeaderProps) {
  const total = staff.length;
  const activeCount = staff.filter((s) => s.active).length;
  const coordinatorsCount = staff.filter((s) => {
    const r = (s.role || "").toLowerCase();
    return r.includes("starszy") || r.includes("koordynator") || r.includes("kierownik");
  }).length;
  const withContact = staff.filter((s) => (s.phone && s.phone.trim()) || (s.email && s.email.trim())).length;

  return (
    <StatsGrid>
      <MetricCard
        title="Kadra Pracownicza"
        value={total}
        subtext="Pracownicy i edukatorzy"
        icon={<Users className="size-4" />}
        variant="default"
      />

      <MetricCard
        title="Aktywni Edukatorzy"
        value={activeCount}
        subtext="Bieżące realizowanie zadań"
        icon={<UserCheck className="size-4" />}
        variant="emerald"
      />

      <MetricCard
        title="Starsza Kadra"
        value={coordinatorsCount}
        subtext="Koordynatorzy programów"
        icon={<ShieldCheck className="size-4" />}
        variant="purple"
      />

      <MetricCard
        title="Z Kontaktem Bezpośrednim"
        value={withContact}
        subtext="Telefon lub e-mail służbowy"
        icon={<PhoneCall className="size-4" />}
        variant="blue"
      />
    </StatsGrid>
  );
}
