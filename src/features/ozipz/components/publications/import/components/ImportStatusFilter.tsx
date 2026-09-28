import { Chip, ChipGroup } from "@/components/ui/chip";
import { SearchInput } from "@/components/ui/search-input";
import type { ImportRowStatus } from "../importRows";
import { IMPORT_STATUS_META } from "../importStatusMeta";
import type { ImportStatusFilter as Filter } from "../useSourceImport";

interface ImportStatusFilterProps {
  value: Filter;
  onChange: (value: Filter) => void;
  counts: Record<ImportRowStatus, number>;
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
  showExternal: boolean;
}

const STATUS_ORDER: ImportRowStatus[] = ["new", "probable", "possible", "linked", "external", "skipped"];

export function ImportStatusFilter({ value, onChange, counts, total, search, onSearchChange, showExternal }: ImportStatusFilterProps) {
  const todo = counts.new + counts.probable + counts.possible;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ChipGroup label="Pokaż" className="flex-1">
        <Chip active={value === "todo"} onClick={() => onChange("todo")} count={todo} tone="primary" title="Pozycje wymagające decyzji: nowe, prawdopodobne i podobne">
          Do decyzji
        </Chip>
        {STATUS_ORDER.filter((s) => (s !== "external" || showExternal) && (counts[s] > 0 || value === s)).map((status) => {
          const meta = IMPORT_STATUS_META[status];
          const Icon = meta.icon;
          return (
            <Chip key={status} active={value === status} onClick={() => onChange(status)} count={counts[status]} tone={meta.chipTone} icon={<Icon />} title={meta.hint}>
              {meta.label}
            </Chip>
          );
        })}
        <Chip active={value === "all"} onClick={() => onChange("all")} count={total}>
          Wszystkie
        </Chip>
      </ChipGroup>
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj w pobranych…" aria-label="Szukaj w pobranych publikacjach" containerClassName="min-w-[220px] max-w-xs" />
    </div>
  );
}
