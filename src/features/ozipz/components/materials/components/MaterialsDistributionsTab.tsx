import { useState, useMemo, useCallback } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzDistribution, OzipzMaterial } from "../../../types/ozipz.types";
import { createDistributionColumns } from "./MaterialsDistributionsColumns";

export interface MaterialsDistributionsTabProps {
  distributions: OzipzDistribution[];
  materials: OzipzMaterial[];
  municipalities?: string[];
  onOpenAdd: () => void;
  onEdit: (item: OzipzDistribution) => void;
  onDelete: (id: string) => void;
  onOpenBlankiet: (item: OzipzDistribution) => void;
}

export function MaterialsDistributionsTab({
  distributions,
  materials: _materials,
  municipalities = [],
  onOpenAdd,
  onEdit,
  onDelete,
  onOpenBlankiet,
}: MaterialsDistributionsTabProps) {
  const [search, setSearch] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("all");

  const availableMunicipalities = useMemo(() => {
    if (municipalities && municipalities.length > 0) {
      return municipalities;
    }
    const set = new Set<string>();
    distributions.forEach((d) => {
      if (d.municipality && d.municipality.trim()) {
        set.add(d.municipality.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [municipalities, distributions]);

  const filteredDistributions = useMemo(() => {
    return distributions.filter((d) => {
      if (selectedMunicipality !== "all" && d.municipality !== selectedMunicipality) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = (d.materialTitle || "").toLowerCase().includes(q);
        const mRec = (d.recipientName || "").toLowerCase().includes(q);
        const mMuni = (d.municipality || "").toLowerCase().includes(q);
        const mEducator = (d.assignedEducator || "").toLowerCase().includes(q);
        if (!mTitle && !mRec && !mMuni && !mEducator) return false;
      }
      return true;
    }).sort((a, b) => (b.distributionDate || "").localeCompare(a.distributionDate || ""));
  }, [distributions, selectedMunicipality, search]);

  const isFiltered = !!search.trim() || selectedMunicipality !== "all";

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedMunicipality("all");
  }, []);

  const columns = useMemo(
    () =>
      createDistributionColumns({
        onOpenBlankiet,
        onEdit,
        onDelete,
      }),
    [onOpenBlankiet, onEdit, onDelete]
  );

  return (
    <div className="space-y-3">
      <FilterBar
        rows={
          availableMunicipalities.length > 0 ? (
            <ChipGroup label="Gmina">
              <Chip active={selectedMunicipality === "all"} onClick={() => setSelectedMunicipality("all")}>
                Wszystkie
              </Chip>
              {availableMunicipalities.map((muni) => {
                const isActive = selectedMunicipality === muni;
                return (
                  <Chip key={muni} active={isActive} onClick={() => setSelectedMunicipality(isActive ? "all" : muni)}>
                    {muni}
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
          placeholder="Szukaj po tytule materiału, placówce..."
          aria-label="Szukaj po tytule materiału, placówce"
        />
        {availableMunicipalities.length > 0 && (
          <div className="w-44">
            <Select
              value={selectedMunicipality}
              onChange={(val) => setSelectedMunicipality(val || "all")}
              options={[
                { value: "all", label: "Wszystkie gminy" },
                ...availableMunicipalities.map((m) => ({ value: m, label: m })),
              ]}
              searchable={availableMunicipalities.length > 5}
              placeholder="Wszystkie gminy"
            />
          </div>
        )}
        {isFiltered && <ClearFiltersButton onClick={handleClearFilters} />}
      </FilterBar>

      {/* Tabela rozdzielników */}
      {distributions.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title={isFiltered ? "Brak pasujących rozdzielników" : "Ewidencja rozdzielników jest pusta"}
          description={
            isFiltered
              ? "Żaden rozdzielnik materiałów nie odpowiada wprowadzonym kryteriom wyszukiwania."
              : "Nie wprowadzono jeszcze rozdzielników ani protokołów przekazania materiałów oświatowych."
          }
          actionLabel={isFiltered ? undefined : "Wystaw pierwszy rozdzielnik"}
          onAction={isFiltered ? undefined : onOpenAdd}
          secondaryActionLabel={isFiltered ? "Wyczyść filtry" : undefined}
          onSecondaryAction={isFiltered ? handleClearFilters : undefined}
          className="my-4"
        />
      ) : (
        <TooltipProvider delayDuration={150}>
          <DataTable
            data={filteredDistributions}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(row) => onEdit(row)}
            rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
            enablePagination
            defaultPageSize={25}
            pageSizeOptions={[15, 25, 50, 100]}
            enableExport={true}
            exportFileName="rozdzielnik_materialow_ozipz.csv"
          />
        </TooltipProvider>
      )}
    </div>
  );
}
