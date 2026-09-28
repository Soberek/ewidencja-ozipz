import {
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OzipzAction } from "../../../types/ozipz.types";
import { EZD_STATUS_LABELS } from "../actionEzdStatus";

const SAVE_SHORTCUT = "⌘/Ctrl + Enter";

export interface ActionEditorFooterProps {
  title?: string;
  date?: string;
  actionType?: string;
  facilityName?: string;
  municipality?: string;
  programName?: string;
  leadEducator?: string;
  ezdStatus?: string;
  numberOfActions?: number;
  totalDirectParticipants: number;
  indirectRecipientsCount?: number;
  materialsDistributedCount?: number;
  groupsCount?: number;
  jrwaSign?: string;
  izrzSign?: string;
  isReadOnly?: boolean;
  isSaveBlocked?: boolean;
  isSubmitting?: boolean;
  editingAction?: Partial<OzipzAction> | null;
  onCancel: () => void;
  onSaveAndAddSimilar?: () => void;
  isModal?: boolean;
  /** Wymagane pola, których jeszcze brakuje — podpowiedź przed zapisem. */
  missingFields?: string[];
}

export function ActionEditorFooter({
  title,
  date,
  actionType,
  facilityName,
  municipality,
  programName,
  leadEducator,
  ezdStatus,
  numberOfActions = 1,
  totalDirectParticipants,
  indirectRecipientsCount = 0,
  materialsDistributedCount = 0,
  jrwaSign,
  izrzSign,
  isReadOnly = false,
  isSaveBlocked = false,
  isSubmitting = false,
  editingAction,
  onCancel,
  onSaveAndAddSimilar,
  missingFields,
}: ActionEditorFooterProps) {
  return (
    <footer className="sticky bottom-0 z-20 grid gap-2 border-t border-border bg-card/95 px-4 py-2.5 shadow-md backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0 space-y-1 text-xs">
      {/* Jedna linia metadanych — długie nazwy są skracane, pełne wartości widać w formularzu. */}
      <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap [&>*]:shrink-0">
        {title && (
          <span className="max-w-[200px] truncate font-semibold text-foreground" title={title}>
            {title}
          </span>
        )}
        {date && <Badge variant="outline">{date}</Badge>}
        {actionType && <Badge variant="secondary">{actionType}</Badge>}
        {(facilityName || municipality) && (
          <span className="max-w-[16rem] truncate text-muted-foreground" title={facilityName || municipality}>
            📍 {facilityName ? `${facilityName}${municipality ? ` (${municipality})` : ""}` : municipality}
          </span>
        )}
        {programName && (
          <Badge variant="default" className="max-w-[14rem] bg-primary/90" title={programName}>
            <span className="truncate">{programName}</span>
          </Badge>
        )}
        {leadEducator && <span className="text-muted-foreground">👤 {leadEducator}</span>}
        {ezdStatus && (
          <Badge
            variant={
              ezdStatus === "zakonczone" ||
              ezdStatus === "zarejestrowane" ||
              ezdStatus === "zarejestrowana" ||
              ezdStatus === "w_ezd"
                ? "success"
                : "outline"
            }
          >
            {EZD_STATUS_LABELS[ezdStatus] || ezdStatus}
          </Badge>
        )}
        {jrwaSign && <span className="font-mono text-xs text-primary">{jrwaSign}</span>}
        {izrzSign && <span className="font-mono text-xs text-muted-foreground">{izrzSign}</span>}
      </div>
        {!isReadOnly && missingFields && (
          <p className={missingFields.length ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
            {missingFields.length ? `Uzupełnij: ${missingFields.join(", ")}` : `Gotowe do zapisu (${SAVE_SHORTCUT})`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2 text-xs font-medium border-x px-3 py-1">
          <span title="Działania Zrealizowane" className="text-primary font-bold">
            {Number(numberOfActions || 1)} DZ
          </span>
          <span>•</span>
          <span title="Odbiorcy Bezpośredni">
            ODB: <strong>{Number.isFinite(totalDirectParticipants) ? totalDirectParticipants : 0}</strong>
          </span>
          <span>•</span>
          <span title="Odbiorcy Pośredni">
            POŚR: <strong>{Number.isFinite(indirectRecipientsCount) ? indirectRecipientsCount : 0}</strong>
          </span>
          <span>•</span>
          <span title="Rozdane Materiały">
            MAT: <strong>{Number.isFinite(materialsDistributedCount) ? materialsDistributedCount : 0}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            {isReadOnly ? "Powrót" : "Anuluj"}
          </Button>
          {!isReadOnly && !editingAction?.id && onSaveAndAddSimilar && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSaveAndAddSimilar}
              disabled={isSubmitting || isSaveBlocked}
              title="Zapisz i przygotuj kolejne działanie z tą samą formą i programem (⌘/Ctrl + Shift + Enter)"
            >
              Zapisz i dodaj podobne
            </Button>
          )}
          {!isReadOnly && (
            <Button type="submit" size="sm" disabled={isSubmitting || isSaveBlocked} title={`Zapisz (${SAVE_SHORTCUT})`}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Zapisywanie…
                </>
              ) : editingAction?.id ? (
                "Zapisz zmiany"
              ) : (
                "Zapisz działanie"
              )}
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
