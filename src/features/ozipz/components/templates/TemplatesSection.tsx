import { useState, useMemo, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzTemplate } from "../../types/ozipz.types";
import { useTemplates } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { toast } from "sonner";
import { TemplatesStatsHeader } from "./components/TemplatesStatsHeader";
import { TemplatesFilterBar } from "./components/TemplatesFilterBar";
import { TemplatesTableView } from "./components/TemplatesTableView";
import { TemplatePreviewDialog } from "./components/TemplatePreviewDialog";
import { isEmptyImportedTemplate } from "../../utils/templateUtils";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface TemplatesSectionProps {
  templates?: OzipzTemplate[];
  onOpenAdd?: () => void;
  onOpenEdit?: (tpl: OzipzTemplate) => void;
  onDelete?: (id: string) => void;
}

export function TemplatesSection(props: TemplatesSectionProps) {
  const templatesStore = useTemplates();
  const openModal = useModalStore((s) => s.openModal);

  const templates = props.templates ?? templatesStore.templates;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("template"));
  const onOpenEdit = props.onOpenEdit ?? ((tpl: OzipzTemplate) => openModal("template", { item: tpl }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await templatesStore.deleteTemplate(id);
        toast.success("Usunięto szablon opisu");
      } catch {
        toast.error("Błąd podczas usuwania szablonu");
      }
    });

  const [search, setSearch] = useState("");
  const [formFilter, setFormFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OzipzTemplate | null>(null);
  const [showEmptyImports, setShowEmptyImports] = useState(false);
  const emptyImportCount = useMemo(() => templates.filter(isEmptyImportedTemplate).length, [templates]);
  const visibleTemplates = useMemo(() => showEmptyImports ? templates : templates.filter((template) => !isEmptyImportedTemplate(template)), [templates, showEmptyImports]);

  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("templates");

  const handleCopy = useCallback(async (text: string, id: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Skopiowano opis szablonu");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Nie udało się skopiować opisu.");
    }
  }, []);

  const availableForms = useMemo(() => {
    const set = new Set<string>();
    visibleTemplates.forEach((t) => {
      if (t.actionType) set.add(t.actionType);
    });
    return Array.from(set).sort();
  }, [visibleTemplates]);

  const filteredTemplates = useMemo(() => {
    return visibleTemplates.filter((t) => {
      if (formFilter !== "all" && t.actionType !== formFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = (t.title || "").toLowerCase().includes(q);
        const mDesc = (t.descriptionTemplate || "").toLowerCase().includes(q);
        const mTopic = (t.topic || "").toLowerCase().includes(q);
        const mForm = (t.actionType || "").toLowerCase().includes(q);
        if (!mTitle && !mDesc && !mTopic && !mForm) return false;
      }
      return true;
    });
  }, [visibleTemplates, formFilter, search]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFormFilter("all");
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3 select-none">
        {showKpiSummary && <TemplatesStatsHeader templates={visibleTemplates} />}

        <TemplatesFilterBar
          search={search}
          onSearchChange={setSearch}
          formFilter={formFilter}
          onFormFilterChange={setFormFilter}
          availableForms={availableForms}
          isKpiVisible={showKpiSummary}
          onToggleKpi={toggleKpiSummary}
          onOpenAdd={onOpenAdd}
        />

        {emptyImportCount > 0 && (
          <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowEmptyImports((shown) => !shown)}>
            Puste rekordy z importu: {emptyImportCount} · {showEmptyImports ? "Ukryj" : "Pokaż"}
          </button>
        )}

        <TemplatesTableView
          templates={filteredTemplates}
          totalCount={visibleTemplates.length}
          copiedId={copiedId}
          onCopy={handleCopy}
          onPreview={setPreviewTemplate}
          onOpenEdit={onOpenEdit}
          onDelete={onDelete}
          onClearFilters={handleClearFilters}
          isFiltered={!!search.trim() || formFilter !== "all"}
        />

        <TemplatePreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      </div>
    </TooltipProvider>
  );
}
