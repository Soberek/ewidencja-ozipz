import { useMemo } from "react";
import { AlertTriangle, GraduationCap, Building2, MapPin, School } from "lucide-react";
import { SearchableSelect, Select, type SelectOption } from "@/components/ui/select";
import { currentSchoolYear, JRWA_PROGRAM_PREFIX } from "../../../utils/participationUtils";
import { getProgramJrwaSymbol } from "../../../utils/programJrwaUtils";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OzipzProgram, OzipzFacility, OzipzSchoolParticipation, OzipzDictionaryItem } from "../../../types/ozipz.types";
import type { ParticipationFormInput } from "../ParticipationDialog";

interface ParticipationProgramFacilityFieldsProps {
  register: UseFormRegister<ParticipationFormInput>;
  errors: FieldErrors<ParticipationFormInput>;
  selectedFacId: string;
  programs: OzipzProgram[];
  /** Symbole ze słownika JRWA bez programu w katalogu – program powstaje przy zapisie zgłoszenia. */
  jrwaWithoutProgram?: OzipzDictionaryItem[];
  facilities: OzipzFacility[];
  /** Zgłoszenia do wybranego programu w wybranym roku szkolnym (bez edytowanego). */
  programYearEntries: OzipzSchoolParticipation[];
  schoolYear: string;
  /** Słownik lat szkolnych – rok wybiera się z listy, nie wpisuje ręcznie. */
  schoolYears: string[];
  onSchoolYearChange: (year: string) => void;
  onProgramSelect: (progId: string) => void;
  onFacilitySelect: (facId: string) => void;
  currentProgramId?: string;
}

export function ParticipationProgramFacilityFields({
  register,
  errors,
  selectedFacId,
  programs,
  jrwaWithoutProgram = [],
  facilities,
  programYearEntries,
  schoolYear,
  schoolYears,
  onSchoolYearChange,
  onProgramSelect,
  onFacilitySelect,
  currentProgramId = "",
}: ParticipationProgramFacilityFieldsProps) {
  const programOptions: SelectOption[] = useMemo(() => {
    const fromCatalog: SelectOption[] = programs.map((p) => {
      const jrwa = getProgramJrwaSymbol(p);
      return {
        value: p.id,
        label: p.name,
        description: jrwa ? `JRWA ${jrwa}` : undefined,
        badge: jrwa || undefined,
        badgeVariant: "secondary",
        icon: GraduationCap,
      };
    });
    const fromDictionary: SelectOption[] = jrwaWithoutProgram.map((d) => ({
      value: `${JRWA_PROGRAM_PREFIX}${d.code}`,
      label: d.label,
      description: `JRWA ${d.code} · ze słownika – program zostanie dodany do katalogu`,
      group: "Słownik JRWA (bez programu w katalogu)",
      badge: d.code,
      badgeVariant: "outline",
      icon: GraduationCap,
    }));
    const byJrwa = (a: SelectOption, b: SelectOption) =>
      (a.badge || "").localeCompare(b.badge || "", undefined, { numeric: true });
    if (fromDictionary.length === 0) return fromCatalog;
    return [
      ...fromCatalog.map((o) => ({ ...o, group: "Katalog programów" })),
      ...fromDictionary.sort(byJrwa),
    ];
  }, [programs, jrwaWithoutProgram]);

  const schoolYearSelectOptions: SelectOption[] = useMemo(() => {
    const current = currentSchoolYear();
    return schoolYears.map((year) => ({
      value: year,
      label: year,
      badge: year === current ? "bieżący" : undefined,
      badgeVariant: "success",
    }));
  }, [schoolYears]);

  const registeredFacilityIds = useMemo(
    () => new Set(programYearEntries.map((p) => p.facilityId)),
    [programYearEntries]
  );

  const facilityOptions: SelectOption[] = useMemo(() => {
    return facilities.map((f) => {
      const groupLabel = f.municipality
        ? f.municipality.toLowerCase().startsWith("gmina")
          ? f.municipality
          : `Gmina ${f.municipality}`
        : "Inne";
      const registered = registeredFacilityIds.has(f.id);

      return {
        value: f.id,
        label: f.name,
        group: groupLabel,
        description: `${f.address}, ${f.city}`,
        icon: f.isComplex ? Building2 : School,
        badge: registered ? "Już zgłoszona" : f.isComplex ? "Zespół" : undefined,
        badgeVariant: registered ? "warning" : undefined,
      };
    });
  }, [facilities, registeredFacilityIds]);

  const selectedFacility = facilities.find((f) => f.id === selectedFacId);
  const existingEntries = selectedFacId ? programYearEntries.filter((p) => p.facilityId === selectedFacId) : [];
  const yearTotals = useMemo(
    () => ({
      facilities: programYearEntries.length,
      pupils: programYearEntries.reduce((sum, p) => sum + (Number(p.pupilsCount) || 0), 0),
    }),
    [programYearEntries]
  );

  return (
    <>
      {/* Program i Rok Szkolny */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="space-y-1 sm:col-span-2">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
            <GraduationCap className="size-3.5 text-primary" />
            <span>
              Program Profilaktyczny <span className="text-destructive">*</span>
            </span>
          </label>
          <SearchableSelect
            value={currentProgramId}
            onChange={onProgramSelect}
            options={programOptions}
            placeholder="-- Wybierz program profilaktyczny --"
            searchPlaceholder="Szukaj programu po nazwie lub JRWA..."
            error={errors.programId?.message as string}
            size="sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="participation-school-year" className="font-semibold text-foreground text-xs">
            Rok Szkolny <span className="text-destructive">*</span>
          </label>
          <Select
            id="participation-school-year"
            value={schoolYear}
            onChange={onSchoolYearChange}
            options={schoolYearSelectOptions}
            placeholder="-- Wybierz rok --"
            searchable={false}
            error={Boolean(errors.schoolYear)}
            size="sm"
            triggerClassName="font-mono font-bold"
          />
          {errors.schoolYear && (
            <p className="text-[10px] text-destructive font-semibold">
              {errors.schoolYear.message as string}
            </p>
          )}
        </div>
      </div>

      {currentProgramId && schoolYear && (
        <p className="-mt-2 text-[11px] text-muted-foreground">
          Rok {schoolYear} – zgłoszone placówki:{" "}
          <strong className="text-foreground">{yearTotals.facilities}</strong>, uczniowie ogółem:{" "}
          <strong className="text-foreground">{yearTotals.pupils.toLocaleString("pl-PL")}</strong>
        </p>
      )}

      {/* Placówka */}
      <div className="space-y-1">
        <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
          <Building2 className="size-3.5 text-primary" />
          <span>
            Placówka Oświatowa <span className="text-destructive">*</span>
          </span>
        </label>
        <SearchableSelect
          value={selectedFacId}
          onChange={onFacilitySelect}
          options={facilityOptions}
          placeholder="-- Wybierz placówkę z bazy --"
          searchPlaceholder="Szukaj szkoły po nazwie, gminie, ulicy..."
          error={(errors.facilityId?.message || errors.facilityName?.message) as string}
          size="sm"
          clearable
        />
        <input type="hidden" {...register("facilityName")} />
        {selectedFacility && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            Gmina {selectedFacility.municipality} · {selectedFacility.address}, {selectedFacility.postalCode} {selectedFacility.city}
          </p>
        )}
        {existingEntries.length > 0 && (
          <p role="alert" className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Ta placówka jest już zgłoszona do tego programu w roku {schoolYear}
              {" "}(koordynator: {existingEntries.map((p) => p.schoolCoordinatorName || "—").join(", ")}).
              Kolejne zgłoszenie dodaj tylko z innym koordynatorem, np. dla drugiego budynku — lokalizację wpisz w uwagach.
            </span>
          </p>
        )}
      </div>
    </>
  );
}
