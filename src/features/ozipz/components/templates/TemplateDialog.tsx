import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import {
  FileText,
  GraduationCap,
  Folder,
} from "lucide-react";
import type {
  OzipzTemplate,
  OzipzDictionaryItem,
  OzipzProgram,
} from "../../types/ozipz.types";
import { TemplateSchema } from "../../schemas/ozipz.schemas";
import { useOzipzDbStore, useDictionaries } from "../../store/useOzipzDbStore";
import { z } from "zod";

export const TemplateFormSchema = TemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().trim().min(1, "Wpisz nazwę szablonu."),
  actionType: z.string().trim().min(1, "Wybierz formę działania."),
  defaultAudience: z.string().trim(),
  descriptionTemplate: z.string().trim(),
}).refine((data) => Boolean(data.descriptionTemplate || data.actionDefaults), {
  path: ["descriptionTemplate"],
  message: "Wpisz opis zadania.",
});

type TemplateFormInput = z.input<typeof TemplateFormSchema>;
type TemplateFormOutput = z.output<typeof TemplateFormSchema>;

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate?: OzipzTemplate | null;
  actionTypes?: OzipzDictionaryItem[];
  topics?: OzipzDictionaryItem[];
  programs?: OzipzProgram[];
  jrwaSymbols?: OzipzDictionaryItem[];
  onSave: (data: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt">) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzTemplate>) => unknown | Promise<unknown>;
}

export function TemplateDialog({
  isOpen,
  onClose,
  editingTemplate = null,
  actionTypes: propActionTypes,
  topics: propTopics,
  programs: propPrograms,
  jrwaSymbols: propJrwaSymbols,
  onSave,
  onUpdate,
}: TemplateDialogProps) {
  const dbPrograms = useOzipzDbStore((s) => s.programs);
  const dictStore = useDictionaries();
  const programs = propPrograms || dbPrograms || [];
  const jrwaSymbols = propJrwaSymbols || dictStore.jrwaSymbols || [];
  const actionTypes: OzipzDictionaryItem[] = propActionTypes || dictStore.activityTypes || [];
  const topics = propTopics || dictStore.dictionaryItems.filter((item) => item.dictType === "topic" || item.dictType === "tematyki");

  const topicOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = topics.map((item) => ({
      value: item.code,
      label: item.label,
      group: "Tematyka zdrowotna",
    }));

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
        const cleanLabel = j.label.startsWith(j.code) ? j.label.slice(j.code.length).replace(/^\s*[-–:]?\s*/, "") : j.label;
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
  }, [topics, programs, jrwaSymbols]);

  const actionTypeOptions: SelectOption[] = useMemo(() => {
    return actionTypes.map((a) => ({
      value: a.label,
      label: a.label,
    }));
  }, [actionTypes]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormInput, undefined, TemplateFormOutput>({
    resolver: zodResolver(TemplateFormSchema),
    defaultValues: {
      title: "",
      topic: "",
      actionType: "",
      descriptionTemplate: "",
      defaultAudience: "",
      suggestedMaterials: "",
      actionDefaults: undefined,
    },
  });

  const selectedTopic = watch("topic");
  const selectedActionType = watch("actionType");

  useEffect(() => {
    if (editingTemplate) {
      reset({
        title: editingTemplate.title || "",
        topic: editingTemplate.topic || "",
        actionType: editingTemplate.actionType || "",
        descriptionTemplate: editingTemplate.descriptionTemplate || "",
        defaultAudience: editingTemplate.defaultAudience || "",
        suggestedMaterials: editingTemplate.suggestedMaterials || "",
        actionDefaults: editingTemplate.actionDefaults,
      });
    } else {
      reset({
        title: "",
        topic: "",
        actionType: "",
        descriptionTemplate: "",
        defaultAudience: "",
        suggestedMaterials: "",
        actionDefaults: undefined,
      });
    }
  }, [editingTemplate, isOpen, reset]);

  const onSubmit = async (data: TemplateFormOutput) => {
    const payload: Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt"> = {
      title: data.title.trim(),
      topic: data.topic?.trim() || "",
      actionType: data.actionType,
      descriptionTemplate: data.descriptionTemplate?.trim() || "",
      defaultAudience: data.defaultAudience,
      suggestedMaterials: data.suggestedMaterials?.trim() || undefined,
    };

    try {
      if (editingTemplate) {
        await onUpdate(editingTemplate.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać szablonu." });
    }
  };

  const errorMessage = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(" ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerAccent="primary"
      icon={<FileText className="size-5" />}
      title={editingTemplate ? "Edytuj szablon zadania" : "Nowy szablon zadania"}
      description="Zapisz opis i ustawienia, które chcesz wykorzystać ponownie."
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingTemplate ? "Zapisz zmiany" : "Utwórz szablon"}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="template-title" className="block text-xs font-semibold text-foreground">
            Nazwa szablonu <span className="text-destructive">*</span>
          </label>
          <Input
            id="template-title"
            placeholder="Np. Warsztaty profilaktyki dla uczniów"
            {...register("title")}
            aria-invalid={Boolean(errors.title)}
            autoFocus
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SearchableSelect
              id="template-topic"
              label="Program, tematyka lub JRWA"
              value={selectedTopic || ""}
              onChange={(val) => setValue("topic", val, { shouldValidate: true })}
              options={selectedTopic && !topicOptions.some((option) => option.value === selectedTopic)
                ? [{ value: selectedTopic, label: selectedTopic }, ...topicOptions] : topicOptions}
              placeholder="Wybierz powiązanie (opcjonalnie)"
              searchPlaceholder="Szukaj programu, tematyki lub JRWA..."
              error={errors.topic?.message as string}
              clearable
            />
          </div>

          <div>
            <Select
              id="template-action-type"
              label="Forma działania"
              required
              value={selectedActionType || ""}
              onChange={(val) => setValue("actionType", val, { shouldValidate: true })}
              options={selectedActionType && !actionTypeOptions.some((option) => option.value === selectedActionType)
                ? [{ value: selectedActionType, label: selectedActionType }, ...actionTypeOptions] : actionTypeOptions}
              placeholder="Wybierz formę działania"
              searchPlaceholder="Szukaj formy..."
              error={errors.actionType?.message as string}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="template-audience" className="block text-xs font-semibold text-foreground">
              Grupy odbiorców
            </label>
            <Textarea
              id="template-audience"
              {...register("defaultAudience")}
              rows={3}
              placeholder="Np. uczniowie; rodzice"
              aria-invalid={Boolean(errors.defaultAudience)}
            />
            {errors.defaultAudience && <p className="text-xs text-destructive">{errors.defaultAudience.message}</p>}
            <p className="text-[11px] text-muted-foreground">Kilka grup oddziel średnikiem.</p>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="template-description" className="block text-xs font-semibold text-foreground">
            Opis zadania {!editingTemplate?.actionDefaults && <span className="text-destructive">*</span>}
          </label>
          <Textarea
            id="template-description"
            {...register("descriptionTemplate")}
            rows={6}
            placeholder="Wpisz wzorcowy opis przebiegu zadania..."
            aria-invalid={Boolean(errors.descriptionTemplate)}
          />
          {errors.descriptionTemplate && <p className="text-xs text-destructive">{errors.descriptionTemplate.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="template-materials" className="block text-xs font-semibold text-foreground">Sugerowane materiały</label>
          <Input
            id="template-materials"
            {...register("suggestedMaterials")}
            placeholder="Np. ulotki, broszury lub plakaty"
          />
        </div>
      </div>
    </ModalDialog>
  );
}
