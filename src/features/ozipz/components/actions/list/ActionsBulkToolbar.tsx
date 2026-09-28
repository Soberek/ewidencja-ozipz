import { useEffect, useState } from "react";
import {
  Trash2,
  CheckCircle2,
  X,
  Download,
  Copy,
  FileCheck,
  Users,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface ActionsBulkToolbarProps {
  selectedCount: number;
  totalFilteredCount: number;
  selectedRecipientsCount?: number;
  selectedMaterialsCount?: number;
  selectedDoEzdCount?: number;
  onSelectAll: () => void;
  onSelectFirstN?: (count: number) => void;
  onClearSelection: () => void;
  onBulkDelete: () => void | Promise<void>;
  onBulkMarkDone?: () => void;
  onBulkMarkEzd?: (status: "do_ezd" | "w_ezd") => void;
  onBulkExportCsv?: () => void;
  onBulkCopySummary?: () => void;
  onDuplicateSingle?: () => void;
  mutationsDisabled?: boolean;
}

export function ActionsBulkToolbar({
  selectedCount,
  totalFilteredCount,
  selectedRecipientsCount,
  selectedMaterialsCount,
  selectedDoEzdCount,
  onSelectAll,
  onSelectFirstN,
  onClearSelection,
  onBulkDelete,
  onBulkMarkDone,
  onBulkMarkEzd,
  onBulkExportCsv,
  onBulkCopySummary,
  onDuplicateSingle,
  mutationsDisabled = false,
}: ActionsBulkToolbarProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  useEffect(() => { if (mutationsDisabled) setIsDeleteConfirmOpen(false); }, [mutationsDisabled]);
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-[3px] border border-primary/40 bg-primary/10 px-3 py-2 text-xs select-none shadow-sm">
      {/* Informacje o wyborze i metryki */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary text-primary-foreground font-mono text-xs px-2">
          {selectedCount}
        </Badge>
        <span className="font-bold text-foreground">
          Wybrano {selectedCount} z {totalFilteredCount} działań
        </span>

        {/* Live metryki dla zaznaczonych */}
        {selectedRecipientsCount !== undefined && (
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-primary/20 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Users className="size-3 text-primary" /> {selectedRecipientsCount}
            </span>
            {selectedMaterialsCount !== undefined && selectedMaterialsCount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-foreground ml-1">
                <Package className="size-3 text-emerald-600" /> {selectedMaterialsCount}
              </span>
            )}
            {selectedDoEzdCount !== undefined && selectedDoEzdCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4.5 px-1.5 ml-1 font-bold">
                {selectedDoEzdCount} do EZD
              </Badge>
            )}
          </div>
        )}

        {/* Szybki wybór */}
        <div className="flex items-center gap-1 ml-1 text-[11px]">
          {onSelectFirstN && totalFilteredCount > 5 && selectedCount !== 5 && (
            <button
              type="button"
              onClick={() => onSelectFirstN(5)}
              className="text-primary hover:underline font-medium cursor-pointer px-1 py-0.5 rounded hover:bg-primary/10"
            >
              Wybierz 5
            </button>
          )}
          {onSelectFirstN && totalFilteredCount > 10 && selectedCount !== 10 && (
            <button
              type="button"
              onClick={() => onSelectFirstN(10)}
              className="text-primary hover:underline font-medium cursor-pointer px-1 py-0.5 rounded hover:bg-primary/10"
            >
              Wybierz 10
            </button>
          )}
          {selectedCount < totalFilteredCount && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-primary underline hover:text-primary/80 font-semibold cursor-pointer ml-0.5"
            >
              Wszystkie ({totalFilteredCount})
            </button>
          )}
        </div>
      </div>

      {/* Przyciski operacji masowych */}
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedCount === 1 && onDuplicateSingle && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicateSingle}
            className="h-7 text-xs bg-card gap-1 cursor-pointer hover:bg-muted font-medium text-foreground"
            title="Kopiuj zaznaczone zadanie jako nowe działanie"
          >
            <Copy className="size-3 text-primary" />
            <span>Kopiuj zadanie</span>
          </Button>
        )}

        {onBulkExportCsv && (
          <Button
            size="sm"
            variant="outline"
            onClick={onBulkExportCsv}
            className="h-7 text-xs bg-card gap-1 cursor-pointer hover:bg-muted font-medium"
            title="Eksportuj wybrane działania do pliku CSV"
          >
            <Download className="size-3 text-primary" />
            <span>Eksportuj (.csv)</span>
          </Button>
        )}

        {onBulkCopySummary && (
          <Button
            size="sm"
            variant="outline"
            onClick={onBulkCopySummary}
            className="h-7 text-xs bg-card gap-1 cursor-pointer hover:bg-muted font-medium"
            title="Kopiuj podsumowanie wybranych działań do schowka"
          >
            <Copy className="size-3 text-muted-foreground" />
            <span>Kopiuj</span>
          </Button>
        )}

        {onBulkMarkEzd && (
          <Button
            size="sm"
            variant="outline"
            disabled={mutationsDisabled}
            onClick={() => onBulkMarkEzd("w_ezd")}
            className="h-7 text-xs bg-card gap-1 cursor-pointer text-blue-600 border-blue-500/30 hover:bg-blue-500/10 dark:text-blue-400 font-medium"
            title="Oznacz wybrane działania jako zarejestrowane w EZD"
          >
            <FileCheck className="size-3" />
            <span>Wprowadzone w EZD</span>
          </Button>
        )}

        {onBulkMarkDone && (
          <Button
            size="sm"
            variant="outline"
            disabled={mutationsDisabled}
            onClick={onBulkMarkDone}
            className="h-7 text-xs bg-card gap-1 cursor-pointer text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400 font-medium"
          >
            <CheckCircle2 className="size-3" />
            <span>Wykonane</span>
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={mutationsDisabled}
          onClick={() => setIsDeleteConfirmOpen(true)}
          className="h-7 text-xs bg-card gap-1 cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10 font-medium"
        >
          <Trash2 className="size-3" />
          <span>Usuń</span>
        </Button>

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer ml-1"
          title="Odznacz wszystkie"
          aria-label="Odznacz wszystkie działania"
        >
          <X className="size-4" />
        </button>
      </div>
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => mutationsDisabled ? Promise.reject(new Error("Nie można zmieniać zaznaczonych działań w zamkniętym miesiącu lub bez odczytu blokad.")) : onBulkDelete()}
        title="Usuń wybrane działania"
        description={`Czy na pewno chcesz usunąć ${selectedCount} zaznaczonych działań? Tej operacji nie można cofnąć.`}
        confirmText="Usuń działania"
        cancelText="Anuluj"
      />
    </div>
  );
}
