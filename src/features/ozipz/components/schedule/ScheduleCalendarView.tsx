import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { executeConfirmedAction } from "@/components/ui/confirmHelper";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Edit,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import type { OzipzScheduleEvent } from "../../types/ozipz.types";
import type { EnrichedScheduleEvent } from "../../utils/scheduleExecutionUtils";

interface ScheduleCalendarViewProps {
  dayGroups: Array<[string, (OzipzScheduleEvent | EnrichedScheduleEvent)[]]>;
  onOpenEdit: (event: OzipzScheduleEvent) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function ScheduleCalendarView({
  dayGroups,
  onOpenEdit,
  onDelete,
}: ScheduleCalendarViewProps) {
  const [deleteEvent, setDeleteEvent] = useState<OzipzScheduleEvent | null>(null);

  if (dayGroups.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground italic border rounded-[3px]">
        Brak zaplanowanych zadań w wybranym filtrze.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dayGroups.map(([dateKey, events]) => (
        <Card key={dateKey} className="p-3.5 bg-card border shadow-none space-y-2.5">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-mono font-bold text-xs text-primary">
              <CalendarIcon className="size-3.5" />
              <span>{dateKey}</span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {events.length} {events.length === 1 ? "zadanie" : "zadania"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {events.map((e) => {
              const enriched = e as Partial<EnrichedScheduleEvent>;
              const progLabel = enriched.resolvedProgramName || e.programName || e.topic;
              const isProgrammatic = enriched.isProgrammatic ?? Boolean(e.programName || e.programId);
              const isDone = enriched.effectiveStatus === "wykonane";
              const isPostponed = enriched.effectiveStatus === "odroczone" || enriched.effectiveStatus === "odwolane";
              return (
                <div
                  key={e.id}
                  onClick={() => onOpenEdit(e)}
                  className="p-2.5 rounded-[2px] border bg-background/80 hover:bg-accent/30 hover:border-primary/50 cursor-pointer transition-colors text-xs space-y-1.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    {progLabel && (
                      <div className="pt-0.5">
                        {isProgrammatic ? (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold max-w-full">
                            <ShieldCheck className="size-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="truncate">{progLabel}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                            {progLabel}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-1.5">
                      <span
                        className="font-bold text-foreground leading-snug line-clamp-2 break-words"
                        title={e.title}
                      >
                        {e.title}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edytuj zadanie"
                          aria-label="Edytuj zadanie"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onOpenEdit(e);
                          }}
                          className="size-5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Edit className="size-2.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Usuń zadanie"
                          aria-label="Usuń zadanie"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            executeConfirmedAction(
                              `Czy na pewno usunąć zadanie: "${e.title}"?`,
                              () => onDelete(e.id),
                              () => setDeleteEvent(e)
                            );
                          }}
                          className="size-5 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="size-2.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      {e.location && (
                        <div className="flex items-start gap-1">
                          <MapPin className="size-3 shrink-0 mt-0.5" />
                          <span
                            className="line-clamp-2 break-words leading-tight"
                            title={e.location}
                          >
                            {e.location}
                          </span>
                        </div>
                      )}
                      {e.responsiblePerson && (
                        <div className="flex items-center gap-1 truncate">
                          <User className="size-3 shrink-0" />
                          <span className="truncate">{e.responsiblePerson}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t text-[10px]">
                    {isDone && (
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Zrealizowane {enriched.isAutoDone ? "(Auto)" : ""}
                      </span>
                    )}
                    {isPostponed && (
                      <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                        <AlertTriangle className="size-3" /> {enriched.effectiveStatus === "odwolane" ? "Odwołane" : "Odroczone"}
                      </span>
                    )}
                    {!isDone && !isPostponed && (
                      <span className="text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-1">
                        <Clock className="size-3" /> {enriched.effectiveStatus === "w_trakcie" ? "W trakcie" : "Zaplanowane"}
                      </span>
                    )}
                    {e.annotationReasonCode && (
                      <span className="text-amber-700 dark:text-amber-300 font-medium">
                        Adnotacja
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <ConfirmDialog
        isOpen={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onConfirm={async () => { if (deleteEvent) await onDelete(deleteEvent.id); }}
        title="Usuń zadanie"
        description={
          <span>
            Czy na pewno chcesz usunąć zadanie <strong>«{deleteEvent?.title || "Bez tytułu"}»</strong> z harmonogramu?
          </span>
        }
        variant="destructive"
        confirmText="Usuń zadanie"
        cancelText="Anuluj"
      />
    </div>
  );
}
