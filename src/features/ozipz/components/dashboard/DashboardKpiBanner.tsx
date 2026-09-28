import { Card } from "@/components/ui/card";
import { FileCheck, GraduationCap, Users, Calendar } from "lucide-react";
import type {
  HealthPromotionTab,
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzScheduleEvent,
} from "../../types/ozipz.types";

interface DashboardKpiBannerProps {
  actions: OzipzAction[];
  programs: OzipzProgram[];
  participations: OzipzSchoolParticipation[];
  scheduleEvents: OzipzScheduleEvent[];
  recipients: { total: number; direct: number; indirect: number };
  upcomingEventsCount: number;
  onNavigateTab: (tab: HealthPromotionTab) => void;
}

export function DashboardKpiBanner({
  actions,
  programs,
  participations,
  scheduleEvents,
  recipients,
  upcomingEventsCount,
  onNavigateTab,
}: DashboardKpiBannerProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Card 1: Działania Edukacyjne */}
      <Card
        className="relative rounded-[3px] border border-primary/25 bg-primary/5 p-3.5 shadow-none transition-all hover:bg-primary/10 group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Działania Edukacyjne
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
              {actions.length.toLocaleString("pl-PL")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              Zrealizowanych w roku {currentYear}
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-primary/20 bg-card text-primary shadow-xs">
            <FileCheck className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-primary/15 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Wszystkie placówki:</span>
          <strong className="text-foreground font-mono">
            {new Set(actions.map((a) => (a.facilityName || a.facilityId || "").trim()).filter(Boolean)).size}
          </strong>
        </div>
        <button type="button" aria-label="Przejdź do rejestru działań" onClick={() => onNavigateTab("dzialania")} className="absolute inset-0 cursor-pointer rounded-[3px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </Card>

      {/* Card 2: Programy Profilaktyczne */}
      <Card
        className="relative rounded-[3px] border border-border bg-card p-3.5 shadow-none transition-all hover:bg-muted/40 group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Programy Edukacyjne
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
              {participations.length.toLocaleString("pl-PL")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              Zgłoszeń placówek oświatowych
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-border bg-muted/40 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>
            Programy:{" "}
            <strong className="text-foreground">
              {programs.filter((p) => p.status === "aktywny" || p.status === "active" || !p.status).length}
            </strong>
          </span>
          <span>
            Sprawozdania:{" "}
            <strong className="text-foreground">
              {participations.filter((p) => p.hasFinalReport).length}
            </strong>
          </span>
        </div>
        <button type="button" aria-label="Przejdź do udziału szkół w programach" onClick={() => onNavigateTab("szkoly-w-programie")} className="absolute inset-0 cursor-pointer rounded-[3px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </Card>

      {/* Card 3: Zasięg Całkowity */}
      <Card
        className="relative rounded-[3px] border border-border bg-card p-3.5 shadow-none transition-all hover:bg-muted/40 group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Zasięg Całkowity (z pośrednimi)
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
              {recipients.total.toLocaleString("pl-PL")}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              Łączny zasięg oddziaływania
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-border bg-muted/40 text-blue-600 dark:text-blue-400">
            <Users className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Wskaźnik bezpośredni:</span>
          <strong className="text-foreground font-mono">
            {recipients.total > 0 ? Math.round((recipients.direct / recipients.total) * 100) : 0}%
          </strong>
        </div>
        <button type="button" aria-label="Przejdź do sprawozdań" onClick={() => onNavigateTab("sprawozdania")} className="absolute inset-0 cursor-pointer rounded-[3px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </Card>

      {/* Card 4: Nadchodzące Wydarzenia */}
      <Card
        className="relative rounded-[3px] border border-border bg-card p-3.5 shadow-none transition-all hover:bg-muted/40 group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              Harmonogram i Wydarzenia
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
              {upcomingEventsCount}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
              Zadań zaplanowanych do realizacji
            </p>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-border bg-muted/40 text-amber-600 dark:text-amber-400">
            <Calendar className="size-4" />
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>
            Łącznie w planie: <strong className="text-foreground">{scheduleEvents.length}</strong>
          </span>
          <span className="text-primary font-bold font-sans">Aktywne</span>
        </div>
        <button type="button" aria-label="Przejdź do harmonogramu" onClick={() => onNavigateTab("harmonogram")} className="absolute inset-0 cursor-pointer rounded-[3px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </Card>
    </div>
  );
}
