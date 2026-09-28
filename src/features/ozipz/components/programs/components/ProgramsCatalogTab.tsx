import { useState, useMemo, useCallback } from "react";
import { Sparkles, Bookmark, Edit, Trash2, CheckCircle2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzProgram } from "../../../types/ozipz.types";
import { getProgramJrwaSymbol } from "../../../utils/programJrwaUtils";
import { RowActionButton } from "@/components/ui/row-action-button";

const PROGRAM_STATUS_LABELS: Record<string, string> = {
  zakonczony: "Zakończony",
  zawieszony: "Zawieszony",
  archiwalny: "Archiwalny",
};

export interface ProgramsCatalogTabProps {
  programs: OzipzProgram[];
  onOpenAdd: () => void;
  onEdit: (program: OzipzProgram) => void;
  onDelete: (id: string) => void;
  onOpenAddParticipation?: (programId: string) => void;
}

export function ProgramsCatalogTab({
  programs,
  onOpenAdd,
  onEdit,
  onDelete,
  onOpenAddParticipation,
}: ProgramsCatalogTabProps) {
  const [search, setSearch] = useState("");

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const mName = (p.name || "").toLowerCase().includes(q);
        const mCode = (p.code || "").toLowerCase().includes(q);
        const mDesc = (p.description || "").toLowerCase().includes(q);
        const mJrwa = (p.jrwaSymbol || "").toLowerCase().includes(q);
        if (!mName && !mCode && !mDesc && !mJrwa) return false;
      }
      return true;
    }).sort((a, b) => (a.name || "").localeCompare(b.name || "", "pl"));
  }, [programs, search]);

  const isFiltered = !!search.trim();

  const handleClearFilters = useCallback(() => {
    setSearch("");
  }, []);

  const columns = useMemo<ColumnDef<OzipzProgram>[]>(() => {
    return [
      {
        id: "name",
        header: "Nazwa Programu",
        accessorKey: "name",
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[200px] max-w-[340px]">
            <div className="flex flex-wrap items-center gap-1">
              <span
                className="font-semibold text-xs text-foreground line-clamp-2 break-words leading-tight"
                title={row.name}
              >
                {row.name}
              </span>
              {row.code && (
                <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                  ({row.code})
                </span>
              )}
            </div>
            {row.description && (
              <p
                className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 break-words"
                title={row.description}
              >
                {row.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "jrwaSymbol",
        header: "Symbol JRWA",
        accessorKey: "jrwaSymbol",
        sortable: true,
        cell: ({ row }) => {
          const jrwa = row.jrwaSymbol || getProgramJrwaSymbol(row);
          return jrwa ? (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-800 border-blue-200 font-mono text-[11px] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
            >
              <Bookmark className="size-3 mr-1 inline text-blue-600" />
              {jrwa}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          );
        },
      },
      {
        id: "targetAudience",
        header: "Grupa Docelowa / Odbiorcy",
        accessorKey: "targetAudience",
        cell: ({ row }) => (
          <span className="text-xs text-foreground">
            {row.targetAudience || "Dzieci i młodzież szkolna"}
          </span>
        ),
      },
      {
        id: "editionYear",
        header: "Edycja / Rok",
        accessorKey: "editionYear",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.editionYear || "Bieżąca"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.status !== "aktywny" ? (
            <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">
              {PROGRAM_STATUS_LABELS[row.status] || row.status || "Nieznany"}
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-semibold flex items-center gap-1 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Aktywny
            </Badge>
          ),
      },
      {
        id: "actions",
        header: "Akcje",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {onOpenAddParticipation && (
              <RowActionButton
                label={`Dodaj zgłoszenie do programu ${row.name}`}
                icon={UserPlus}
                onClick={() => onOpenAddParticipation(row.id)}
              />
            )}
            <RowActionButton
              label="Edytuj program"
              icon={Edit}
              onClick={() => onEdit(row)}
            />

            <RowActionButton
              label="Usuń program"
              icon={Trash2}
              onClick={() => onDelete(row.id)}
              tone="destructive"
            />
          </div>
        ),
      },
    ];
  }, [onEdit, onDelete, onOpenAddParticipation]);

  return (
    <div className="space-y-3">
      <FilterBar>
        <SearchInput value={search} onValueChange={setSearch} placeholder="Szukaj programu po nazwie, symbolu JRWA..." />
        {isFiltered && filteredPrograms.length > 0 && <ClearFiltersButton onClick={handleClearFilters} />}
      </FilterBar>

      {/* Tabela programów */}
      {filteredPrograms.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={isFiltered ? "Brak pasujących programów" : "Katalog programów jest pusty"}
          description={
            isFiltered
              ? "Żaden program edukacyjny nie spełnia wprowadzonych kryteriów wyszukiwania."
              : "W bazie nie ma jeszcze zarejestrowanych programów profilaktycznych GIS/MZ."
          }
          actionLabel={isFiltered ? undefined : "Dodaj pierwszy program"}
          onAction={isFiltered ? undefined : onOpenAdd}
          secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
          onSecondaryAction={isFiltered ? handleClearFilters : undefined}
          className="my-4"
        />
      ) : (
        <TooltipProvider delayDuration={150}>
          <DataTable
            data={filteredPrograms}
            columns={columns}
            keyExtractor={(item) => item.id}
            enablePagination
            defaultPageSize={25}
            pageSizeOptions={[15, 25, 50, 100]}
            enableExport={true}
            exportFileName="programy_profilaktyczne.csv"
            onRowClick={(row) => onEdit(row)}
            rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
          />
        </TooltipProvider>
      )}
    </div>
  );
}
