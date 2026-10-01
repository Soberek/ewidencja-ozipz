import { useEffect, useState } from "react";
import { FileText, Copy, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OzipzAction } from "../../../types/ozipz.types";

export interface ActionRowActionButtonsProps {
  row: OzipzAction;
  isClosed: boolean;
  locksStatus?: "loading" | "ready" | "error";
  canGenerateIzrz: boolean;
  isPub: boolean;
  isCancelled: boolean;
  onOpenIzrz: (action: OzipzAction) => void;
  onEdit: (action: OzipzAction) => void;
  onDuplicate?: (action: OzipzAction) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function ActionRowActionButtons({
  row,
  isClosed,
  locksStatus = "ready",
  canGenerateIzrz,
  isPub,
  isCancelled,
  onOpenIzrz,
  onEdit,
  onDuplicate,
  onDelete,
}: ActionRowActionButtonsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  useEffect(() => { if (isClosed || locksStatus !== "ready") setIsConfirmOpen(false); }, [isClosed, locksStatus]);

  return (
    <>
      <div className="flex items-center justify-end gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Karta IZRZ / Drukuj"
              disabled={!canGenerateIzrz}
              onClick={(e) => {
                e.stopPropagation();
                if (canGenerateIzrz) onOpenIzrz(row);
              }}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 disabled:opacity-30 cursor-pointer"
            >
              <FileText className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPub
              ? "Publikacja nie wymaga IZRZ"
              : isCancelled
              ? "Działanie odwołane"
              : "Karta IZRZ / Drukuj"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Edytuj działanie"
              disabled={isClosed || locksStatus !== "ready"}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
            >
              <Edit className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {locksStatus === "error" ? "Nie można odczytać blokad miesięcy" : locksStatus === "loading" ? "Wczytywanie blokad miesięcy" : isClosed ? "Miesiąc zablokowany – kliknij wiersz, aby podejrzeć" : "Edytuj działanie"}
          </TooltipContent>
        </Tooltip>

        {onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Kopiuj zadanie"
                aria-label="Kopiuj zadanie"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(row);
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Copy className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Kopiuj zadanie</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Usuń działanie"
              disabled={isClosed || locksStatus !== "ready"}
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmOpen(true);
              }}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 disabled:opacity-30 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {locksStatus === "error" ? "Nie można odczytać blokad miesięcy" : locksStatus === "loading" ? "Wczytywanie blokad miesięcy" : isClosed ? "Miesiąc zablokowany" : "Usuń działanie"}
          </TooltipContent>
        </Tooltip>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => isClosed || locksStatus !== "ready" ? Promise.reject(new Error(isClosed ? "Miesiąc jest zablokowany." : "Nie można odczytać blokad miesięcy.")) : onDelete(row.id)}
        title="Usuń działanie"
        description={
          <span>
            Czy na pewno chcesz usunąć działanie{" "}
            <strong>«{row.title || "Bez tytułu"}»</strong>?
          </span>
        }
        variant="destructive"
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
      />
    </>
  );
}
