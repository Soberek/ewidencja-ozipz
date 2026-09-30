import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { GraduationCap } from "lucide-react";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OzipzDictionaryItem, OzipzProgram } from "../../../types/ozipz.types";
import type { ScheduleFormInput } from "../ScheduleDialog";

interface ScheduleActivityFormFieldsProps {
  register: UseFormRegister<ScheduleFormInput>;
  errors: FieldErrors<ScheduleFormInput>;
  selectedActivityTypeCode: string;
  selectedProgramId: string;
  selectedCampaignId: string;
  activityTypes: OzipzDictionaryItem[];
  programs: OzipzProgram[];
  campaigns: OzipzDictionaryItem[];
  onActivityTypeChange: (code: string) => void;
  onProgramChange: (progId: string) => void;
  onCampaignChange: (campId: string) => void;
}

export function ScheduleActivityFormFields({
  register,
  errors,
  selectedActivityTypeCode,
  selectedProgramId,
  selectedCampaignId,
  activityTypes,
  programs,
  campaigns,
  onActivityTypeChange,
  onProgramChange,
  onCampaignChange,
}: ScheduleActivityFormFieldsProps) {
  const activityOptions: SelectOption[] = useMemo(() => activityTypes.map((act) => ({
    value: act.code,
    label: act.label,
    description: act.description || undefined,
  })), [activityTypes]);

  const programOptions: SelectOption[] = useMemo(() => programs.map((prog) => ({
    value: prog.id,
    label: prog.name,
    description: `Edycja: ${prog.editionYear || "ciągła"}`,
    badge: prog.jrwaSymbol || undefined,
    badgeVariant: "secondary",
    icon: GraduationCap,
  })), [programs]);

  const campaignOptions: SelectOption[] = useMemo(() => campaigns.map((camp) => ({
    value: camp.code,
    label: camp.label,
  })), [campaigns]);

  return (
    <div className="space-y-3">
      <Select
        id="schedule-activity-type"
        label="Forma działania"
        required
        value={selectedActivityTypeCode}
        onChange={onActivityTypeChange}
        options={activityOptions}
        placeholder="Wybierz formę działania"
        searchPlaceholder="Szukaj formy działania..."
        error={errors.activityTypeCode?.message as string}
      />

      <div className="space-y-1">
        <label htmlFor="schedule-title" className="block text-xs font-semibold text-foreground">
          Tytuł zadania <span className="text-destructive">*</span>
        </label>
        <Input
          id="schedule-title"
          {...register("title")}
          placeholder="Wpisz tytuł zadania"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SearchableSelect
          id="schedule-program"
          label="Program profilaktyczny"
          value={selectedProgramId}
          onChange={onProgramChange}
          options={programOptions}
          placeholder="Poza programem"
          searchPlaceholder="Szukaj programu..."
          clearable
        />
        <Select
          id="schedule-campaign"
          label="Akcja profilaktyczna"
          value={selectedCampaignId}
          onChange={onCampaignChange}
          options={campaignOptions}
          placeholder="Poza akcją"
          searchPlaceholder="Szukaj akcji..."
          clearable
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="schedule-topic" className="block text-xs font-semibold text-foreground">Tematyka</label>
        <Input
          id="schedule-topic"
          {...register("topic")}
          placeholder="Np. profilaktyka tytoniowa"
        />
      </div>
    </div>
  );
}
