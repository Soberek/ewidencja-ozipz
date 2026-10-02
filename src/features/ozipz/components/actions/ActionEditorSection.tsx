import { combineActionNotes, describeSaveError, DEFAULT_EZD_STATUS } from "./editor/actionEditorSubmitUtils";
import { handleActionSaveShortcut } from "./editor/editorShortcuts";
import { useDiscardConfirmation } from "./editor/useDiscardConfirmation";
import { ActionQuickForm } from "./editor/ActionQuickForm";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { ActionEditorSectionProps, ActionEditorDraft } from "./editor/editor.types";
import { useActionEditorState } from "./editor/useActionEditorState";
import { ActionEditorHeader } from "./editor/ActionEditorHeader";
import { ActionEditorFooter } from "./editor/ActionEditorFooter";
import { duplicateActionDraft } from "./editor/editorUtils";
import { isMonthClosed } from "../../utils/dateUtils";
import { useClosedMonths } from "./hooks/useClosedMonths";
import type { OzipzAction } from "../../types/ozipz.types";
import {
  useActions,
  usePrograms,
  useMaterials,
  useFacilities,
  useJrwa,
  useDictionaries,
  useStaff,
  useTemplates,
  useSchedule,
} from "../../store/useOzipzDbStore";

export type { RecipientSubItem, AudienceGroupBlock, ActionEditorSectionProps } from "./editor/editor.types";

export function ActionEditorSection(props: ActionEditorSectionProps) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    duplicateFrom?: Partial<OzipzAction>;
    sourceActionId?: string;
  } | undefined;

  // Pobranie domyślnych danych ze store'a
  const actionsStore = useActions();
  const programsStore = usePrograms();
  const materialsStore = useMaterials();
  const facilitiesStore = useFacilities();
  const jrwaStore = useJrwa();
  const dictStore = useDictionaries();
  const staffStore = useStaff();
  const templatesStore = useTemplates();
  const scheduleStore = useSchedule();

  const actions = props.actions ?? actionsStore.actions;
  const programs = props.programs ?? programsStore.programs;
  const materials = props.materials ?? materialsStore.materials;
  const facilities = props.facilities ?? facilitiesStore.facilities;
  const jrwaCases = props.jrwaCases ?? jrwaStore.jrwaCases;
  const staff = props.staff ?? staffStore.staff;
  const templates = props.templates ?? templatesStore.templates;
  const dictionaryItems = props.dictionaryItems ?? dictStore.dictionaryItems;
  const scheduleEvents = props.scheduleEvents ?? scheduleStore.scheduleEvents;
  const distributions = props.distributions ?? materialsStore.distributions;
  const municipalities = props.municipalities ?? dictStore.municipalities.map((m) => m.label || m.code);

  // Wyznaczenie edytowanego działania (z props, z parametru URL :id lub z draftu kopiowania)
  const editingAction =
    props.editingAction !== undefined
      ? props.editingAction
      : id
      ? actions.find((a) => a.id === id) || null
      : locationState?.duplicateFrom
      ? locationState.duplicateFrom
      : null;

  const isDuplicate = Boolean(locationState?.duplicateFrom);
  const { closedMonths, status: locksStatus } = useClosedMonths();
  const isClosed = Boolean(editingAction?.id && isMonthClosed(editingAction.date, closedMonths));

  const handleDefaultSave = async (
    data: Parameters<NonNullable<ActionEditorSectionProps["onSave"]>>[0],
    autoCreateJrwa?: Parameters<NonNullable<ActionEditorSectionProps["onSave"]>>[1],
    distributionMaterials?: Parameters<NonNullable<ActionEditorSectionProps["onSave"]>>[2],
    linkedDistribution?: Parameters<NonNullable<ActionEditorSectionProps["onSave"]>>[3]
  ) => {
    try {
      await actionsStore.saveActionWithRelations({
        action: data,
        autoCreateJrwa,
        distributionMaterials,
        companionDistribution: linkedDistribution,
      });
      toast.success(linkedDistribution
        ? "Zarejestrowano działanie i powiązaną dystrybucję materiałów"
        : "Zarejestrowano nowe działanie edukacyjne");
    } catch (err) {
      console.error(err);
      const reason = describeSaveError(err);
      toast.error(reason ? `Błąd podczas zapisywania działania: ${reason}` : "Błąd podczas zapisywania działania");
      throw err;
    }
  };

  const handleDefaultUpdate = async (
    actionId: string,
    updates: Partial<typeof actions[0]>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: Parameters<NonNullable<ActionEditorSectionProps["onUpdate"]>>[3]
  ) => {
    try {
      await actionsStore.updateActionWithRelations(actionId, updates, distributionMaterials, linkedDistribution);
      toast.success(linkedDistribution
        ? "Zaktualizowano działanie i dodano powiązaną dystrybucję materiałów"
        : "Zaktualizowano działanie edukacyjne");
    } catch (err) {
      console.error(err);
      const reason = describeSaveError(err);
      toast.error(reason ? `Błąd podczas aktualizacji działania: ${reason}` : "Błąd podczas aktualizacji działania");
      throw err;
    }
  };

  const handleDefaultCancel = () => {
    navigate("/dzialania");
  };

  const onSave = props.onSave || handleDefaultSave;
  const onUpdate = props.onUpdate || handleDefaultUpdate;
  const onCancel = props.onCancel || handleDefaultCancel;

  const resolvedProps: ActionEditorSectionProps = {
    ...props,
    editingAction,
    actions,
    programs,
    materials,
    facilities,
    jrwaCases,
    staff,
    templates,
    dictionaryItems,
    scheduleEvents,
    distributions,
    municipalities,
    isReadOnly: locksStatus !== "ready" || isClosed || (props.isReadOnly ?? false),
    closedReason: locksStatus === "error" ? "Nie można odczytać blokad miesięcy. Odśwież stronę i spróbuj ponownie." : locksStatus === "loading" ? "Wczytywanie blokad miesięcy..." : isClosed ? "Miesiąc jest zamknięty. Odblokuj go w rejestrze działań, aby edytować to działanie." : props.closedReason,
    // Szkic zapisujemy tylko dla pustego nowego działania (nie dla edycji, kopii ani wpisu z planu pracy).
    enableDraft: props.enableDraft ?? (!id && props.editingAction === undefined && !locationState?.duplicateFrom),
    onSave,
    onUpdate,
    onCancel,
    onAddFacility: props.onAddFacility ?? facilitiesStore.addFacility,
  };

  const state = useActionEditorState(resolvedProps);
  const { form, date, materialItems, onSubmit } = state;
  const isSelectedMonthClosed = !resolvedProps.isReadOnly && isMonthClosed(date, closedMonths);
  const { requestCancel, confirmDialog } = useDiscardConfirmation({
    hasUnsavedContent: state.hasUnsavedContent,
    onDiscard: () => { state.discardDraft(); onCancel(); },
  });

  if (id && !editingAction) {
    return <div role="alert" className="mx-auto max-w-5xl p-4 text-sm">Nie znaleziono działania. <button type="button" className="underline" onClick={onCancel}>Wróć do rejestru</button></div>;
  }

  const handleDuplicateFromEditor = () => {
    const formValues = form.getValues();
    const draft: ActionEditorDraft = duplicateActionDraft({ ...formValues, notes: combineActionNotes(state.activitiesDescription, state.additionalNotes) });
    draft.materialItems = materialItems.map((m) => ({
      materialId: m.materialId,
      quantity: m.quantity,
    }));
    navigate("/dzialania/nowe", {
      state: { duplicateFrom: draft },
    });
    toast.info("Utworzono kopię zadania w edytorze. Możesz zmienić datę i zapisać.");
  };

  const errorMessage = Object.values(form.formState.errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(", ");

  return (
    <form
      noValidate onSubmit={form.handleSubmit((data) => {
        if (resolvedProps.isReadOnly || isMonthClosed(data.date, closedMonths)) return;
        return onSubmit(data);
      })}
      onKeyDown={(e) => handleActionSaveShortcut(e, {
        enabled: !resolvedProps.isReadOnly && !isSelectedMonthClosed && !state.isSubmitting,
        onSaveAndAddSimilar: editingAction?.id ? undefined : state.onSaveAndAddSimilar,
      })}
      className="space-y-4 pb-24 max-w-5xl mx-auto px-2 sm:px-4 text-foreground"
    >
      <ActionEditorHeader
        editingAction={editingAction}
        isReadOnly={resolvedProps.isReadOnly}
        closedReason={resolvedProps.closedReason}
        date={date}
        errorMessage={errorMessage}
        onCancel={requestCancel}
        onDuplicate={handleDuplicateFromEditor}
        isDuplicate={isDuplicate}
      />

      {isSelectedMonthClosed && <p role="alert" className="text-sm text-destructive">Miesiąc wybranej daty jest zamknięty. Wybierz datę z otwartego miesiąca, aby zapisać działanie.</p>}

      <fieldset disabled={resolvedProps.isReadOnly} className="space-y-4">
        <ActionQuickForm state={state} data={resolvedProps} />
      </fieldset>

      {state.saveError && <p role="alert" className="text-sm text-destructive">{state.saveError}</p>}
      <ActionEditorFooter
        title={state.title}
        date={state.date}
        actionType={state.actionType}
        facilityName={state.facilityName}
        municipality={state.municipality}
        programName={state.programName || programs.find((p) => p.id === state.programId)?.name || ""}
        leadEducator={state.leadEducator}
        ezdStatus={state.isNoJrwa ? "nie_dotyczy" : state.ezdStatus || DEFAULT_EZD_STATUS}
        numberOfActions={state.numberOfActions}
        totalDirectParticipants={state.totalDirectParticipants}
        materialsDistributedCount={state.materialsDistributedCount || 0}
        jrwaSign={state.jrwaSign}
        izrzSign={state.izrzSign}
        onSaveAndAddSimilar={state.onSaveAndAddSimilar}
        isReadOnly={resolvedProps.isReadOnly}
        isSaveBlocked={isSelectedMonthClosed}
        isSubmitting={state.isSubmitting}
        editingAction={editingAction}
        onCancel={requestCancel}
        missingFields={state.missingFields}
      />
      {confirmDialog}
    </form>
  );
}
