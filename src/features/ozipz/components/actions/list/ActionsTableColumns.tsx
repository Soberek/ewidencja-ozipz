import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ColumnDef, TableDensity } from "@/components/ui/data-table";
import type { OzipzAction } from "../../../types/ozipz.types";
import { formatDatePl, isMonthClosed } from "../../../utils/dateUtils";
import { isPublicationActionType, normalizeActionType } from "../editor/editorUtils";
import { ActionRowActionButtons } from "./ActionRowActionButtons";
import { ActionTypeCell, FacilityCell, JrwaSignCell, ParticipantsCell } from "./ActionTableCells";

export interface CreateActionColumnsOptions {
  onToggleSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
  closedMonths: Set<string>;
  locksStatus?: "loading" | "ready" | "error";
  copiedSignId: string | null;
  onCopySign: (id: string, sign: string) => void;
  onOpenIzrz: (action: OzipzAction) => void;
  onEdit: (action: OzipzAction) => void;
  onDuplicate?: (action: OzipzAction) => void;
  onDelete: (id: string) => void;
  density?: TableDensity;
  /** Wszystkie działania po id — żeby dystrybucja pokazała działanie, z którym została zapisana (także gdy jest odfiltrowane). */
  actionsById?: ReadonlyMap<string, OzipzAction>;
  /** Dystrybucja zapisana razem z działaniem, po id działania głównego. */
  linkedDistributionByActionId?: ReadonlyMap<string, OzipzAction>;
}

export function createActionColumns(options: CreateActionColumnsOptions): ColumnDef<OzipzAction>[] {
  const {
    onToggleSelect,
    onSelectAll,
    isAllSelected,
    closedMonths,
    locksStatus = "ready",
    copiedSignId,
    onCopySign,
    onOpenIzrz,
    onEdit,
    onDuplicate,
    onDelete,
    density = "normal",
    actionsById,
    linkedDistributionByActionId,
  } = options;

  return [
    {
      id: "select",
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
          title="Zaznacz wszystkie widoczne"
          aria-label="Zaznacz wszystkie widoczne działania"
        />
      ),
      // Stan zaznaczenia przychodzi z DataTable (selectedIds), więc kolumny nie przebudowują się przy każdym kliknięciu.
      cell: ({ row, isSelected }) => (
        <input
          type="checkbox"
          checked={Boolean(isSelected)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(row.id, e.target.checked);
          }}
          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
          aria-label={`Zaznacz działanie: ${row.title}`}
        />
      ),
      width: "36px",
    },
    {
      id: "izrzSign",
      header: "Nr informacji",
      width: "80px",
      minWidth: "72px",
      accessorKey: "izrzSign",
      sortable: true,
      sortFn: (a, b) => {
        const signA = a.izrzSign?.replace(/^IZRZ:\s*/i, "").trim() || "";
        const signB = b.izrzSign?.replace(/^IZRZ:\s*/i, "").trim() || "";
        if (!signA && !signB) return 0;
        if (!signA) return 1;
        if (!signB) return -1;
        return signA.localeCompare(signB, "pl", { numeric: true });
      },
      cell: ({ row }) => {
        const sign = row.izrzSign?.replace(/^IZRZ:\s*/i, "").trim();
        return (
          <div className="flex items-center">
            {sign ? (
              <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
                {sign}
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground/40">-</span>
            )}
          </div>
        );
      },
    },
    {
      id: "jrwaSign",
      header: "Numer sprawy JRWA",
      minWidth: "140px",
      width: "165px",
      accessorKey: "jrwaSign",
      sortable: true,
      sortFn: (a, b) => {
        const signA = a.jrwaSign?.trim() || "";
        const signB = b.jrwaSign?.trim() || "";
        if (!signA && !signB) return 0;
        if (!signA) return 1;
        if (!signB) return -1;
        return signA.localeCompare(signB, "pl", { numeric: true });
      },
      cell: ({ row }) => <JrwaSignCell row={row} copiedSignId={copiedSignId} onCopySign={onCopySign} />,
    },
    {
      id: "programName",
      header: "Nazwa programu",
      // Bez stałej szerokości: program bierze resztę miejsca, żeby tabela mieściła się bez przewijania w bok.
      minWidth: "200px",
      accessorKey: "programName",
      sortable: true,
      sortFn: (a, b) => {
        const progA = a.programName || a.campaignName || "";
        const progB = b.programName || b.campaignName || "";
        if (!progA && !progB) return 0;
        if (!progA) return 1;
        if (!progB) return -1;
        return progA.localeCompare(progB, "pl");
      },
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs leading-snug text-left">
          <div className="font-semibold break-words">{row.programName || row.campaignName || row.title || "—"}</div>
          {row.programName && row.campaignName && row.campaignName !== row.programName && (
            <div className="text-muted-foreground break-words">{row.campaignName}</div>
          )}
          {row.programName && !row.campaignName && row.title && row.title !== row.programName && row.title !== normalizeActionType(row.actionType) && (
            <div className="text-muted-foreground break-words">{row.title}</div>
          )}
        </div>
      ),
    },
    {
      id: "actionType",
      header: "Działanie",
      minWidth: "130px",
      width: "145px",
      accessorKey: "actionType",
      sortable: true,
      sortFn: (a, b) => normalizeActionType(a.actionType).localeCompare(normalizeActionType(b.actionType), "pl"),
      cell: ({ row }) => (
        <ActionTypeCell row={row} actionsById={actionsById} linkedDistributionByActionId={linkedDistributionByActionId} onEdit={onEdit} />
      ),
    },
    {
      id: "numberOfActions",
      header: "Liczba działań",
      width: "70px",
      minWidth: "60px",
      align: "center",
      headerClassName: "text-center",
      accessorFn: (row) => Number(row.numberOfActions || 1),
      sortable: true,
      sortFn: (a, b) => Number(a.numberOfActions || 1) - Number(b.numberOfActions || 1),
      cell: ({ row }) => {
        const count = Number(row.numberOfActions || 1);
        return (
          <div className="text-center font-mono font-bold text-xs text-foreground">
            {count}
          </div>
        );
      },
    },
    {
      id: "participantsCount",
      header: "Liczba odbiorców",
      minWidth: "90px",
      width: "100px",
      align: "right",
      headerClassName: "text-right",
      accessorFn: (row) => Number(row.participantsCount || 0),
      sortable: true,
      sortFn: (a, b) => Number(a.participantsCount || 0) - Number(b.participantsCount || 0),
      cell: ({ row }) => <ParticipantsCell row={row} />,
    },
    {
      id: "date",
      header: "Data",
      width: "82px",
      minWidth: "78px",
      accessorKey: "date",
      sortable: true,
      sortFn: (a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        const cmp = dateA.localeCompare(dateB);
        if (cmp !== 0) return cmp;
        return (a.id || "").localeCompare(b.id || "");
      },
      cell: ({ row }) => {
        const isClosed = isMonthClosed(row.date, closedMonths);
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-foreground font-medium whitespace-nowrap">
              {row.date ? formatDatePl(row.date) : "-"}
            </span>
            {isClosed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="size-3 text-amber-500 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Miesiąc zablokowany</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      id: "facilityName",
      header: "Lokalizacja",
      width: "200px",
      minWidth: "175px",
      accessorKey: "facilityName",
      sortable: true,
      cell: ({ row, density: cellDensity }) => <FacilityCell row={row} density={cellDensity ?? density} />,
    },
    {
      id: "actions",
      header: "Akcje",
      width: "110px",
      minWidth: "105px",
      headerClassName: "sticky right-0 z-10 bg-muted text-right pr-2",
      className: "sticky right-0 z-10 bg-card group-hover:bg-muted text-right pr-2",
      cell: ({ row }) => {
        const isClosed = isMonthClosed(row.date, closedMonths);
        const isPub = isPublicationActionType(row.actionType);
        const isCancelled = row.status === "odwolane" || row.status === "cancelled";
        const canGenerateIzrz = !isPub && !isCancelled;

        return (
          <ActionRowActionButtons
            row={row}
            isClosed={isClosed}
            locksStatus={locksStatus}
            canGenerateIzrz={canGenerateIzrz}
            isPub={isPub}
            isCancelled={isCancelled}
            onOpenIzrz={onOpenIzrz}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        );
      },
    },
  ];
}
