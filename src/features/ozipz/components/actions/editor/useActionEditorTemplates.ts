import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { parseAudienceGroups } from "./audienceUtils";
import type { OzipzTemplate, OzipzDictionaryItem, OzipzMaterial, OzipzProgram } from "../../../types/ozipz.types";
import type { ActionDistributedMaterialItem, ActionFormInput, AudienceGroupBlock } from "./editor.types";
import type { ActionDraft } from "./actionDraft";
import { classificationValue } from "../../../utils/programJrwaUtils";
import { resolveTemplateContent, templateContentKey, type TemplateContent } from "../../../utils/templateUtils";

export interface UseActionEditorTemplatesParams {
  templates: OzipzTemplate[];
  programs: OzipzProgram[];
  materials: OzipzMaterial[];
  activityTypeDict: OzipzDictionaryItem[];
  setValue: UseFormSetValue<ActionFormInput>;
  setAudienceGroups: (groups: AudienceGroupBlock[]) => void;
  setMaterialItems: (items: ActionDistributedMaterialItem[]) => void;
  setActivitiesDescription: (value: string) => void;
  selectClassification: (value: string) => void;
  /** Stan formularza przed wczytaniem szablonu — do cofnięcia. */
  takeSnapshot: () => ActionDraft;
  restoreSnapshot: (snapshot: ActionDraft) => void;
  /** Treść formularza w kształcie szablonu (do porównania z wczytanym szablonem). */
  currentContent: TemplateContent;
}

/** Wypełnienie formularza zapisanym szablonem (szablony pochodzą wyłącznie z bazy). */
export function useActionEditorTemplates({
  templates, programs, materials, activityTypeDict, setValue, setAudienceGroups, setMaterialItems,
  setActivitiesDescription, selectClassification, takeSnapshot, restoreSnapshot, currentContent,
}: UseActionEditorTemplatesParams) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState<ActionDraft | null>(null);

  /** Treść szablonu tak, jak trafia do formularza: etykieta formy ze słownika, tytuł zastępczy, tylko istniejące materiały. */
  const formContent = (template: OzipzTemplate): TemplateContent => {
    const content = resolveTemplateContent(template, programs);
    const program = programs.find((p) => p.id === content.programId);
    const type = activityTypeDict.find((a) => a.code === content.actionType || a.label === content.actionType);
    return {
      ...content,
      programId: program ? program.id : "",
      actionType: type?.label || content.actionType,
      // Bez własnego tytułu działanie nazywa się jak program, a poza programem — jak szablon.
      title: content.title || program?.name || content.name,
      materialIds: content.materialIds.filter((id) => materials.some((m) => m.id === id)),
    };
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const content = formContent(template);
    setUndoSnapshot(takeSnapshot());
    setValue("actionType", content.actionType, { shouldDirty: true });
    selectClassification(classificationValue(content.programId, content.jrwaSymbol));
    setValue("title", content.title, { shouldDirty: true });
    if (!content.programId) setValue("programName", content.title);
    setValue("campaignId", content.campaignId);
    // Szablon bez prowadzącego nie czyści osoby już wybranej w formularzu.
    if (content.leadEducator) setValue("leadEducator", content.leadEducator);
    setValue("numberOfActions", content.numberOfActions);
    setAudienceGroups(content.audienceGroups.length
      ? content.audienceGroups.map((group, gi) => ({
        id: `tpl-${gi + 1}`,
        name: group.name,
        items: group.items.map((item, ii) => ({
          id: `tpl-${gi + 1}-${ii + 1}`, name: item.name, count: 0, ageFrom: item.ageFrom ?? null, ageTo: item.ageTo ?? null,
        })),
      }))
      : parseAudienceGroups(""));
    // Liczby sztuk, jak liczby osób, wpisuje się przy każdym działaniu.
    setMaterialItems(content.materialIds.map((materialId) => ({ materialId, quantity: 0 })));
    setActivitiesDescription(content.description);
    setSelectedTemplateId(templateId);
  };

  const undoTemplate = () => {
    if (!undoSnapshot) return;
    restoreSnapshot(undoSnapshot);
    setUndoSnapshot(null);
    setSelectedTemplateId("");
  };

  const resetTemplate = () => {
    setSelectedTemplateId("");
    setUndoSnapshot(null);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedContent = selectedTemplate && formContent(selectedTemplate);
  const isTemplateChanged = Boolean(selectedContent) && templateContentKey(currentContent) !== templateContentKey({
    ...selectedContent!,
    leadEducator: selectedContent!.leadEducator || currentContent.leadEducator,
  });

  return {
    selectedTemplateId,
    selectedTemplate,
    currentContent,
    isTemplateChanged,
    canUndoTemplate: Boolean(undoSnapshot),
    applyTemplate,
    undoTemplate,
    resetTemplate,
  };
}
