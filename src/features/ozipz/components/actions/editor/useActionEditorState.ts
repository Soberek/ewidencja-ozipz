import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActionFormSchema,
  type ActionFormInput,
  type ActionFormOutput,
  type ActionEditorSectionProps,
} from "./editor.types";
import { parseAudienceGroups } from "./audienceUtils";
import {
  getDefaultActionFormValues,
  mapActionToFormValues,
  isPublicationActionType,
  isDistributionActionType,
  isNoJrwaActionType,
  getSoleActiveStaffName,
} from "./editorUtils";
import { PUBLICATION_DEFAULTS } from "../../../constants";
import { useAudienceGroups } from "./useAudienceGroups";
import { useActionEditorJrwa } from "./useActionEditorJrwa";
import { useActionEditorMaterials } from "./useActionEditorMaterials";
import { useTemplates } from "../../../store/useOzipzDbStore";
import { toast } from "sonner";
import { useActionEditorPresets } from "./useActionEditorPresets";
import {
  buildActionCleanPayload,
  buildActionDistributionMaterials,
  resolveActionInitialMaterials,
  matchFacilityInfo,
  findDuplicateAction,
  describeSaveError,
  getMissingActionFields,
} from "./actionEditorSubmitUtils";
import { useActionEditorDraft } from "./useActionEditorDraft";
import type { ActionDraft } from "./actionDraft";
import { buildLinkedDistribution, DEFAULT_DISTRIBUTION_ACTION_TYPE } from "../../../utils/linkedDistribution";

const DUPLICATE_CONFIRM_DELAY_MS = 800;

export function useActionEditorState({
  editingAction,
  actions = [],
  programs = [],
  materials = [],
  facilities = [],
  distributions = [],
  jrwaCases = [],
  dictionaryItems = [],
  staff = [],
  templates: suppliedTemplates,
  onSave,
  onUpdate,
  onCancel,
  enableDraft = false,
}: ActionEditorSectionProps) {
  const templatesStore = useTemplates();
  const templates = suppliedTemplates ?? templatesStore.templates;
  const isEditMode = Boolean(editingAction?.id);
  const [facilityAddress, setFacilityAddress] = useState("");
  const [activitiesDescription, setActivitiesDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  // Materiały wydane podczas działania zapisujemy domyślnie jako osobne, powiązane działanie „Dystrybucja”.
  const [separateDistribution, setSeparateDistribution] = useState(true);

  const audience = useAudienceGroups();
  const { setAudienceGroups, totalDirectParticipants, formattedAudienceString } = audience;
  const hasNamedAudience = audience.audienceGroups.some((g) => g.items.some((i) => i.name.trim()));

  const activityTypeDict = useMemo(
    () => dictionaryItems.filter((d) => d.dictType === "activityType" || d.dictType === "formy_dzialan"),
    [dictionaryItems]
  );
  const campaignDict = useMemo(
    () => dictionaryItems.filter((d) => d.dictType === "campaign"),
    [dictionaryItems]
  );

  const form = useForm<ActionFormInput, undefined, ActionFormOutput>({
    resolver: zodResolver(ActionFormSchema),
    defaultValues: getDefaultActionFormValues(activityTypeDict, staff),
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  // Ostrzeżenie o duplikacie: zapis mimo to wymaga świadomego ponownego kliknięcia (nie przypadkowego dwukliku).
  const duplicateWarningRef = useRef<{ key: string; at: number } | null>(null);
  const { setValue, watch, reset } = form;

  const title = watch("title"), actionType = watch("actionType"), date = watch("date"),
    facilityId = watch("facilityId"), facilityName = watch("facilityName"), municipality = watch("municipality"),
    programId = watch("programId"), programName = watch("programName"), campaignId = watch("campaignId"),
    indirectRecipientsCount = watch("indirectRecipientsCount"),
    materialsDistributedCount = watch("materialsDistributedCount"), numberOfActions = watch("numberOfActions") || 1, materialId = watch("materialId"),
    leadEducator = watch("leadEducator"), ezdStatus = watch("ezdStatus"),
    izrzSign = watch("izrzSign"), jrwaSign = watch("jrwaSign");

  const isPublication = useMemo(() => isPublicationActionType(actionType), [actionType]);
  const isDistribution = useMemo(() => isDistributionActionType(actionType), [actionType]);
  const isNoJrwa = useMemo(() => isNoJrwaActionType(actionType), [actionType]);
  const distributionActionType = activityTypeDict.find((d) => isDistributionActionType(d.label))?.label
    ?? DEFAULT_DISTRIBUTION_ACTION_TYPE;
  // Wpisy zapisane razem: dystrybucja tego działania albo działanie, z którym zapisano tę dystrybucję.
  const linkedDistribution = editingAction?.id ? actions.find((a) => a.linkedActionId === editingAction.id) : undefined;
  const linkedParentAction = editingAction?.linkedActionId ? actions.find((a) => a.id === editingAction.linkedActionId) : undefined;
  const canSeparateDistribution = !isPublication && !isDistribution && !linkedDistribution && !editingAction?.linkedActionId;

  const prevActionIdRef = useRef<string | null | undefined>(undefined);
  const staffRef = useRef(staff); staffRef.current = staff;
  const facilitiesRef = useRef(facilities); facilitiesRef.current = facilities;
  const distributionsRef = useRef(distributions); distributionsRef.current = distributions;
  const activityTypeDictRef = useRef(activityTypeDict); activityTypeDictRef.current = activityTypeDict;

  const jrwa = useActionEditorJrwa({ programs, actions, jrwaCases, dictionaryItems, isNoJrwa, isEditMode, setValue, watch });
  const mats = useActionEditorMaterials({ materials, materialId, setValue, watch });
  const presets = useActionEditorPresets({
    templates, activityTypeDict, setValue, watch, setAudienceGroups,
    handleJrwaSymbolChange: jrwa.handleJrwaSymbolChange, activitiesDescription, setActivitiesDescription,
  });

  const allValues = watch();
  const restoreFromDraft = (saved: ActionDraft) => {
    reset(saved.values);
    setAudienceGroups(saved.audienceGroups);
    mats.setMaterialItems(saved.materialItems);
    setActivitiesDescription(saved.activitiesDescription);
    setAdditionalNotes(saved.additionalNotes);
    setFacilityAddress(matchFacilityInfo(saved.values.facilityName || "", facilities)?.address || "");
    jrwa.restoreClassification(saved.selectedJrwaSymbol, saved.autoSign);
  };
  const draft = useActionEditorDraft({
    enabled: enableDraft && !editingAction,
    content: { values: allValues, audienceGroups: audience.audienceGroups, materialItems: mats.materialItems, activitiesDescription, additionalNotes },
    selectedJrwaSymbol: jrwa.selectedJrwaSymbol,
    autoSign: Boolean(jrwaSign) && jrwaSign === jrwa.generatedJrwaMeta?.fullCaseSign,
    onRestore: restoreFromDraft,
  });
  const missingFields = getMissingActionFields(allValues, { isPublication, hasNamedAudience });

  useEffect(() => {
    if (isPublication) {
      if (watch("ezdStatus") !== "nie_dotyczy") setValue("ezdStatus", "nie_dotyczy");
      if (watch("izrzSign") !== "") setValue("izrzSign", "");
      if (watch("jrwaSign") !== "") setValue("jrwaSign", "");
      if (watch("jrwaCaseId") !== "") setValue("jrwaCaseId", "");
      if (watch("participantsCount") !== 0) setValue("participantsCount", 0);
      if (watch("materialsDistributedCount") !== 0) setValue("materialsDistributedCount", 0);
      if (!watch("audienceGroup")) {
        setValue("audienceGroup", PUBLICATION_DEFAULTS.audienceGroup);
      }
      jrwa.setGeneratedJrwaMeta(null);
      jrwa.setAutoCreateJrwaCase(false);
      setAudienceGroups((prev) => (prev.length > 0 ? [] : prev));
      mats.setMaterialItems((prev) => (prev.length > 0 ? [] : prev));
      if (!watch("facilityName")) {
        setValue("facilityName", PUBLICATION_DEFAULTS.facilityName);
        setValue("municipality", PUBLICATION_DEFAULTS.municipality);
      }
    }
  }, [isPublication, setValue, setAudienceGroups, watch, jrwa, mats]);

  // Po zmianie formy z publikacji na inną usuwamy miejsce wpisane automatycznie dla publikacji.
  const wasPublicationRef = useRef(isPublication);
  useEffect(() => {
    if (wasPublicationRef.current && !isPublication && watch("facilityName") === PUBLICATION_DEFAULTS.facilityName) {
      setValue("facilityName", "");
      setValue("facilityId", "");
      if (watch("municipality") === PUBLICATION_DEFAULTS.municipality) setValue("municipality", "");
    }
    wasPublicationRef.current = isPublication;
  }, [isPublication, setValue, watch]);

  useEffect(() => {
    if (isDistribution) {
      if (watch("ezdStatus") !== "nie_dotyczy") setValue("ezdStatus", "nie_dotyczy");
      if (watch("izrzSign") !== "") setValue("izrzSign", "");
      if (watch("jrwaSign") !== "") setValue("jrwaSign", "");
      if (watch("jrwaCaseId") !== "") setValue("jrwaCaseId", "");
      jrwa.setGeneratedJrwaMeta(null);
      jrwa.setAutoCreateJrwaCase(false);
    }
  }, [isDistribution, setValue, watch, jrwa]);

  useEffect(() => {
    if (!isPublication) {
      if (audience.audienceGroups.length === 0) setAudienceGroups(parseAudienceGroups(""));
      const description = hasNamedAudience ? formattedAudienceString : "";
      if (watch("audienceGroup") !== description) setValue("audienceGroup", description);
      if (watch("participantsCount") !== totalDirectParticipants) setValue("participantsCount", totalDirectParticipants);
    }
  }, [formattedAudienceString, hasNamedAudience, audience.audienceGroups.length, setAudienceGroups, totalDirectParticipants, setValue, isPublication, watch]);

  const actionKey = editingAction
    ? editingAction.id || `prefill:${editingAction.scheduleEventId || editingAction.title || "custom"}`
    : "empty";

  useEffect(() => {
    if (actionKey !== prevActionIdRef.current) {
      prevActionIdRef.current = actionKey;
      wasPublicationRef.current = isPublicationActionType(editingAction?.actionType);
      duplicateWarningRef.current = null;
      const initialMaterials = editingAction ? resolveActionInitialMaterials(editingAction, distributionsRef.current) : [];
      // Istniejący wpis, który już miał materiały, zostaje jak był, dopóki użytkownik sam nie włączy dystrybucji.
      setSeparateDistribution(!editingAction?.id || (initialMaterials.length === 0 && !(Number(editingAction.materialsDistributedCount) > 0)));
      if (editingAction) {
        reset(mapActionToFormValues(editingAction, staffRef.current));
        setAudienceGroups(parseAudienceGroups(editingAction.audienceGroup, editingAction.participantsCount));
        setActivitiesDescription(editingAction.notes || "");
        setAdditionalNotes("");
        presets.setSelectedTemplateId("");

        const fac = facilitiesRef.current.find(
          (f) =>
            (editingAction.facilityId && f.id === editingAction.facilityId) ||
            (editingAction.facilityName && f.name.trim().toLowerCase() === editingAction.facilityName.trim().toLowerCase())
        );
        if (fac) {
          setFacilityAddress(fac.address ? `${fac.address}, ${fac.city || fac.municipality}` : fac.city || "");
          if (!editingAction.municipality && fac.municipality) setValue("municipality", fac.municipality);
          if (!editingAction.facilityId && fac.id) setValue("facilityId", fac.id);
        }

        jrwa.initJrwaForAction(editingAction);
        mats.setMaterialItems(initialMaterials);
      } else {
        reset(getDefaultActionFormValues(activityTypeDictRef.current, staffRef.current));
        setFacilityAddress("");
        setAudienceGroups(parseAudienceGroups(""));
        setSaveError(null);
        setActivitiesDescription("");
        setAdditionalNotes("");
        presets.setSelectedTemplateId("");
        jrwa.initJrwaForAction(null);
        mats.setMaterialItems([]);
      }
    }
  }, [actionKey, editingAction, reset, setAudienceGroups, setValue, jrwa, presets, mats]);

  useEffect(() => {
    const soleStaffName = getSoleActiveStaffName(staff);
    if (!editingAction?.id && !editingAction?.leadEducator && soleStaffName &&
        !form.getValues("leadEducator") && !form.getFieldState("leadEducator").isDirty) {
      setValue("leadEducator", soleStaffName);
    }
  }, [staff, editingAction, form, setValue]);

  const handleFacilityNameInput = (val: string) => {
    setValue("facilityName", val);
    const matched = matchFacilityInfo(val, facilities);
    if (matched) {
      setValue("facilityId", matched.id);
      if (matched.municipality) setValue("municipality", matched.municipality);
      setFacilityAddress(matched.address);
    } else {
      setValue("facilityId", "");
      setFacilityAddress("");
    }
  };

  const onSubmit = async (data: ActionFormOutput, addSimilar = false) => {
    if (isSubmittingRef.current) return;
    if (!isPublication && mats.materialItems.some((item) => !item.materialId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      form.setError("materialId", { message: "Wybierz materiał i podaj dodatnią, całkowitą liczbę sztuk albo usuń pustą pozycję." });
      return;
    }
    const cleanPayload = buildActionCleanPayload({
      data,
      campaignDict,
      activitiesDescription,
      additionalNotes,
      isPublication,
      isNoJrwa,
      formattedAudienceString,
      totalDirectParticipants,
      // Program sam klasyfikuje działanie; symbol JRWA zapisujemy tylko dla klasyfikacji bez programu.
      classificationSymbol: programId ? undefined : jrwa.selectedJrwaSymbol,
    });
    if (!isEditMode) {
      const duplicate = findDuplicateAction(cleanPayload, actions);
      const duplicateKey = duplicate
        ? [duplicate.id, cleanPayload.date, cleanPayload.title, cleanPayload.facilityName, cleanPayload.actionType].join("|")
        : null;
      const warning = duplicateWarningRef.current;
      if (duplicate && duplicateKey && !(warning?.key === duplicateKey && Date.now() - warning.at >= DUPLICATE_CONFIRM_DELAY_MS)) {
        if (warning?.key !== duplicateKey) duplicateWarningRef.current = { key: duplicateKey, at: Date.now() };
        setSaveError(`W rejestrze jest już takie samo działanie (${duplicate.date}, „${duplicate.title}”, ${duplicate.facilityName}). Zapisz ponownie, jeśli to na pewno kolejny, osobny wpis.`);
        return;
      }
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const distributionMaterials = buildActionDistributionMaterials(mats.materialItems, materials, cleanPayload);
      const materialsCount = Number(cleanPayload.materialsDistributedCount) || 0;
      const companion = canSeparateDistribution && separateDistribution && materialsCount > 0
        ? buildLinkedDistribution(cleanPayload, {
          actionType: distributionActionType,
          materialId: distributionMaterials[0]?.materialId || cleanPayload.materialId,
          materialsCount,
          classificationSymbol: programId ? undefined : jrwa.selectedJrwaSymbol,
        })
        : undefined;
      // Materiały liczą się wtedy przy dystrybucji, nie przy działaniu głównym.
      const mainPayload = companion ? { ...cleanPayload, materialId: undefined, materialsDistributedCount: 0 } : cleanPayload;

      if (isEditMode && editingAction?.id) {
        await onUpdate?.(editingAction.id, mainPayload, distributionMaterials, companion);
      } else {
        await onSave?.(
          mainPayload,
          jrwa.autoCreateJrwaCase && !isNoJrwa ? (jrwa.generatedJrwaMeta || undefined) : undefined,
          distributionMaterials.length > 0 ? distributionMaterials : undefined,
          companion
        );
      }
      if (addSimilar && !editingAction?.id) {
        reset({ ...form.getValues(), facilityId: "", facilityName: "", municipality: "",
          audienceGroup: "", participantsCount: 0, indirectRecipientsCount: 0,
          jrwaCaseId: "", jrwaSign: "", izrzSign: "", scheduleEventId: "",
        });
        setFacilityAddress("");
        const freshGroups = parseAudienceGroups("");
        setAudienceGroups(freshGroups);
        jrwa.prepareSignForNextSimilar(cleanPayload);
        duplicateWarningRef.current = null;
        setAdditionalNotes("");
        draft.markSaved({ values: form.getValues(), audienceGroups: freshGroups, materialItems: mats.materialItems, activitiesDescription, additionalNotes: "" });
        toast.success(`Zapisano działanie${companion ? " i dystrybucję materiałów" : ""}. Uzupełnij miejsce i odbiorców kolejnego.`);
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-label="Miejsce i prowadzący"] input')?.focus());
      } else {
        draft.markSaved();
        onCancel?.();
      }
    } catch (err) {
      const reason = describeSaveError(err);
      setSaveError(`Nie udało się zapisać działania${reason ? `: ${reason}` : ""}. Dane pozostały w formularzu. Spróbuj ponownie.`);
      console.error("[useActionEditorState] Błąd podczas zapisywania działania:", err);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    form, isEditMode, isSubmitting, saveError, title, actionType, isPublication, isDistribution, isNoJrwa, date, facilityId,
    facilityName, facilityAddress, municipality, programId, programName, campaignId, indirectRecipientsCount,
    materialsDistributedCount, numberOfActions, materialId, materialItems: mats.materialItems, leadEducator,
    ezdStatus, izrzSign, jrwaSign, selectedMaterial: mats.selectedMaterial, activitiesDescription,
    additionalNotes, canSeparateDistribution, separateDistribution, setSeparateDistribution, distributionActionType,
    linkedDistribution, linkedParentAction, selectedJrwaSymbol: jrwa.selectedJrwaSymbol, selectedTemplateId: presets.selectedTemplateId,
    jrwaSymbolsList: jrwa.jrwaSymbolsList, activityTypeDict, campaignDict, setValue, setFacilityAddress,
    setActivitiesDescription, setAdditionalNotes, handleAddMaterialItem: mats.handleAddMaterialItem,
    handleRemoveMaterialItem: mats.handleRemoveMaterialItem, handleUpdateMaterialItem: mats.handleUpdateMaterialItem,
    applyPreset: presets.applyPreset, handleApplyTemplate: presets.handleApplyTemplate, handleFacilityNameInput,
    handleProgramSelect: jrwa.handleProgramSelect, handleJrwaSymbolChange: jrwa.handleJrwaSymbolChange,
    handleProgramOrJrwaSelect: jrwa.handleProgramOrJrwaSelect, setQuickDate: jrwa.setQuickDate, handleDateChange: jrwa.handleDateChange,
    handleGenerateJrwaSign: jrwa.handleGenerateJrwaSign, handleJrwaSignChange: jrwa.handleJrwaSignChange,
    missingFields, pendingDraft: draft.pendingDraft, restoreDraft: draft.restoreDraft,
    dismissDraft: draft.dismissDraft, hasUnsavedContent: draft.hasUnsavedContent, discardDraft: draft.discardDraft,
    onSubmit: (data: ActionFormOutput) => onSubmit(data),
    onSaveAndAddSimilar: form.handleSubmit((data) => onSubmit(data, true)), ...audience,
  };
}
