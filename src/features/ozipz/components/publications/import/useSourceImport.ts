import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useActions, usePrograms, usePublications, useStaff } from "../../../store/useOzipzDbStore";
import { buildPublicationRegistry, linkKey } from "../matching/publicationMatcher";
import type { ImportSourceId, ScrapedPublication } from "../sources/importTypes";
import { DEFAULT_PUBLICATION_TOPIC } from "../sources/topicMatcher";
import {
  countByStatus,
  evaluateImportRows,
  mergeImportRows,
  type EvaluatedRow,
  type ImportRow,
  type ImportRowStatus,
} from "./importRows";
import { buildLinkOperation, importPublicationRows } from "./importExecution";

export type ImportStatusFilter = "todo" | "all" | ImportRowStatus;

const skippedStorageKey = (source: ImportSourceId) => `ozipz_${source}_skipped_publications`;
const LEGACY_SKIPPED_KEYS: Record<ImportSourceId, string> = {
  gov: "ozipz_gov_manual_imported_urls",
  x: "ozipz_x_manual_imported_urls",
};

function loadSkipped(source: ImportSourceId): Set<string> {
  const result = new Set<string>();
  try {
    for (const storageKey of [skippedStorageKey(source), LEGACY_SKIPPED_KEYS[source]]) {
      const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(parsed)) continue;
      // Poprzednia wersja zapisywała pełne adresy (gov.pl) albo same numery wpisów (X).
      parsed.forEach((v) => {
        const key = typeof v !== "string" ? null : /^\d{6,}$/.test(v) ? `x:${v}` : linkKey(v);
        if (key) result.add(key);
      });
    }
  } catch {
    // Brak dostępu do localStorage – lista pominiętych jest tylko wygodą.
  }
  return result;
}

function persistSkipped(source: ImportSourceId, keys: Set<string>) {
  try {
    localStorage.setItem(skippedStorageKey(source), JSON.stringify(Array.from(keys)));
    localStorage.removeItem(LEGACY_SKIPPED_KEYS[source]);
  } catch {
    // ignorujemy
  }
}

const matchesSearch = (row: EvaluatedRow, query: string) =>
  !query || [row.title, row.text, row.customTopic, row.url].some((v) => (v || "").toLowerCase().includes(query));

const matchesFilter = (row: EvaluatedRow, filter: ImportStatusFilter) =>
  filter === "all" ? true : filter === "todo" ? row.selectable : row.status === filter;

/** Wspólny stan i akcje ekranu importu publikacji (gov.pl i X). */
export function useSourceImport(source: ImportSourceId) {
  const publicationsStore = usePublications();
  const actionsStore = useActions();
  const programs = usePrograms().programs || [];
  const staff = useStaff().staff || [];

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [selection, setSelection] = useState<Map<string, boolean>>(new Map());
  const [skipped, setSkipped] = useState<Set<string>>(() => loadSkipped(source));
  const [statusFilter, setStatusFilter] = useState<ImportStatusFilter>("todo");
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  const registry = useMemo(
    () => buildPublicationRegistry(publicationsStore.publications, actionsStore.actions),
    [publicationsStore.publications, actionsStore.actions]
  );

  const evaluated = useMemo(
    () => evaluateImportRows(rows, registry, skipped, selection),
    [rows, registry, skipped, selection]
  );
  const counts = useMemo(() => countByStatus(evaluated), [evaluated]);
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return evaluated.filter((r) => matchesFilter(r, statusFilter) && matchesSearch(r, q));
  }, [evaluated, statusFilter, search]);
  const selectedRows = useMemo(() => evaluated.filter((r) => r.selected), [evaluated]);

  const addItems = useCallback((items: ScrapedPublication[], replace = false) => {
    setRows((prev) => mergeImportRows(replace ? [] : prev, items));
  }, []);

  const setSelected = useCallback((keys: string[], value: boolean) => {
    setSelection((prev) => {
      const next = new Map(prev);
      keys.forEach((k) => next.set(k, value));
      return next;
    });
  }, []);

  const toggleRow = useCallback((key: string, value: boolean) => setSelected([key], value), [setSelected]);

  const selectVisible = useCallback(
    (value: boolean) => setSelected(visibleRows.filter((r) => r.selectable).map((r) => r.key), value),
    [visibleRows, setSelected]
  );

  const updateRow = useCallback((key: string, patch: Partial<ImportRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const selectProgram = useCallback(
    (key: string, programId: string) => {
      const program = programs.find((p) => p.id === programId);
      setRows((prev) =>
        prev.map((r) => {
          if (r.key !== key) return r;
          return program
            ? { ...r, programId: program.id, programName: program.name, customTopic: program.name, customJrwa: program.jrwaSymbol || r.customJrwa }
            : { ...r, programId: undefined, programName: undefined, customTopic: r.customTopic || DEFAULT_PUBLICATION_TOPIC };
        })
      );
    },
    [programs]
  );

  const setSkippedKeys = useCallback(
    (keys: string[], value: boolean) => {
      setSkipped((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => (value ? next.add(k) : next.delete(k)));
        persistSkipped(source, next);
        return next;
      });
      setSelected(keys, false);
    },
    [source, setSelected]
  );

  const skipSelected = useCallback(() => {
    const keys = selectedRows.map((r) => r.key);
    if (!keys.length) return;
    setSkippedKeys(keys, true);
    toast.success(`Pominięto ${keys.length} ${keys.length === 1 ? "pozycję" : "pozycji"} – nie będą proponowane do importu`);
  }, [selectedRows, setSkippedKeys]);

  const linkToExisting = useCallback(
    async (key: string) => {
      const row = evaluated.find((r) => r.key === key);
      const operation = row && buildLinkOperation(row, actionsStore.actions);
      if (!row || !operation) {
        toast.error("Nie można powiązać tej pozycji z istniejącym wpisem");
        return;
      }
      try {
        if (operation.kind === "update-publication") {
          await publicationsStore.updatePublication(operation.publicationId, operation.patch);
        } else {
          await publicationsStore.addPublication(operation.publication);
        }
        toast.success("Powiązano z istniejącym wpisem – link zapisany w ewidencji publikacji");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Nie udało się zapisać powiązania");
      }
    },
    [evaluated, actionsStore.actions, publicationsStore]
  );

  const importSelected = useCallback(async () => {
    if (savingRef.current) return;
    const toImport = selectedRows.filter((r) => r.title.trim());
    if (toImport.length === 0) {
      toast.error(selectedRows.length ? "Uzupełnij tytuły zaznaczonych pozycji" : "Zaznacz co najmniej jedną pozycję do importu");
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    const imported: string[] = [];
    try {
      await importPublicationRows(toImport, author, programs, {
        addAction: actionsStore.addAction,
        deleteAction: actionsStore.deleteAction,
        addPublication: publicationsStore.addPublication,
      }, (key) => imported.push(key));
      toast.success(`Zaimportowano ${imported.length} ${imported.length === 1 ? "publikację" : "publikacji"} wraz z działaniami edukacyjnymi`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania publikacji";
      toast.error(imported.length ? `Zapisano ${imported.length}. Import kolejnych przerwany: ${msg}` : msg);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      if (imported.length) setSelected(imported, false);
    }
  }, [selectedRows, author, programs, actionsStore, publicationsStore, setSelected]);

  return {
    source,
    programs,
    staff,
    rows: evaluated,
    visibleRows,
    selectedRows,
    counts,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    author,
    setAuthor,
    isSaving,
    addItems,
    toggleRow,
    selectVisible,
    updateRow,
    selectProgram,
    setSkippedKeys,
    skipSelected,
    linkToExisting,
    importSelected,
    actions: actionsStore.actions,
  };
}

export type SourceImportState = ReturnType<typeof useSourceImport>;
