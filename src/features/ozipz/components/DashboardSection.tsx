import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzScheduleEvent,
  HealthPromotionTab,
} from "../types/ozipz.types";
import { useOzipzDbStore } from "../store/useOzipzDbStore";
import { useModalStore } from "../store/useModalStore";
import { calculateTotalRecipients } from "../utils/ozipzCalculations";
import { DashboardKpiBanner } from "./dashboard/DashboardKpiBanner";
import { DashboardQuickActions } from "./dashboard/DashboardQuickActions";
import { DashboardRecentActionsCard } from "./dashboard/DashboardRecentActionsCard";
import { DashboardActivityTypeCard } from "./dashboard/DashboardActivityTypeCard";
import { DashboardCurrentMonthPlanCard } from "./dashboard/DashboardCurrentMonthPlanCard";

export interface DashboardSectionProps {
  actions?: OzipzAction[];
  programs?: OzipzProgram[];
  participations?: OzipzSchoolParticipation[];
  scheduleEvents?: OzipzScheduleEvent[];
  onNavigateTab?: (tab: HealthPromotionTab) => void;
  onOpenAddAction?: () => void;
  onOpenAddParticipation?: () => void;
  onOpenAddDistribution?: () => void;
}

export function DashboardSection(props: DashboardSectionProps) {
  const store = useOzipzDbStore();
  const openModal = useModalStore((s) => s.openModal);
  const navigate = useNavigate();

  const actions = props.actions ?? store.actions ?? [];
  const programs = props.programs ?? store.programs ?? [];
  const participations = props.participations ?? store.participations ?? [];
  const scheduleEvents = props.scheduleEvents ?? store.scheduleEvents ?? [];

  const handleNavigateTab = useCallback(
    (tab: HealthPromotionTab) => {
      if (props.onNavigateTab) {
        props.onNavigateTab(tab);
        return;
      }
      const routeMap: Record<string, string> = {
        pulpit: "/",
        dzialania: "/dzialania",
        harmonogram: "/harmonogram",
        "lista-obecnosci": "/lista-obecnosci",
        programy: "/programy",
        "szkoly-w-programie": "/szkoly-w-programie",
        materialy: "/materialy",
        rozdzielniki: "/rozdzielniki",
        "druk-rozdzielnika": "/druk-rozdzielnika",
        sprawozdania: "/sprawozdania",
        lokalizacje: "/lokalizacje",
        kontakty: "/kontakty",
        znaki: "/znaki",
        slowniki: "/slowniki",
        "slownik-dzialania": "/slowniki?kategoria=activityType",
        "opisy-zadan": "/opisy-zadan",
        pisma: "/pisma",
        asystent: "/asystent",
        skany: "/skany",
        publikacje: "/publikacje",
        osoby: "/osoby",
        rejestry: "/rejestry",
        ustawienia: "/ustawienia",
      };
      navigate(routeMap[tab] || `/${tab}`);
    },
    [props.onNavigateTab, navigate]
  );

  const onOpenAddAction = props.onOpenAddAction ?? (() => openModal("action"));
  const onOpenAddParticipation = props.onOpenAddParticipation ?? (() => openModal("participation"));
  const onOpenAddDistribution = props.onOpenAddDistribution ?? (() => openModal("distribution"));
  const onNavigateTab = handleNavigateTab;
  const recipients = useMemo(() => calculateTotalRecipients(actions), [actions]);

  const recentActions = useMemo(() => {
    return [...actions]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);
  }, [actions]);

  const plannedTasksCount = useMemo(() => {
    return scheduleEvents.filter((ev) => ev.status !== "wykonane" && ev.status !== "odwolane").length;
  }, [scheduleEvents]);

  const typeStats = useMemo(() => {
    const map: Record<string, { count: number; participants: number }> = {};
    for (const a of actions) {
      const t = a.actionType || "Inne";
      if (!map[t]) map[t] = { count: 0, participants: 0 };
      map[t].count += Number(a.numberOfActions) || 1;
      map[t].participants += Number(a.participantsCount) || 0;
    }
    return Object.entries(map)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        participants: stats.participants,
      }))
      .sort((a, b) => b.count - a.count);
  }, [actions]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4 select-none">
        {/* Top KPIs Banner */}
        <DashboardKpiBanner
          actions={actions}
          programs={programs}
          participations={participations}
          scheduleEvents={scheduleEvents}
          recipients={recipients}
          upcomingEventsCount={plannedTasksCount}
          onNavigateTab={onNavigateTab}
        />

        {/* Szybkie Akcje */}
        <DashboardQuickActions
          onOpenAddAction={onOpenAddAction}
          onOpenAddParticipation={onOpenAddParticipation}
          onOpenAddDistribution={onOpenAddDistribution}
        />

        {/* Plan Pracy i Zadania na Bieżący Miesiąc */}
        <DashboardCurrentMonthPlanCard
          scheduleEvents={scheduleEvents}
          actions={actions}
          onNavigateTab={onNavigateTab}
        />

        {/* Dolna sekcja: Ostatnie Działania i Struktura Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <DashboardRecentActionsCard
              actionsCount={actions.length}
              recentActions={recentActions}
              onNavigateTab={onNavigateTab}
              onOpenAddAction={onOpenAddAction}
            />
          </div>

          <div>
            <DashboardActivityTypeCard typeStats={typeStats} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
