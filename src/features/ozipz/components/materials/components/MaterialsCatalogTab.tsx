import { useState, useMemo, useCallback } from "react";
import { Package, BookOpen, Edit, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzMaterial, OzipzDictionaryItem } from "../../../types/ozipz.types";
import { RowActionButton } from "@/components/ui/row-action-button";

export interface MaterialsCatalogTabProps {
  materials: OzipzMaterial[];
  materialTypes: OzipzDictionaryItem[];
  onOpenAdd: () => void;
  onEdit: (material: OzipzMaterial) => void;
  onDelete: (id: string) => void;
  onOpenAddDistribution: (materialId?: string) => void;
}

export function MaterialsCatalogTab({
  materials,
  materialTypes,
  onOpenAdd,
  onEdit,
  onDelete,
  onOpenAddDistribution,
}: MaterialsCatalogTabProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedType !== "all" && m.materialType !== selectedType) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = (m.title || "").toLowerCase().includes(q);
        const mType = (m.materialType || "").toLowerCase().includes(q);
        const mPub = (m.publisher || "").toLowerCase().includes(q);
        const mTop = (m.topic || "").toLowerCase().includes(q);
        if (!mTitle && !mType && !mPub && !mTop) return false;
      }
      return true;
    }).sort((a, b) => (a.title || "").localeCompare(b.title || "", "pl"));
  }, [materials, selectedType, search]);

  const isFiltered = !!search.trim() || selectedType !== "all";

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedType("all");
  }, []);

  const columns = useMemo<ColumnDef<OzipzMaterial>[]>(() => {
    return [
      {
        id: "title",
        header: "Tytuł Materiału / Nazwa",
        accessorKey: "title",
        sortable: true,
        cell: ({ row }) => (
          <div className="min-w-[200px] max-w-[340px] space-y-0.5">
            <span
              className="font-semibold text-xs text-foreground line-clamp-2 break-words leading-tight"
              title={row.title}
            >
              {row.title}
            </span>
            {row.publisher && (
              <p
                className="text-[11px] text-muted-foreground mt-0.5 truncate"
                title={`Wydawca: ${row.publisher}`}
              >
                Wydawca: {row.publisher}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "materialType",
        header: "Typ Materiału",
        accessorKey: "materialType",
        sortable: true,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-muted/40 text-[11px] font-normal border-border"
          >
            <BookOpen className="size-3 mr-1 inline text-muted-foreground" />
            {row.materialType || "Inne"}
          </Badge>
        ),
      },
      {
        id: "topic",
        header: "Tematyka Zdrowotna",
        accessorKey: "topic",
        sortable: true,
        cell: ({ row }) => (
          <span className="text-xs text-foreground">
            {row.topic || "-"}
          </span>
        ),
      },
      {
        id: "targetAudience",
        header: "Grupa Docelowa",
        accessorKey: "targetAudience",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.targetAudience || "Ogół społeczeństwa"}
          </span>
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
            <RowActionButton
              label="Wystaw rozdzielnik"
              icon={Plus}
              onClick={() => onOpenAddDistribution(row.id)}
              tone="primary"
            />

            <RowActionButton
              label="Edytuj materiał"
              icon={Edit}
              onClick={() => onEdit(row)}
            />

            <RowActionButton
              label="Usuń materiał"
              icon={Trash2}
              onClick={() => onDelete(row.id)}
              tone="destructive"
            />
          </div>
        ),
      },
    ];
  }, [onOpenAddDistribution, onEdit, onDelete]);

  return (
    <div className="space-y-3">
      <FilterBar
        rows={
          materialTypes.length > 0 ? (
            <ChipGroup label="Szybkie filtry">
              <Chip active={selectedType === "all"} onClick={() => setSelectedType("all")}>
                Wszystkie
              </Chip>
              {materialTypes.map((t) => {
                const isActive = selectedType === t.label;
                return (
                  <Chip key={t.id} active={isActive} onClick={() => setSelectedType(isActive ? "all" : t.label)}>
                    {t.label}
                  </Chip>
                );
              })}
            </ChipGroup>
          ) : undefined
        }
      >
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Szukaj po tytule, wydawcy, tematyce..."
          aria-label="Szukaj po tytule, wydawcy, tematyce"
        />
        {materialTypes.length > 0 && (
          <div className="w-48">
            <Select
              value={selectedType}
              onChange={(val) => setSelectedType(val || "all")}
              options={[
                { value: "all", label: "Wszystkie typy" },
                ...materialTypes.map((t) => ({ value: t.label, label: t.label })),
              ]}
              searchable={materialTypes.length > 5}
              placeholder="Wszystkie typy"
            />
          </div>
        )}
        {isFiltered && <ClearFiltersButton onClick={handleClearFilters} />}
      </FilterBar>

      {/* Tabela materiałów */}
      {materials.length === 0 ? (
        <EmptyState
          icon={Package}
          title={isFiltered ? "Brak pasujących materiałów" : "Katalog materiałów jest pusty"}
          description={
            isFiltered
              ? "Żaden materiał oświatowy nie odpowiada wprowadzonym kryteriom wyszukiwania."
              : "W bazie nie ma jeszcze zarejestrowanych ulotek, broszur, plakatów ani pomocy edukacyjnych."
          }
          actionLabel={isFiltered ? undefined : "Dodaj pierwszy materiał"}
          onAction={isFiltered ? undefined : onOpenAdd}
          secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
          onSecondaryAction={isFiltered ? handleClearFilters : undefined}
          className="my-4"
        />
      ) : (
        <TooltipProvider delayDuration={150}>
          <DataTable
            data={filteredMaterials}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(row) => onEdit(row)}
            rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
            enablePagination
            defaultPageSize={25}
            pageSizeOptions={[15, 25, 50, 100]}
            enableExport={true}
            exportFileName="katalog_materialow_ozipz.csv"
          />
        </TooltipProvider>
      )}
    </div>
  );
}
