import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import {
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Contact,
  School,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import type { OzipzContact, OzipzFacility, OzipzDictionaryItem } from "../../types/ozipz.types";
import { ContactSchema } from "../../schemas/ozipz.schemas";
import { z } from "zod";
import { findDuplicateContacts, formatPhone, isValidEmail } from "./contactUtils";

const ContactFormSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).superRefine((data, ctx) => {
  const email = data.email?.trim();
  if (email && !isValidEmail(email)) {
    ctx.addIssue({ code: "custom", path: ["email"], message: "Niepoprawny format adresu e-mail" });
  }
});

const DUPLICATE_REASON_LABEL = {
  email: "ten sam e-mail",
  phone: "ten sam telefon",
  name: "to samo imię i nazwisko",
} as const;

type ContactFormInput = z.input<typeof ContactFormSchema>;
type ContactFormOutput = z.output<typeof ContactFormSchema>;

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingContact: OzipzContact | null;
  facilities: OzipzFacility[];
  positions?: (string | OzipzDictionaryItem)[];
  municipalities?: string[];
  /** Istniejące kontakty – do ostrzegania o możliwych duplikatach. */
  existingContacts?: OzipzContact[];
  onSave: (data: Omit<OzipzContact, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (id: string, data: Partial<OzipzContact>) => void;
}

export function ContactDialog({
  isOpen,
  onClose,
  editingContact,
  facilities,
  positions = [],
  municipalities = [],
  existingContacts = [],
  onSave,
  onUpdate,
}: ContactDialogProps) {
  const dynamicPositions: string[] = useMemo(() => {
    return Array.from(
      new Set(
        positions
          .map((p) => {
            if (typeof p === "string") return p.trim();
            if (p && typeof p === "object") return (p.label || p.code || "").trim();
            return "";
          })
          .filter(Boolean)
      )
    );
  }, [positions]);

  const dynamicMunicipalities: string[] = useMemo(() => {
    return Array.from(
      new Set(
        municipalities
          .map((m) => (typeof m === "string" ? m.trim() : ""))
          .filter(Boolean)
      )
    );
  }, [municipalities]);

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput, undefined, ContactFormOutput>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: "",
      position: "",
      facilityId: "",
      facilityName: "",
      municipality: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (editingContact) {
      reset({
        name: editingContact.name,
        position: editingContact.position,
        facilityId: editingContact.facilityId || "",
        facilityName: editingContact.facilityName,
        municipality: editingContact.municipality || "",
        phone: editingContact.phone || "",
        email: editingContact.email || "",
        notes: editingContact.notes || "",
      });
    } else {
      reset({
        name: "",
        position: "",
        facilityId: "",
        facilityName: "",
        municipality: "",
        phone: "",
        email: "",
        notes: "",
      });
    }
  }, [editingContact, isOpen, reset]);

  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedPhone = watch("phone");
  const watchedFacilityId = watch("facilityId");

  const duplicates = useMemo(
    () =>
      findDuplicateContacts(
        { name: watchedName || "", email: watchedEmail || "", phone: watchedPhone || "" },
        existingContacts,
        editingContact?.id
      ).slice(0, 3),
    [watchedName, watchedEmail, watchedPhone, existingContacts, editingContact?.id]
  );

  // Placówka z kartoteki ma domyślnego koordynatora? Pozwól przepisać brakujące dane jednym kliknięciem.
  const facilityCoordinator = useMemo(() => {
    const fac = watchedFacilityId ? facilities.find((f) => f.id === watchedFacilityId) : undefined;
    if (!fac) return null;
    const { defaultCoordinatorName: name, defaultCoordinatorPhone: phone, defaultCoordinatorEmail: email } = fac;
    if (!name && !phone && !email) return null;
    return { name: name || "", phone: phone || "", email: email || "" };
  }, [watchedFacilityId, facilities]);

  const canFillFromFacility =
    facilityCoordinator !== null &&
    ((!watchedName?.trim() && facilityCoordinator.name) ||
      (!watchedPhone?.trim() && facilityCoordinator.phone) ||
      (!watchedEmail?.trim() && facilityCoordinator.email));

  const fillFromFacility = () => {
    if (!facilityCoordinator) return;
    const opts = { shouldValidate: true, shouldDirty: true };
    if (!watchedName?.trim() && facilityCoordinator.name) setValue("name", facilityCoordinator.name, opts);
    if (!watchedPhone?.trim() && facilityCoordinator.phone) setValue("phone", formatPhone(facilityCoordinator.phone), opts);
    if (!watchedEmail?.trim() && facilityCoordinator.email) setValue("email", facilityCoordinator.email, opts);
  };

  const handleFacilityChange = (facId: string) => {
    setValue("facilityId", facId);
    if (!facId) return;
    const fac = facilities.find((f) => f.id === facId);
    if (fac) {
      setValue("facilityName", fac.name);
      if (fac.municipality) {
        setValue("municipality", fac.municipality);
      }
    }
  };

  const onSubmit = (data: ContactFormOutput) => {
    const payload: Omit<OzipzContact, "id" | "createdAt" | "updatedAt"> = {
      name: data.name.trim(),
      position: data.position.trim(),
      facilityId: data.facilityId?.trim() || undefined,
      facilityName: data.facilityName.trim(),
      municipality: data.municipality?.trim() || undefined,
      phone: formatPhone(data.phone),
      email: data.email?.trim() || "",
      notes: data.notes?.trim() || undefined,
    };

    if (editingContact) {
      onUpdate(editingContact.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  const errorMessage = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(", ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      headerAccent="purple"
      icon={<Contact className="size-5" />}
      title={editingContact ? "Edycja Kontaktu" : "Nowy Kontakt / Koordynator"}
      description="Kartoteka koordynatora programu profilaktycznego lub pedagoga szkolnego"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      submitText={editingContact ? "Zapisz Zmiany" : "Dodaj Kontakt"}
    >
      <div className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User className="size-3.5 text-primary" />
            <span>Imię i Nazwisko <span className="text-destructive">*</span></span>
          </label>
          <Input
            type="text"
            placeholder="np. mgr Anna Kowalska"
            {...register("name")}
            className="h-9 text-xs"
            autoFocus
          />
          {errors.name && <p className="text-[10px] text-destructive font-semibold">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Briefcase className="size-3.5 text-primary" />
            <span>Stanowisko / Rola <span className="text-destructive">*</span></span>
          </label>
          <Autocomplete
            options={dynamicPositions}
            value={watch("position") || ""}
            onChange={(pos) => setValue("position", pos, { shouldValidate: true })}
            placeholder="Wpisz lub wybierz stanowisko..."
            error={errors.position?.message as string}
            size="sm"
            startIcon={Briefcase}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 text-primary" />
            <span>Przypisana Placówka / Instytucja <span className="text-destructive">*</span></span>
          </label>
          <Autocomplete
            options={facilityAutocompleteOptions}
            value={watch("facilityName") || ""}
            onChange={(name) => {
              setValue("facilityName", name, { shouldValidate: true });
              const match = facilities.find((f) => f.name.toLowerCase() === name.toLowerCase());
              if (match) {
                setValue("facilityId", match.id);
                if (match.municipality) setValue("municipality", match.municipality);
              } else {
                setValue("facilityId", "");
              }
            }}
            onSelectOption={(opt) => {
              handleFacilityChange(opt.value);
            }}
            placeholder="Wpisz lub wybierz placówkę z bazy..."
            error={errors.facilityName?.message as string}
            size="sm"
            startIcon={Building2}
          />
          {canFillFromFacility && (
            <button
              type="button"
              onClick={fillFromFacility}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
            >
              <Wand2 className="size-3" />
              Uzupełnij dane koordynatora z karty placówki
              {facilityCoordinator?.name ? ` (${facilityCoordinator.name})` : ""}
            </button>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5 text-primary" />
            <span>Gmina</span>
          </label>
          <Select
            value={watch("municipality") || ""}
            onChange={(muni) => setValue("municipality", muni, { shouldValidate: true })}
            options={municipalityOptions}
            placeholder="-- Wybierz gminę --"
            searchPlaceholder="Szukaj gminy..."
            size="sm"
            clearable
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="size-3.5 text-primary" />
              <span>Telefon</span>
            </label>
            <Input
              type="text"
              placeholder="np. 95 747 22 33 / 600 000 000"
              {...register("phone", {
                onBlur: (e) => setValue("phone", formatPhone(e.target.value)),
              })}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="size-3.5 text-primary" />
              <span>Adres E-mail</span>
            </label>
            <Input
              type="email"
              placeholder="np. a.kowalska@sp2.mysliborz.pl"
              {...register("email")}
              className="h-9 text-xs font-mono"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="text-[10px] text-destructive font-semibold">{errors.email.message}</p>}
          </div>
        </div>

        {duplicates.length > 0 && (
          <div
            role="status"
            className="rounded-[3px] border border-amber-500/30 bg-amber-500/5 p-2.5 text-[11px] text-amber-800 dark:text-amber-300"
          >
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-3.5 shrink-0" />
              Możliwy duplikat – w spisie jest już podobny kontakt:
            </p>
            <ul className="mt-1 ml-5 list-disc space-y-0.5">
              {duplicates.map((d) => (
                <li key={d.contact.id}>
                  <strong>{d.contact.name}</strong>
                  {d.contact.facilityName ? `, ${d.contact.facilityName}` : ""} ({DUPLICATE_REASON_LABEL[d.reason]})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-muted-foreground" />
            <span>Notatki / Informacje dodatkowe</span>
          </label>
          <textarea
            placeholder="Dni i godziny kontaktu, preferowana forma kontaktu, koordynowane programy..."
            {...register("notes")}
            rows={2}
            className="w-full rounded-[2px] border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </ModalDialog>
  );
}
