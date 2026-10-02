import type { ReactNode } from "react";
import { Building2, Check, Copy, CornerDownRight, Package, Users } from "lucide-react";
import type { TableDensity } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import type { OzipzAction } from "../../../types/ozipz.types";
import { formatDatePl } from "../../../utils/dateUtils";
import { isPublicationActionType, normalizeActionType } from "../editor/editorUtils";
import { getActionEzdState } from "../actionEzdStatus";
import { ACTION_STATUS_CONFIG, EzdBadge, getActionTypeSolidColor } from "./ActionTableBadges";

// Jeden formatter zamiast toLocaleString w każdej komórce (tworzenie Intl przy każdym wywołaniu jest kosztowne).
const PL_NUMBER = new Intl.NumberFormat("pl-PL");

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

export function JrwaSignCell({ row, copiedSignId, onCopySign }: {
  row: OzipzAction;
  copiedSignId: string | null;
  onCopySign: (id: string, sign: string) => void;
}) {
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
}

export function ActionTypeCell({ row, actionsById, linkedDistributionByActionId, onEdit }: {
  row: OzipzAction;
  actionsById?: ReadonlyMap<string, OzipzAction>;
  linkedDistributionByActionId?: ReadonlyMap<string, OzipzAction>;
  onEdit: (action: OzipzAction) => void;
}) {
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
}

export function ParticipantsCell({ row }: { row: OzipzAction }) {
  const odb = Number(row.participantsCount || 0);
  const mat = Number(row.materialsDistributedCount || 0);
  const isPub = isPublicationActionType(row.actionType);

  return (
    <div className="text-right font-mono">
      <div className="text-xs font-bold text-foreground">
        {PL_NUMBER.format(odb)} {isPub ? "wyśw." : "os."}
      </div>
      {mat > 0 && (
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground flex-wrap">
          {(
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
}

export function FacilityCell({ row, density }: { row: OzipzAction; density: TableDensity }) {
  const isCompact = density === "compact";
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
}
