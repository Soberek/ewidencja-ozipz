import {
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OzipzAction } from "../../../types/ozipz.types";
import { EZD_STATUS_LABELS } from "../actionEzdStatus";
import { formatDatePl } from "../../../utils/dateUtils";

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
  /** Rzeczy do sprawdzenia, które nie blokują zapisu. */
  warnings?: string[];
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
  warnings = [],
}: ActionEditorFooterProps) {
  const place = facilityName ? `${facilityName}${municipality ? ` (${municipality})` : ""}` : municipality;
  // Program zwykle nadaje tytuł działania — nie powtarzamy go wtedy w podsumowaniu.
  const details = [
    date && formatDatePl(date, date),
    actionType,
    place,
    programName !== title && programName,
    leadEducator,
    jrwaSign,
    izrzSign && `IZRZ: ${izrzSign}`,
    ezdStatus && (EZD_STATUS_LABELS[ezdStatus] || ezdStatus),
  ].filter((part): part is string => Boolean(part));
  const summary = [title, ...details].filter(Boolean).join(" · ");

  return (
    <footer className="sticky bottom-0 z-20 grid gap-2 border-t border-border bg-card/95 px-4 py-2.5 shadow-md backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0 space-y-1 text-xs">
      {/* Jedna linia podsumowania skracana na końcu — pełna treść w podpowiedzi, a wartości i tak widać w formularzu. */}
      {summary && (
        <p className="flex min-w-0 gap-1 whitespace-nowrap text-muted-foreground" title={summary}>
          {/* Długi tytuł (np. pełna nazwa programu) nie może zasłonić daty i miejsca. */}
          {title && <span className="max-w-[45%] shrink-0 truncate font-semibold text-foreground">{title}</span>}
          {details.length > 0 && <span className="min-w-0 truncate">{title && "· "}{details.join(" · ")}</span>}
        </p>
      )}
        {!isReadOnly && missingFields && (
          <p className={missingFields.length ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}>
            {missingFields.length ? `Uzupełnij: ${missingFields.join(", ")}` : `Gotowe do zapisu (${SAVE_SHORTCUT})`}
            {!missingFields.length && warnings.length > 0 &&
              <span className="text-amber-700 dark:text-amber-300"> · Sprawdź: {warnings.join(", ")}</span>}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2 text-xs font-medium border-x px-3 py-1">
          <span title="Działania Zrealizowane" className="text-primary font-bold">
            {Number(numberOfActions || 1)} DZ
          </span>
          <span>•</span>
          <span title="Odbiorcy">
            ODB: <strong>{Number.isFinite(totalDirectParticipants) ? totalDirectParticipants : 0}</strong>
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
