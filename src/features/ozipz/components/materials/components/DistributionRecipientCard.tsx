import { useMemo } from "react";
import { Building2, MapPin, School } from "lucide-react";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import { Select, type SelectOption } from "@/components/ui/select";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OzipzFacility } from "../../../types/ozipz.types";
import type { DistributionFormInput } from "../DistributionDialog";

interface DistributionRecipientCardProps {
  register: UseFormRegister<DistributionFormInput>;
  errors: FieldErrors<DistributionFormInput>;
  selectedFacilityId: string;
  facilities: OzipzFacility[];
  dynamicMunicipalities: string[];
  onFacilityChange: (facId: string) => void;
  currentRecipientName?: string;
  onRecipientNameChange?: (name: string) => void;
  currentMunicipality?: string;
  onMunicipalityChange?: (muni: string) => void;
}

export function DistributionRecipientCard({
  register: _register,
  errors,
  selectedFacilityId: _selectedFacilityId,
  facilities,
  dynamicMunicipalities,
  onFacilityChange,
  currentRecipientName = "",
  onRecipientNameChange,
  currentMunicipality = "",
  onMunicipalityChange,
}: DistributionRecipientCardProps) {
  const facilityAutocompleteOptions: AutocompleteOption[] = useMemo(() => {
    return facilities.map((f) => {
      const groupLabel = f.municipality
        ? f.municipality.toLowerCase().startsWith("gmina")
          ? f.municipality
          : `Gmina ${f.municipality}`
        : "Inne";

      return {
        value: f.id,
        label: f.name,
        group: groupLabel,
        description: `${f.address}, ${f.city}`,
        icon: f.isComplex ? Building2 : School,
        badge: f.isComplex ? "Zespół" : undefined,
      };
    });
  }, [facilities]);

  const municipalityOptions: SelectOption[] = useMemo(() => {
    return dynamicMunicipalities.map((m) => ({
      value: m,
      label: m,
    }));
  }, [dynamicMunicipalities]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div className="space-y-1 sm:col-span-2">
        <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
          <Building2 className="size-3.5 text-primary" />
          <span>
            Wybierz Placówkę (lub wpisz własnego odbiorcę) <span className="text-destructive">*</span>
          </span>
        </label>
        <Autocomplete
          value={currentRecipientName}
          onChange={(name) => onRecipientNameChange?.(name)}
          onSelectOption={(opt) => {
            onFacilityChange(opt.value);
            const fac = facilities.find((f) => f.id === opt.value);
            if (fac?.municipality && onMunicipalityChange) {
              onMunicipalityChange(fac.municipality);
            }
          }}
          options={facilityAutocompleteOptions}
          placeholder="Wpisz lub wybierz placówkę z bazy..."
          error={errors.recipientName?.message as string}
          size="sm"
          startIcon={Building2}
        />
      </div>

      <div className="space-y-1">
        <label className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
          <MapPin className="size-3.5 text-primary" />
          <span>Gmina</span>
        </label>
        <Select
          value={currentMunicipality}
          onChange={(muni) => onMunicipalityChange?.(muni)}
          options={municipalityOptions}
          placeholder="-- Wybierz gminę --"
          searchPlaceholder="Szukaj gminy..."
          size="sm"
          clearable
        />
      </div>
    </div>
  );
}
