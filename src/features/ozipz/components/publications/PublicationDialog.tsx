import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SelectOption } from "@/components/ui/select";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Globe,
  Share2,
  Calendar,
  Eye,
  Link,
  User,
  FileText,
  Bookmark,
} from "lucide-react";
import type {
  OzipzPublication,
  OzipzDictionaryItem,
  OzipzStaff,
  OzipzProgram,
} from "../../types/ozipz.types";
import { PublicationSchema } from "../../schemas/ozipz.schemas";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { z } from "zod";

const PublicationFormSchema = PublicationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().trim().min(1, "Tytuł publikacji jest wymagany"),
  channel: z.string().trim().min(1, "Kanał publikacji jest wymagany"),
});

type PublicationFormInput = z.input<typeof PublicationFormSchema>;
type PublicationFormOutput = z.output<typeof PublicationFormSchema>;

interface PublicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingPublication: OzipzPublication | null;
  staff?: OzipzStaff[];
  programs: OzipzProgram[];
  jrwaSymbols: OzipzDictionaryItem[];
  onSave: (data: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzPublication>) => Promise<unknown>;
}

const CHANNEL_SUGGESTIONS = [
  "Strona internetowa PSSE (gov.pl)",
  "Facebook PSSE Myślibórz",
  "Portal X (Twitter)",
  "Gazeta Myśliborska",
  "Radio Szczecin",
  "Tablica informacyjna PSSE",
  "Newsletter szkolny",
];

export function PublicationDialog({
  isOpen,
  onClose,
  editingPublication,
  staff = [],
  programs,
  jrwaSymbols,
  onSave,
  onUpdate,
}: PublicationDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PublicationFormInput, undefined, PublicationFormOutput>({
    resolver: zodResolver(PublicationFormSchema),
    defaultValues: {
      title: "",
      channel: "",
      publicationDate: getTodayIsoDate(),
      topic: "",
      link: "",
      reachCount: 0,
      author: "",
      notes: "",
    },
  });

  const topicOptions: SelectOption[] = useMemo(() => {
    const progOpts: SelectOption[] = programs.map((p) => ({
      value: p.name,
      label: p.name,
      description: p.jrwaSymbol ? `Symbol JRWA: ${p.jrwaSymbol}` : "Program profilaktyczny",
      badge: p.jrwaSymbol || undefined,
      group: "Programy Profilaktyczne",
    }));

    const jrwaOpts: SelectOption[] = jrwaSymbols
      .filter((j) => !programs.some((p) => (p.jrwaSymbol || "").trim() === j.code) && j.code !== "070" && j.code !== "9010")
      .map((j) => {
        const cleanLabel = j.label.replace(new RegExp(`^${j.code}\\s*[-–:]?\\s*`), "");
        return {
          value: `JRWA ${j.code} - ${cleanLabel}`,
          label: `${j.code} – ${cleanLabel}`,
          badge: j.code,
          group: "Klasyfikacja JRWA",
        };
      });

    return [...progOpts, ...jrwaOpts];
  }, [programs, jrwaSymbols]);

  const staffOptions: AutocompleteOption[] = useMemo(() => {
    return staff.map((s) => ({
      value: s.fullName,
      label: s.fullName,
      description: s.role,
      icon: User,
    }));
  }, [staff]);

  useEffect(() => {
    setSubmitError(null);
    if (editingPublication) {
      reset({
        title: editingPublication.title,
        channel: editingPublication.channel,
        publicationDate: editingPublication.publicationDate,
        topic: editingPublication.topic || "",
        link: editingPublication.link || "",
        reachCount: editingPublication.reachCount || 0,
        author: editingPublication.author || "",
        notes: editingPublication.notes || "",
      });
    } else {
      reset({
        title: "",
        channel: "",
        publicationDate: getTodayIsoDate(),
        topic: "",
        link: "",
        reachCount: 0,
        author: "",
        notes: "",
      });
    }
  }, [editingPublication, isOpen, reset]);

  const onSubmit = async (data: PublicationFormOutput) => {
    setSubmitError(null);
    const payload: Omit<OzipzPublication, "id" | "createdAt" | "updatedAt"> = {
      title: data.title.trim(),
      channel: data.channel.trim(),
      publicationDate: data.publicationDate,
      topic: data.topic?.trim() || "",
      link: data.link?.trim() || undefined,
      reachCount: Number(data.reachCount) || 0,
      author: data.author?.trim() || "",
      notes: data.notes?.trim() || undefined,
    };

    try {
      if (editingPublication) {
        await onUpdate(editingPublication.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nie udało się zapisać publikacji.");
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
      headerAccent="purple"
      icon={<Globe className="size-5" />}
      title={editingPublication ? "Edycja Publikacji Internetowej" : "Nowa Publikacja / Artykuł / Post"}
      description="Ewidencja materiałów publikowanych w mediach, powiązanych z programami i symbolami JRWA"
      error={submitError || errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingPublication ? "Zapisz Zmiany" : "Opublikuj Wpis"}
    >
      <div className="space-y-4 text-xs">
        {/* Tytuł */}
        <div className="space-y-1">
          <label className="font-bold text-foreground flex items-center gap-1 text-xs">
            <Share2 className="size-3.5 text-primary" />
            <span>Tytuł Publikacji / Posta <span className="text-destructive">*</span></span>
          </label>
          <Input
            type="text"
            placeholder="np. Światowy Dzień Rzucania Palenia - poradnik i statystyki..."
            {...register("title")}
            className="h-8 text-xs font-medium"
            autoFocus
          />
          {errors.title && <p className="text-[10px] text-destructive font-semibold">{errors.title.message}</p>}
        </div>

        {/* Kanał i Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="font-semibold text-foreground text-xs">Kanał / Medium Publikacji <span className="text-destructive">*</span></label>
            <Autocomplete
              value={watch("channel") || ""}
              onChange={(c) => setValue("channel", c, { shouldValidate: true })}
              options={CHANNEL_SUGGESTIONS}
              placeholder="np. Facebook, Gov.pl, Portal X..."
              error={errors.channel?.message as string}
              size="sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
              <Calendar className="size-3 text-primary" /> Data Publikacji <span className="text-destructive">*</span>
            </label>
            <DatePicker
              value={watch("publicationDate") || ""}
              onChange={(d) => setValue("publicationDate", d, { shouldValidate: true })}
              placeholder="Wybierz datę publikacji..."
              size="sm"
              required
            />
            {errors.publicationDate && <p className="text-[10px] text-destructive font-semibold">{errors.publicationDate.message}</p>}
          </div>
        </div>

        {/* Program / JRWA i Szacowany Zasięg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
              <Bookmark className="size-3 text-primary" /> Program Profilaktyczny / JRWA
            </label>
            <SearchableSelect
              value={watch("topic") || ""}
              onChange={(t) => setValue("topic", t, { shouldValidate: true })}
              options={topicOptions}
              placeholder="-- Wybierz program lub JRWA --"
              searchPlaceholder="Szukaj tematu/programu..."
              size="sm"
              clearable
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
              <Eye className="size-3 text-emerald-600" /> Szacowany Zasięg Odbiorców
            </label>
            <Input
              type="number"
              min="0"
              placeholder="np. 450"
              {...register("reachCount", { setValueAs: (value) => value === "" ? 0 : Number(value) })}
              className="h-8 text-xs font-mono"
            />
            {errors.reachCount && <p className="text-[10px] text-destructive font-semibold">{errors.reachCount.message}</p>}
          </div>
        </div>

        {/* Link / URL */}
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <Link className="size-3 text-muted-foreground" /> Link / URL do publikacji
          </label>
          <Input
            type="url"
            placeholder="https://psse.gov.pl/aktualnosci/..."
            {...register("link")}
            className="h-8 text-xs font-mono"
          />
        </div>

        {/* Autor */}
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <User className="size-3 text-muted-foreground" /> Autor / Osoba Odpowiedzialna
          </label>
          <Autocomplete
            value={watch("author") || ""}
            onChange={(a) => setValue("author", a, { shouldValidate: true })}
            options={staffOptions}
            placeholder="Wybierz lub wpisz autora..."
            size="sm"
            startIcon={User}
          />
        </div>

        {/* Uwagi */}
        <div className="space-y-1">
          <label className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <FileText className="size-3 text-muted-foreground" /> Uwagi / Informacje dodatkowe
          </label>
          <textarea
            placeholder="Dodatkowe informacje..."
            {...register("notes")}
            rows={2}
            className="w-full rounded-[2px] border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </ModalDialog>
  );
}
