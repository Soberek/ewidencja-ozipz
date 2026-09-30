import { useEffect, useState } from "react";
import { Bookmark, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { OzipzDbService } from "../../../../../db/client";
import type { RozdzielnikItem } from "../../../utils/rozdzielnikPrint";
import { sortRozdzielnikTemplates, type RozdzielnikTemplate } from "../../../utils/rozdzielnikTemplates";

interface RozdzielnikTemplatesPanelProps {
  /** Bieżący stan formularza — zapisywany jako szablon. */
  programName: string;
  items: RozdzielnikItem[];
  onApply: (template: RozdzielnikTemplate) => void;
}

function filledItems(items: RozdzielnikItem[]): RozdzielnikItem[] {
  return items.filter((item) => item.title.trim()).map((item) => ({ title: item.title.trim(), quantity: item.quantity }));
}

/** Zapisane zestawy materiałów (np. per program) — kliknięcie wypełnia program i pozycje rozdzielnika. */
export function RozdzielnikTemplatesPanel({ programName, items, onApply }: RozdzielnikTemplatesPanelProps) {
  const [templates, setTemplates] = useState<RozdzielnikTemplate[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<RozdzielnikTemplate | null>(null);

  useEffect(() => {
    let cancelled = false;
    OzipzDbService.getRozdzielnikTemplates()
      .then((list) => !cancelled && setTemplates(list))
      .catch(() => {
        if (cancelled) return;
        setTemplates([]);
        toast.error("Nie udało się wczytać szablonów rozdzielnika.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentItems = filledItems(items);
  const trimmedName = name.trim();

  const persist = async (template: RozdzielnikTemplate, message: string) => {
    try {
      await OzipzDbService.saveRozdzielnikTemplate(template);
      setTemplates((list) => sortRozdzielnikTemplates([...(list ?? []).filter((t) => t.id !== template.id), template]));
      setActiveId(template.id);
      toast.success(message);
      return true;
    } catch {
      toast.error("Nie udało się zapisać szablonu.");
      return false;
    }
  };

  const handleSave = async () => {
    const existing = templates?.find((t) => t.name.toLowerCase() === trimmedName.toLowerCase());
    const template: RozdzielnikTemplate = {
      id: existing?.id ?? crypto.randomUUID(),
      name: trimmedName,
      programName: programName.trim(),
      items: currentItems,
      updatedAt: new Date().toISOString(),
    };
    if (await persist(template, existing ? `Zaktualizowano szablon „${template.name}”.` : `Zapisano szablon „${template.name}”.`)) setName("");
  };

  const handleOverwrite = (template: RozdzielnikTemplate) =>
    void persist(
      { ...template, programName: programName.trim(), items: currentItems, updatedAt: new Date().toISOString() },
      `Zaktualizowano szablon „${template.name}”.`
    );

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await OzipzDbService.deleteRozdzielnikTemplate(pendingDelete.id);
      setTemplates((list) => (list ?? []).filter((t) => t.id !== pendingDelete.id));
      if (activeId === pendingDelete.id) setActiveId(null);
      toast.success(`Usunięto szablon „${pendingDelete.name}”.`);
    } catch {
      toast.error("Nie udało się usunąć szablonu.");
    }
    setPendingDelete(null);
  };

  const apply = (template: RozdzielnikTemplate) => {
    setActiveId(template.id);
    onApply(template);
  };

  return (
    <Card className="w-full space-y-3 p-4 lg:w-64 lg:shrink-0">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-bold">
          <Bookmark className="size-3.5 text-primary" />
          Szablony zestawów
        </h2>
        <p className="text-[11px] text-muted-foreground">Kliknij, aby wstawić program i materiały. Data i placówka zostają bez zmian.</p>
      </div>

      {templates === null ? (
        <div className="flex justify-center py-4 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <p className="rounded-[3px] border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
          Brak szablonów. Ułóż zestaw w formularzu i zapisz go poniżej.
        </p>
      ) : (
        <ul className="space-y-1">
          {templates.map((template) => {
            const isActive = template.id === activeId;
            const total = template.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
            return (
              <li key={template.id} className="group relative">
                <button
                  type="button"
                  onClick={() => apply(template)}
                  title={template.items.map((item) => `${item.title}${item.quantity ? ` — ${item.quantity} szt.` : ""}`).join("\n")}
                  className={cn(
                    "w-full rounded-[3px] border px-2.5 py-1.5 pr-14 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/30 hover:bg-muted/60"
                  )}
                >
                  <span className={cn("block truncate text-xs font-semibold", isActive && "text-primary")}>{template.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {template.items.length} poz.{total > 0 ? ` · ${total} szt.` : ""}
                    {template.programName && template.programName !== template.name ? ` · ${template.programName}` : ""}
                  </span>
                </button>
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOverwrite(template)}
                    disabled={currentItems.length === 0}
                    title="Nadpisz bieżącym zestawem z formularza"
                    aria-label={`Nadpisz szablon ${template.name}`}
                    className="size-6 p-0 text-muted-foreground hover:text-primary"
                  >
                    <RefreshCw className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingDelete(template)}
                    title="Usuń szablon"
                    aria-label={`Usuń szablon ${template.name}`}
                    className="size-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="space-y-1.5 border-t border-border pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <label htmlFor="rozdzielnik-template-name" className="text-xs font-bold">
          Zapisz bieżący zestaw
        </label>
        <Input
          id="rozdzielnik-template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={programName.trim() || "Nazwa szablonu, np. Bieg po zdrowie"}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={!trimmedName || currentItems.length === 0}
          className="w-full gap-1.5"
        >
          <Save className="size-3.5" />
          Zapisz szablon
        </Button>
        {currentItems.length === 0 && <p className="text-[11px] text-muted-foreground">Dodaj materiały w formularzu, aby zapisać zestaw.</p>}
        {trimmedName && templates?.some((t) => t.name.toLowerCase() === trimmedName.toLowerCase()) && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">Szablon o tej nazwie istnieje — zostanie nadpisany.</p>
        )}
      </form>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Usunąć szablon?"
        description={pendingDelete ? `Szablon „${pendingDelete.name}” zostanie usunięty. Wydrukowane rozdzielniki pozostają bez zmian.` : undefined}
        confirmText="Usuń"
      />
    </Card>
  );
}
