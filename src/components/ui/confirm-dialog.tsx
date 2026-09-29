import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Potwierdź operację",
  description = "Czy na pewno chcesz kontynuować tę operację?",
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant = "destructive",
  icon,
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) setConfirmError(null);
  }, [isOpen]);

  const isExecuting = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setConfirmError(null);
      setInternalLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      setConfirmError(error instanceof Error && error.message
        ? error.message
        : "Nie udało się wykonać operacji. Spróbuj ponownie.");
    } finally {
      setInternalLoading(false);
    }
  };

  const defaultIcon =
    icon ??
    (variant === "destructive" ? (
      <Trash2 className="size-4" />
    ) : variant === "warning" ? (
      <AlertTriangle className="size-4" />
    ) : (
      <Info className="size-4" />
    ));

  const resolvedConfirmText =
    confirmLabel ??
    confirmText ??
    (variant === "destructive" ? "Usuń trwale" : "Potwierdź");

  const resolvedCancelText = cancelLabel ?? cancelText ?? "Anuluj";

  const iconBgClass =
    variant === "destructive"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : variant === "warning"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isExecuting && onClose()}>
      <DialogContent closeDisabled={isExecuting} className="sm:max-w-[420px] p-0 overflow-hidden border border-border shadow-md rounded-[3px] select-none">
        <DialogHeader className="p-4 pr-10 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "size-8 rounded-[3px] flex items-center justify-center border shrink-0",
                iconBgClass
              )}
            >
              {defaultIcon}
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {title}
              </DialogTitle>
            </div>
          </div>
          {/* div zamiast p: opis bywa listą lub kilkoma akapitami, a <p> nie może ich zawierać. */}
          <DialogDescription asChild>
            <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{description}</div>
          </DialogDescription>
          {confirmError && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {confirmError}
            </p>
          )}
        </DialogHeader>

        <DialogFooter className="p-3 bg-muted/10 border-t border-border flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExecuting}
            className="h-8 text-xs font-semibold cursor-pointer"
          >
            {resolvedCancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            disabled={isExecuting}
            className="h-8 text-xs font-bold gap-1.5 cursor-pointer shadow-none"
          >
            {isExecuting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Przetwarzanie...
              </>
            ) : (
              resolvedConfirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
