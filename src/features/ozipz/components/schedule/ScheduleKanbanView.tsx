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

interface ScheduleKanbanViewProps {
  plannedEvents: (OzipzScheduleEvent | EnrichedScheduleEvent)[];
  doneEvents: (OzipzScheduleEvent | EnrichedScheduleEvent)[];
  postponedEvents: (OzipzScheduleEvent | EnrichedScheduleEvent)[];
  onOpenEdit: (event: OzipzScheduleEvent) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function ScheduleKanbanView({
  plannedEvents,
  doneEvents,
  postponedEvents,
  onOpenEdit,
  onDelete,
}: ScheduleKanbanViewProps) {
  const [deleteEvent, setDeleteEvent] = useState<OzipzScheduleEvent | null>(null);

  const renderCard = (event: OzipzScheduleEvent | EnrichedScheduleEvent) => {
    const enriched = event as Partial<EnrichedScheduleEvent>;
    const topicLabel = enriched.resolvedProgramName || event.programName || event.topic;
    const isProgrammatic = enriched.isProgrammatic ?? Boolean(event.programName || event.programId);

    return (
      <Card
        key={event.id}
        onClick={() => onOpenEdit(event)}
        className="p-3 bg-background border shadow-none hover:border-primary/50 hover:shadow-xs cursor-pointer transition-colors space-y-2 text-xs"
      >
        {/* Etykieta Programu Profilaktycznego */}
        {topicLabel && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant={isProgrammatic ? "default" : "secondary"}
              className={`text-[10px] font-semibold gap-1 ${
                isProgrammatic
                  ? "bg-primary/90 hover:bg-primary text-primary-foreground shadow-2xs"
                  : ""
              }`}
            >
              {isProgrammatic && <ShieldCheck className="size-2.5 text-primary-foreground" />}
              <span className="truncate max-w-[180px]">{topicLabel}</span>
            </Badge>
          </div>
        )}

        {/* Tytuł zadania i akcje */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className="font-semibold text-foreground line-clamp-2 break-words leading-snug flex-1"
            title={event.title}
          >
            {event.title}
          </h4>

          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              title="Edytuj zadanie"
              aria-label="Edytuj zadanie"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(event);
              }}
              className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Edit className="size-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Usuń zadanie"
              aria-label="Usuń zadanie"
              onClick={(e) => {
                e.stopPropagation();
                executeConfirmedAction(
                  `Czy na pewno usunąć zadanie: "${event.title}"?`,
                  () => onDelete(event.id),
                  () => setDeleteEvent(event)
                );
              }}
              className="size-6 text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <div className="flex items-center gap-1 font-mono text-primary">
            <CalendarIcon className="size-3" />
            <span>{event.eventDate}</span>
          </div>
          {event.location && (
            <div className="flex items-start gap-1">
              <MapPin className="size-3 shrink-0 mt-0.5" />
              <span
                className="line-clamp-2 break-words leading-tight"
                title={event.location}
              >
                {event.location}
              </span>
            </div>
          )}
          {event.responsiblePerson && (
            <div className="flex items-center gap-1">
              <User className="size-3 shrink-0" />
              <span className="truncate">{event.responsiblePerson}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Kolumna 1: Zaplanowane */}
      <div className="space-y-3 bg-muted/30 p-3 rounded-[3px] border">
        <div className="flex items-center justify-between font-bold text-xs text-sky-800 dark:text-sky-300">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4 text-sky-600" /> Do Realizacji
          </span>
          <Badge variant="secondary" className="font-mono text-xs">
            {plannedEvents.length}
          </Badge>
        </div>
        <div className="space-y-2.5">
          {plannedEvents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed rounded-[2px]">
              Brak zadań
            </div>
          ) : (
            plannedEvents.map(renderCard)
          )}
        </div>
      </div>

      {/* Kolumna 2: Zrealizowane */}
      <div className="space-y-3 bg-muted/30 p-3 rounded-[3px] border">
        <div className="flex items-center justify-between font-bold text-xs text-emerald-800 dark:text-emerald-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-emerald-600" /> Zrealizowane
          </span>
          <Badge variant="secondary" className="font-mono text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {doneEvents.length}
          </Badge>
        </div>
        <div className="space-y-2.5">
          {doneEvents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed rounded-[2px]">
              Brak zadań
            </div>
          ) : (
            doneEvents.map(renderCard)
          )}
        </div>
      </div>

      {/* Kolumna 3: Odroczone */}
      <div className="space-y-3 bg-muted/30 p-3 rounded-[3px] border">
        <div className="flex items-center justify-between font-bold text-xs text-amber-800 dark:text-amber-300">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-amber-600" /> Odroczone / Odwołane
          </span>
          <Badge variant="secondary" className="font-mono text-xs bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {postponedEvents.length}
          </Badge>
        </div>
        <div className="space-y-2.5">
          {postponedEvents.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground italic border border-dashed rounded-[2px]">
              Brak zadań
            </div>
          ) : (
            postponedEvents.map(renderCard)
          )}
        </div>
      </div>

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
