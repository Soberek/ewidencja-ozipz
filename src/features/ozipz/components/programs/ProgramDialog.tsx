import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import {
  Award,
  BookOpen,
  Calendar,
  Users,
  FileText,
  Hash,
} from "lucide-react";
import type { OzipzProgram, OzipzDictionaryItem } from "../../types/ozipz.types";
import { ProgramSchema } from "../../schemas/ozipz.schemas";
import { getProgramJrwaSymbol } from "../../utils/programJrwaUtils";
import { useDictionaries } from "../../store/useOzipzDbStore";
import { z } from "zod";

const ProgramFormSchema = ProgramSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  code: z.string().trim().min(1, "Kod programu jest wymagany"),
  name: z.string().trim().min(1, "Nazwa programu jest wymagana"),
  editionYear: z.string().trim().min(1, "Rok edycji jest wymagany"),
});

type ProgramFormInput = z.input<typeof ProgramFormSchema>;
type ProgramFormOutput = z.output<typeof ProgramFormSchema>;

interface ProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProgram: OzipzProgram | null;
  jrwaSymbols?: OzipzDictionaryItem[];
  onSave: (data: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt">) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzProgram>) => unknown | Promise<unknown>;
}

export function ProgramDialog({
  isOpen,
  onClose,
  editingProgram,
  jrwaSymbols: propJrwaSymbols,
  onSave,
  onUpdate,
}: ProgramDialogProps) {
  const dictStore = useDictionaries();
  const dbJrwaSymbols = dictStore.jrwaSymbols;

  const dynamicJrwaList = useMemo(() => {
    const fromProps = propJrwaSymbols || [];
    const fromDb = dbJrwaSymbols || [];
    const map = new Map<string, { symbol: string; label: string }>();

    // Wyłącznie Słownik JRWA z bazy
    for (const d of [...fromProps, ...fromDb]) {
      if (d.code) {
        map.set(d.code, { symbol: d.code, label: d.label || `JRWA ${d.code}` });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol, undefined, { numeric: true }));
  }, [propJrwaSymbols, dbJrwaSymbols]);

  const jrwaOptions: SelectOption[] = useMemo(() => {
    return dynamicJrwaList.map((item) => ({
      value: item.symbol,
      label: item.label,
      badge: `JRWA ${item.symbol}`,
      badgeVariant: "secondary",
    }));
  }, [dynamicJrwaList]);

  const statusOptions: SelectOption[] = [
    { value: "aktywny", label: "Aktywny w roku bieżącym", badge: "Aktywny", badgeVariant: "success" },
    { value: "zakonczony", label: "Zakończony", badge: "Zakończony", badgeVariant: "outline" },
    { value: "zawieszony", label: "Zawieszony", badge: "Zawieszony", badgeVariant: "secondary" },
    { value: "archiwalny", label: "Archiwalny", badge: "Archiwalny", badgeVariant: "outline" },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormInput, undefined, ProgramFormOutput>({
    resolver: zodResolver(ProgramFormSchema),
    defaultValues: {
      code: "",
      name: "",
      editionYear: "",
      jrwaSymbol: "",
      targetAudience: "",
      description: "",
      status: "aktywny",
      participatingSchoolsCount: 0,
      totalPupilsReached: 0,
    },
  });

  const selectedJrwaSymbol = watch("jrwaSymbol");
  const selectedStatus = watch("status");

  useEffect(() => {
    if (editingProgram) {
      reset({
        code: editingProgram.code,
        name: editingProgram.name,
        editionYear: editingProgram.editionYear || "",
        jrwaSymbol: getProgramJrwaSymbol(editingProgram),
        targetAudience: editingProgram.targetAudience || "",
        description: editingProgram.description || "",
        status: editingProgram.status || "aktywny",
        participatingSchoolsCount: editingProgram.participatingSchoolsCount || 0,
        totalPupilsReached: editingProgram.totalPupilsReached || 0,
      });
    } else {
      reset({
        code: "",
        name: "",
        editionYear: "",
        jrwaSymbol: "",
        targetAudience: "",
        description: "",
        status: "aktywny",
        participatingSchoolsCount: 0,
        totalPupilsReached: 0,
      });
    }
  }, [editingProgram, isOpen, reset]);

  const onSubmit = async (data: ProgramFormOutput) => {
    const cleanPayload: Omit<OzipzProgram, "id" | "createdAt" | "updatedAt"> = {
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      editionYear: data.editionYear.trim(),
      jrwaSymbol: data.jrwaSymbol.trim(),
      targetAudience: data.targetAudience?.trim() || "",
      description: data.description?.trim() || "",
      status: data.status || "aktywny",
      participatingSchoolsCount: Number(data.participatingSchoolsCount) || 0,
      totalPupilsReached: Number(data.totalPupilsReached) || 0,
    };

    try {
      if (editingProgram) await onUpdate(editingProgram.id, cleanPayload);
      else await onSave(cleanPayload);
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać programu." });
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
      headerAccent="amber"
      icon={<Award className="size-5" />}
      title={editingProgram ? "Edycja Programu Profilaktycznego" : "Nowy Program Profilaktyczny"}
      description="Katalog programów i projektów edukacyjnych realizowanych w szkołach i placówkach (relacje bazy danych OZiPZ)"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingProgram ? "Zapisz Zmiany" : "Utwórz Program"}
    >
      {/* Kod i Edycja Rocznikowa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="font-bold text-foreground text-xs">
            Kod / Identyfikator Programu <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="np. TRZYMAJ-FORME, BIEG, ZNAMIE, WZW..."
            {...register("code")}
            className="h-8 text-xs font-mono font-bold uppercase"
            autoFocus
          />
          {errors.code && <p className="text-[10px] text-destructive font-semibold">{errors.code.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="font-bold text-foreground flex items-center gap-1 text-xs">
            <Calendar className="size-3 text-primary" /> Edycja Rocznikowa <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="np. 2025/2026"
            {...register("editionYear")}
            className="h-8 text-xs font-mono font-bold"
          />
          {errors.editionYear && <p className="text-[10px] text-destructive font-semibold">{errors.editionYear.message}</p>}
        </div>
      </div>

      {/* Nazwa Programu */}
      <div className="space-y-1">
        <label className="font-bold text-foreground flex items-center gap-1 text-xs">
          <BookOpen className="size-3.5 text-primary" />
          <span>Pełna Nazwa Programu <span className="text-destructive">*</span></span>
        </label>
        <Input
          type="text"
          placeholder="np. Trzymaj Formę! - Ogólnopolski Program Edukacyjny..."
          {...register("name")}
          className="h-8 text-xs font-medium"
        />
        {errors.name && <p className="text-[10px] text-destructive font-semibold">{errors.name.message}</p>}
      </div>

      {/* Grupa Docelowa */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
          <Users className="size-3 text-indigo-600" /> Grupa Docelowa / Odbiorcy
        </label>
        <Input
          type="text"
          placeholder="np. Szkoły Podstawowe (klasy V-VIII), przedszkola, rodzice..."
          {...register("targetAudience")}
          className="h-8 text-xs"
        />
      </div>

      {/* Symbol JRWA i Status Programu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label className="font-bold text-foreground flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Hash className="size-3 text-primary" /> Symbol JRWA (Słownik)
            </span>
          </label>
          <SearchableSelect
            value={selectedJrwaSymbol || ""}
            onChange={(val) => setValue("jrwaSymbol", val, { shouldValidate: true })}
            options={jrwaOptions}
            placeholder="-- Wybierz symbol JRWA ze słownika --"
            searchPlaceholder="Szukaj symbolu JRWA..."
            error={errors.jrwaSymbol?.message as string}
            size="sm"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-foreground text-xs">Status Programu</label>
          <Select
            value={selectedStatus || "aktywny"}
            onChange={(val) => setValue("status", val, { shouldValidate: true })}
            options={statusOptions}
            searchable={false}
            size="sm"
          />
        </div>
      </div>

      {/* Opis Merytoryczny */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
          <FileText className="size-3 text-muted-foreground" /> Opis i Cele Programu
        </label>
        <textarea
          placeholder="Główne cele, harmonogram realizacji, metodyka pracy z uczniami..."
          {...register("description")}
          rows={3}
          className="w-full rounded-[2px] border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        {errors.description && <p className="text-[10px] text-destructive font-semibold">{errors.description.message}</p>}
      </div>
    </ModalDialog>
  );
}
