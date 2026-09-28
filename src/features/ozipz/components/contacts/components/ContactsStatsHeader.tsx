import { Users, Phone, Mail, Award, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MetricCard, StatsGrid } from "@/components/ui/metric-card";
import { cn } from "@/lib/utils";

export interface ContactsStatsHeaderProps {
  total: number;
  withPhone: number;
  withEmail: number;
  coordinators: number;
  /** Liczba kontaktów wymagających uzupełnienia – bez niej karta jakości danych nie jest wyświetlana. */
  incomplete?: number;
  isIncompleteActive?: boolean;
  onShowIncomplete?: () => void;
}

export function ContactsStatsHeader({
  total,
  withPhone,
  withEmail,
  coordinators,
  incomplete,
  isIncompleteActive = false,
  onShowIncomplete,
}: ContactsStatsHeaderProps) {
  const showQuality = incomplete !== undefined;
  const completeness = total > 0 && incomplete !== undefined ? Math.round(((total - incomplete) / total) * 100) : 100;
  const canFilterIncomplete = Boolean(onShowIncomplete) && (Boolean(incomplete) || isIncompleteActive);

  return (
    <StatsGrid columns={showQuality ? 5 : 4}>
      <MetricCard title="Wszystkie Kontakty" value={total} subtext="Książka teleadresowa" icon={<Users className="size-4" />} />
      <MetricCard title="Koordynatorzy" value={coordinators} subtext="Liderzy szkolni" icon={<Award className="size-4" />} variant="purple" />
      <MetricCard title="Z Telefonem" value={withPhone} subtext="Szybki kontakt głosowy" icon={<Phone className="size-4" />} variant="emerald" />
      <MetricCard title="Z Adresem E-mail" value={withEmail} subtext="Gotowi do wysyłki pism" icon={<Mail className="size-4" />} variant="blue" />
      {showQuality && (
        <MetricCard
          title="Do Uzupełnienia"
          value={incomplete}
          subtext={`Kompletność kartoteki: ${completeness}%`}
          icon={incomplete ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
          variant={incomplete ? "amber" : "emerald"}
          onClick={canFilterIncomplete ? onShowIncomplete : undefined}
          active={canFilterIncomplete ? isIncompleteActive : undefined}
          hint={incomplete ? "Pokaż kontakty wymagające uzupełnienia" : undefined}
          footer={
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className={cn("h-full rounded-full", incomplete ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${completeness}%` }}
              />
            </div>
          }
        />
      )}
    </StatsGrid>
  );
}
