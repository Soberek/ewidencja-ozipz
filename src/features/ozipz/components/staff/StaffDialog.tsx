import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
} from "lucide-react";
import type { OzipzStaff, OzipzDictionaryItem } from "../../types/ozipz.types";
import { StaffSchema } from "../../schemas/ozipz.schemas";
import { z } from "zod";

const StaffFormSchema = StaffSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

type StaffFormInput = z.input<typeof StaffFormSchema>;
type StaffFormOutput = z.output<typeof StaffFormSchema>;

interface StaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaff: OzipzStaff | null;
  staffRoles?: (string | OzipzDictionaryItem)[];
  onSave: (data: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt">) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzStaff>) => unknown | Promise<unknown>;
}

export function StaffDialog({
  isOpen,
  onClose,
  editingStaff,
  staffRoles = [],
  onSave,
  onUpdate,
}: StaffDialogProps) {
  const dynamicRoles: string[] = useMemo(() => {
    const raw = staffRoles.map((r: string | OzipzDictionaryItem) => (typeof r === "string" ? r : r.label));
    return Array.from(new Set(raw.filter(Boolean))).sort((a: string, b: string) => a.localeCompare(b, "pl"));
  }, [staffRoles]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormInput, any, StaffFormOutput>({
    resolver: zodResolver(StaffFormSchema),
    defaultValues: {
      fullName: "",
      role: "",
      email: "",
      phone: "",
      active: true,
      specialization: "",
    },
  });

  useEffect(() => {
    if (editingStaff) {
      reset({
        fullName: editingStaff.fullName || "",
        role: editingStaff.role || "",
        email: editingStaff.email || "",
        phone: editingStaff.phone || "",
        active: editingStaff.active ?? true,
        specialization: editingStaff.specialization || "",
      });
    } else {
      reset({
        fullName: "",
        role: "",
        email: "",
        phone: "",
        active: true,
        specialization: "",
      });
    }
  }, [editingStaff, isOpen, reset]);

  const onSubmit = async (data: StaffFormOutput) => {
    const payload: Omit<OzipzStaff, "id" | "createdAt" | "updatedAt"> = {
      fullName: data.fullName.trim(),
      role: data.role.trim(),
      email: data.email?.trim() || "",
      phone: data.phone?.trim() || "",
      active: data.active ?? true,
      specialization: data.specialization?.trim() || undefined,
    };

    try {
      if (editingStaff) await onUpdate(editingStaff.id, payload);
      else await onSave(payload);
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać pracownika." });
    }
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
      headerAccent="emerald"
      icon={<User className="size-5" />}
      title={editingStaff ? "Edycja Pracownika / Edukatora" : "Nowy Pracownik Sekcji OZiPZ"}
      description="Ewidencja kadry pracowniczej, uprawnień referenckich i specjalizacji"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingStaff ? "Zapisz Zmiany" : "Dodaj Pracownika"}
    >
      <div className="space-y-4">
        {/* Imię i Nazwisko */}
        <div className="space-y-1">
          <label htmlFor="staff-name" className="font-bold text-foreground flex items-center gap-1 text-xs">
            <User className="size-3.5 text-primary" />
            <span>Imię i Nazwisko Pracownika <span className="text-destructive">*</span></span>
          </label>
          <Input
            id="staff-name"
            type="text"
            placeholder="np. Jan Kowalski"
            {...register("fullName")}
            className="h-8 text-xs font-medium"
            autoFocus
          />
          {errors.fullName && <p className="text-[10px] text-destructive font-semibold">{errors.fullName.message}</p>}
        </div>

        {/* Stanowisko / Rola */}
        <div className="space-y-1">
          <label htmlFor="staff-role" className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Briefcase className="size-3.5 text-primary" /> Stanowisko / Funkcja <span className="text-destructive">*</span>
          </label>
          <Autocomplete
            id="staff-role"
            value={watch("role") || ""}
            onChange={(r) => setValue("role", r, { shouldValidate: true })}
            options={dynamicRoles}
            placeholder="Wpisz lub wybierz stanowisko ze słownika..."
            error={errors.role?.message as string}
            size="sm"
            startIcon={Briefcase}
          />
        </div>

        {/* Kontakt: E-mail i Telefon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label htmlFor="staff-email" className="font-semibold text-foreground flex items-center gap-1">
              <Mail className="size-3 text-primary" /> Adres E-mail
            </label>
            <Input
              id="staff-email"
              type="email"
              placeholder="np. ozipz@psse.gov.pl"
              {...register("email")}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="staff-phone" className="font-semibold text-foreground flex items-center gap-1">
              <Phone className="size-3 text-primary" /> Telefon Kontaktowy
            </label>
            <Input
              id="staff-phone"
              type="text"
              placeholder="np. 95 747 24 31"
              {...register("phone")}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        {/* Specjalizacja */}
        <div className="space-y-1">
          <label htmlFor="staff-specialization" className="font-semibold text-foreground flex items-center gap-1">
            <Award className="size-3.5 text-amber-600" /> Główny Obszar / Specjalizacja
          </label>
          <Input
            id="staff-specialization"
            type="text"
            placeholder="np. Profilaktyka antytytoniowa, choroby odkleszczowe, BHP..."
            {...register("specialization")}
            className="h-8 text-xs"
          />
        </div>

        {/* Status aktywności */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground pt-1">
          <input
            type="checkbox"
            {...register("active")}
            className="rounded border-input text-emerald-600 size-4"
          />
          <span>Pracownik aktywny zawodowo (dostępny na listach referentów w rejestrach)</span>
        </label>
      </div>
    </ModalDialog>
  );
}
