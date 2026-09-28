import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Search } from "lucide-react";
import type { OzipzDictionaryItem } from "../../types/ozipz.types";
import { DICTIONARY_CATEGORIES_CONFIG } from "../../constants";
import { useDictionaries } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getDictionaryUsageModules,
  isHiddenDictionaryItem,
  isUsageTracked,
  normalizeDictionaryValue,
} from "../../utils/dictionaryUsage";
import { DictionariesStatsHeader } from "./components/DictionariesStatsHeader";
import { DictionariesCategoryTabs } from "./components/DictionariesCategoryTabs";
import { DictionariesFilterBar, type DictionaryUsageFilter } from "./components/DictionariesFilterBar";
import { DictionariesTableView } from "./components/DictionariesTableView";
import { getCategoryDef, isJrwaCategory } from "./dictionaryCategoryMeta";
import { useDictionaryUsageIndex } from "./useDictionaryUsageIndex";

export interface DictionariesSectionProps {
  dictionaryItems?: OzipzDictionaryItem[];
  defaultCategory?: string;
  onOpenAdd?: (defaultCategory?: string) => void;
  onOpenEdit?: (item: OzipzDictionaryItem) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_PARAM = "kategoria";

function matchesSearch(item: OzipzDictionaryItem, query: string): boolean {
  if (!query) return true;
  return [item.code, item.label, item.description, item.postalCode].some((v) =>
    normalizeDictionaryValue(v).includes(query)
  );
}

export function DictionariesSection(props: DictionariesSectionProps) {
  const dictStore = useDictionaries();
  const openModal = useModalStore((s) => s.openModal);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLDivElement>(null);

  const { defaultCategory } = props;

  const rawDictionaryItems = props.dictionaryItems ?? dictStore.dictionaryItems;
  const dictionaryItems = useMemo(
    () => rawDictionaryItems.filter((d) => !isHiddenDictionaryItem(d)),
    [rawDictionaryItems]
  );

  const usageIndex = useDictionaryUsageIndex(dictionaryItems);

  // --- Kategoria: z URL (?kategoria=) lub z propsów ---------------------------------
  const fallbackCategory = defaultCategory && defaultCategory !== "all" ? defaultCategory : "activityType";
  const urlCategory = searchParams.get(CATEGORY_PARAM);
  const selectedCategory = urlCategory || fallbackCategory;

  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<DictionaryUsageFilter>("all");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OzipzDictionaryItem | null>(null);

  const setSelectedCategory = useCallback(
    (category: string) => {
      setKindFilter("all");
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(CATEGORY_PARAM, category);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Skrót "/" — przejście do wyszukiwarki
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const input = searchInputRef.current?.querySelector("input");
      if (input) {
        e.preventDefault();
        input.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --- Akcje ---------------------------------------------------------------------
  const onOpenAdd =
    props.onOpenAdd ??
    ((defCategory?: string) => openModal("dictionary", { category: defCategory || defaultCategory }));
  const onOpenEdit = props.onOpenEdit ?? ((item: OzipzDictionaryItem) => openModal("dictionary", { item }));

  const performDelete = useCallback(
    async (id: string) => {
      if (props.onDelete) {
        props.onDelete(id);
        return;
      }
      try {
        await dictStore.deleteDictionaryItem(id);
        toast.success("Usunięto pozycję słownikową");
      } catch {
        toast.error("Błąd podczas usuwania pozycji słownikowej");
      }
    },
    [props, dictStore]
  );

  const requestDelete = useCallback(
    (id: string) => {
      const item = dictionaryItems.find((d) => d.id === id);
      if (item) setPendingDelete(item);
    },
    [dictionaryItems]
  );

  const handleDuplicate = useCallback(
    (item: OzipzDictionaryItem) => {
      openModal("dictionary", {
        category: item.dictType,
        initialValues: {
          dictType: item.dictType,
          label: `${item.label} (kopia)`,
          code: "",
          description: item.description,
          postalCode: item.postalCode,
          kind: item.kind,
          gisCategory: item.gisCategory,
          isSystem: false,
        },
      });
    },
    [openModal]
  );

  const handleCopyCode = useCallback((id: string, code: string) => {
    void navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopiedCodeId(id);
    toast.success(`Skopiowano kod: ${code}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  }, []);

  // --- Dane pochodne -------------------------------------------------------------
  const customCategories = useMemo(() => {
    const known = new Set(Object.keys(DICTIONARY_CATEGORIES_CONFIG));
    return [...new Set(dictionaryItems.map((d) => d.dictType))].filter((t) => !known.has(t)).sort();
  }, [dictionaryItems]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: dictionaryItems.length };
    for (const d of dictionaryItems) counts[d.dictType] = (counts[d.dictType] || 0) + 1;
    return counts;
  }, [dictionaryItems]);

  const currentCategoryItems = useMemo(
    () => (selectedCategory === "all" ? dictionaryItems : dictionaryItems.filter((d) => d.dictType === selectedCategory)),
    [dictionaryItems, selectedCategory]
  );

  const usageTracked = selectedCategory === "all" ? true : isUsageTracked(selectedCategory);

  const categoryStats = useMemo(() => {
    const total = currentCategoryItems.length;
    const systemCount = currentCategoryItems.filter((d) => d.isSystem).length;
    let usedCount = 0;
    let referencesCount = 0;
    for (const d of currentCategoryItems) {
      const usage = usageIndex.get(d.id);
      if (usage?.total) {
        usedCount += 1;
        referencesCount += usage.total;
      }
    }
    const trackedTotal = currentCategoryItems.filter((d) => isUsageTracked(d.dictType)).length;
    return {
      total,
      systemCount,
      userCount: total - systemCount,
      usedCount: usageTracked ? usedCount + (total - trackedTotal) : undefined,
      referencesCount: usageTracked ? referencesCount : undefined,
    };
  }, [currentCategoryItems, usageIndex, usageTracked]);

  const query = normalizeDictionaryValue(search);

  const filteredItems = useMemo(
    () =>
      currentCategoryItems.filter((item) => {
        if (systemFilter === "system" && !item.isSystem) return false;
        if (systemFilter === "user" && item.isSystem) return false;
        if (kindFilter !== "all" && item.kind !== kindFilter) return false;
        if (usageFilter !== "all" && isUsageTracked(item.dictType)) {
          const used = !!usageIndex.get(item.id)?.total;
          if (usageFilter === "used" ? !used : used) return false;
        }
        return matchesSearch(item, query);
      }),
    [currentCategoryItems, systemFilter, kindFilter, usageFilter, usageIndex, query]
  );

  // Trafienia w innych kategoriach — podpowiedź, gdy szukana pozycja jest gdzie indziej
  const otherCategoryHits = useMemo(() => {
    if (!query || selectedCategory === "all") return [];
    const hits = new Map<string, number>();
    for (const d of dictionaryItems) {
      if (d.dictType !== selectedCategory && matchesSearch(d, query)) {
        hits.set(d.dictType, (hits.get(d.dictType) || 0) + 1);
      }
    }
    return [...hits.entries()].sort((a, b) => b[1] - a[1]);
  }, [dictionaryItems, query, selectedCategory]);

  const activeCategoryDef =
    selectedCategory === "all"
      ? {
          label: "Wszystkie kategorie",
          shortLabel: "Wszystkie",
          description: "Przegląd wszystkich pozycji słownikowych wykorzystywanych w formularzach, raportach i rejestrach OZiPZ.",
        }
      : getCategoryDef(selectedCategory);

  const usageModules = selectedCategory === "all" ? [] : getDictionaryUsageModules(selectedCategory);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSystemFilter("all");
    setKindFilter("all");
    setUsageFilter("all");
  }, []);

  const isFiltered = !!query || systemFilter !== "all" || kindFilter !== "all" || usageFilter !== "all";
  const showKindFilter =
    isJrwaCategory(selectedCategory) || (selectedCategory === "all" && currentCategoryItems.some((d) => d.kind));
  const addCategory = selectedCategory !== "all" ? selectedCategory : undefined;

  const pendingUsage = pendingDelete ? usageIndex.get(pendingDelete.id) : undefined;

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-[3px] border border-border bg-card p-2 lg:sticky lg:top-4">
          <DictionariesCategoryTabs
            categories={Object.values(DICTIONARY_CATEGORIES_CONFIG)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            customCategories={customCategories}
          />
        </aside>

        <div className="min-w-0 space-y-3">
          <DictionariesStatsHeader
            categoryKey={selectedCategory}
            categoryLabel={activeCategoryDef.label}
            categoryDescription={activeCategoryDef.description}
            totalCount={categoryStats.total}
            systemCount={categoryStats.systemCount}
            userCount={categoryStats.userCount}
            usedCount={categoryStats.usedCount}
            referencesCount={categoryStats.referencesCount}
            usageModules={usageModules}
            onShowUnused={() => setUsageFilter("unused")}
          />

          <div ref={searchInputRef}>
            <DictionariesFilterBar
              search={search}
              onSearchChange={setSearch}
              systemFilter={systemFilter}
              onSystemFilterChange={setSystemFilter}
              kindFilter={kindFilter}
              onKindFilterChange={setKindFilter}
              usageFilter={usageFilter}
              onUsageFilterChange={usageTracked ? setUsageFilter : undefined}
              showKindFilter={showKindFilter}
              totalFilteredCount={categoryStats.total}
              systemCount={categoryStats.systemCount}
              userCount={categoryStats.userCount}
              activeCategory={selectedCategory}
              activeCategoryLabel={activeCategoryDef.shortLabel}
              onOpenAdd={() => onOpenAdd(addCategory)}
              onClearFilters={handleClearFilters}
            />
          </div>

          {otherCategoryHits.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-[3px] border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              <Search className="size-3.5" />
              <span>„{search.trim()}” występuje także w:</span>
              {otherCategoryHits.map(([cat, count]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-[2px] border border-border bg-background px-1.5 py-px font-medium text-foreground hover:bg-muted cursor-pointer"
                >
                  {getCategoryDef(cat).label} <span className="font-mono text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          )}

          <DictionariesTableView
            key={selectedCategory}
            items={filteredItems}
            copiedCodeId={copiedCodeId}
            onCopyCode={handleCopyCode}
            onEdit={onOpenEdit}
            onDelete={requestDelete}
            onDuplicate={props.onOpenAdd ? undefined : handleDuplicate}
            onOpenAdd={() => onOpenAdd(addCategory)}
            onClearFilters={handleClearFilters}
            isFiltered={isFiltered}
            usageIndex={usageIndex}
            showUsageColumn={usageTracked}
            showCategoryColumn={selectedCategory === "all"}
            showClassificationColumn={isJrwaCategory(selectedCategory) || undefined}
            defaultSortField={isJrwaCategory(selectedCategory) ? "code" : "label"}
            exportFileName={`slownik_${selectedCategory}.csv`}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => (pendingDelete ? performDelete(pendingDelete.id) : undefined)}
        title="Usunąć pozycję słownikową?"
        confirmText="Usuń pozycję"
        variant="destructive"
        description={
          pendingDelete && (
            <span className="block space-y-2">
              <span className="block">
                Pozycja <strong className="text-foreground">{pendingDelete.label}</strong>{" "}
                <span className="font-mono">({pendingDelete.code})</span> zostanie trwale usunięta ze słownika „
                {getCategoryDef(pendingDelete.dictType).label}”.
              </span>
              {pendingUsage && pendingUsage.total > 0 && (
                <span className="flex gap-2 rounded-[3px] border border-amber-300 bg-amber-50 p-2 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span className="block">
                    <span className="block font-semibold">Pozycja jest używana w {pendingUsage.total} rekordach:</span>
                    <span className="block">{pendingUsage.byModule.map((m) => `${m.module} (${m.count})`).join(", ")}.</span>
                    <span className="mt-1 block">
                      Rekordy zachowają zapisaną wartość, ale nie będzie jej można wybrać w formularzach.
                    </span>
                  </span>
                </span>
              )}
            </span>
          )
        }
      />
    </div>
  );
}

export default DictionariesSection;
