import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Building2 } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OzipzFacility, OzipzDictionaryItem } from "../../types/ozipz.types";
import { FacilitySchema } from "../../schemas/ozipz.schemas";
import {
  isValidEmail,
  isValidPostalCode,
  municipalityName,
  municipalityNamesFromDictionary,
  municipalityPostalCode,
  normalizeSearchText,
} from "../../utils/facilityUtils";
import { FacilityComplexCard } from "./components/FacilityComplexCard";
import { FacilityAddressFields } from "./components/FacilityAddressFields";
import { FacilityContactFields } from "./components/FacilityContactFields";
import { FacilityEducationTypesField } from "./components/FacilityEducationTypesField";

const optionalEmail = (label: string) =>
  z.string().trim().optional().refine((v) => !v || isValidEmail(v), `Niepoprawny adres e-mail ${label}`);

export const FacilityFormSchema = FacilitySchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  name: z.string().trim().min(1, "Nazwa placówki jest wymagana"),
  type: z.string().trim().min(1, "Typ placówki jest wymagany"),
  address: z.string().trim().min(1, "Adres jest wymagany"),
  city: z.string().trim().min(1, "Miejscowość jest wymagana"),
  postalCode: z.string().trim().min(1, "Kod pocztowy jest wymagany").refine(isValidPostalCode, "Kod pocztowy w formacie 00-000"),
  municipality: z.string().trim().min(1, "Gmina jest wymagana"),
  email: optionalEmail("placówki"),
  defaultCoordinatorEmail: optionalEmail("koordynatora"),
});

export type FacilityFormInput = z.input<typeof FacilityFormSchema>;
export type FacilityFormOutput = z.output<typeof FacilityFormSchema>;
type FacilityPayload = Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">;

interface FacilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingFacility: OzipzFacility | null;
  locationTypes: OzipzDictionaryItem[];
  facilities?: OzipzFacility[];
  municipalities?: string[];
  municipalityItems?: OzipzDictionaryItem[];
  onSave: (data: FacilityPayload) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzFacility>) => unknown | Promise<unknown>;
  /** Wartości startowe nowej placówki (np. nazwa wpisana w formularzu działania). Przekazuj stabilny obiekt. */
  initialValues?: Partial<FacilityFormInput>;
  /** „quick” — tylko pola wymagane, do dodawania miejsca bez wychodzenia z innego formularza. */
  variant?: "full" | "quick";
}

function toFormValues(f: OzipzFacility | null): FacilityFormInput {
  return {
    name: f?.name || "",
    type: f?.type || "",
    educationTypes: f?.educationTypes || [],
    isComplex: Boolean(f?.isComplex),
    parentFacilityId: f?.parentFacilityId || "",
    municipality: f ? municipalityName(f.municipality) : "",
    county: f?.county || "",
    address: f?.address || "",
    postalCode: f?.postalCode || "",
    city: f?.city || "",
    leadingAuthority: f?.leadingAuthority || "",
    email: f?.email || "",
    phone: f?.phone || "",
    defaultCoordinatorName: f?.defaultCoordinatorName || "",
    defaultCoordinatorPhone: f?.defaultCoordinatorPhone || "",
    defaultCoordinatorEmail: f?.defaultCoordinatorEmail || "",
    notes: f?.notes || "",
  };
}

const optional = (value?: string) => value?.trim() || undefined;

export function FacilityDialog({
  isOpen,
  onClose,
  editingFacility,
  locationTypes,
  facilities = [],
  municipalities = [],
  municipalityItems = [],
  onSave,
  onUpdate,
  initialValues,
  variant = "full",
}: FacilityDialogProps) {
  const isQuick = variant === "quick" && !editingFacility;
  const form = useForm<FacilityFormInput, undefined, FacilityFormOutput>({
    resolver: zodResolver(FacilityFormSchema),
    defaultValues: toFormValues(null),
  });
  const { register, handleSubmit, setValue, getValues, watch, reset, setError, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (isOpen) reset({ ...toFormValues(editingFacility), ...(editingFacility ? {} : initialValues) });
  }, [editingFacility, initialValues, isOpen, reset]);

  const municipalityOptions = useMemo(() => {
    const names = [
      ...municipalityNamesFromDictionary(municipalityItems),
      ...municipalities.map(municipalityName),
      ...facilities.map((f) => municipalityName(f.municipality)),
    ].filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "pl"));
  }, [municipalities, municipalityItems, facilities]);

  const authoritySuggestions = useMemo(
    () => Array.from(new Set(facilities.map((f) => f.leadingAuthority?.trim()).filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b, "pl")),
    [facilities]
  );

  const availableComplexes = useMemo(
    () => facilities.filter((f) => f.id !== editingFacility?.id && f.isComplex && !f.parentFacilityId),
    [facilities, editingFacility]
  );

  const name = watch("name");
  const duplicate = useMemo(() => {
    const key = normalizeSearchText(name);
    return key ? facilities.find((f) => f.id !== editingFacility?.id && normalizeSearchText(f.name) === key) : undefined;
  }, [name, facilities, editingFacility]);

  const isComplex = Boolean(watch("isComplex"));

  const fillIfEmpty = (field: "address" | "city" | "postalCode" | "municipality" | "leadingAuthority" | "email" | "phone", value?: string) => {
    if (value && !getValues(field)?.trim()) setValue(field, value, { shouldValidate: true });
  };

  const handleParentSelect = (parentId: string) => {
    setValue("parentFacilityId", parentId);
    const parent = facilities.find((f) => f.id === parentId);
    if (!parent) return;
    fillIfEmpty("address", parent.address);
    fillIfEmpty("city", parent.city);
    fillIfEmpty("postalCode", parent.postalCode);
    fillIfEmpty("municipality", municipalityName(parent.municipality));
    fillIfEmpty("leadingAuthority", parent.leadingAuthority);
    fillIfEmpty("email", parent.email);
    fillIfEmpty("phone", parent.phone);
  };

  const handleMunicipalityChange = (value: string) => {
    setValue("municipality", value, { shouldValidate: true });
    fillIfEmpty("postalCode", municipalityPostalCode(municipalityItems, value));
    fillIfEmpty("city", value);
  };

  const onSubmit = async (data: FacilityFormOutput) => {
    if (editingFacility && !data.isComplex && facilities.some((f) => f.parentFacilityId === editingFacility.id)) {
      setError("root", { message: "Najpierw przenieś placówki należące do tego zespołu." });
      return;
    }
    const payload: FacilityPayload = {
      name: data.name.trim(),
      type: data.type,
      educationTypes: data.educationTypes || [],
      isComplex: Boolean(data.isComplex),
      parentFacilityId: !data.isComplex && data.parentFacilityId ? data.parentFacilityId : undefined,
      municipality: municipalityName(data.municipality),
      county: data.county?.trim() || "",
      address: data.address.trim(),
      postalCode: data.postalCode.trim(),
      city: data.city.trim(),
      leadingAuthority: data.leadingAuthority?.trim() || "",
      email: optional(data.email),
      phone: optional(data.phone),
      defaultCoordinatorName: optional(data.defaultCoordinatorName),
      defaultCoordinatorPhone: optional(data.defaultCoordinatorPhone),
      defaultCoordinatorEmail: optional(data.defaultCoordinatorEmail),
      notes: optional(data.notes),
    };
    try {
      if (editingFacility) await onUpdate(editingFacility.id, payload);
      else await onSave(payload);
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać placówki." });
    }
  };

  const errorMessage = Object.values(errors).map((e) => e?.message).filter(Boolean).join(", ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerAccent="primary"
      icon={<Building2 className="size-5" />}
      title={editingFacility ? "Edycja placówki" : isQuick ? "Nowe miejsce działania" : "Nowa placówka / instytucja"}
      description={isQuick
        ? "Miejsce trafi do bazy placówek i zostanie wybrane w działaniu. Kontakty i pozostałe dane uzupełnisz później w Lokalizacjach."
        : "Szkoły, przedszkola, zespoły placówek i instytucje partnerskie OZiPZ"}
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingFacility ? "Zapisz Zmiany" : isQuick ? "Dodaj i wybierz" : "Dodaj Placówkę"}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="facility-name" className="text-xs font-semibold text-foreground">
            Pełna nazwa placówki <span className="text-destructive">*</span>
          </label>
          <Input
            id="facility-name"
            placeholder="np. Szkoła Podstawowa nr 1 im. Mikołaja Kopernika w Myśliborzu"
            {...register("name")}
            className="h-9 text-xs"
            autoFocus
          />
          {errors.name && <p className="text-[10px] font-semibold text-destructive">{errors.name.message}</p>}
          {duplicate && (
            <p className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              W bazie jest już placówka o tej nazwie ({duplicate.city}). Upewnij się, że to nie duplikat.
            </p>
          )}
        </div>

        {!isQuick && <FacilityComplexCard
          register={register}
          isComplex={isComplex}
          parentFacilityId={watch("parentFacilityId") || ""}
          availableComplexes={availableComplexes}
          onComplexChange={(checked) => {
            setValue("isComplex", checked);
            if (checked) setValue("parentFacilityId", "");
          }}
          onParentSelect={handleParentSelect}
        />}

        <FacilityAddressFields
          register={register}
          errors={errors}
          locationTypes={locationTypes}
          municipalityOptions={municipalityOptions}
          authoritySuggestions={authoritySuggestions}
          currentType={watch("type") || ""}
          onTypeChange={(t) => setValue("type", t, { shouldValidate: true })}
          currentMunicipality={watch("municipality") || ""}
          onMunicipalityChange={handleMunicipalityChange}
        />

        {!isQuick && <>
        <FacilityEducationTypesField
          selected={watch("educationTypes") || []}
          onChange={(next) => setValue("educationTypes", next, { shouldValidate: true })}
        />

        <FacilityContactFields register={register} errors={errors} />

        <div className="space-y-1.5">
          <label htmlFor="facility-notes" className="text-xs font-semibold text-foreground">Uwagi</label>
          <Textarea
            id="facility-notes"
            rows={2}
            placeholder="np. filie, dojazd, godziny pracy sekretariatu…"
            {...register("notes")}
            className="text-xs"
          />
        </div>
        </>}
      </div>
    </ModalDialog>
  );
}
