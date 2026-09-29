import { useCallback, useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, ResultsCount } from "@/components/ui/filter-bar";
import { NativeSelect } from "@/components/ui/native-select";
import { OzipzDbService } from "../../../../db/client";
import type { ChangeLogEntry } from "../../../../db/change-log";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { CHANGE_LOG_TABLE_LABELS, recordLabel, tableLabel } from "../../utils/changeLogPresentation";
import { ChangeLogRow } from "./ChangeLogRow";

type HistoryView = "trash" | "all";
const PAGE_SIZE = 200;

interface PendingRestore {
  entry: ChangeLogEntry;
  related: number;
}

export function HistorySection() {
  const [view, setView] = useState<HistoryView>("trash");
  const [tableName, setTableName] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [entries, setEntries] = useState<ChangeLogEntry[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [pending, setPending] = useState<PendingRestore | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await OzipzDbService.getChangeLog({
        tableName: tableName || undefined,
        operation: view === "trash" ? "DELETE" : undefined,
        onlyRestorable: view === "trash",
        limit,
      }));
    } catch (error) {
      setEntries([]);
      toast.error(error instanceof Error ? error.message : "Nie udało się wczytać historii zmian");
    }
  }, [view, tableName, limit]);

  useEffect(() => { void load(); }, [load]);

  const askRestore = async (entry: ChangeLogEntry) => {
    const group = entry.operation === "DELETE" ? await OzipzDbService.getRestoreGroup(entry.id).catch(() => [entry]) : [entry];
    setPending({ entry, related: Math.max(0, group.length - 1) });
  };

  const performRestore = async ({ entry }: PendingRestore) => {
    setIsBusy(true);
    try {
      const restored = await OzipzDbService.restoreChange(entry.id);
      toast.success(entry.operation === "DELETE"
        ? `Przywrócono „${recordLabel(entry)}”${restored > 1 ? ` i ${restored - 1} powiązanych rekordów` : ""}`
        : `Przywrócono poprzednią wersję „${recordLabel(entry)}”`);
      await useOzipzDbStore.getState().loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się przywrócić rekordu");
    } finally {
      setIsBusy(false);
      void load();
    }
  };

  return (
    <div className="space-y-3 select-none">
      <FilterBar
        actions={entries && <ResultsCount shown={entries.length} total={entries.length} label={view === "trash" ? "W koszu" : "Zmian"} />}
      >
        <div role="tablist" aria-label="Widok historii" className="inline-flex rounded-[3px] border border-border p-0.5">
          {([["trash", "Kosz", Trash2], ["all", "Wszystkie zmiany", History]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => { setView(id); setLimit(PAGE_SIZE); }}
              className={`flex h-7 items-center gap-1.5 rounded-[2px] px-2.5 text-xs font-semibold cursor-pointer ${view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <NativeSelect aria-label="Moduł" value={tableName} onChange={(event) => { setTableName(event.target.value); setLimit(PAGE_SIZE); }} containerClassName="w-52">
          <option value="">Wszystkie moduły</option>
          {Object.keys(CHANGE_LOG_TABLE_LABELS).map((name) => <option key={name} value={name}>{tableLabel(name)}</option>)}
        </NativeSelect>
      </FilterBar>

      <p className="text-xs text-muted-foreground">
        {view === "trash"
          ? "Usunięte rekordy z ostatnich dwóch lat. Przywrócenie odtwarza też rekordy usunięte razem z nimi (np. pozycje rozdzielnika) i odpięte powiązania."
          : "Każde dodanie, zmiana i usunięcie danych z autorem i godziną. Rozwiń wpis, aby zobaczyć, co dokładnie się zmieniło."}
      </p>

      {entries === null ? null : entries.length === 0 ? (
        <EmptyState
          icon={view === "trash" ? Trash2 : History}
          title={view === "trash" ? "Kosz jest pusty" : "Brak zapisanych zmian"}
          description={view === "trash" ? "Usunięte rekordy pojawią się tutaj i będzie można je przywrócić." : "Historia obejmuje zmiany wprowadzone od wersji 1.2 aplikacji."}
        />
      ) : (
        <>
          <ul className="divide-y divide-border rounded-[3px] border border-border bg-card">
            {entries.map((entry) => (
              <ChangeLogRow key={entry.id} entry={entry} isBusy={isBusy} onRestore={(item) => void askRestore(item)} />
            ))}
          </ul>
          {entries.length >= limit && (
            <Button size="sm" variant="outline" onClick={() => setLimit((value) => value + PAGE_SIZE)} className="text-xs">
              Pokaż starsze
            </Button>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() => {
          const current = pending;
          setPending(null);
          if (current) void performRestore(current);
        }}
        title={pending?.entry.operation === "DELETE" ? "Przywrócenie z kosza" : "Przywrócenie poprzedniej wersji"}
        description={pending
          ? pending.entry.operation === "DELETE"
            ? `Przywrócić „${recordLabel(pending.entry)}” (${tableLabel(pending.entry.tableName)})?${pending.related > 0 ? ` Razem z nim wrócą rekordy i powiązania usunięte w tej samej operacji (${pending.related}).` : ""}`
            : `Przywrócić wartości „${recordLabel(pending.entry)}” sprzed tej zmiany? Późniejsze zmiany tych pól zostaną zastąpione.`
          : ""}
        variant="warning"
        confirmText="Przywróć"
        cancelText="Anuluj"
      />
    </div>
  );
}
