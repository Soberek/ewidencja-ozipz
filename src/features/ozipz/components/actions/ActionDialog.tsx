import { ActionQuickForm } from "./editor/ActionQuickForm";
import { useMemo } from "react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type {
  OzipzAction,
  OzipzFacility,
  OzipzProgram,
  OzipzMaterial,
  OzipzStaff,
  OzipzDictionaryItem,
  OzipzTemplate,
  OzipzScheduleEvent,
  OzipzJrwaCase,
  OzipzDistribution,
} from "../../types/ozipz.types";
import { ActionEditorFooter } from "./editor/ActionEditorFooter";
import { useActionEditorState } from "./editor/useActionEditorState";
import { useDictionaries } from "../../store/useOzipzDbStore";
import { isMonthClosed } from "../../utils/dateUtils";
import { useClosedMonths } from "./hooks/useClosedMonths";
import { DEFAULT_EZD_STATUS } from "./editor/actionEditorSubmitUtils";
import { handleActionSaveShortcut } from "./editor/editorShortcuts";
import { useDiscardConfirmation } from "./editor/useDiscardConfirmation";
import type { ActionEditorSectionProps, LinkedDistributionPayload } from "./editor/editor.types";

export interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingAction?: Partial<OzipzAction> | null;
  actions?: OzipzAction[];
  facilities?: OzipzFacility[];
  programs?: OzipzProgram[];
  materials?: OzipzMaterial[];
  staff?: OzipzStaff[];
  activityTypes?: OzipzDictionaryItem[];
  recipientGroups?: OzipzDictionaryItem[];
  campaigns?: OzipzDictionaryItem[];
  templates?: OzipzTemplate[];
  municipalities?: string[];
  scheduleEvents?: OzipzScheduleEvent[];
  jrwaCases?: OzipzJrwaCase[];
  dictionaryItems?: OzipzDictionaryItem[];
  distributions?: OzipzDistribution[];
  isReadOnly?: boolean;
  closedReason?: string;
  enableDraft?: boolean;
  onSave: (
    data: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">,
    autoCreateJrwa?: { section: string; jrwaSymbol: string; caseNumber: number; year: number; fullCaseSign: string },
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: LinkedDistributionPayload
  ) => void | Promise<void>;
  onUpdate: (
    id: string,
    data: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: LinkedDistributionPayload
  ) => void | Promise<void>;
  onAddFacility?: ActionEditorSectionProps["onAddFacility"];
}

export function ActionDialog(props: ActionDialogProps) {
  const { isOpen, onClose, editingAction } = props;
  const { closedMonths, status: locksStatus } = useClosedMonths();
  const isReadOnly = Boolean(props.isReadOnly || locksStatus !== "ready" || (editingAction?.id && isMonthClosed(editingAction.date, closedMonths)));
  const dictStore = useDictionaries();
  const municipalities = useMemo(() => {
    return props.municipalities && props.municipalities.length > 0
      ? props.municipalities
      : dictStore.municipalities.map((m) => m.label || m.code);
  }, [props.municipalities, dictStore.municipalities]);

  const state = useActionEditorState({
    ...props,
    municipalities,
    dictionaryItems: props.dictionaryItems ?? dictStore.dictionaryItems,
    enableDraft: props.enableDraft ?? !editingAction,
    onCancel: onClose,
  });

  const { form, onSubmit } = state;
  const isSelectedMonthClosed = !isReadOnly && isMonthClosed(state.date, closedMonths);
  const { requestCancel, confirmDialog } = useDiscardConfirmation({
    hasUnsavedContent: state.hasUnsavedContent,
    onDiscard: () => { state.discardDraft(); onClose(); },
  });

  const formErrors = form.formState.errors;
  const programName = useMemo(() => {
    return state.programName || (props.programs ?? []).find((p) => p.id === state.programId)?.name || "";
  }, [props.programs, state.programId, state.programName]);

  const errorMessages = useMemo(() => {
    const keys = Object.keys(formErrors);
    if (keys.length === 0) return null;
    const msgs = keys
      .map((k) => (formErrors as Record<string, { message?: string }>)[k]?.message)
      .filter(Boolean);
    return msgs.length > 0 ? `Proszę poprawić formularz: ${msgs.join(", ")}` : null;
  }, [formErrors]);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={requestCancel}
      title={isReadOnly ? "Szczegóły działania edukacyjnego" : editingAction?.id ? "Edycja działania edukacyjnego" : "Nowe działanie edukacyjne"}
      size="2xl"
      error={errorMessages}
      footer={null}
    >
      <form noValidate onSubmit={form.handleSubmit((data) => {
        if (isReadOnly || isMonthClosed(data.date, closedMonths)) return;
        return onSubmit(data);
      })} onKeyDown={(e) => handleActionSaveShortcut(e, {
        enabled: !isReadOnly && !isSelectedMonthClosed && !state.isSubmitting,
        onSaveAndAddSimilar: editingAction?.id ? undefined : state.onSaveAndAddSimilar,
      })} className="space-y-4">
        {locksStatus === "error" && <p role="alert" className="text-sm text-destructive">Nie można odczytać blokad miesięcy. Odśwież stronę i spróbuj ponownie.</p>}
        {isSelectedMonthClosed && <p role="alert" className="text-sm text-destructive">Miesiąc wybranej daty jest zamknięty. Wybierz datę z otwartego miesiąca, aby zapisać działanie.</p>}
        <fieldset disabled={isReadOnly} className="space-y-4">
          <ActionQuickForm state={state} data={{ ...props, municipalities,
            dictionaryItems: props.dictionaryItems ?? dictStore.dictionaryItems }} />
        </fieldset>

        {state.saveError && <p role="alert" className="text-sm text-destructive">{state.saveError}</p>}
        <ActionEditorFooter
          title={state.title}
          date={state.date}
          actionType={state.actionType}
          facilityName={state.facilityName}
          municipality={state.municipality}
          programName={programName}
          leadEducator={state.leadEducator}
          ezdStatus={state.isNoJrwa ? "nie_dotyczy" : state.ezdStatus || DEFAULT_EZD_STATUS}
          numberOfActions={state.numberOfActions}
          totalDirectParticipants={state.totalDirectParticipants}
          materialsDistributedCount={state.materialsDistributedCount || 0}
          jrwaSign={state.jrwaSign}
          izrzSign={state.izrzSign}
          onSaveAndAddSimilar={state.onSaveAndAddSimilar}
          editingAction={editingAction}
          isReadOnly={isReadOnly}
          isSaveBlocked={isSelectedMonthClosed}
          isSubmitting={state.isSubmitting}
          onCancel={requestCancel}
          missingFields={state.missingFields}
          isModal
        />
        {confirmDialog}
      </form>
    </ModalDialog>
  );
}
