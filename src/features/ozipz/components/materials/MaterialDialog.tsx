import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import {
  Package,
  BookOpen,
  Building2,
  Users,
  FileText,
  Bookmark,
  GraduationCap,
  Folder,
} from "lucide-react";
import type {
  OzipzMaterial,
  OzipzDictionaryItem,
  OzipzProgram,
} from "../../types/ozipz.types";
import { MaterialSchema } from "../../schemas/ozipz.schemas";
import { useOzipzDbStore, useDictionaries } from "../../store/useOzipzDbStore";
import { z } from "zod";

const MaterialFormSchema = MaterialSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

type MaterialFormInput = z.input<typeof MaterialFormSchema>;
type MaterialFormOutput = z.output<typeof MaterialFormSchema>;

interface MaterialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingMaterial: OzipzMaterial | null;
  materialTypes: OzipzDictionaryItem[];
  programs?: OzipzProgram[];
  jrwaSymbols?: OzipzDictionaryItem[];
  onSave: (data: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (id: string, data: Partial<OzipzMaterial>) => void;
}

export function MaterialDialog({
  isOpen,
  onClose,
  editingMaterial,
  materialTypes,
  programs: propPrograms,
  jrwaSymbols: propJrwaSymbols,
  onSave,
  onUpdate,
}: MaterialDialogProps) {
  const dbPrograms = useOzipzDbStore((s) => s.programs);
  const dictStore = useDictionaries();
  const programs = propPrograms || dbPrograms || [];
  const jrwaSymbols = propJrwaSymbols || dictStore.jrwaSymbols || [];

  const materialTypeOptions: SelectOption[] = useMemo(() => {
    return materialTypes.map((t) => ({
      value: t.code,
      label: t.label,
    }));
  }, [materialTypes]);

  const topicOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];

    programs.forEach((p) => {
      list.push({
        value: p.name,
        label: p.name,
        group: "Programy Profilaktyczne (Baza OZiPZ)",
        description: `Edycja: ${p.editionYear || "ciągła"}`,
        icon: GraduationCap,
        badge: p.jrwaSymbol ? `JRWA ${p.jrwaSymbol}` : undefined,
        badgeVariant: "secondary",
      });
    });

    jrwaSymbols
      .filter((j) => !programs.some((p) => (p.jrwaSymbol || "").trim() === j.code) && j.code !== "070" && j.code !== "9010")
      .forEach((j) => {
        const cleanLabel = j.label.replace(new RegExp(`^${j.code}\\s*[-–:]?\\s*`), "");
        list.push({
          value: `JRWA ${j.code} - ${cleanLabel}`,
          label: `JRWA ${j.code} – ${cleanLabel}`,
          group: "Pozostałe Symbole JRWA (Działania poza programami)",
          icon: Folder,
          badge: `JRWA ${j.code}`,
          badgeVariant: "outline",
        });
      });

    return list;
  }, [programs, jrwaSymbols]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MaterialFormInput, undefined, MaterialFormOutput>({
    resolver: zodResolver(MaterialFormSchema),
    defaultValues: {
      title: "",
      materialType: "",
      topic: "",
      publisher: "",
      targetAudience: "",
      notes: "",
    },
  });

  const selectedMaterialType = watch("materialType");
  const selectedTopic = watch("topic");

  useEffect(() => {
    if (editingMaterial) {
      reset({
        title: editingMaterial.title,
        materialType: editingMaterial.materialType || "",
        topic: editingMaterial.topic || "",
        publisher: editingMaterial.publisher || "",
        targetAudience: editingMaterial.targetAudience || "",
        notes: editingMaterial.notes || "",
      });
    } else {
      reset({
        title: "",
        materialType: "",
        topic: "",
        publisher: "",
        targetAudience: "",
        notes: "",
      });
    }
  }, [editingMaterial, isOpen, reset]);

  const onSubmit = (data: MaterialFormOutput) => {
    const payload: Omit<OzipzMaterial, "id" | "createdAt" | "updatedAt"> = {
      title: data.title.trim(),
      materialType: data.materialType.trim(),
      topic: data.topic?.trim() || "",
      publisher: data.publisher?.trim() || "",
      targetAudience: data.targetAudience?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    if (editingMaterial) {
      onUpdate(editingMaterial.id, payload);
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
      headerAccent="emerald"
      icon={<Package className="size-5" />}
      title={editingMaterial ? "Edycja Materiału Edukacyjnego" : "Nowy Materiał Oświatowy OZiPZ"}
      description="Katalog materiałów oświatowych bazujący na programach profilaktycznych i symbolach JRWA"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      submitText={editingMaterial ? "Zapisz Zmiany" : "Dodaj Materiał do Katalogu"}
    >
      <div className="space-y-4">
        {/* Tytuł */}
        <div className="space-y-1.5">
          <label className="font-bold text-foreground flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-primary" />
            <span>Tytuł Materiału / Wydawnictwa <span className="text-destructive">*</span></span>
          </label>
          <Input
            type="text"
            placeholder="np. Ulotka o szczepieniach ochronnych"
            {...register("title")}
            className="h-9 text-xs font-medium"
            autoFocus
          />
          {errors.title && <p className="text-[10px] text-destructive font-semibold">{errors.title.message}</p>}
        </div>

        {/* Typ materiału ze słownika & Program / JRWA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Package className="size-3.5 text-emerald-600" />
              <span>Typ / Nośnik Materiału <span className="text-destructive">*</span></span>
            </label>
            <Select
              value={selectedMaterialType || ""}
              onChange={(val) => setValue("materialType", val, { shouldValidate: true })}
              options={materialTypeOptions}
              placeholder="-- Wybierz typ materiału --"
              searchPlaceholder="Szukaj typu..."
              error={errors.materialType?.message as string}
              size="sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <Bookmark className="size-3.5 text-primary" />
              <span>Program Profilaktyczny / JRWA</span>
            </label>
            <SearchableSelect
              value={selectedTopic || ""}
              onChange={(val) => setValue("topic", val, { shouldValidate: true })}
              options={topicOptions}
              placeholder="-- Wybierz program lub JRWA --"
              searchPlaceholder="Szukaj programu/JRWA..."
              error={errors.topic?.message as string}
              size="sm"
              clearable
            />
          </div>
        </div>

        {/* Wydawca / Źródło */}
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground flex items-center gap-1.5">
            <Building2 className="size-3.5 text-primary" />
            <span>Wydawca / Źródło Pochodzenia</span>
          </label>
          <Input
            type="text"
            placeholder="np. Główny Inspektorat Sanitarny / WSSE Szczecin"
            {...register("publisher")}
            className="h-8 text-xs"
          />
        </div>

        {/* Grupa Docelowa */}
        <div className="space-y-1.5">
          <label className="font-semibold text-foreground flex items-center gap-1.5">
            <Users className="size-3.5 text-indigo-600" />
            <span>Grupa Docelowa (Odbiorcy)</span>
          </label>
          <Input
            type="text"
            placeholder="np. Młodzież szkolna (klasy VII-VIII), dorośli, seniorzy"
            {...register("targetAudience")}
            className="h-8 text-xs"
          />
        </div>

        {/* Notatki / Uwagi */}
        <div className="space-y-1.5">
          <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-muted-foreground" />
            <span>Uwagi / Informacje o nakładzie i dystrybucji</span>
          </label>
          <textarea
            placeholder="np. Pakiety po 50 szt., materiały na akcję letnią Bezpieczne Wakacje..."
            {...register("notes")}
            rows={2}
            className="w-full rounded-[2px] border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </ModalDialog>
  );
}
