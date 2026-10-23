import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Autocomplete } from "@/components/ui/autocomplete";
import { EMPTY_LIST } from "@/lib/utils";
import type { OzipzDictionaryItem, OzipzMaterial, OzipzProgram, OzipzStaff, OzipzTemplate } from "../../types/ozipz.types";
import { useOzipzDbStore, useDictionaries } from "../../store/useOzipzDbStore";
import { buildClassificationOptions, classificationValue, getAllJrwaSymbols } from "../../utils/programJrwaUtils";
import { buildTemplatePayload, resolveTemplateContent, type TemplateAudienceGroup, type TemplatePayload } from "../../utils/templateUtils";
import { findCampaign } from "../actions/editor/actionEditorSubmitUtils";
import { FIELD_LABEL } from "../actions/editor/formStyles";
import { TemplateAudienceEditor, TemplateMaterialsEditor } from "./components/TemplateContentEditors";

export const TemplateFormSchema = z.object({
  name: z.string().trim().min(1, "Wpisz nazwę szablonu."),
  actionType: z.string().trim().min(1, "Wybierz formę działania."),
  classification: z.string(),
  title: z.string(),
  campaignId: z.string(),
  leadEducator: z.string(),
  numberOfActions: z.number({ error: "Podaj liczbę działań." }).int().min(1, "Liczba działań to co najmniej 1.").max(999),
  description: z.string(),
});

type TemplateFormValues = z.infer<typeof TemplateFormSchema>;

const EMPTY_VALUES: TemplateFormValues = {
  name: "", actionType: "", classification: "", title: "", campaignId: "", leadEducator: "", numberOfActions: 1, description: "",
};
const EMPTY_AUDIENCE: TemplateAudienceGroup[] = [{ name: "", items: [{ name: "", ageFrom: null, ageTo: null }] }];

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate?: OzipzTemplate | null;
  actionTypes?: OzipzDictionaryItem[];
  programs?: OzipzProgram[];
  jrwaSymbols?: OzipzDictionaryItem[];
  materials?: OzipzMaterial[];
  staff?: OzipzStaff[];
  templates?: OzipzTemplate[];
  onSave: (data: TemplatePayload) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzTemplate>) => unknown | Promise<unknown>;
}

/**
 * Szablon zadania: to samo, co wypełnia formularz działania — forma, program lub JRWA, tytuł, kampania, prowadzący,
 * liczba działań, grupy odbiorców, materiały i opis. Daty, miejsca, liczb osób i sztuk ani znaków spraw szablon nie ma.
 */
export function TemplateDialog({
  isOpen,
  onClose,
  editingTemplate = null,
  actionTypes: propActionTypes,
  programs: propPrograms,
  jrwaSymbols: propJrwaSymbols,
  materials: propMaterials,
  staff: propStaff,
  templates: propTemplates,
  onSave,
  onUpdate,
}: TemplateDialogProps) {
  const dbPrograms = useOzipzDbStore((s) => s.programs);
  const dbMaterials = useOzipzDbStore((s) => s.materials);
  const dbStaff = useOzipzDbStore((s) => s.staff);
  const dbTemplates = useOzipzDbStore((s) => s.templates);
  const dictStore = useDictionaries();
  const programs = propPrograms || dbPrograms || EMPTY_LIST;
  const materials = propMaterials || dbMaterials || EMPTY_LIST;
  const staff = propStaff || dbStaff || EMPTY_LIST;
  const templates = propTemplates || dbTemplates || EMPTY_LIST;
  const actionTypes = propActionTypes || dictStore.activityTypes || EMPTY_LIST;
  const jrwaSymbols = propJrwaSymbols || dictStore.jrwaSymbols || EMPTY_LIST;
  const campaigns = dictStore.dictionaryItems.filter((d) => d.dictType === "campaign");
  const recipientSuggestions = dictStore.dictionaryItems.filter((d) => d.dictType === "recipientGroup").map((d) => d.label);

  const classificationOptions = buildClassificationOptions(programs, getAllJrwaSymbols(jrwaSymbols));
  const actionTypeOptions = actionTypes.map((a) => ({ value: a.label, label: a.label }));
  const campaignOptions = campaigns.map((c) => ({ value: c.code, label: c.label }));

  const [audienceGroups, setAudienceGroups] = useState<TemplateAudienceGroup[]>(EMPTY_AUDIENCE);
  const [materialIds, setMaterialIds] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors, isSubmitting } } =
    useForm<TemplateFormValues>({ resolver: zodResolver(TemplateFormSchema), defaultValues: EMPTY_VALUES });

  // Katalogi czytamy przy otwarciu okna; ich odświeżenie w tle nie może nadpisać wpisywanych zmian.
  const lookupsRef = useRef({ programs, campaigns, actionTypes });
  lookupsRef.current = { programs, campaigns, actionTypes };
  useEffect(() => {
    if (!isOpen) return;
    if (!editingTemplate) {
      reset(EMPTY_VALUES);
      setAudienceGroups(EMPTY_AUDIENCE);
      setMaterialIds([]);
      return;
    }
    const { programs: currentPrograms, campaigns: currentCampaigns, actionTypes: currentTypes } = lookupsRef.current;
    const content = resolveTemplateContent(editingTemplate, currentPrograms);
    const type = currentTypes.find((a) => a.code === content.actionType || a.label === content.actionType);
    reset({
      name: content.name,
      actionType: type?.label || content.actionType,
      classification: classificationValue(content.programId, content.jrwaSymbol),
      title: content.title,
      campaignId: findCampaign(currentCampaigns, content.campaignId)?.code || content.campaignId,
      leadEducator: content.leadEducator,
      numberOfActions: content.numberOfActions,
      description: content.description,
    });
    setAudienceGroups(content.audienceGroups.length ? content.audienceGroups : EMPTY_AUDIENCE);
    setMaterialIds(content.materialIds);
  }, [editingTemplate, isOpen, reset]);

  const values = watch();
  // Wartość spoza list (np. forma lub kampania usunięta ze słownika) pokazujemy, zamiast jej po cichu kasować.
  const withCurrent = (options: { value: string; label: string }[], value: string) =>
    value && !options.some((o) => o.value === value) ? [{ value, label: value }, ...options] : options;

  const onSubmit = async (data: TemplateFormValues) => {
    const name = data.name.trim();
    if (templates.some((t) => t.id !== editingTemplate?.id && t.title.trim().toLocaleLowerCase("pl") === name.toLocaleLowerCase("pl"))) {
      setError("name", { message: "Szablon o tej nazwie już istnieje. Podaj inną nazwę." });
      return;
    }
    const [kind, ref = ""] = data.classification.split(/:(.*)/s);
    const payload = buildTemplatePayload({
      name,
      actionType: data.actionType,
      title: data.title,
      programId: kind === "prog" ? ref : "",
      jrwaSymbol: kind === "jrwa" ? ref : "",
      campaignId: data.campaignId,
      leadEducator: data.leadEducator,
      numberOfActions: data.numberOfActions,
      audienceGroups,
      materialIds,
      description: data.description,
    });
    try {
      if (editingTemplate) await onUpdate(editingTemplate.id, payload);
      else await onSave(payload);
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać szablonu." });
    }
  };

  const errorMessage = Object.values(errors).map((e) => e?.message).filter(Boolean).join(" ");
  const legacyMaterials = editingTemplate?.suggestedMaterials?.trim();

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      headerAccent="primary"
      icon={<FileText className="size-5" />}
      title={editingTemplate ? "Edytuj szablon" : "Nowy szablon"}
      description="To, co się powtarza. Datę, miejsce, liczby osób i sztuk oraz znaki spraw uzupełnisz przy każdym działaniu."
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingTemplate ? "Zapisz zmiany" : "Utwórz szablon"}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="template-name" className={FIELD_LABEL}>Nazwa szablonu <span className="text-destructive">*</span></label>
          <Input id="template-name" placeholder="Np. Prelekcja — jesień bez infekcji, 4 grupy" {...register("name")}
            aria-invalid={Boolean(errors.name)} autoFocus />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <section className="space-y-3" aria-label="Działanie">
          <h3 className="text-sm font-semibold">Działanie</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select id="template-action-type" label="Forma działania" required value={values.actionType}
              options={withCurrent(actionTypeOptions, values.actionType)} placeholder="Wybierz formę działania"
              onChange={(v) => setValue("actionType", v, { shouldValidate: true })} error={errors.actionType?.message} />
            <Select id="template-classification" label="Program lub klasyfikacja" value={values.classification}
              options={classificationOptions} clearable placeholder="Wybierz, jeśli dotyczy" dropdownClassName="sm:min-w-[26rem]"
              onChange={(v) => setValue("classification", v)} />
            <Select id="template-campaign" label="Kampania / akcja" value={values.campaignId}
              options={withCurrent(campaignOptions, values.campaignId)} clearable placeholder="Wybierz, jeśli dotyczy"
              onChange={(v) => setValue("campaignId", v)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="template-title" className={FIELD_LABEL}>Tytuł działania</label>
              <Input id="template-title" {...register("title")}
                placeholder="Puste: tytułem będzie nazwa programu, a bez programu — nazwa szablonu" />
            </div>
            <Autocomplete label="Osoba prowadząca" value={values.leadEducator} options={staff.map((p) => p.fullName)}
              onChange={(v) => setValue("leadEducator", v)} placeholder="Wybierz lub wpisz osobę" />
            <div>
              <label htmlFor="template-count" className={FIELD_LABEL}>Liczba działań [DZ]</label>
              <Input id="template-count" type="number" min={1} max={999} className="max-w-32"
                {...register("numberOfActions", { valueAsNumber: true })} aria-invalid={Boolean(errors.numberOfActions)} />
            </div>
          </div>
        </section>

        <section className="space-y-2 border-t border-border pt-3" aria-label="Odbiorcy">
          <h3 className="text-sm font-semibold">Odbiorcy <span className="font-normal text-muted-foreground">— bez liczby osób</span></h3>
          <TemplateAudienceEditor groups={audienceGroups} onChange={setAudienceGroups} suggestions={recipientSuggestions} />
        </section>

        <section className="space-y-2 border-t border-border pt-3" aria-label="Materiały">
          <h3 className="text-sm font-semibold">Materiały <span className="font-normal text-muted-foreground">— bez liczby sztuk</span></h3>
          <TemplateMaterialsEditor materialIds={materialIds} onChange={setMaterialIds} materials={materials} />
          {legacyMaterials && <p className="text-xs text-muted-foreground">Ze starszej wersji szablonu: „{legacyMaterials}”. Wybierz te materiały z katalogu.</p>}
        </section>

        <div className="border-t border-border pt-3">
          <label htmlFor="template-description" className={FIELD_LABEL}>Opis czynności</label>
          <Textarea id="template-description" rows={4} {...register("description")} placeholder="Przebieg działania, który chcesz powtarzać" />
        </div>
      </div>
    </ModalDialog>
  );
}
