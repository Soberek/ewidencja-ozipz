import { useNavigate } from "react-router-dom";
import { AlarmClock, CalendarClock, ChevronRight, Lock, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useModalStore } from "../../store/useModalStore";
import { DEADLINE_HORIZON_DAYS, describeDaysLeft, type DeadlineItem } from "../../utils/deadlineUtils";
import { formatDatePl } from "../../utils/dateUtils";

const KIND_ICONS = { letter: Mail, schedule: CalendarClock, closeMonth: Lock } as const;
const SEVERITY_VARIANTS = { overdue: "destructive-soft", today: "warning-soft", soon: "info-soft" } as const;
const VISIBLE_LIMIT = 8;

interface DashboardDeadlinesCardProps {
  deadlines: DeadlineItem[];
}

/** Zaległe i nadchodzące terminy (pisma, harmonogram, blokada miesiąca) z przejściem do właściwego rekordu. */
export function DashboardDeadlinesCard({ deadlines }: DashboardDeadlinesCardProps) {
  const navigate = useNavigate();
  const openModal = useModalStore((state) => state.openModal);
  const overdueCount = deadlines.filter((item) => item.severity === "overdue").length;

  const open = (item: DeadlineItem) => {
    navigate(item.path);
    if (item.letter) openModal("letter", { item: item.letter });
    else if (item.scheduleEvent) openModal("schedule", { item: item.scheduleEvent });
  };

  return (
    <Card className="p-3.5 bg-card border border-border rounded-[3px] shadow-none space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <AlarmClock className="size-3.5 text-primary" />
          Terminy
        </h3>
        {overdueCount > 0 && <Badge variant="destructive-soft">{overdueCount} po terminie</Badge>}
      </div>

      {deadlines.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Brak zaległości i terminów w najbliższych {DEADLINE_HORIZON_DAYS} dniach. Termin odpowiedzi na pismo ustawisz w formularzu pisma.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {deadlines.slice(0, VISIBLE_LIMIT).map((item) => {
            const Icon = KIND_ICONS[item.kind];
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => open(item)}
                  className="w-full p-2 rounded-[3px] border border-border bg-card hover:bg-muted/40 transition-colors flex items-center gap-2 text-xs text-left cursor-pointer"
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-foreground truncate">{item.title}</span>
                    <span className="block text-muted-foreground truncate">{item.detail}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <Badge variant={SEVERITY_VARIANTS[item.severity]}>{describeDaysLeft(item.daysLeft)}</Badge>
                    <span className="block pt-0.5 text-[11px] text-muted-foreground">{formatDatePl(item.dueDate)}</span>
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {deadlines.length > VISIBLE_LIMIT && (
        <p className="text-[11px] text-muted-foreground">I jeszcze {deadlines.length - VISIBLE_LIMIT} — zobacz moduły Pisma i Harmonogram.</p>
      )}
    </Card>
  );
}
