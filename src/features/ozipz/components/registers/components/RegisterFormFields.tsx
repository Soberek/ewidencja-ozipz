import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SearchableSelect } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Calendar,
  Building2,
  Users,
  User,
  Sparkles,
  Bookmark,
} from "lucide-react";
import type {
  OzipzRegisterItem,
  OzipzRegisterType,
  OzipzFacility,
  OzipzProgram,
  OzipzStaff,
} from "../../../types/ozipz.types";
import { REGISTER_TYPE_OPTIONS, type RegisterFormInput } from "../registerTypes";

export interface RegisterFormFieldsProps {
  register: UseFormRegister<RegisterFormInput>;
  setValue: UseFormSetValue<RegisterFormInput>;
  watch: UseFormWatch<RegisterFormInput>;
  errors: FieldErrors<RegisterFormInput>;
  selectedType: OzipzRegisterType;
  selectedFacilityId?: string;
  selectedProgramId?: string;
  facilities: OzipzFacility[];
  programs?: OzipzProgram[];
  staff?: OzipzStaff[];
  editingItem: OzipzRegisterItem | null;
  currentYear: number;
}

export function RegisterFormFields({
  register,
  setValue,
  watch,
  errors,
  selectedType,
  selectedFacilityId,
  selectedProgramId,
  facilities,
  programs = [],
  staff = [],
  editingItem,
  currentYear,
}: RegisterFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Wybór typu rejestru */}
      <div className="space-y-1">
        <label htmlFor="register-type" className="text-xs font-semibold text-foreground">
          Kategoria / Typ Rejestru: <span className="text-destructive">*</span>
        </label>
        <Select
          id="register-type"
          value={selectedType}
          onChange={(val) => setValue("registerType", val as OzipzRegisterType)}
          options={REGISTER_TYPE_OPTIONS}
          placeholder="-- Wybierz kategorię rejestru --"
          disabled={!!editingItem}
          size="sm"
        />
      </div>

      {/* Numer wpisu i data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label htmlFor="register-number" className="font-semibold text-foreground">
            Nr w rejestrze: <span className="text-destructive">*</span>
          </label>
          <Input
            id="register-number"
            {...register("registerNumber")}
            placeholder={`np. 1/${currentYear}`}
            className="text-xs h-9 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="register-date" className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>Data wydarzenia: <span className="text-destructive">*</span></span>
          </label>
          <DatePicker
            id="register-date"
            value={watch("date")}
            onChange={(d) => setValue("date", d, { shouldValidate: true })}
            placeholder="Wybierz datę..."
            size="md"
            required
          />
          {errors.date && <p className="text-[10px] text-destructive font-semibold">{errors.date.message}</p>}
        </div>
      </div>

      {/* Tytuł / Temat */}
      <div className="space-y-1">
        <label htmlFor="register-title" className="text-xs font-semibold text-foreground">
          Temat / Nazwa Wpisu: <span className="text-destructive">*</span>
        </label>
        <Input
          id="register-title"
          {...register("title")}
          placeholder="np. Szkolenie dla szkolnych koordynatorów programu Skąd się biorą produkty ekologiczne"
          className="text-xs h-9"
        />
      </div>

      {/* Placówka i Organizator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label htmlFor="register-facility" className="font-medium text-foreground flex items-center gap-1 text-xs">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span>Placówka / Miejsce:</span>
          </label>
          <SearchableSelect
            id="register-facility"
            value={selectedFacilityId || ""}
            onChange={(id) => {
              setValue("facilityId", id);
              const fac = facilities.find((f) => f.id === id);
              if (fac) {
                setValue("facilityName", fac.name);
                if (!watch("organizer")) setValue("organizer", fac.name);
              }
            }}
            options={facilities.map((f) => ({
              value: f.id,
              label: f.name,
              description: `${f.address}, ${f.city}`,
              group: f.municipality
                ? f.municipality.toLowerCase().startsWith("gmina")
                  ? f.municipality
                  : `Gmina ${f.municipality}`
                : "Inne",
              icon: Building2,
            }))}
            placeholder="-- Wybierz placówkę --"
            searchPlaceholder="Szukaj placówki w bazie..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="register-organizer" className="font-medium text-foreground text-xs">
            Organizator / Współorganizator:
          </label>
          <Input
            id="register-organizer"
            {...register("organizer")}
            placeholder="np. PSSE w Myśliborzu / SP nr 1"
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Prowadzący i Uczestnicy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label htmlFor="register-responsible" className="font-medium text-foreground flex items-center gap-1 text-xs">
            <User className="size-3.5 text-muted-foreground" />
            <span>Prowadzący / Koordynator:</span>
          </label>
          <Select
            id="register-responsible"
            value={watch("responsiblePerson") || ""}
            onChange={(val) => setValue("responsiblePerson", val, { shouldValidate: true })}
            options={staff.map((s) => ({
              value: s.fullName,
              label: s.fullName,
              description: s.role,
              icon: User,
            }))}
            placeholder="-- Wybierz pracownika --"
            searchPlaceholder="Szukaj pracownika..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="register-participants" className="font-medium text-foreground flex items-center gap-1 text-xs">
            <Users className="size-3.5 text-muted-foreground" />
            <span>Liczba uczestników:</span>
          </label>
          <Input
            id="register-participants"
            type="number"
            min={0}
            {...register("participantsCount", { valueAsNumber: true })}
            className="text-xs h-9 font-mono"
          />
        </div>
      </div>

      {/* Program i Hasło JRWA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <label htmlFor="register-program" className="font-medium text-foreground flex items-center gap-1 text-xs">
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Powiązany Program:</span>
          </label>
          <SearchableSelect
            id="register-program"
            value={selectedProgramId || ""}
            onChange={(id) => {
              setValue("programId", id);
              const prog = programs.find((p) => p.id === id);
              if (prog) {
                setValue("programName", prog.name);
              }
            }}
            options={programs.map((p) => ({
              value: p.id,
              label: p.name,
              description: `Edycja: ${p.editionYear || "ciągła"}`,
              badge: p.jrwaSymbol || undefined,
            }))}
            placeholder="-- Brak powiązania programowego --"
            searchPlaceholder="Szukaj programu..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="register-jrwa" className="font-medium text-foreground flex items-center gap-1 text-xs">
            <Bookmark className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Znak sprawy JRWA:</span>
          </label>
          <Input
            id="register-jrwa"
            {...register("jrwaSign")}
            placeholder="np. PSSE.OZiPZ.9011.1.2026"
            className="text-xs h-9 font-mono"
          />
        </div>
      </div>

      {/* Uwagi */}
      <div className="space-y-1">
        <label htmlFor="register-notes" className="text-xs font-medium text-foreground">
          Uwagi i wnioski merytoryczne:
        </label>
        <textarea
          id="register-notes"
          {...register("notes")}
          rows={2}
          placeholder="Dodatkowe informacje, wydane zaświadczenia, protokoły..."
          className="w-full rounded-[3px] border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}
