import {
  Copy,
  Check,
  Lock,
  Building2,
  Users,
  Package,
  CornerDownRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ColumnDef, TableDensity } from "@/components/ui/data-table";
import type { OzipzAction } from "../../../types/ozipz.types";
import { formatDatePl, isMonthClosed } from "../../../utils/dateUtils";
import { isPublicationActionType, normalizeActionType } from "../editor/editorUtils";
import { getActionEzdState } from "../actionEzdStatus";
import { ActionRowActionButtons } from "./ActionRowActionButtons";
import {
  EzdBadge,
  getActionTypeSolidColor,
  ACTION_STATUS_CONFIG,
} from "./ActionTableBadges";
import { cn } from "@/lib/utils";

// Jeden formatter zamiast toLocaleString w każdej komórce (tworzenie Intl przy każdym wywołaniu jest kosztowne).
const PL_NUMBER = new Intl.NumberFormat("pl-PL");

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

function describeAction(action: OzipzAction): string {
  const sign = action.izrzSign?.replace(/^IZRZ:\s*/i, "").trim();
  return [
    normalizeActionType(action.actionType),
    action.date ? formatDatePl(action.date) : "",
    sign ? `nr ${sign}` : "",
  ].filter(Boolean).join(", ");
}

function LinkedActionChip({ label, title, onOpen }: { label: ReactNode; title: string; onOpen?: () => void }) {
  return (
    <button
      type="button"
      disabled={!onOpen}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
      className="inline-flex max-w-full items-center gap-1 rounded-sm border border-dashed border-amber-700/50 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-amber-900 hover:bg-amber-100 disabled:cursor-default disabled:hover:bg-amber-50 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70"
      title={title}
    >
      {label}
    </button>
  );
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
      cell: ({ row }) => {
        const ezdState = getActionEzdState(row);

        return (
          <div className="space-y-0.5">
            {row.jrwaSign ? (
              <div className="flex items-center gap-1 text-xs font-mono text-foreground font-medium whitespace-nowrap">
                <span className="truncate max-w-[155px]" title={row.jrwaSign}>
                  {row.jrwaSign}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopySign(row.id, row.jrwaSign || "");
                  }}
                  className="hover:text-foreground text-muted-foreground cursor-pointer p-0.5"
                  title="Kopiuj znak JRWA"
                >
                  {copiedSignId === row.id ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            ) : (
              ezdState !== "not_applicable" && <span className="font-mono text-xs text-muted-foreground/40">-</span>
            )}

            <div className="flex items-center gap-1 flex-wrap">
              <EzdBadge state={ezdState} />
            </div>
          </div>
        );
      },
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
      cell: ({ row }) => {
        const parent = row.linkedActionId ? actionsById?.get(row.linkedActionId) : undefined;
        const distribution = linkedDistributionByActionId?.get(row.id);
        const parentSign = parent?.izrzSign?.replace(/^IZRZ:\s*/i, "").trim();
        return (
          <div className="space-y-1 text-center text-xs leading-relaxed">
            <div className="font-medium rounded-sm px-2 py-1 text-white leading-snug" style={{ backgroundColor: getActionTypeSolidColor(row.actionType) }}>{normalizeActionType(row.actionType)}</div>
            {row.linkedActionId && (
              <LinkedActionChip
                label={
                  <>
                    <CornerDownRight className="size-2.5 shrink-0" />
                    <span className="truncate">
                      {parent ? `z działania ${parentSign || normalizeActionType(parent.actionType)}` : "z innego działania"}
                    </span>
                  </>
                }
                title={parent
                  ? `Dystrybucja dodana razem z działaniem: ${describeAction(parent)}. Kliknij, aby otworzyć to działanie.`
                  : "Dystrybucja dodana razem z innym działaniem."}
                onOpen={parent ? () => onEdit(parent) : undefined}
              />
            )}
            {distribution && (
              <LinkedActionChip
                label={
                  <>
                    <Package className="size-2.5 shrink-0" />
                    <span className="truncate">
                      + dystrybucja
                      {Number(distribution.materialsDistributedCount || 0) > 0 && ` (${PL_NUMBER.format(Number(distribution.materialsDistributedCount))} szt.)`}
                    </span>
                  </>
                }
                title={`Z tym działaniem zapisano dystrybucję materiałów: ${describeAction(distribution)}. Kliknij, aby ją otworzyć.`}
                onOpen={() => onEdit(distribution)}
              />
            )}
            {row.status && ACTION_STATUS_CONFIG[row.status] && (
              <div className="text-muted-foreground">{ACTION_STATUS_CONFIG[row.status].label}</div>
            )}
          </div>
        );
      },
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
      cell: ({ row }) => {
        const odb = Number(row.participantsCount || 0);
        const posr = Number(row.indirectRecipientsCount || 0);
        const mat = Number(row.materialsDistributedCount || 0);
        const isPub = isPublicationActionType(row.actionType);

        return (
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-foreground">
              {PL_NUMBER.format(odb)} {isPub ? "wyśw." : "os."}
            </div>
            {(posr > 0 || mat > 0) && (
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                {posr > 0 && (
                  <span title={`Odbiorcy pośredni: ${posr}`}>
                    +{PL_NUMBER.format(posr)} pośr.
                  </span>
                )}
                {mat > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-medium"
                    title={`Wydane materiały (MAT): ${mat}`}
                  >
                    <Package className="size-2.5 shrink-0" />
                    {PL_NUMBER.format(mat)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
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
      cell: ({ row, density: cellDensity }) => {
        const isCompact = (cellDensity ?? density) === "compact";
        return (
          <div className="space-y-0.5 min-w-[160px] max-w-[190px]">
            <div className="flex items-start gap-1 font-medium text-xs text-foreground">
              <Building2 className="size-3 text-muted-foreground shrink-0 mt-0.5" />
              <span
                className={cn(
                  "break-words leading-tight",
                  isCompact ? "line-clamp-1" : "line-clamp-2"
                )}
                title={row.facilityName || undefined}
              >
                {row.facilityName || "Placówka nieokreślona"}
              </span>
            </div>
            {row.municipality && (
              <div className="text-[10px] font-medium text-muted-foreground/90">
                Gmina: {row.municipality}
              </div>
            )}
            {row.audienceGroup && (
              <div
                className="flex items-center gap-0.5 text-[10px] text-muted-foreground/80 font-medium min-w-0 overflow-hidden"
                title={`Grupa odbiorców: ${row.audienceGroup}`}
              >
                <Users className="size-2.5 shrink-0" />
                <span className="truncate">{row.audienceGroup}</span>
              </div>
            )}
          </div>
        );
      },
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
