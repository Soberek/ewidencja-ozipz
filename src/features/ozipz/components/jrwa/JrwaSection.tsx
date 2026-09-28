import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { OzipzJrwaCase, OzipzDictionaryItem, OzipzStaff, OzipzAction } from "../../types/ozipz.types";
import { useJrwa, useDictionaries, useStaff, useActions } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { JrwaCaseDetailsDialog } from "./JrwaCaseDetailsDialog";
import { JrwaStatsHeader } from "./components/JrwaStatsHeader";
import { JrwaCasesFilterBar } from "./components/JrwaCasesFilterBar";
import { JrwaKnowledgeGuide } from "./components/JrwaKnowledgeGuide";
import { JrwaCasesTable } from "./components/JrwaCasesTable";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface JrwaSectionProps {
  cases?: OzipzJrwaCase[];
  dictionaryItems?: OzipzDictionaryItem[];
  staff?: OzipzStaff[];
  actions?: OzipzAction[];
  onOpenAdd?: () => void;
  onOpenEdit?: (item: OzipzJrwaCase) => void;
  onDelete?: (id: string) => Promise<void> | void;
  onUpdate?: (id: string, updates: Partial<OzipzJrwaCase>) => Promise<void>;
}

export function JrwaSection(props: JrwaSectionProps) {
  const jrwaStore = useJrwa();
  const dictStore = useDictionaries();
  const staffStore = useStaff();
  const actionsStore = useActions();
  const openModal = useModalStore((s) => s.openModal);

  const cases = props.cases ?? jrwaStore.jrwaCases;
  const dictionaryItems = props.dictionaryItems ?? dictStore.dictionaryItems;
  const staff = props.staff ?? staffStore.staff;
  const actions = props.actions ?? actionsStore.actions;

  const onOpenAdd = props.onOpenAdd ?? (() => openModal("jrwa"));
  const onOpenEdit = props.onOpenEdit ?? ((item: OzipzJrwaCase) => openModal("jrwa", { item }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await jrwaStore.deleteJrwaCase(id);
        toast.success("Usunięto sprawę JRWA");
      } catch {
        toast.error("Błąd podczas usuwania sprawy");
      }
    });

  const onUpdate =
    props.onUpdate ??
    (async (id: string, updates: Partial<OzipzJrwaCase>) => {
      try {
        await jrwaStore.updateJrwaCase(id, updates);
        toast.success("Zaktualizowano sprawę JRWA");
      } catch {
        toast.error("Błąd podczas aktualizacji sprawy");
      }
    });

  const currentYear = new Date().getFullYear();

  const [search, setSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEducator, setSelectedEducator] = useState<string>("all");
  const [requiresEzdFilter, setRequiresEzdFilter] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const { isKpiVisible: showKpiSummary, toggleKpi: handleToggleKpi } = useKpiVisibility("jrwa");

  // Podgląd szczegółów / metryki sprawy
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<OzipzJrwaCase | null>(null);

  const handleCopySign = useCallback((id: string, sign: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(sign);
    }
    setCopiedId(id);
    toast.success(`Skopiowano znak: ${sign}`);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Słownik symboli JRWA
  const jrwaDictItems = useMemo(() => {
    return dictionaryItems.filter(
      (d) => d.dictType === "jrwaSymbol" || d.dictType === "jrwa"
    );
  }, [dictionaryItems]);

  // Dostępne lata w bazie
  const availableYears = useMemo(() => {
    const years = new Set(cases.map((c) => Number(c.year) || currentYear));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [cases, currentYear]);

  // Dynamiczne powiązanie spraw ze statusem EZD na podstawie działań
  const caseEzdStatusMap = useMemo(() => {
    const map = new Map<string, { total: number; pendingEzd: number }>();
    cases.forEach((c) => {
      const related = actions.filter(
        (a) => a.jrwaCaseId === c.id || (Boolean(c.fullCaseSign) && a.jrwaSign === c.fullCaseSign)
      );
      const pending = related.filter(
        (a) => a.ezdStatus === "do_ezd" || (!a.ezdStatus && a.actionType !== "Publikacja media")
      ).length;
      map.set(c.id, { total: related.length, pendingEzd: pending });
    });
    return map;
  }, [cases, actions]);

  // Statystyki KPI
  const stats = useMemo(() => {
    const total = cases.length;
    const inProgress = cases.filter(
      (c) => c.status !== "zakonczona" && c.status !== "zarchiwizowana"
    ).length;
    const completed = cases.filter((c) => c.status === "zakonczona").length;
    const distinctSymbols = new Set(cases.map((c) => c.jrwaSymbol)).size;

    return {
      total,
      inProgress,
      completed,
      distinctSymbols,
    };
  }, [cases]);

  // Filtrowane sprawy
  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        if (requiresEzdFilter) {
          const ezdInfo = caseEzdStatusMap.get(c.id);
          if (!ezdInfo || ezdInfo.pendingEzd <= 0) return false;
        }
        if (selectedSymbol !== "all" && c.jrwaSymbol !== selectedSymbol) return false;
        if (selectedYear !== "all" && String(c.year) !== selectedYear) return false;
        if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
        if (selectedEducator !== "all" && c.assignedEducator !== selectedEducator) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const mSign = (c.fullCaseSign || "").toLowerCase().includes(q);
          const mTitle = (c.title || "").toLowerCase().includes(q);
          const mNotes = (c.notes || "").toLowerCase().includes(q);
          const mSym = (c.jrwaSymbol || "").toLowerCase().includes(q);
          const mEdu = (c.assignedEducator || "").toLowerCase().includes(q);
          if (!mSign && !mTitle && !mNotes && !mSym && !mEdu) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (b.year !== a.year) return (b.year || 0) - (a.year || 0);
        return (b.caseNumber || 0) - (a.caseNumber || 0);
      });
  }, [cases, selectedSymbol, selectedYear, selectedStatus, selectedEducator, search, requiresEzdFilter, caseEzdStatusMap]);

  const activeQuickFilter = useMemo(() => {
    if (selectedStatus === "w_toku") return "w_toku";
    if (selectedStatus === "zakonczona") return "zakonczona";
    if (selectedStatus === "all") return "all";
    return "";
  }, [selectedStatus]);

  const handleQuickFilterChange = useCallback((filter: string) => {
    if (filter === "all") {
      setSelectedStatus("all");
    } else {
      setSelectedStatus(filter);
    }
  }, []);

  const handleToggleRequiresEzd = useCallback(() => {
    setRequiresEzdFilter((prev) => !prev);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedSymbol !== "all") count++;
    if (selectedYear !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedEducator !== "all") count++;
    if (requiresEzdFilter) count++;
    return count;
  }, [search, selectedSymbol, selectedYear, selectedStatus, selectedEducator, requiresEzdFilter]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedSymbol("all");
    setSelectedYear("all");
    setSelectedStatus("all");
    setSelectedEducator("all");
    setRequiresEzdFilter(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* KPI Stats Header (zwijany) */}
      {showKpiSummary && (
        <JrwaStatsHeader
          totalCases={stats.total}
          inProgressCases={stats.inProgress}
          completedCases={stats.completed}
          distinctSymbolsCount={stats.distinctSymbols}
        />
      )}

      {/* Pasek filtrów i wyszukiwania */}
      <JrwaCasesFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedSymbol={selectedSymbol}
        onSymbolChange={setSelectedSymbol}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedEducator={selectedEducator}
        onEducatorChange={setSelectedEducator}
        availableYears={availableYears}
        jrwaDictItems={jrwaDictItems}
        staff={staff}
        isGuideOpen={isGuideOpen}
        onToggleGuide={() => setIsGuideOpen((p) => !p)}
        onOpenAdd={onOpenAdd}
        onClearFilters={handleClearFilters}
        activeFiltersCount={activeFiltersCount}
        activeQuickFilter={activeQuickFilter}
        onQuickFilterChange={handleQuickFilterChange}
        requiresEzdFilter={requiresEzdFilter}
        onToggleRequiresEzd={handleToggleRequiresEzd}
        isKpiVisible={showKpiSummary}
        onToggleKpi={handleToggleKpi}
      />

      {/* Wykaz klasyfikacyjny JRWA (rozwijany przewodnik) */}
      {isGuideOpen && <JrwaKnowledgeGuide />}

      {/* Tabela spraw JRWA */}
      <JrwaCasesTable
        cases={filteredCases}
        copiedId={copiedId}
        onCopySign={handleCopySign}
        onOpenDetails={(item) => setSelectedCaseForDetails(item)}
        onEdit={onOpenEdit}
        onDelete={onDelete}
        onOpenAdd={onOpenAdd}
        onClearFilters={handleClearFilters}
        isFiltered={activeFiltersCount > 0}
        ezdStatusMap={caseEzdStatusMap}
      />

      {/* Modal Szczegółów / Metryki Sprawy */}
      {selectedCaseForDetails && (
        <JrwaCaseDetailsDialog
          isOpen={!!selectedCaseForDetails}
          onClose={() => setSelectedCaseForDetails(null)}
          jrwaCase={selectedCaseForDetails}
          onEdit={(item) => {
            setSelectedCaseForDetails(null);
            onOpenEdit(item);
          }}
          onToggleStatus={async (id, newStatus) => {
            await onUpdate(id, { status: newStatus });
            if (selectedCaseForDetails && selectedCaseForDetails.id === id) {
              setSelectedCaseForDetails({
                ...selectedCaseForDetails,
                status: newStatus,
              });
            }
          }}
          actions={actions}
        />
      )}
    </div>
  );
}

export default JrwaSection;
