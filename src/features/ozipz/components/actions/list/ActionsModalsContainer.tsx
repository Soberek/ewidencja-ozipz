import type { OzipzAction, OzipzDistribution } from "../../../types/ozipz.types";
import { ActionsMonthManagementModal } from "./ActionsMonthManagementModal";
import { IzrzDocumentDialog } from "../IzrzDocumentDialog";
import { RozdzielnikBlankietDialog } from "../../materials/RozdzielnikBlankietDialog";

export interface ActionsModalsContainerProps {
  isMonthModalOpen: boolean;
  onCloseMonthModal: () => void;
  closedMonths: Set<string>;
  onToggleMonthLock: (monthKey: string) => void;
  locksStatus: "loading" | "ready" | "error";
  pendingMonth: string | null;
  onRetryMonthLocks: () => void;
  selectedIzrzAction: OzipzAction | null;
  onCloseIzrzDialog: () => void;
  selectedBlankietDistribution: OzipzDistribution | null;
  onCloseBlankietDialog: () => void;
}

export function ActionsModalsContainer({
  isMonthModalOpen,
  onCloseMonthModal,
  closedMonths,
  onToggleMonthLock,
  locksStatus,
  pendingMonth,
  onRetryMonthLocks,
  selectedIzrzAction,
  onCloseIzrzDialog,
  selectedBlankietDistribution,
  onCloseBlankietDialog,
}: ActionsModalsContainerProps) {
  return (
    <>
      <ActionsMonthManagementModal
        isOpen={isMonthModalOpen}
        onClose={onCloseMonthModal}
        currentYear={new Date().getFullYear()}
        closedMonths={closedMonths}
        onToggleMonthLock={onToggleMonthLock}
        locksStatus={locksStatus}
        pendingMonth={pendingMonth}
        onRetry={onRetryMonthLocks}
      />

      {selectedIzrzAction && (
        <IzrzDocumentDialog
          key={selectedIzrzAction.id}
          isOpen={Boolean(selectedIzrzAction)}
          onClose={onCloseIzrzDialog}
          action={selectedIzrzAction}
        />
      )}

      {selectedBlankietDistribution && (
        <RozdzielnikBlankietDialog
          open={Boolean(selectedBlankietDistribution)}
          onOpenChange={(open) => !open && onCloseBlankietDialog()}
          distribution={selectedBlankietDistribution}
        />
      )}
    </>
  );
}
