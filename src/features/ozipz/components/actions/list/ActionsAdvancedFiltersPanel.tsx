import { useId, useMemo } from "react";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { municipalityName } from "../../../utils/facilityUtils";
import type {
  OzipzDictionaryItem,
  OzipzProgram,
  OzipzStaff,
} from "../../../types/ozipz.types";

export interface ActionsAdvancedFiltersProps {
  isOpen: boolean;
  municipalityFilter: string;
  onMunicipalityChange: (val: string) => void;
  selectedMunicipalities?: string[];
  onToggleMunicipality?: (name: string) => void;
  programFilter: string;
  onProgramChange: (val: string) => void;
  selectedPrograms?: string[];
  onToggleProgram?: (prog: string) => void;
  activityTypeFilter: string;
  onActivityTypeChange: (val: string) => void;
  selectedActivityTypes?: string[];
  onToggleActivityType?: (actType: string) => void;
  topicFilter: string;
  onTopicChange: (val: string) => void;
  selectedTopics?: string[];
  onToggleTopic?: (top: string) => void;
  educatorFilter: string;
  onEducatorChange: (val: string) => void;
  ezdFilter: string;
  onEzdChange: (val: string) => void;
  municipalities: OzipzDictionaryItem[];
  programs: OzipzProgram[];
  activityTypes: OzipzDictionaryItem[];
  topics: OzipzDictionaryItem[];
  staff: OzipzStaff[];
}

export function ActionsAdvancedFiltersPanel({
  isOpen,
  municipalityFilter: _municipalityFilter,
  onMunicipalityChange,
  selectedMunicipalities = [],
  onToggleMunicipality,
  programFilter: _programFilter,
  onProgramChange,
  selectedPrograms = [],
  onToggleProgram,
  activityTypeFilter: _activityTypeFilter,
  onActivityTypeChange,
  selectedActivityTypes = [],
  onToggleActivityType,
  topicFilter: _topicFilter,
  onTopicChange,
  selectedTopics = [],
  onToggleTopic,
  educatorFilter,
  onEducatorChange,
  ezdFilter,
  onEzdChange,
  municipalities,
  programs,
  activityTypes,
  topics,
  staff,
}: ActionsAdvancedFiltersProps) {
  const filterId = useId();
  const municipalityOptions = useMemo(() => {
    return [
      { value: "", label: "-- Dodaj gminę --" },
      // Wartość bez prefiksu „Gmina”, tak jak zapisana w działaniach.
      ...[...new Set(municipalities.map((m) => municipalityName(m.label || m.code)).filter(Boolean))].map((name) => ({
        value: name,
        label: name,
      })),
    ];
  }, [municipalities]);

  const programOptions = useMemo(() => {
    return [
      { value: "", label: "-- Dodaj program --" },
      { value: "none", label: "Działania własne (nieprogramowe)" },
      ...programs.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    ];
  }, [programs]);

  const activityTypeOptions = useMemo(() => {
    return [
      { value: "", label: "-- Dodaj formę --" },
      { value: "Publikacje (wszystkie media)", label: "★ Wszystkie publikacje media (FB, X, Strona)" },
      ...activityTypes.map((a) => ({
        value: a.label,
        label: a.label,
      })),
    ];
  }, [activityTypes]);

  const topicOptions = useMemo(() => {
    return [
      { value: "", label: "-- Dodaj tematykę --" },
      ...topics.map((t) => ({
        value: t.code || t.label,
        label: t.label,
      })),
    ];
  }, [topics]);

  const educatorOptions = useMemo(() => {
    return [
      { value: "", label: "Wszyscy edukatorzy" },
      ...staff.map((s) => ({
        value: s.fullName,
        label: s.fullName,
      })),
    ];
  }, [staff]);

  if (!isOpen) return null;

  const ezdOptions = [
    { value: "all", label: "Status EZD: Wszystkie" },
    { value: "do_ezd", label: "Wymaga EZD (do_ezd)" },
    { value: "w_ezd", label: "Zarejestrowane w EZD (w_ezd)" },
    { value: "nie_dotyczy", label: "Nie dotyczy (nie_dotyczy)" },
  ];

  const handleSelectMunicipality = (val: string) => {
    if (!val) return;
    if (onToggleMunicipality) onToggleMunicipality(val);
    else onMunicipalityChange(val);
  };

  const handleSelectProgram = (val: string) => {
    if (!val) return;
    if (onToggleProgram) onToggleProgram(val);
    else onProgramChange(val);
  };

  const handleSelectActivityType = (val: string) => {
    if (!val) return;
    if (onToggleActivityType) onToggleActivityType(val);
    else onActivityTypeChange(val);
  };

  const handleSelectTopic = (val: string) => {
    if (!val) return;
    if (onToggleTopic) onToggleTopic(val);
    else onTopicChange(val);
  };

  return (
    <div className="p-3 bg-muted/20 border border-border/80 rounded-[3px] space-y-2.5 transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {/* 1. Gmina */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor={`${filterId}-municipality`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Gmina {selectedMunicipalities.length > 0 && `(${selectedMunicipalities.length})`}
            </label>
          </div>
          <Select
            id={`${filterId}-municipality`}
            value=""
            onChange={handleSelectMunicipality}
            options={municipalityOptions}
            size="sm"
          />
          {selectedMunicipalities.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedMunicipalities.map((m) => (
                <Badge
                  key={m}
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] gap-1 font-medium bg-muted border border-border"
                >
                  <span>{m}</span>
                  <button
                    type="button"
                    aria-label={`Usuń filtr gminy ${m}`}
                    onClick={() => onToggleMunicipality?.(m)}
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 2. Program profilaktyczny */}
        <div className="space-y-1">
          <label htmlFor={`${filterId}-program`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Program {selectedPrograms.length > 0 && `(${selectedPrograms.length})`}
          </label>
          <Select
            id={`${filterId}-program`}
            value=""
            onChange={handleSelectProgram}
            options={programOptions}
            size="sm"
          />
          {selectedPrograms.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedPrograms.map((p) => {
                const label = p === "none" ? "Działania własne" : programs.find((pr) => pr.id === p)?.name || p;
                return (
                  <Badge
                    key={p}
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] gap-1 font-medium bg-muted border border-border"
                  >
                    <span className="truncate max-w-[100px]">{label}</span>
                    <button
                      type="button"
                      aria-label={`Usuń filtr programu ${label}`}
                      onClick={() => onToggleProgram?.(p)}
                      className="hover:text-destructive cursor-pointer"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Forma działania */}
        <div className="space-y-1">
          <label htmlFor={`${filterId}-activity-type`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Forma {selectedActivityTypes.length > 0 && `(${selectedActivityTypes.length})`}
          </label>
          <Select
            id={`${filterId}-activity-type`}
            value=""
            onChange={handleSelectActivityType}
            options={activityTypeOptions}
            size="sm"
          />
          {selectedActivityTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedActivityTypes.map((a) => (
                <Badge
                  key={a}
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] gap-1 font-medium bg-muted border border-border"
                >
                  <span className="truncate max-w-[100px]">{a}</span>
                  <button
                    type="button"
                    aria-label={`Usuń filtr formy ${a}`}
                    onClick={() => onToggleActivityType?.(a)}
                    className="hover:text-destructive cursor-pointer"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 4. Tematyka */}
        <div className="space-y-1">
          <label htmlFor={`${filterId}-topic`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Tematyka {selectedTopics.length > 0 && `(${selectedTopics.length})`}
          </label>
          <Select
            id={`${filterId}-topic`}
            value=""
            onChange={handleSelectTopic}
            options={topicOptions}
            size="sm"
          />
          {selectedTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedTopics.map((t) => {
                const label = topics.find((top) => top.code === t || top.label === t)?.label || t;
                return (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] gap-1 font-medium bg-muted border border-border"
                  >
                    <span className="truncate max-w-[100px]">{label}</span>
                    <button
                      type="button"
                      aria-label={`Usuń filtr tematyki ${label}`}
                      onClick={() => onToggleTopic?.(t)}
                      className="hover:text-destructive cursor-pointer"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Edukator */}
        <div className="space-y-1">
          <label htmlFor={`${filterId}-educator`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Edukator
          </label>
          <Select
            id={`${filterId}-educator`}
            value={educatorFilter}
            onChange={onEducatorChange}
            options={educatorOptions}
            size="sm"
          />
        </div>

        {/* 6. Status EZD */}
        <div className="space-y-1">
          <label htmlFor={`${filterId}-ezd-status`} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Status EZD
          </label>
          <Select
            id={`${filterId}-ezd-status`}
            value={ezdFilter}
            onChange={onEzdChange}
            options={ezdOptions}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
