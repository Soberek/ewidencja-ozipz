import { useMemo } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Building2, School } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import type { FieldErrors } from "react-hook-form";
import type { OzipzFacility, OzipzDictionaryItem } from "../../../types/ozipz.types";
import type { ScheduleFormInput } from "../ScheduleDialog";

interface ScheduleLocationDatesFieldsProps {
  errors: FieldErrors<ScheduleFormInput>;
  facilities: OzipzFacility[];
  recipientGroups: OzipzDictionaryItem[];
  onFacilityChange: (facId: string) => void;
  currentRecipientGroup: string;
  onRecipientGroupChange: (group: string) => void;
  currentLocation: string;
  onLocationChange: (location: string) => void;
  eventDate: string;
  onEventDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
}

export function ScheduleLocationDatesFields({
  errors,
  facilities,
  recipientGroups,
  onFacilityChange,
  currentRecipientGroup,
  onRecipientGroupChange,
  currentLocation,
  onLocationChange,
  eventDate,
  onEventDateChange,
  endDate,
  onEndDateChange,
}: ScheduleLocationDatesFieldsProps) {
  const facilityOptions: AutocompleteOption[] = useMemo(() => facilities.map((facility) => ({
    value: facility.id,
    label: facility.name,
    group: facility.municipality
      ? facility.municipality.toLowerCase().startsWith("gmina")
        ? facility.municipality
        : `Gmina ${facility.municipality}`
      : "Inne",
    description: `${facility.address}, ${facility.city}`,
    icon: facility.isComplex ? Building2 : School,
    badge: facility.isComplex ? "Zespół" : undefined,
  })), [facilities]);

  const recipientOptions: SelectOption[] = useMemo(() => recipientGroups.map((group) => ({
    value: group.label,
    label: group.label,
  })), [recipientGroups]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="schedule-event-date" className="block text-xs font-semibold text-foreground">
            Data realizacji <span className="text-destructive">*</span>
          </label>
          <DatePicker
            id="schedule-event-date"
            value={eventDate}
            onChange={onEventDateChange}
            placeholder="Wybierz datę"
            size="md"
            required
          />
          {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message as string}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="schedule-end-date" className="block text-xs font-semibold text-foreground">Data zakończenia</label>
          <DatePicker
            id="schedule-end-date"
            value={endDate}
            onChange={onEndDateChange}
            minDate={eventDate || undefined}
            placeholder="Opcjonalnie"
            size="md"
            allowClear
          />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message as string}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="schedule-location" className="block text-xs font-semibold text-foreground">
          Miejsce realizacji <span className="text-destructive">*</span>
        </label>
        <Autocomplete
          id="schedule-location"
          aria-required="true"
          value={currentLocation}
          onChange={onLocationChange}
          onSelectOption={(option) => onFacilityChange(option.value)}
          options={facilityOptions}
          placeholder="Wybierz placówkę lub wpisz miejsce"
          searchPlaceholder="Szukaj placówki..."
          startIcon={Building2}
          error={errors.location?.message as string}
        />
      </div>

      <Select
        id="schedule-recipient-group"
        label="Grupa odbiorców"
        value={currentRecipientGroup}
        onChange={onRecipientGroupChange}
        options={recipientOptions}
        placeholder="Wybierz grupę docelową"
        searchPlaceholder="Szukaj grupy..."
        clearable
      />
    </div>
  );
}
