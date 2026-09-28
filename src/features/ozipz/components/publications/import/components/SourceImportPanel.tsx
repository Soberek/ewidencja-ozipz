import { useCallback, useMemo, type ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePublications } from "../../../../store/useOzipzDbStore";
import { useModalStore } from "../../../../store/useModalStore";
import { buildLinkOperation } from "../importExecution";
import type { EvaluatedRow } from "../importRows";
import type { SourceImportState } from "../useSourceImport";
import { ImportActionBar } from "./ImportActionBar";
import { ImportRowCard } from "./ImportRowCard";
import { ImportStatusFilter } from "./ImportStatusFilter";

interface SourceImportPanelProps {
  state: SourceImportState;
  header: ReactNode;
  isLoading: boolean;
  error: string | null;
  loadingLabel: string;
  /** Dodatkowa treść pod listą (np. „wczytaj starsze”). */
  footer?: ReactNode;
}

export function SourceImportPanel({ state, header, isLoading, error, loadingLabel, footer }: SourceImportPanelProps) {
  const openModal = useModalStore((s) => s.openModal);
  const publications = usePublications().publications;
  const { rows, visibleRows, counts, actions } = state;

  const linkable = useMemo(
    () => new Set(visibleRows.filter((r) => r.match && buildLinkOperation(r, actions)).map((r) => r.key)),
    [visibleRows, actions]
  );

  const openMatch = useCallback(
    (row: EvaluatedRow) => {
      const entry = row.match?.entry;
      if (!entry) return;
      const publication = entry.publicationId ? publications.find((p) => p.id === entry.publicationId) : undefined;
      if (publication) return openModal("publication", { item: publication });
      const action = actions.find((a) => a.id === entry.actionId);
      if (action) openModal("action", { item: action });
    },
    [publications, actions, openModal]
  );

  const selectableVisible = visibleRows.filter((r) => r.selectable);
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every((r) => r.selected);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {header}

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-[3px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ImportStatusFilter
          value={state.statusFilter}
          onChange={state.setStatusFilter}
          counts={counts}
          total={rows.length}
          search={state.search}
          onSearchChange={state.setSearch}
          showExternal={state.source === "gov"}
        />

        <Card className="overflow-hidden border-border/80 shadow-none">
          <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              disabled={selectableVisible.length === 0}
              onChange={() => state.selectVisible(!allVisibleSelected)}
              aria-label="Zaznacz wszystkie widoczne pozycje do importu"
              className="size-4 cursor-pointer rounded accent-primary disabled:cursor-not-allowed disabled:opacity-40"
            />
            <span className="hidden w-[150px] lg:block">Data</span>
            <span className="flex-1">Publikacja i stan w systemie</span>
            <span className="hidden w-[260px] lg:block">Program / tematyka</span>
          </div>

          {visibleRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-xs text-muted-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <span>{loadingLabel}</span>
                </>
              ) : (
                <>
                  <Inbox className="size-6 text-muted-foreground/60" />
                  <span className="font-semibold text-foreground">
                    {rows.length === 0 ? "Brak pobranych pozycji" : "Nic do pokazania w tym filtrze"}
                  </span>
                  <span>
                    {rows.length === 0
                      ? "Pobierz publikacje przyciskiem powyżej."
                      : state.statusFilter === "todo"
                        ? "Wszystkie pobrane pozycje są już w systemie, pominięte albo należą do innych jednostek. Wczytaj starsze wpisy lub zmień filtr."
                        : "Zmień filtr statusu lub wyszukiwaną frazę."}
                  </span>
                </>
              )}
            </div>
          ) : (
            <ul aria-busy={isLoading}>
              {visibleRows.map((row) => (
                <ImportRowCard
                  key={row.key}
                  row={row}
                  programs={state.programs}
                  canLink={linkable.has(row.key)}
                  onToggle={state.toggleRow}
                  onUpdate={state.updateRow}
                  onProgram={state.selectProgram}
                  onSkip={state.setSkippedKeys}
                  onLink={state.linkToExisting}
                  onOpenMatch={openMatch}
                />
              ))}
            </ul>
          )}
          {footer}
        </Card>

        <ImportActionBar
          selectedCount={state.selectedRows.length}
          author={state.author}
          onAuthorChange={state.setAuthor}
          staff={state.staff}
          isSaving={state.isSaving}
          onSkipSelected={state.skipSelected}
          onImport={state.importSelected}
        />
      </div>
    </TooltipProvider>
  );
}
