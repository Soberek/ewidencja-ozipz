import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { OzipzTemplate } from "../../types/ozipz.types";
import { useDictionaries, useMaterials, usePrograms, useTemplates } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { TemplatesFilterBar } from "./components/TemplatesFilterBar";
import { TemplatesTableView } from "./components/TemplatesTableView";
import type { TemplateListRow } from "./components/TemplatesTableColumns";
import { describeTemplateContent, isEmptyImportedTemplate, resolveTemplateContent } from "../../utils/templateUtils";

export interface TemplatesSectionProps {
  templates?: OzipzTemplate[];
  onOpenAdd?: () => void;
  onOpenEdit?: (tpl: OzipzTemplate) => void;
  onDelete?: (id: string) => void;
  onDeleteEmptyImports?: (ids: string[]) => Promise<void>;
  onUse?: (tpl: OzipzTemplate) => void;
}

export function TemplatesSection(props: TemplatesSectionProps) {
  const templatesStore = useTemplates();
  const { programs } = usePrograms();
  const { materials } = useMaterials();
  const { dictionaryItems } = useDictionaries();
  const openModal = useModalStore((s) => s.openModal);
  const navigate = useNavigate();

  const templates = props.templates ?? templatesStore.templates;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("template"));
  const onOpenEdit = props.onOpenEdit ?? ((tpl: OzipzTemplate) => openModal("template", { item: tpl }));
  const onUse = props.onUse ?? ((tpl: OzipzTemplate) => navigate("/dzialania/nowe", { state: { templateId: tpl.id } }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await templatesStore.deleteTemplate(id);
        toast.success("Usunięto szablon");
      } catch {
        toast.error("Błąd podczas usuwania szablonu");
      }
    });
  // Jeden komunikat na całą operację — zwykłe onDelete pokazałoby osobny toast dla każdego rekordu.
  const onDeleteEmptyImports =
    props.onDeleteEmptyImports ??
    (async (ids: string[]) => {
      try {
        for (const id of ids) await templatesStore.deleteTemplate(id);
      } catch {
        throw new Error("Nie udało się usunąć wszystkich pustych rekordów. Spróbuj ponownie.");
      }
      toast.success(`Usunięto puste rekordy z importu (${ids.length})`);
    });

  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState("all");
  const [showEmptyImports, setShowEmptyImports] = useState(false);
  const [confirmEmptyDelete, setConfirmEmptyDelete] = useState(false);
  const emptyImportIds = useMemo(() => templates.filter(isEmptyImportedTemplate).map((t) => t.id), [templates]);
  const emptyImportCount = emptyImportIds.length;

  const rows = useMemo<TemplateListRow[]>(() => {
    const jrwaSymbols = dictionaryItems.filter((d) => d.dictType === "jrwaSymbol");
    return templates
      .filter((template) => showEmptyImports || !isEmptyImportedTemplate(template))
      .map((template) => {
        const content = resolveTemplateContent(template, programs);
        return { ...template, content, summary: describeTemplateContent(content, { programs, materials, jrwaSymbols }) };
      });
  }, [templates, showEmptyImports, programs, materials, dictionaryItems]);

  const availableForms = useMemo(
    () => [...new Set(rows.map((row) => row.actionType).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl")),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("pl");
    return rows.filter((row) => {
      if (formFilter !== "all" && row.actionType !== formFilter) return false;
      if (!q) return true;
      const { summary, content } = row;
      return [row.title, row.actionType, content.title, content.leadEducator, content.description,
        summary.classification, summary.audience, summary.materials]
        .some((text) => text.toLocaleLowerCase("pl").includes(q));
    });
  }, [rows, formFilter, search]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFormFilter("all");
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3 select-none">
        <TemplatesFilterBar
          search={search}
          onSearchChange={setSearch}
          formFilter={formFilter}
          onFormFilterChange={setFormFilter}
          availableForms={availableForms}
          onOpenAdd={onOpenAdd}
        />

        {emptyImportCount > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            Puste rekordy z importu: {emptyImportCount}
            <button type="button" className="underline-offset-2 hover:underline" onClick={() => setShowEmptyImports((shown) => !shown)}>
              {showEmptyImports ? "Ukryj" : "Pokaż"}
            </button>
            <button type="button" className="text-destructive underline-offset-2 hover:underline" onClick={() => setConfirmEmptyDelete(true)}>
              Usuń puste rekordy
            </button>
          </p>
        )}

        <TemplatesTableView
          templates={filteredRows}
          totalCount={rows.length}
          onUse={onUse}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
          onClearFilters={handleClearFilters}
          isFiltered={!!search.trim() || formFilter !== "all"}
        />

        <ConfirmDialog
          isOpen={confirmEmptyDelete}
          onClose={() => setConfirmEmptyDelete(false)}
          onConfirm={async () => {
            await onDeleteEmptyImports(emptyImportIds);
            setShowEmptyImports(false);
          }}
          title="Usunąć puste rekordy z importu?"
          description={`Zostanie usuniętych ${emptyImportCount} szablonów „Szablon zadania” bez opisu, materiałów i ustawień. Szablony z treścią pozostają bez zmian.`}
          confirmText="Usuń puste rekordy"
        />
      </div>
    </TooltipProvider>
  );
}
