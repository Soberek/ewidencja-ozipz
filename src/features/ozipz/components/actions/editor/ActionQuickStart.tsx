import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTemplates } from "../../../store/useOzipzDbStore";
import { TemplateDialog } from "../../templates/TemplateDialog";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import type { ActionEditorSectionProps } from "./editor.types";
import type { useActionEditorState } from "./useActionEditorState";
import {
  buildTemplatePayload, describeTemplateContent, isEmptyImportedTemplate, resolveTemplateContent, templateDetailRows, usableTemplates,
  type TemplateContent,
} from "../../../utils/templateUtils";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";
import { TemplateCompactList, type CompactTemplateRow } from "./TemplateCompactList";

/** Od tylu szablonów pokazujemy wyszukiwarkę — mniejszą listę ogarnia się wzrokiem. */
const SEARCH_FROM = 6;

/**
 * Szablony nad formularzem: kliknięcie kafelka wypełnia formularz, „Cofnij” przywraca poprzedni stan,
 * a zmiany w formularzu można zapisać w szablonie albo jako nowy szablon. Wbudowanych wzorców nie ma.
 */
export function ActionQuickStart({ state: s, data }: {
  state: ReturnType<typeof useActionEditorState>; data: ActionEditorSectionProps;
}) {
  const store = useTemplates();
  const templates = data.templates ?? store.templates;
  const list = useMemo(() => usableTemplates(templates), [templates]);
  const emptyCount = templates.filter(isEmptyImportedTemplate).length;
  const programs = data.programs ?? [];
  const lookups = {
    programs,
    materials: data.materials ?? [],
    jrwaSymbols: (data.dictionaryItems ?? []).filter((d) => d.dictType === "jrwaSymbol"),
    campaigns: (data.dictionaryItems ?? []).filter((d) => d.dictType === "campaign"),
  };
  // Edycja w lokalnym oknie: modal z globalnego store zastąpiłby otwarty formularz działania.
  const [editing, setEditing] = useState<OzipzTemplate | null>(null);
  const [query, setQuery] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const summarize = (content: TemplateContent, full: boolean) => {
    const d = describeTemplateContent(content, lookups);
    return (full
      ? [content.actionType, d.classification, d.count, d.audience && `odbiorcy: ${d.audience}`, d.materials && `materiały: ${d.materials}`,
        content.leadEducator && `prowadzi: ${content.leadEducator}`, content.description.trim() && "opis"]
      : [content.actionType, d.count, d.audience]
    ).filter(Boolean).join(" · ");
  };
  // Opis każdego szablonu liczymy raz na zmianę danych, nie przy każdym znaku wpisanym w formularz.
  const rows = useMemo<(CompactTemplateRow & { searchText: string })[]>(() => list.map((template) => {
    const content = resolveTemplateContent(template, programs);
    const summary = describeTemplateContent(content, lookups);
    const searchText = [template.title, content.actionType, summary.classification, summary.audience, summary.materials, content.leadEducator]
      .join(" ").toLocaleLowerCase("pl");
    return { template, content, summary, details: templateDetailRows(content, lookups), searchText };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- lookups to pochodna data.programs/materials/dictionaryItems
  }), [list, data.programs, data.materials, data.dictionaryItems]);
  const q = query.trim().toLocaleLowerCase("pl");
  const visible = useMemo(() => (q ? rows.filter((r) => r.searchText.includes(q)) : rows), [rows, q]);

  const run = async (task: () => Promise<unknown>, success: string) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError("");
    try {
      await task();
      setSaveOpen(false);
      toast.success(success);
    } catch {
      setError("Nie udało się zapisać szablonu. Spróbuj ponownie.");
      toast.error("Nie udało się zapisać szablonu.");
    } finally { busy.current = false; setSaving(false); }
  };

  const togglePin = async (template: OzipzTemplate) => {
    try {
      await store.updateTemplate(template.id, { pinned: !template.pinned });
    } catch {
      toast.error("Nie udało się zmienić przypięcia szablonu.");
    }
  };

  const saveAsNew = () => {
    const trimmed = name.trim();
    if (!trimmed || !s.actionType) { setError("Podaj nazwę szablonu i wybierz formę działania."); return; }
    if (list.some((t) => t.title.trim().toLocaleLowerCase("pl") === trimmed.toLocaleLowerCase("pl"))) {
      setError("Szablon o tej nazwie już istnieje. Podaj inną nazwę albo zapisz zmiany we wczytanym szablonie."); return;
    }
    void run(() => store.addTemplate(buildTemplatePayload({ ...s.templateContent, name: trimmed })),
      "Zapisano szablon. Znajdziesz go też w zakładce Szablony zadań.");
  };

  const saveChanges = (template: OzipzTemplate) => run(
    () => store.updateTemplate(template.id, buildTemplatePayload({ ...s.templateContent, name: template.title })),
    `Zapisano zmiany w szablonie „${template.title}”.`
  );

  return <TooltipProvider delayDuration={600}><section aria-label="Szablony" className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-sm font-semibold">Szablony</h2>
      {list.length > 0 && <span className="text-xs text-muted-foreground">Kliknij wiersz, aby wypełnić formularz; przytrzymaj kursor, aby zobaczyć wszystko, co wpisze.</span>}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {list.length >= SEARCH_FROM && <SearchInput value={query} onValueChange={setQuery} placeholder="Szukaj szablonu…" />}
        <Button type="button" variant="outline" size="sm" className="gap-1.5" aria-expanded={saveOpen}
          onClick={() => { setName(s.selectedTemplate ? "" : s.title); setError(""); setSaveOpen(!saveOpen); }}>
          <BookmarkPlus className="size-3.5" /> Zapisz jako szablon
        </Button>
      </div>
    </div>

    {list.length === 0
      ? <p className="text-sm text-muted-foreground">Nie masz jeszcze szablonów. Wypełnij pola, które się powtarzają (formę, program, odbiorców, materiały), i kliknij „Zapisz jako szablon”.</p>
      : visible.length > 0
        ? <TemplateCompactList rows={visible} activeId={s.selectedTemplateId ?? undefined}
          onApply={(t) => s.applyTemplate(t.id)} onTogglePin={(t) => void togglePin(t)} onEdit={setEditing} />
        : <p className="text-sm text-muted-foreground">Żaden szablon nie pasuje do „{query.trim()}”.</p>}

    {s.selectedTemplate && <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span>Wczytano „<strong>{s.selectedTemplate.title}</strong>”. Uzupełnij datę, miejsce i liczby.</span>
      {s.canUndoTemplate && <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={s.undoTemplate}>Cofnij</Button>}
      {s.isTemplateChanged && <Button type="button" variant="link" size="sm" className="h-auto p-0" disabled={saving}
        onClick={() => void saveChanges(s.selectedTemplate!)}>Zapisz zmiany w szablonie</Button>}
    </div>}

    {emptyCount > 0 && <p className="text-xs text-muted-foreground">Pominięto puste rekordy z importu ({emptyCount}) — usuniesz je w zakładce Szablony zadań.</p>}

    {saveOpen && <div className="space-y-2 border-t border-border pt-3">
      <div className="max-w-md">
        <label htmlFor="action-template-name" className={FIELD_LABEL}>Nazwa nowego szablonu</label>
        <Input id="action-template-name" className={FIELD_INPUT} value={name} autoFocus
          onChange={(e) => setName(e.target.value)} placeholder="np. Prelekcja — higiena rąk, 4 grupy" />
      </div>
      <p className="text-xs text-muted-foreground">
        Szablon zapamięta: {summarize(s.templateContent, true) || "na razie nic — wypełnij formularz"}.
        {" "}Daty, miejsca, liczby osób i sztuk ani znaków spraw nie zapisujemy — uzupełnisz je przy każdym działaniu.
      </p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={saveAsNew}>{saving ? "Zapisywanie…" : "Zapisz szablon"}</Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setSaveOpen(false)}>Anuluj</Button>
      </div>
    </div>}
    {editing && <TemplateDialog isOpen onClose={() => setEditing(null)} editingTemplate={editing}
      programs={programs} materials={lookups.materials} jrwaSymbols={lookups.jrwaSymbols} templates={templates}
      onSave={(payload) => store.addTemplate(payload)}
      onUpdate={async (id, payload) => {
        try {
          await store.updateTemplate(id, payload);
          toast.success(`Zapisano szablon „${payload.title ?? editing.title}”.`);
        } catch (err) {
          toast.error("Nie udało się zapisać szablonu.");
          throw err;
        }
      }} />}
  </section></TooltipProvider>;
}
