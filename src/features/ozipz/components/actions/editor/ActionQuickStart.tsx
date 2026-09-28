import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTemplates } from "../../../store/useOzipzDbStore";
import type { ActionEditorSectionProps } from "./editor.types";
import type { useActionEditorState } from "./useActionEditorState";
import { isEmptyImportedTemplate } from "../../../utils/templateUtils";
import { ACTION_CARD_PRESETS } from "./presetsConfig";

const TEMPLATE_PREFIX = "tpl:";
const PRESET_PREFIX = "preset:";

/**
 * Szybki start: jedno pole z zapisanymi szablonami (z bazy) i wbudowanymi wzorcami działań,
 * oraz zapis bieżącego formularza jako nowego szablonu.
 */
export function ActionQuickStart({ state: s, data }: {
  state: ReturnType<typeof useActionEditorState>; data: ActionEditorSectionProps;
}) {
  const store = useTemplates();
  const templates = data.templates ?? store.templates;
  const usableTemplates = templates.filter((t) => !isEmptyImportedTemplate(t));
  const emptyCount = templates.length - usableTemplates.length;
  const showPresets = !data.editingAction?.id;
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");

  const options = [
    ...usableTemplates.map((t) => ({ value: `${TEMPLATE_PREFIX}${t.id}`, label: t.title, description: t.actionType, group: "Twoje szablony" })),
    ...(showPresets
      ? ACTION_CARD_PRESETS.map((p) => ({ value: `${PRESET_PREFIX}${p.id}`, label: p.title, description: p.subtitle, group: "Wzorce wbudowane" }))
      : []),
  ];
  const value = s.selectedTemplateId.startsWith(PRESET_PREFIX)
    ? s.selectedTemplateId
    : s.selectedTemplateId ? `${TEMPLATE_PREFIX}${s.selectedTemplateId}` : "";

  const apply = (choice: string) => {
    if (choice.startsWith(PRESET_PREFIX)) {
      const preset = ACTION_CARD_PRESETS.find((p) => `${PRESET_PREFIX}${p.id}` === choice);
      if (!preset) return;
      s.applyPreset(preset);
      toast.info("Wczytano wzorzec. Sprawdź tytuł, miejsce, datę i liczby odbiorców.");
      return;
    }
    const id = choice.startsWith(TEMPLATE_PREFIX) ? choice.slice(TEMPLATE_PREFIX.length) : "";
    const template = templates.find((item) => item.id === id);
    if (!template) { s.handleApplyTemplate(id); return; }
    const program = data.programs?.find((p) => p.name === template.topic);
    const symbol = template.topic?.match(/^JRWA\s+([\d.]+)/)?.[1];
    s.handleProgramOrJrwaSelect(program ? `prog:${program.id}` : symbol ? `jrwa:${symbol}` : "");
    s.handleApplyTemplate(id);
    toast.info("Wczytano szablon. Sprawdź miejsce, datę i liczby odbiorców.");
  };

  const save = async () => {
    if (busy.current) return;
    if (!name.trim() || !s.actionType) { setError("Podaj nazwę szablonu i wybierz formę działania."); return; }
    if (templates.some((t) => t.title.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) {
      setError("Szablon o tej nazwie już istnieje. Podaj inną nazwę."); return;
    }
    busy.current = true; setSaving(true); setError("");
    try {
      await store.addTemplate({
        title: name.trim(), actionType: s.actionType,
        actionDefaults: { title: s.title.trim() || name.trim(), leadEducator: s.leadEducator || "", campaignId: s.campaignId || "" },
        topic: data.programs?.find((p) => p.id === s.programId)?.name || (s.selectedJrwaSymbol ? `JRWA ${s.selectedJrwaSymbol}` : s.form.getValues("topic") || ""),
        descriptionTemplate: s.activitiesDescription,
        defaultAudience: s.audienceGroups.flatMap((g) => g.items.map((i) => i.name.trim())).filter(Boolean).join("; "),
      });
      setExpanded(false); toast.success("Zapisano szablon. Znajdziesz go również w zakładce Szablony.");
    } catch { setError("Nie udało się zapisać szablonu. Spróbuj ponownie."); }
    finally { busy.current = false; setSaving(false); }
  };

  return <section aria-label="Szybki start" className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <Select label="Szybki start: szablon lub wzorzec" value={value} options={options} onChange={apply} clearable
          placeholder={options.length ? "Wybierz, aby wypełnić formularz…" : "Zapisz swój pierwszy szablon"} />
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" aria-expanded={expanded}
        onClick={() => { setName(s.title); setError(""); setExpanded(!expanded); }}>
        <Bookmark className="size-3.5" /> Zapisz jako szablon
      </Button>
    </div>
    {emptyCount > 0 && <p className="text-xs text-muted-foreground">Pominięto puste rekordy z importu ({emptyCount}).</p>}
    {expanded && <div className="space-y-2 border-t border-border pt-3">
      <label htmlFor="action-template-name" className="text-sm font-medium">Nazwa szablonu</label>
      <Input id="action-template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. Prelekcja — higiena rąk" />
      <p className="text-xs text-muted-foreground">Zapisujemy tytuł, formę, program lub klasyfikację, prowadzącego, kampanię, opis i nazwy grup odbiorców. Miejsce, liczby osób i znaki spraw uzupełnisz przy realizacji.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><Button type="button" size="sm" disabled={saving} onClick={save}>{saving ? "Zapisywanie…" : "Zapisz szablon"}</Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setExpanded(false)}>Anuluj zapis szablonu</Button></div>
    </div>}
  </section>;
}
