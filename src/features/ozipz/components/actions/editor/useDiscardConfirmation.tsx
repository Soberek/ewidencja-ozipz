import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Potwierdzenie przed porzuceniem nowego działania z wpisanymi danymi.
 * Bez wpisanych danych formularz zamyka się od razu.
 */
export function useDiscardConfirmation({ hasUnsavedContent, onDiscard }: { hasUnsavedContent: boolean; onDiscard: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const requestCancel = useCallback(() => {
    if (hasUnsavedContent) setIsOpen(true);
    else onDiscard();
  }, [hasUnsavedContent, onDiscard]);

  const confirmDialog = <ConfirmDialog
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    onConfirm={onDiscard}
    variant="warning"
    title="Porzucić nowe działanie?"
    description="Wpisane dane nie zostały zapisane w rejestrze. Po porzuceniu szkic zostanie usunięty."
    confirmText="Porzuć dane"
    cancelText="Wróć do formularza"
  />;

  return { requestCancel, confirmDialog };
}
