import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SelectOption } from "@/components/ui/select";
import { BookOpen, FileText, AlertTriangle, Info } from "lucide-react";
import type { OzipzDictionaryItem, OzipzDictionaryType } from "../../types/ozipz.types";
import { DICTIONARY_CATEGORIES_CONFIG } from "../../constants";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { normalizeDictionaryValue } from "../../utils/dictionaryUsage";
import { JrwaClassificationFields } from "./components/JrwaClassificationFields";
import { DictionaryCodeField, DictionaryPostalCodeField, DictionarySystemToggle } from "./components/DictionaryDialogFields";
import { DictionaryItemSchema } from "../../schemas/ozipz.schemas";
import { isJrwaCategory, isMunicipalityCategory } from "./dictionaryCategoryMeta";
import { useDictionaryUsageIndex } from "./useDictionaryUsageIndex";
import { z } from "zod";

const CUSTOM_TYPE = "__custom__";

const DictionaryFormSchema = DictionaryItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).superRefine((data, ctx) => {
  if (isJrwaCategory(data.dictType) && !data.kind) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Wybór rodzaju interwencji (PROGRAMOWE / NIEPROGRAMOWE) jest wymagany dla symbolu JRWA",
      path: ["kind"],
    });
  }
});

type DictionaryFormInput = z.input<typeof DictionaryFormSchema>;
type DictionaryFormOutput = z.output<typeof DictionaryFormSchema>;
type DictionaryPayload = Omit<OzipzDictionaryItem, "id" | "createdAt" | "updatedAt">;

interface DictionaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DictionaryPayload) => void | Promise<unknown>;
  onUpdate: (id: string, item: Partial<Omit<OzipzDictionaryItem, "id">>) => void | Promise<unknown>;
  editingItem: OzipzDictionaryItem | null;
  defaultCategory: OzipzDictionaryType;
  /** Wartości początkowe nowej pozycji (np. przy duplikowaniu). */
  initialValues?: Partial<OzipzDictionaryItem>;
}

export function slugifyDictionaryCode(label: string): string {
  return label
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

const toFormValues = (source: Partial<OzipzDictionaryItem>, dictType: string): DictionaryFormInput => ({
  dictType,
  code: source.code || "",
  label: source.label || "",
  description: source.description || "",
  postalCode: source.postalCode || "",
  kind: source.kind || undefined,
  gisCategory: source.gisCategory || undefined,
  isSystem: !!source.isSystem,
});

export function DictionaryDialog({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingItem,
  defaultCategory,
  initialValues,
}: DictionaryDialogProps) {
  const [customType, setCustomType] = useState("");
  const [isCustomType, setIsCustomType] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Kod generowany na bieżąco z nazwy, dopóki użytkownik nie wpisze go ręcznie
  const codeTouched = useRef(false);

  const allItems = useOzipzDbStore((s) => s.dictionaryItems);
  const editingItems = useMemo(() => (editingItem ? [editingItem] : []), [editingItem]);
  const usageIndex = useDictionaryUsageIndex(editingItems, isOpen && !!editingItem);
  const editingUsage = editingItem ? usageIndex.get(editingItem.id) : undefined;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<DictionaryFormInput, unknown, DictionaryFormOutput>({
    resolver: zodResolver(DictionaryFormSchema),
    defaultValues: toFormValues({}, defaultCategory || ""),
  });

  const dictType = watch("dictType");
  const label = watch("label");
  const code = watch("code");
  const isSystem = watch("isSystem");

  const effectiveType = isCustomType ? customType.trim() : dictType;
  const isCodeLocked = !!editingItem?.isSystem;

  const categoryOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = Object.entries(DICTIONARY_CATEGORIES_CONFIG).map(([key, config]) => ({
      value: key,
      label: `${config.label} (${config.shortLabel})`,
      description: config.description,
      badge: config.shortLabel,
    }));
    list.push({
      value: CUSTOM_TYPE,
      label: "+ Nowy typ słownika...",
      badge: "Własny",
      badgeVariant: "secondary",
    });
    return list;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    const source = editingItem ?? initialValues ?? {};
    const sourceType = editingItem?.dictType ?? initialValues?.dictType ?? defaultCategory;
    const isKnown = !!sourceType && sourceType in DICTIONARY_CATEGORIES_CONFIG;
    const isCustom = !!sourceType && !isKnown && sourceType !== "all" && (!!editingItem || !!initialValues);

    codeTouched.current = !!editingItem || !!source.code;
    setIsCustomType(isCustom);
    setCustomType(isCustom ? sourceType : "");
    reset(toFormValues(source, isCustom ? CUSTOM_TYPE : isKnown ? sourceType : ""));
  }, [editingItem, initialValues, defaultCategory, isOpen, reset]);

  // Automatyczne uzupełnianie kodu z nazwy
  useEffect(() => {
    if (codeTouched.current || editingItem) return;
    setValue("code", slugifyDictionaryCode(label || ""));
  }, [label, editingItem, setValue]);

  const sameTypeItems = useMemo(
    () => allItems.filter((d) => d.dictType === effectiveType && d.id !== editingItem?.id),
    [allItems, effectiveType, editingItem]
  );

  const duplicateCode = useMemo(() => {
    const normalized = normalizeDictionaryValue(code);
    return normalized ? sameTypeItems.find((d) => normalizeDictionaryValue(d.code) === normalized) : undefined;
  }, [sameTypeItems, code]);

  const duplicateLabel = useMemo(() => {
    const normalized = normalizeDictionaryValue(label);
    return normalized ? sameTypeItems.find((d) => normalizeDictionaryValue(d.label) === normalized) : undefined;
  }, [sameTypeItems, label]);

  const renamedWhileUsed =
    !!editingItem &&
    !!editingUsage?.total &&
    (normalizeDictionaryValue(label) !== normalizeDictionaryValue(editingItem.label) ||
      normalizeDictionaryValue(code) !== normalizeDictionaryValue(editingItem.code));

  const handleGenerateCode = () => {
    if (!label?.trim() || isCodeLocked) return;
    codeTouched.current = true;
    setValue("code", slugifyDictionaryCode(label) || "kod_" + Date.now().toString().slice(-4), {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: DictionaryFormOutput) => {
    if (isCustomType && !customType.trim()) {
      setSubmitError("Podaj identyfikator nowego typu słownika");
      return;
    }
    if (duplicateCode) {
      setError("code", { message: `Kod „${duplicateCode.code}” jest już używany przez pozycję „${duplicateCode.label}”` });
      return;
    }

    const finalCode = isCodeLocked
      ? editingItem!.code
      : data.code.trim() || slugifyDictionaryCode(data.label) || "kod_" + Date.now().toString().slice(-4);

    const payload: DictionaryPayload = {
      dictType: effectiveType,
      code: finalCode,
      label: data.label.trim(),
      description: data.description?.trim() || undefined,
      postalCode: isMunicipalityCategory(effectiveType) ? data.postalCode?.trim() || undefined : editingItem?.postalCode,
      kind: data.kind || undefined,
      gisCategory: data.gisCategory || undefined,
      isSystem: Boolean(data.isSystem),
    };

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Nie udało się zapisać pozycji słownikowej");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = DICTIONARY_CATEGORIES_CONFIG[dictType as OzipzDictionaryType];
  const showJrwaFields = isJrwaCategory(effectiveType);
  const showPostalCode = isMunicipalityCategory(effectiveType);

  const errorMessage =
    submitError ||
    Object.values(errors)
      .map((e) => e?.message)
      .filter(Boolean)
      .join(", ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      headerAccent="purple"
      icon={<BookOpen className="size-5" />}
      title={editingItem ? "Edycja Pozycji Słownikowej" : "Nowa Pozycja w Słowniku"}
      description="Konfiguracja słowników systemowych i użytkownika dla wszystkich modułów OZiPZ"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingItem ? "Zapisz Zmiany" : "Dodaj do Słownika"}
    >
      <div className="space-y-4">
        {editingItem && (
          <div className="flex items-center gap-2 rounded-[3px] border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            {editingUsage?.total ? (
              <span>
                Używana w <strong className="text-foreground">{editingUsage.total}</strong> rekordach:{" "}
                {editingUsage.byModule.map((m) => `${m.module} (${m.count})`).join(", ")}
              </span>
            ) : (
              <span>Pozycja nie jest jeszcze używana w żadnym rekordzie.</span>
            )}
          </div>
        )}

        {/* Typ / Kategoria słownika */}
        <div className="space-y-1.5">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
            <BookOpen className="size-3.5 text-indigo-600" />
            <span>
              Kategoria Słownika <span className="text-destructive">*</span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SearchableSelect
              value={isCustomType ? CUSTOM_TYPE : dictType}
              onChange={(val) => {
                if (val === CUSTOM_TYPE) {
                  setIsCustomType(true);
                  setValue("dictType", CUSTOM_TYPE, { shouldValidate: true });
                } else {
                  setIsCustomType(false);
                  setValue("dictType", val, { shouldValidate: true });
                }
              }}
              options={categoryOptions}
              placeholder="-- Wybierz kategorię słownika --"
              searchPlaceholder="Szukaj kategorii..."
              size="sm"
            />

            {isCustomType && (
              <Input
                type="text"
                placeholder="Identyfikator nowego słownika..."
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="h-9 text-xs"
              />
            )}
          </div>

          {selectedCategoryMeta && !isCustomType && (
            <p className="text-[11px] text-muted-foreground leading-tight">{selectedCategoryMeta.description}</p>
          )}
        </div>

        {/* Nazwa pozycji */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="size-3.5 text-primary" />
            <span>
              Nazwa Wartości Słownikowej <span className="text-destructive">*</span>
            </span>
          </label>
          <Input
            type="text"
            placeholder="np. Prelekcja multimedialna, Spotkanie z rodzicami..."
            {...register("label")}
            className="h-9 text-xs font-medium"
            autoFocus
          />
          {errors.label && <p className="text-[10px] text-destructive font-semibold">{errors.label.message}</p>}
          {duplicateLabel && (
            <p className="text-[10.5px] text-amber-700 dark:text-amber-400 font-medium">
              W tej kategorii istnieje już pozycja o tej nazwie (kod: {duplicateLabel.code}).
            </p>
          )}
        </div>

        {showPostalCode && <DictionaryPostalCodeField field={register("postalCode")} />}

        {showJrwaFields && (
          <JrwaClassificationFields
            kindField={register("kind")}
            gisCategoryField={register("gisCategory")}
            kindError={errors.kind?.message}
          />
        )}

        <DictionaryCodeField
          codeField={register("code", { onChange: () => { codeTouched.current = true; } })}
          isCodeLocked={isCodeLocked}
          codeError={errors.code?.message}
          duplicateCode={duplicateCode}
          onGenerateCode={handleGenerateCode}
        />

        {renamedWhileUsed && (
          <div className="flex gap-2 rounded-[3px] border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Pozycja jest używana w {editingUsage?.total} rekordach, które przechowują dotychczasową wartość (
              <strong>{editingItem?.label}</strong>). Zmiana nie zaktualizuje ich automatycznie i mogą przestać być
              powiązane z tą pozycją w statystykach.
            </span>
          </div>
        )}

        {/* Opis merytoryczny */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Opis Merytoryczny / Wyjaśnienie <span className="text-muted-foreground font-normal">(opcjonalnie)</span>
          </label>
          <textarea
            placeholder="Dodatkowy opis kontekstu użycia, grupy docelowej lub wytycznych metodycznych..."
            {...register("description")}
            rows={3}
            className="w-full rounded-[2px] border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <DictionarySystemToggle field={register("isSystem")} checked={Boolean(isSystem)} />
      </div>
    </ModalDialog>
  );
}
