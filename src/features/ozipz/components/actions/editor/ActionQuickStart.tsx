import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BookmarkPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";
import { useTemplates } from "../../../store/useOzipzDbStore";
import type { OzipzTemplate } from "../../../types/ozipz.types";
import type { ActionEditorSectionProps } from "./editor.types";
import type { useActionEditorState } from "./useActionEditorState";
import {
  buildTemplatePayload, describeTemplateContent, isEmptyImportedTemplate, resolveTemplateContent, usableTemplates,
  type TemplateContent,
} from "../../../utils/templateUtils";
import { FIELD_INPUT, FIELD_LABEL } from "./formStyles";

/** Od tylu szablonów pokazujemy wyszukiwarkę — mniejszą listę ogarnia się wzrokiem. */
const SEARCH_FROM = 9;

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
  };
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
  const q = query.trim().toLocaleLowerCase("pl");
  const visible = q
    ? list.filter((t) => `${t.title} ${summarize(resolveTemplateContent(t, programs), true)}`.toLocaleLowerCase("pl").includes(q))
    : list;

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

  return <section aria-label="Szablony" className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-sm font-semibold">Szablony</h2>
      {list.length > 0 && <span className="text-xs text-muted-foreground">Kliknij szablon, aby wypełnić formularz.</span>}
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
      : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((t) => {
          const active = t.id === s.selectedTemplateId;
          const content = resolveTemplateContent(t, programs);
          return <button key={t.id} type="button" aria-pressed={active} title={summarize(content, true)}
            onClick={() => s.applyTemplate(t.id)}
            className={cn(
              "flex min-w-0 flex-col items-start gap-0.5 rounded-md border bg-background px-3 py-2 text-left transition-colors",
              "hover:border-primary/60 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
              active ? "border-primary bg-primary/10" : "border-border"
            )}>
            <span className="flex w-full items-start gap-1.5 text-sm font-medium leading-snug">
              {/* Pełna nazwa (najwyżej dwie linie) — ucięte nazwy podobnych szablonów wyglądałyby tak samo. */}
              <span className="line-clamp-2 break-words">{t.title}</span>
              {active && <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />}
            </span>
            <span className="w-full truncate text-xs text-muted-foreground">{summarize(content, false)}</span>
          </button>;
        })}
        {visible.length === 0 && <p className="text-sm text-muted-foreground">Żaden szablon nie pasuje do „{query.trim()}”.</p>}
      </div>}

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
  </section>;
}
