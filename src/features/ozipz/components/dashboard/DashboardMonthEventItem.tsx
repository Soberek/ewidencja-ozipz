import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { formatDatePl } from "../../utils/dateUtils";
import type { OzipzScheduleEvent } from "../../types/ozipz.types";

interface DashboardMonthEventItemProps {
  event: OzipzScheduleEvent;
  isCompleted: boolean;
  isPostponed: boolean;
  jrwaInfo: {
    symbol: string;
    label: string;
    description?: string;
  } | null;
  onRegisterAction: (event: OzipzScheduleEvent) => void;
  onNavigateToActions: () => void;
}

export function DashboardMonthEventItem({
  event,
  isCompleted,
  isPostponed,
  jrwaInfo,
  onRegisterAction,
  onNavigateToActions,
}: DashboardMonthEventItemProps) {
  return (
    <div
      className={`p-2.5 rounded-[3px] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
        isCompleted
          ? "bg-emerald-500/5 border-emerald-500/30"
          : isPostponed
          ? "bg-rose-500/5 border-rose-500/30"
          : "bg-card border-border hover:bg-muted/30"
      }`}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px] shrink-0">
            {formatDatePl(event.eventDate)}
          </span>
          <span className="font-bold text-foreground truncate">{event.title}</span>

          {isCompleted ? (
            <Badge
              variant="secondary"
              className="text-[9.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold py-0 px-1.5 flex items-center gap-1"
            >
              <CheckCircle2 className="size-2.5" /> WYKONANE
            </Badge>
          ) : isPostponed ? (
            <Badge variant="destructive" className="text-[9.5px] py-0 px-1.5 font-bold flex items-center gap-1">
              <AlertTriangle className="size-2.5" /> ODROCZONE
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9.5px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold py-0 px-1.5"
            >
              DO REALIZACJI
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap pt-0.5">
          {event.location && (
            <span className="flex items-center gap-1 truncate max-w-xs text-foreground/80">
              <Building2 className="size-3 shrink-0 text-muted-foreground" /> {event.location}
            </span>
          )}
          {jrwaInfo && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold text-[10.5px]"
              title={jrwaInfo.description}
            >
              <ShieldCheck className="size-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
              {jrwaInfo.symbol ? (
                <>
                  <span className="font-mono font-bold">JRWA {jrwaInfo.symbol}:</span>
                  <span>{jrwaInfo.label}</span>
                </>
              ) : (
                <span>{jrwaInfo.label}</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
        {!isCompleted ? (
          <Button
            size="sm"
            onClick={() => onRegisterAction(event)}
            className="h-7 text-[11px] font-semibold gap-1 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[2px]"
          >
            <PlusCircle className="size-3" /> Zarejestruj wykonanie
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToActions}
            className="h-7 text-[11px] font-semibold gap-1 px-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-[2px]"
          >
            Zobacz w działaniach <ArrowRight className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
