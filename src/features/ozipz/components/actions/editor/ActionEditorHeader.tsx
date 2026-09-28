import { Activity, ArrowLeft, Copy, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OzipzAction } from "../../../types/ozipz.types";
import { getMonthKey } from "../../../utils/dateUtils";

interface ActionEditorHeaderProps {
  editingAction?: Partial<OzipzAction> | null;
  isReadOnly?: boolean;
  closedReason?: string;
  date: string;
  errorMessage?: string | null;
  onCancel: () => void;
  onDuplicate?: () => void;
  isDuplicate?: boolean;
}

export function ActionEditorHeader({
  editingAction,
  isReadOnly = false,
  closedReason,
  date,
  errorMessage,
  onCancel,
  onDuplicate,
  isDuplicate = false,
}: ActionEditorHeaderProps) {
  return (
    <>
      {/* HEADER Z PRZYCISKIEM POWROTU I PRZYCISKAMI AKCJI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80 pt-1">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 gap-1.5 cursor-pointer hover:bg-muted font-bold text-xs"
          >
            <ArrowLeft className="size-3.5" /> Wróć do listy
          </Button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                {editingAction?.id
                  ? isReadOnly ? "Podgląd działania" : "Edycja działania"
                  : isDuplicate
                  ? "Nowe Działanie (Kopia)"
                  : "Nowe działanie"}
              </h1>
              {isDuplicate && <Badge variant="outline">Kopia zadania</Badge>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDuplicate && (editingAction?.id || isDuplicate) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-muted"
              title="Kopiuj dane do nowego formularza"
            >
              <Copy className="size-3.5 text-primary" />
              Kopiuj zadanie
            </Button>
          )}


        </div>
      </div>

      {/* BANER BLOKADY MIESIĄCA W TRYBIE TYLKO DO ODCZYTU */}
      {isReadOnly && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-[3px] border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-none">
          <Lock className="size-4 text-amber-600 shrink-0" />
          <span>
            {closedReason || `Miesiąc (${getMonthKey(date)}) jest zamknięty i rozliczony. Zadanie znajduje się w trybie tylko do odczytu (edycja i zapis są zablokowane).`}
          </span>
        </div>
      )}

      {/* BANER BŁĘDU WALIDACJI */}
      {errorMessage && (
        <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-[3px] border border-destructive/20 font-bold flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <span>Błąd walidacji: {errorMessage}</span>
        </div>
      )}
    </>
  );
}
