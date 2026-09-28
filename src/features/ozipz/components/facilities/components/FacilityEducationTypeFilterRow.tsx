import { useState } from "react";
import { ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { CANONICAL_EDUCATION_TYPES, EDUCATION_TYPE_PRESETS } from "../../../constants";

export interface FacilityEducationTypeFilterRowProps {
  selectedEducationTypes: string[];
  onToggleEducationType: (type: string) => void;
  onSelectEducationTypePreset: (types: string[]) => void;
  onClearEducationTypes: () => void;
  educationTypeCounts?: Record<string, number>;
}

export function FacilityEducationTypeFilterRow({
  selectedEducationTypes,
  onToggleEducationType,
  onSelectEducationTypePreset,
  onClearEducationTypes,
  educationTypeCounts = {},
}: FacilityEducationTypeFilterRowProps) {
  const isPresetActive = (types: readonly string[]) =>
    types.length === selectedEducationTypes.length && types.every((t) => selectedEducationTypes.includes(t));
  const activePreset = EDUCATION_TYPE_PRESETS.find((preset) => isPresetActive(preset.types));
  // Szczegółowa lista typów jest zwinięta, dopóki użytkownik jej nie otworzy albo nie wybrał typu spoza presetów.
  const [isExpanded, setIsExpanded] = useState(false);
  const showDetails = isExpanded || (selectedEducationTypes.length > 0 && !activePreset);
  // Typy bez żadnej placówki tylko zaśmiecają pasek — pokazujemy je wyłącznie, gdy są zaznaczone.
  const visibleTypes = CANONICAL_EDUCATION_TYPES.filter(
    (t) => (educationTypeCounts[t] || 0) > 0 || selectedEducationTypes.includes(t)
  );

  return (
    <div className="space-y-1.5">
      <ChipGroup
        label={
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="size-3.5 text-primary" />
            Kształcenie
          </span>
        }
      >
        {EDUCATION_TYPE_PRESETS.map((preset) => {
          const active = isPresetActive(preset.types);
          return (
            <Chip
              key={preset.id}
              active={active}
              title={preset.description}
              onClick={() => (active ? onClearEducationTypes() : onSelectEducationTypePreset(Array.from(preset.types)))}
            >
              {preset.label}
            </Chip>
          );
        })}
        {visibleTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={showDetails}
            className="inline-flex h-6 items-center gap-1 rounded-[3px] px-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            {showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            Szczegółowe typy ({visibleTypes.length})
          </button>
        )}
        {selectedEducationTypes.length > 0 && (
          <button
            type="button"
            onClick={onClearEducationTypes}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
          >
            Wyczyść ({selectedEducationTypes.length})
          </button>
        )}
      </ChipGroup>
      {showDetails && (
        <div className="flex flex-wrap items-center gap-1 pl-1">
          {visibleTypes.map((type) => (
            <Chip
              key={type}
              active={selectedEducationTypes.includes(type)}
              onClick={() => onToggleEducationType(type)}
              count={educationTypeCounts[type] || 0}
            >
              {type}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
