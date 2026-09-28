import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bookmark, Award, User, FileText, School } from "lucide-react";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type {
  OzipzFacility,
  OzipzProgram,
  OzipzJrwaCase,
  OzipzStaff,
} from "../../../types/ozipz.types";
import type { LetterFormInput } from "../LetterDialog";

interface LetterEntityRelationFieldsProps {
  register: UseFormRegister<LetterFormInput>;
  errors: FieldErrors<LetterFormInput>;
  direction: string;
  facilityId: string;
  caseSign: string;
  facilities: OzipzFacility[];
  programs: OzipzProgram[];
  jrwaCases: OzipzJrwaCase[];
  staff: OzipzStaff[];
  onFacilityChange: (facId: string) => void;
  onCaseChange: (sign: string) => void;
  currentSenderRecipient?: string;
  onSenderRecipientChange?: (val: string) => void;
  currentProgramId?: string;
  onProgramIdChange?: (val: string) => void;
  currentAssignedPerson?: string;
  onAssignedPersonChange?: (val: string) => void;
  currentStatus?: string;
  onStatusChange?: (val: string) => void;
}

export function LetterEntityRelationFields({
  register,
  errors,
  direction,
  facilityId,
  caseSign,
  facilities,
  programs,
  jrwaCases,
  staff,
  onFacilityChange,
  onCaseChange,
  currentSenderRecipient = "",
  onSenderRecipientChange,
  currentProgramId = "",
  onProgramIdChange,
  currentAssignedPerson = "",
  onAssignedPersonChange,
  currentStatus = "nowe",
  onStatusChange,
}: LetterEntityRelationFieldsProps) {
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

  const facilitySelectOptions: SelectOption[] = useMemo(() => {
    return facilities.map((f) => {
      const groupLabel = f.municipality
        ? f.municipality.toLowerCase().startsWith("gmina")
          ? f.municipality
          : `Gmina ${f.municipality}`
        : "Inne";

      return {
        value: f.id,
        label: f.name,
        description: `${f.address}, ${f.city}`,
        group: groupLabel,
        icon: Building2,
      };
    });
  }, [facilities]);

  const caseOptions: SelectOption[] = useMemo(() => {
    return jrwaCases.map((c) => ({
      value: c.fullCaseSign,
      label: `${c.fullCaseSign} - ${c.title}`,
      badge: c.jrwaSymbol,
    }));
  }, [jrwaCases]);

  const programOptions: SelectOption[] = useMemo(() => {
    return programs.map((p) => ({
      value: p.id,
      label: p.name,
      description: `Edycja: ${p.editionYear || "ciągła"}`,
      badge: p.jrwaSymbol || undefined,
    }));
  }, [programs]);

  const staffOptions: SelectOption[] = useMemo(() => {
    return staff.map((s) => ({
      value: s.fullName,
      label: s.fullName,
      description: s.role,
      icon: User,
    }));
  }, [staff]);

  return (
    <>
      {/* Nadawca / Odbiorca i Placówka */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Building2 className="size-3.5 text-primary" />
            <span>
              {direction === "wychodzace" ? "Odbiorca / Adresat" : "Nadawca pisma"}{" "}
              <span className="text-destructive">*</span>
            </span>
          </label>
          <Autocomplete
            value={currentSenderRecipient}
            onChange={(val) => onSenderRecipientChange?.(val)}
            onSelectOption={(opt) => {
              onFacilityChange(opt.value);
              onSenderRecipientChange?.(opt.label);
            }}
            options={facilityAutocompleteOptions}
            placeholder="Wpisz adresata lub wybierz ze szkoły..."
            error={errors.senderRecipient?.message as string}
            size="sm"
            startIcon={Building2}
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-muted-foreground flex items-center gap-1 text-xs">
            <Building2 className="size-3.5 text-muted-foreground" /> Powiązana Placówka
          </label>
          <SearchableSelect
            value={facilityId || ""}
            onChange={onFacilityChange}
            options={facilitySelectOptions}
            placeholder="-- Brak powiązania lub spoza bazy --"
            searchPlaceholder="Szukaj placówki w bazie..."
            size="sm"
            clearable
          />
        </div>
      </div>

      {/* Znak JRWA i Program */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Bookmark className="size-3 text-primary" /> Znak Sprawy JRWA
          </label>
          {jrwaCases.length > 0 ? (
            <SearchableSelect
              value={caseSign || ""}
              onChange={onCaseChange}
              options={caseOptions}
              placeholder="-- Wybierz sprawę JRWA --"
              searchPlaceholder="Szukaj znaku sprawy JRWA..."
              size="sm"
              clearable
            />
          ) : (
            <Input
              type="text"
              placeholder="np. OZ.966.1.12.2026"
              {...register("caseSign")}
              className="h-8 text-xs font-mono"
            />
          )}
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Award className="size-3 text-primary" /> Powiązany Program Profilaktyczny
          </label>
          <SearchableSelect
            value={currentProgramId}
            onChange={(val) => onProgramIdChange?.(val)}
            options={programOptions}
            placeholder="-- Brak powiązania z programem --"
            searchPlaceholder="Szukaj programu..."
            size="sm"
            clearable
          />
        </div>
      </div>

      {/* Osoba Przypisana i Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <User className="size-3 text-primary" /> Osoba Odpowiedzialna / Prowadząca
          </label>
          <Select
            value={currentAssignedPerson}
            onChange={(val) => onAssignedPersonChange?.(val)}
            options={staffOptions}
            placeholder="-- Wybierz pracownika ze słownika kadry --"
            searchPlaceholder="Szukaj pracownika..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground text-xs">Status Sprawy</label>
          <Select
            value={currentStatus}
            onChange={(val) => onStatusChange?.(val)}
            options={[
              { value: "nowe", label: "Nowe (w rejestracji)", badge: "Nowe", badgeVariant: "outline" },
              { value: "w_toku", label: "W toku (w trakcie załatwiania)", badge: "W toku", badgeVariant: "warning" },
              { value: "zakonczone", label: "Zakończone / Wysłane", badge: "Koniec", badgeVariant: "success" },
              { value: "archiwalne", label: "Archiwalne", badge: "Archiwum", badgeVariant: "secondary" },
            ]}
            searchable={false}
            size="sm"
          />
        </div>
      </div>

      {/* Uwagi */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
          <FileText className="size-3 text-muted-foreground" /> Uwagi / Notatki dodatkowe
        </label>
        <Textarea
          rows={2}
          placeholder="np. informacja o załącznikach, terminie odpowiedzi..."
          {...register("notes")}
          className="text-xs"
        />
      </div>
    </>
  );
}
