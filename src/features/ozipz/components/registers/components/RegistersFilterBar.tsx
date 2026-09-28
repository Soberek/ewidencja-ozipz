import { Printer, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { ClearFiltersButton, FilterBar } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import type { OzipzDictionaryItem } from "../../../types/ozipz.types";

export interface RegistersFilterBarProps {
  year: string;
  onYearChange: (val: string) => void;
  month: string;
  onMonthChange: (val: string) => void;
  jrwa: string;
  onJrwaChange: (val: string) => void;
  educator: string;
  onEducatorChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  jrwaSymbols: OzipzDictionaryItem[];
  educators: string[];
  isFiltered: boolean;
  onClearFilters: () => void;
  onPrint: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  isConfigTab?: boolean;
}

export function RegistersFilterBar({
  year,
  onYearChange,
  month,
  onMonthChange,
  jrwa,
  onJrwaChange,
  educator,
  onEducatorChange,
  search,
  onSearchChange,
  jrwaSymbols,
  educators,
  isFiltered,
  onClearFilters,
  onPrint,
  onExportExcel,
  onExportCsv,
  isConfigTab = false,
}: RegistersFilterBarProps) {
  if (isConfigTab) return null;

  const currentYear = new Date().getFullYear();
  const yearOptions: SelectOption[] = [
    { value: "", label: "Wszystkie lata" },
    ...Array.from({ length: 5 }, (_, i) => {
      const y = String(currentYear - i);
      return { value: y, label: `Rok ${y}` };
    }),
  ];

  const monthOptions: SelectOption[] = [
    { value: "", label: "Wszystkie miesiące" },
    { value: "1", label: "01 - Styczeń" },
    { value: "2", label: "02 - Luty" },
    { value: "3", label: "03 - Marzec" },
    { value: "4", label: "04 - Kwiecień" },
    { value: "5", label: "05 - Maj" },
    { value: "6", label: "06 - Czerwiec" },
    { value: "7", label: "07 - Lipiec" },
    { value: "8", label: "08 - Sierpień" },
    { value: "9", label: "09 - Wrzesień" },
    { value: "10", label: "10 - Październik" },
    { value: "11", label: "11 - Listopad" },
    { value: "12", label: "12 - Grudzień" },
  ];

  const jrwaOptions: SelectOption[] = [
    { value: "", label: "Wszystkie symbole JRWA" },
    ...jrwaSymbols.map((s) => ({
      value: s.code,
      label: `${s.code} — ${s.label}`,
    })),
  ];

  const educatorOptions: SelectOption[] = [
    { value: "", label: "Wszyscy edukatorzy" },
    ...educators.map((e) => ({
      value: e,
      label: e,
    })),
  ];

  return (
    <FilterBar
      actions={
        <>
          <Button variant="outline" onClick={onPrint} className="font-medium">
            <Printer className="size-3.5 text-info" />
            <span>Drukuj Rejestr</span>
          </Button>
          <Button variant="outline" onClick={onExportExcel} className="font-medium">
            <FileSpreadsheet className="size-3.5 text-success" />
            <span>Eksport Excel</span>
          </Button>
          <Button variant="outline" onClick={onExportCsv} className="font-medium">
            <Download className="size-3.5 text-muted-foreground" />
            <span>CSV</span>
          </Button>
        </>
      }
      rows={
        <ChipGroup label="Szybkie filtry">
          <Chip
            active={!year && !month}
            onClick={() => {
              onYearChange("");
              onMonthChange("");
            }}
          >
            Wszystkie wpisy
          </Chip>
          <Chip
            active={year === String(currentYear)}
            onClick={() => onYearChange(year === String(currentYear) ? "" : String(currentYear))}
          >
            Bieżący rok
          </Chip>
          <span className="ml-2 mr-0.5 text-[11px] font-semibold text-muted-foreground">JRWA:</span>
          {(["966.1", "966.3", "966.4"] as const).map((symbol) => (
            <Chip key={symbol} active={jrwa === symbol} onClick={() => onJrwaChange(jrwa === symbol ? "" : symbol)}>
              {symbol}
            </Chip>
          ))}
        </ChipGroup>
      }
    >
      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Szukaj #id, placówka, temat..." />
      <div className="w-36">
        <Select value={year} onChange={onYearChange} options={yearOptions} placeholder="Rok..." searchable={false} />
      </div>
      <div className="w-44">
        <Select value={month} onChange={onMonthChange} options={monthOptions} placeholder="Miesiąc..." searchable={false} />
      </div>
      <div className="w-56">
        <SearchableSelect
          value={jrwa}
          onChange={onJrwaChange}
          options={jrwaOptions}
          placeholder="Symbol JRWA..."
          searchPlaceholder="Szukaj JRWA..."
          clearable
        />
      </div>
      <div className="w-48">
        <Select value={educator} onChange={onEducatorChange} options={educatorOptions} placeholder="Edukator..." />
      </div>
      {isFiltered && <ClearFiltersButton onClick={onClearFilters} label="Wyczyść filtry" />}
    </FilterBar>
  );
}
