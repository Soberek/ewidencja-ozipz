import { useState } from "react";
import { parseAudienceGroups } from "./audienceUtils";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import type {
  OzipzTemplate,
  OzipzDictionaryItem,
  OzipzHealthTopic,
} from "../../../types/ozipz.types";
import type {
  ActionCardPreset,
  ActionFormInput,
  AudienceGroupBlock,
} from "./editor.types";

export interface UseActionEditorPresetsParams {
  templates: OzipzTemplate[];
  activityTypeDict: OzipzDictionaryItem[];
  setValue: UseFormSetValue<ActionFormInput>;
  watch: UseFormWatch<ActionFormInput>;
  setAudienceGroups: (groups: AudienceGroupBlock[]) => void;
  handleJrwaSymbolChange: (symbol: string) => void;
  activitiesDescription: string;
  setActivitiesDescription: React.Dispatch<React.SetStateAction<string>>;
}

export function useActionEditorPresets({
  templates,
  activityTypeDict,
  setValue,
  setAudienceGroups,
  handleJrwaSymbolChange,
  activitiesDescription,
  setActivitiesDescription,
}: UseActionEditorPresetsParams) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const applyPreset = (preset: ActionCardPreset) => {
    setSelectedTemplateId(`preset:${preset.id}`);
    if (preset.titlePrefix) setValue("title", preset.titlePrefix);
    setValue("actionType", preset.actionType);
    if (preset.topic) setValue("topic", preset.topic);
    if (preset.audienceGroups) setAudienceGroups(preset.audienceGroups);
    if (preset.materialsDistributedCount !== undefined) {
      setValue("materialsDistributedCount", preset.materialsDistributedCount);
    }
    handleJrwaSymbolChange(preset.jrwaSymbol);
    if (preset.activitiesTemplate && !activitiesDescription) {
      setActivitiesDescription(preset.activitiesTemplate);
    }
  };

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setValue("title", tpl.actionDefaults?.title || tpl.title, { shouldDirty: true });
      if (tpl.actionDefaults) {
        setValue("leadEducator", tpl.actionDefaults.leadEducator);
        setValue("campaignId", tpl.actionDefaults.campaignId);
      }
      setValue("topic", (tpl.topic || "") as OzipzHealthTopic);
      const foundType = activityTypeDict.find((a) => a.code === tpl.actionType || a.label === tpl.actionType);
      setValue("actionType", foundType?.label || tpl.actionType);
      setAudienceGroups(parseAudienceGroups(tpl.defaultAudience).map((group) => ({
        ...group, items: group.items.map((item) => ({ ...item, count: 0 })),
      })));
      setActivitiesDescription(tpl.descriptionTemplate || "");
    }
  };

  return {
    selectedTemplateId,
    setSelectedTemplateId,
    applyPreset,
    handleApplyTemplate,
  };
}
