import { useMemo } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import type { OzipzDictionaryItem } from "../../../types/ozipz.types";
import type { FacilityFormInput } from "../FacilityDialog";

interface FacilityAddressFieldsProps {
  register: UseFormRegister<FacilityFormInput>;
  errors: FieldErrors<FacilityFormInput>;
  locationTypes: OzipzDictionaryItem[];
  municipalityOptions: string[];
  /** Organy prowadzące już zapisane w bazie — podpowiedzi dla spójnego nazewnictwa. */
  authoritySuggestions: string[];
  currentType: string;
  onTypeChange: (val: string) => void;
  currentMunicipality: string;
  onMunicipalityChange: (val: string) => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[10px] font-semibold text-destructive">{message}</p> : null;
}

const labelClass = "text-xs font-semibold text-foreground";

export function FacilityAddressFields({
  register,
  errors,
  locationTypes,
  municipalityOptions,
  authoritySuggestions,
  currentType,
  onTypeChange,
  currentMunicipality,
  onMunicipalityChange,
}: FacilityAddressFieldsProps) {
  const typeOptions: SelectOption[] = useMemo(() => {
    const options = locationTypes.map((t) => ({ value: t.code, label: t.label }));
    // Typ spoza słownika (np. usunięty z Centrum Słowników) nadal musi być widoczny przy edycji.
    if (currentType && !options.some((o) => o.value === currentType)) options.push({ value: currentType, label: currentType });
    return options;
  }, [locationTypes, currentType]);

  return (
    <div className="space-y-3 rounded-[3px] border border-border/70 p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <MapPin className="size-3.5 text-primary" />
        Typ, lokalizacja i organ prowadzący
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <span className={labelClass}>Typ placówki <span className="text-destructive">*</span></span>
          <Select
            value={currentType}
            onChange={onTypeChange}
            options={typeOptions}
            placeholder="-- Wybierz typ placówki ze słownika --"
            searchPlaceholder="Szukaj typu placówki..."
            error={errors.type?.message}
            size="sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="facility-authority" className={labelClass}>Organ prowadzący</label>
          <Input
            id="facility-authority"
            list="facility-authority-suggestions"
            placeholder="np. Gmina Myślibórz / Powiat Myśliborski"
            {...register("leadingAuthority")}
            className="h-8 text-xs"
          />
          <datalist id="facility-authority-suggestions">
            {authoritySuggestions.map((a) => <option key={a} value={a} />)}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="facility-address" className={labelClass}>Ulica i numer <span className="text-destructive">*</span></label>
          <Input id="facility-address" placeholder="np. ul. Piłsudskiego 10" {...register("address")} className="h-8 text-xs" />
          <FieldError message={errors.address?.message} />
        </div>
        <div className="space-y-1">
          <label htmlFor="facility-postal" className={labelClass}>Kod pocztowy <span className="text-destructive">*</span></label>
          <Input id="facility-postal" placeholder="00-000" inputMode="numeric" {...register("postalCode")} className="h-8 font-mono text-xs" />
          <FieldError message={errors.postalCode?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="facility-city" className={labelClass}>Miejscowość <span className="text-destructive">*</span></label>
          <Input id="facility-city" placeholder="np. Myślibórz" {...register("city")} className="h-8 text-xs" />
          <FieldError message={errors.city?.message} />
        </div>
        <div className="space-y-1">
          <span className={labelClass}>Gmina <span className="text-destructive">*</span></span>
          <Select
            value={currentMunicipality}
            onChange={onMunicipalityChange}
            options={municipalityOptions}
            placeholder="-- Wybierz gminę --"
            searchPlaceholder="Szukaj gminy..."
            error={errors.municipality?.message}
            size="sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="facility-county" className={labelClass}>Powiat</label>
          <Input id="facility-county" placeholder="np. powiat myśliborski" {...register("county")} className="h-8 text-xs" />
        </div>
      </div>
    </div>
  );
}
