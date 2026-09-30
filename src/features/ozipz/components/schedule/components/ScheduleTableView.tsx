import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Edit,
  Trash2,
  Building2,
  FileText,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OzipzScheduleEvent } from "../../../types/ozipz.types";
import type { EnrichedScheduleEvent } from "../../../utils/scheduleExecutionUtils";
import { formatDatePl } from "../../../utils/dateUtils";

export interface ScheduleTableViewProps {
  events: EnrichedScheduleEvent[];
  onToggleStatus: (id: string, currentStatus: string) => void;
  onOpenAdnotacja: (event: OzipzScheduleEvent) => void;
  onViewAdnotacja: (event: OzipzScheduleEvent) => void;
  onEdit: (event: OzipzScheduleEvent) => void;
  onDelete: (id: string) => void | Promise<void>;
  onOpenAdd: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export function ScheduleTableView({
  events,
  onToggleStatus,
  onOpenAdnotacja,
  onViewAdnotacja,
  onEdit,
  onDelete,
  onOpenAdd,
  onClearFilters,
  isFiltered,
}: ScheduleTableViewProps) {
  const [deleteEvent, setDeleteEvent] = useState<OzipzScheduleEvent | null>(null);
  const columns = useMemo<ColumnDef<EnrichedScheduleEvent>[]>(() => {
    return [
      {
        id: "eventDate",
        header: "Termin Realizacji",
        accessorKey: "eventDate",
        sortable: true,
        cell: ({ row }) => (
          <div className="flex flex-col text-xs font-mono">
            <span className="font-semibold text-foreground">
              {row.eventDate ? formatDatePl(row.eventDate) : "-"}
            </span>
          </div>
        ),
      },
      {
        id: "title",
        header: "Zadanie Planu / Tematyka",
        accessorKey: "title",
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <p
              className="font-medium text-xs text-foreground line-clamp-2 break-words leading-tight"
              title={row.title}
            >
              {row.title}
            </p>
            {row.location && (
              <div className="flex items-start gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Building2 className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                <span
                  className="line-clamp-2 break-words leading-tight"
                  title={row.location}
                >
                  {row.location}
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "programName",
        header: "Program / Akcja",
        accessorFn: (row) => row.resolvedProgramName || row.programName || row.campaignName || "",
        sortable: true,
        cell: ({ row }) => {
          const progName = row.resolvedProgramName || row.programName;
          const symbol = row.resolvedJrwaSymbol;
          const campaignName = row.campaignName;
          if (!progName && !campaignName) {
            return <span className="text-[10px] text-muted-foreground italic">Działanie ogólne</span>;
          }
          return (
            <div className="max-w-[220px] space-y-1">
              {progName && (
                <div className="space-y-0.5" title={symbol ? `${progName} (JRWA ${symbol})` : progName}>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-800 border-purple-200 text-[10px] max-w-full dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1"
                  >
                    <ShieldCheck className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="line-clamp-2 break-words whitespace-normal leading-tight">{progName}</span>
                  </Badge>
                  {symbol && <p className="text-[10px] font-mono text-muted-foreground">JRWA {symbol}</p>}
                </div>
              )}
              {campaignName && (
                <Badge
                  variant="outline"
                  className="bg-sky-50 text-sky-800 border-sky-200 text-[10px] max-w-full dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 flex items-center gap-1"
                  title={`Akcja profilaktyczna: ${campaignName}`}
                >
                  <Megaphone className="size-3 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="line-clamp-2 break-words whitespace-normal leading-tight">{campaignName}</span>
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "responsiblePerson",
        header: "Odpowiedzialny",
        accessorKey: "responsiblePerson",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-xs text-foreground">
            {row.responsiblePerson || "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status Zadania",
        accessorKey: "status",
        sortable: true,
        cell: ({ row }) => {
          const effStatus = row.effectiveStatus;
          const status = row.status;

          if (effStatus === "wykonane") {
            const badge = <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200">
              <CheckCircle2 className="size-3" />
              Wykonane {row.isAutoDone ? "(Auto)" : ""}
            </Badge>;
            if (row.isAutoDone) return <span title="Wykonanie wynika z powiązanego działania">{badge}</span>;
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(row.id, status);
                }}
                className="cursor-pointer"
                title="Kliknij, aby zmienić status"
              >
                {badge}
              </button>
            );
          }

          if (effStatus === "w_trakcie") {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(row.id, status);
                }}
                className="cursor-pointer"
                title="Oznacz jako wykonane"
              >
                <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200">
                  <Clock className="size-3" />
                  W trakcie
                </Badge>
              </button>
            );
          }

          if (effStatus === "odroczone") {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                className="cursor-pointer"
                title="Edytuj status i powód odroczenia"
              >
                <Badge className="bg-orange-100 text-orange-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-orange-950/60 dark:text-orange-300 hover:bg-orange-200">
                  <RotateCcw className="size-3" />
                  Odroczone
                </Badge>
              </button>
            );
          }

          if (effStatus === "odwolane") {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                className="cursor-pointer"
                title="Edytuj status i powód odwołania"
              >
                <Badge className="bg-red-100 text-red-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-red-950/60 dark:text-red-300 hover:bg-red-200">
                  <XCircle className="size-3" />
                  Odwołane
                </Badge>
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(row.id, status);
              }}
              className="cursor-pointer"
              title="Kliknij, aby zmienić status"
            >
              <Badge className="bg-blue-100 text-blue-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-200">
                <Clock className="size-3" />
                Zaplanowane
              </Badge>
            </button>
          );
        },
      },
      {
        id: "adnotacja",
        header: "Adnotacja",
        cell: ({ row }) => {
          const hasAdnotacja = Boolean(row.annotationReasonCode);
          if (hasAdnotacja) {
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAdnotacja(row);
                }}
                className="h-6 text-[10px] px-1.5 gap-1 border-orange-300 text-orange-800 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 cursor-pointer"
              >
                <FileText className="size-2.5" />
                <span>Adnotacja</span>
              </Button>
            );
          }

          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAdnotacja(row);
              }}
              className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              + Dodaj
            </Button>
          );
        },
      },
      {
        id: "actions",
        header: "Akcje",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Edytuj zadanie"
                  aria-label="Edytuj zadanie"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                  }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Edit className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edytuj zadanie</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Usuń zadanie"
                  aria-label="Usuń zadanie"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteEvent(row);
                  }}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Usuń zadanie</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ];
    }, [onToggleStatus, onOpenAdnotacja, onViewAdnotacja, onEdit]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title={isFiltered ? "Brak pasujących zadań planu" : "Harmonogram jest pusty"}
        description={
          isFiltered
            ? "Żadne zadanie planu pracy nie spełnia wprowadzonych kryteriów wyszukiwania lub wybranego miesiąca."
            : "Nie wprowadzono jeszcze zadań do harmonogramu pracy na ten rok."
        }
        actionLabel={isFiltered ? undefined : "Dodaj pierwsze zadanie"}
        onAction={isFiltered ? undefined : onOpenAdd}
        secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
        onSecondaryAction={isFiltered ? onClearFilters : undefined}
        className="my-4"
      />
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <DataTable
        data={events}
        columns={columns}
        keyExtractor={(item) => item.id}
        enablePagination
        defaultPageSize={25}
        pageSizeOptions={[15, 25, 50, 100]}
        enableExport={true}
        exportFileName="harmonogram_plan_pracy.csv"
        onRowClick={(row) => onEdit(row)}
        rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
      />
      <ConfirmDialog
        isOpen={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onConfirm={async () => { if (deleteEvent) await onDelete(deleteEvent.id); }}
        title="Usuń zadanie"
        description={<>Czy na pewno chcesz usunąć zadanie <strong>«{deleteEvent?.title || "Bez tytułu"}»</strong> z harmonogramu?</>}
        variant="destructive"
        confirmText="Usuń zadanie"
      />
    </TooltipProvider>
  );
}
