# Comprehensive Investigation & Survey Report: School Participations & Programs Module Harmonization

**Author**: Explorer Survey 1  
**Working Directory**: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1`  
**Date**: 2026-09-03  
**Status**: Completed  
**Reference Directives**: `ORIGINAL_REQUEST.md`, `GEMINI.md`, `DATABASE_SCHEMA.md`

---

## 1. Executive Summary & Context

The "Szkoły w programie" (*School Participations & Programs*) module located at `src/features/ozipz/components/programs/` currently lags behind the design system standards established in the "Lokalizacje" (*Facilities*) and "Działania" (*Actions*) modules. Specifically:
1. **R1 (Filter Bar & Selects)**: `SchoolParticipationsTab.tsx` uses raw HTML `<select>` elements with basic borders, lacks quick-filter status chips (*Wszystkie zgłoszenia*, *Sprawozdanie złożone*, *Oczekuje na sprawozdanie*), and lacks a municipality filter.
2. **R2 (Collapsible KPI Header)**: `ProgramsStatsHeader.tsx` is permanently visible in `ProgramsSection.tsx`, occupying ~120px of vertical height with no toggle button or `localStorage` preference persistence.
3. **R3 (Row Interaction & Event Isolation)**: `<DataTable>` in `SchoolParticipationsTab` and `ProgramsCatalogTab` lacks `onRowClick={(row) => onEdit(row)}` and active hover cursor styles (`hover:bg-muted/40 cursor-pointer`). Furthermore, the inline action buttons (Edit, Delete) do NOT call `e.stopPropagation()`, which would lead to double handlers or conflicting state mutations on click.
4. **R4 (Multi-line Text Wrapping)**: Facility and program names in table columns are truncated with single-line `truncate` and `items-center` alignment, truncating long school names (e.g. *"Szkoła Podstawowa z Oddziałami Integracyjnymi im. Bohaterów Westerplatte w Barlinku"*) mid-word with no descriptive `title` tooltips.

This report provides the complete survey, exact line-by-line evidence, design system references, edge case analysis, and actionable implementation blueprints to guide the implementation team.

---

## 2. Component Architecture Analysis (`src/features/ozipz/components/programs/`)

The programs feature is organized under `src/features/ozipz/components/programs/`:

```
src/features/ozipz/components/programs/
├── ParticipationDialog.tsx                      # Modal for adding/editing school participations (227 lines)
├── ProgramDialog.tsx                            # Modal for adding/editing preventive programs (311 lines)
├── ProgramsSection.tsx                          # Root container module (121 lines)
├── programs.test.ts                             # Domain logic unit tests (141 lines)
└── components/
    ├── ParticipationCoordinatorFields.tsx       # Sub-form for coordinator data (39 lines)
    ├── ParticipationMetricsStatusFields.tsx     # Sub-form for classes, pupils, declaration/report (123 lines)
    ├── ParticipationProgramFacilityFields.tsx   # Sub-form for program & facility pickers (127 lines)
    ├── ProgramsCatalogTab.tsx                   # Tab 2: Catalog of preventive programs (233 lines)
    ├── ProgramsStatsHeader.tsx                  # KPI summary header (4 cards, 90 lines)
    ├── ProgramsViewSwitcher.tsx                 # Tab switcher + Add action buttons (94 lines)
    ├── SchoolParticipationsTab.tsx              # Tab 1: List and filter bar for participations (298 lines)
    └── programsComponents.test.tsx              # React testing-library component tests (143 lines)
```

### Architectural Line Counts & SRP Compliance
All files in `src/features/ozipz/components/programs/` are strictly below the 350-line limit mandated by `GEMINI.md`:
- `SchoolParticipationsTab.tsx`: 298 lines (projected to be ~340 lines after R1, R3, R4 enhancements, maintaining SRP and staying safely under the 350-line threshold).
- `ProgramsSection.tsx`: 121 lines (projected ~140 lines with R2).
- `ProgramsViewSwitcher.tsx`: 94 lines (projected ~115 lines with R2 toggle button).
- `ProgramsCatalogTab.tsx`: 233 lines (projected ~245 lines with R3 and R4).
- `ProgramsStatsHeader.tsx`: 90 lines.

---

## 3. Current Select Implementations vs. Design System `<Select size="sm">`

### 3.1 Observed State in `SchoolParticipationsTab.tsx`
Lines 225-251 of `SchoolParticipationsTab.tsx` currently render native HTML `<select>` tags:
```tsx
// Program Selector:
<select
  value={selectedProgramId}
  onChange={(e) => setSelectedProgramId(e.target.value)}
  className="h-9 rounded-[3px] border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
>
  <option value="all">Wszystkie programy</option>
  {programs.map((p) => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ))}
</select>

// Year Selector:
{availableSchoolYears.length > 0 && (
  <select
    value={selectedYear}
    onChange={(e) => setSelectedYear(e.target.value)}
    className="h-9 rounded-[3px] border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
  >
    <option value="all">Wszystkie lata szkolne</option>
    {availableSchoolYears.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
)}
```

### 3.2 Design System Reference: `src/components/ui/select.tsx`
The Design System component `Select` (and its alias `SearchableSelect`) is defined in `src/components/ui/select.tsx`.
Key properties:
- `options: SelectOptionInput[]` — can be strings or `{ value: string; label: string; badge?: string; badgeVariant?: ... }`.
- `value?: string` — current value.
- `onChange?: (value: string) => void` — callback invoked when option is selected.
- `size?: "sm" | "md" | "lg"` — `size="sm"` uses `h-7 text-xs px-2 py-1 gap-1.5`. Can be paired with `triggerClassName="h-9"` or wrapped in fixed-width containers (`w-56`, `w-44`, `w-48`) to match other toolbar inputs.
- `searchable?: boolean` — enables embedded search input in dropdown. In filter bars, `searchable={options.length > 5}` is standard.
- `placeholder?: string` — default placeholder text.

### 3.3 Golden Reference: `FacilitiesFilterBar.tsx` & `ScheduleFilterBar.tsx`
In `FacilitiesFilterBar.tsx` (lines 61-93):
```tsx
<div className="w-52">
  <Select
    value={filterType}
    onChange={(val) => onFilterTypeChange((val || "all") as ...)}
    options={[
      { value: "all", label: "Wszystkie typy placówek" },
      { value: "complex", label: "Tylko zespoły szkół" },
      { value: "standalone", label: "Placówki samodzielne" },
      { value: "in_complex", label: "Wchodzące w skład zespołu" },
    ]}
    searchable={false}
    size="sm"
  />
</div>

<div className="w-48">
  <Select
    value={selectedMunicipality}
    onChange={(val) => onMunicipalityChange(val || "all")}
    options={[
      { value: "all", label: "Wszystkie gminy" },
      ...uniqueMunicipalities.map((m) => ({ value: m, label: m })),
    ]}
    searchable={uniqueMunicipalities.length > 5}
    size="sm"
    placeholder="Wszystkie gminy"
  />
</div>
```

---

## 4. Quick-Filter Chip Patterns and Styling Analysis

### 4.1 Token Standard Across the Codebase
From `FacilitiesFilterBar.tsx` (lines 158-166), `ScheduleFilterBar.tsx` (lines 235-263), and `ActionsFilterBar.tsx` (lines 212-254):
- **Active Chip**:
  `"bg-primary text-primary-foreground border-primary shadow-none font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border"`
- **Inactive Chip**:
  `"bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer"`

### 4.2 Application to `SchoolParticipationsTab.tsx`
The filter bar should provide two levels of quick filtering:
1. **Report Submission Status (`reportStatusFilter`)**:
   - Values: `"all" | "submitted" | "pending"`
   - Chips:
     - `Wszystkie zgłoszenia` (active when `reportStatusFilter === "all"`)
     - `Sprawozdanie złożone` (active when `reportStatusFilter === "submitted"`, filters `p.hasFinalReport === true`)
     - `Oczekuje na sprawozdanie` (active when `reportStatusFilter === "pending"`, filters `!p.hasFinalReport`)
2. **Municipality Filter (`selectedMunicipality`)**:
   - Dropdown `<Select size="sm">` in the main filter bar row (`w-44` to `w-48`).
   - Quick-filter chips in the chips row when municipalities exist, allowing instant 1-click filtering by commune (e.g. `Barlinek`, `Dębno`, `Myślibórz`, etc.).

---

## 5. Table Column Wrapping & Icon Alignment Analysis (R4)

### 5.1 Observed Deficiencies in `SchoolParticipationsTab.tsx`
Currently (lines 87-124):
```tsx
// Facility Column:
cell: ({ row }) => (
  <div className="max-w-[280px]">
    <div className="flex items-center gap-1 font-medium text-xs text-neutral-900 dark:text-neutral-100">
      <Building2 className="size-3 text-neutral-400 shrink-0" />
      <span className="truncate">{row.facilityName || "Brak nazwy"}</span>
    </div>
    {row.municipality && (
      <p className="text-[11px] text-neutral-500 truncate dark:text-neutral-400 mt-0.5">
        Gmina: {row.municipality}
      </p>
    )}
  </div>
),

// Program Column:
cell: ({ row }) => {
  const prog = programMap.get(row.programId);
  return (
    <div className="max-w-[240px]">
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-800 border-purple-200 text-[11px] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
      >
        {row.programName || prog?.name || "Program"}
      </Badge>
...
```
Defects:
1. `items-center`: If text wraps, the icon is centered vertically rather than top-aligned.
2. `truncate`: Single-line truncation with `...` cuts off long school names like *"Szkoła Podstawowa z Oddziałami Integracyjnymi im. Bohaterów Westerplatte w Barlinku"*.
3. Missing `title` attribute: Users cannot hover to see full text.
4. `max-w-[280px]` without `min-w-[200px] max-w-[340px]`.

### 5.2 Golden Reference: `FacilitiesTableView.tsx` & `ActionsTableColumns.tsx`
From `FacilitiesTableView.tsx` (lines 51-61):
```tsx
<div className="min-w-[220px] max-w-[420px] space-y-1">
  <div className="flex items-start gap-1.5">
    <Building2 className="size-3.5 text-neutral-500 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2 break-words leading-tight"
          title={row.name}
        >
          {row.name}
        </span>
```
From `ActionsTableColumns.tsx` (lines 124-133):
```tsx
<div className="min-w-[180px] max-w-[320px]">
  <div className="flex items-start gap-1 font-medium text-xs text-neutral-800 dark:text-neutral-200">
    <Building2 className="size-3 text-neutral-400 shrink-0 mt-0.5" />
    <span
      className="line-clamp-2 break-words leading-tight"
      title={row.facilityName || undefined}
    >
      {row.facilityName || "Placówka nieokreślona"}
    </span>
  </div>
```

### 5.3 Target Specification for R4
1. **Facility Name Column**:
   - Container: `min-w-[200px] max-w-[340px]`
   - Layout: `flex items-start gap-1.5 font-medium text-xs`
   - Icon: `<Building2 className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />`
   - School name text: `line-clamp-2 break-words leading-tight`
   - Tooltip: `title={facilityName}`
   - Municipality subtitle: `text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 ml-5 truncate`
2. **Program Name Column**:
   - Container: `min-w-[180px] max-w-[300px]`
   - Layout: `flex items-start gap-1`
   - Badge: `variant="outline"` with `text-[11px] line-clamp-2 break-words leading-tight text-left whitespace-normal h-auto py-0.5`
   - Tooltip: `title={programName}`
3. **Programs Catalog Table (`ProgramsCatalogTab.tsx`)**:
   - Program name column: container `min-w-[200px] max-w-[340px]`, `line-clamp-2 break-words leading-tight`, `title={row.name}`.

---

## 6. Row Click Interactivity & Event Propagation Isolation (R3)

### 6.1 Observed State
In `SchoolParticipationsTab.tsx`:
- `<DataTable>` does not receive `onRowClick` or `rowClassName`.
- Action buttons in column definitions (lines 179-204):
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => onEdit(row)}
...
<Button
  variant="ghost"
  size="sm"
  onClick={() => onDelete(row.id)}
```
In `ProgramsCatalogTab.tsx`:
- `<DataTable>` does not receive `onRowClick` or `rowClassName`.
- Action buttons also lack `e.stopPropagation()`.

### 6.2 The Event Propagation Conflict
`DataTableRow.tsx` attaches `onClick={() => onRowClick?.(item)}` to the `<tr>` element.
If `onRowClick={(row) => onEdit(row)}` is passed to `<DataTable>` without stopping propagation on the inner buttons:
- Clicking the Edit button invokes `onEdit(row)` from the button handler, and then event bubbling invokes `onEdit(row)` again on the row.
- Clicking the Delete button invokes `onDelete(row.id)` and then immediately invokes `onEdit(row)`, opening the edit modal for an item that is being deleted.

### 6.3 Target Specification for R3
1. In `<DataTable>`:
   ```tsx
   rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}
   onRowClick={(row) => onEdit(row)}
   ```
2. In Action column buttons:
   ```tsx
   onClick={(e) => {
     e.stopPropagation();
     onEdit(row);
   }}
   aria-label="Edytuj zgłoszenie" // / "Edytuj program"
   ```
   and
   ```tsx
   onClick={(e) => {
     e.stopPropagation();
     onDelete(row.id);
   }}
   aria-label="Usuń zgłoszenie" // / "Usuń program"
   ```

---

## 7. Collapsible KPI Header with LocalStorage Persistence (R2)

### 7.1 Golden Reference Architecture
Across `FacilitiesSection`, `ScheduleSection`, and `ActionsSection`:
1. Storage Key: `"oz.programsShowKpiSummary"`
2. Initial State:
   ```tsx
   const [showKpiSummary, setShowKpiSummary] = useState<boolean>(() => {
     try {
       const saved = localStorage.getItem("oz.programsShowKpiSummary");
       if (saved !== null) return saved === "true";
     } catch {
       // fallback
     }
     return true;
   });
   ```
3. Toggle Handler:
   ```tsx
   const toggleKpiSummary = useCallback(() => {
     setShowKpiSummary((prev) => {
       const next = !prev;
       try {
         localStorage.setItem("oz.programsShowKpiSummary", String(next));
       } catch {
         // fallback
       }
       return next;
     });
   }, []);
   ```
4. Placement of the Toggle Button:
   In `ProgramsSection.tsx`, `ProgramsViewSwitcher.tsx` sits permanently directly beneath `ProgramsStatsHeader.tsx`, rendered in both "schools" and "programs" tabs. Placing the `Zwiń KPI` / `Pokaż KPI` button in `ProgramsViewSwitcher.tsx` (with `ChevronUp` / `ChevronDown`) ensures:
   - Zero duplication of buttons when KPI is expanded.
   - Permanent availability whether the user is viewing school participations or the program catalog.
   - Clean UI balance: tabs on the left, `[Zwiń KPI]` and `[Dodaj Zgłoszenie]` / `[Nowy Program]` on the right.

---

## 8. Implementation Blueprints

### 8.1 `SchoolParticipationsTab.tsx` Blueprint
```tsx
import { useState, useMemo } from "react";
import {
  School,
  Search,
  Building2,
  Edit,
  Trash2,
  CheckCircle2,
  FilterX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { OzipzSchoolParticipation, OzipzProgram } from "../../../types/ozipz.types";

export type ParticipationStatusFilter = "all" | "submitted" | "pending";

const STATUS_FILTER_OPTIONS: { id: ParticipationStatusFilter; label: string }[] = [
  { id: "all", label: "Wszystkie zgłoszenia" },
  { id: "submitted", label: "Sprawozdanie złożone" },
  { id: "pending", label: "Oczekuje na sprawozdanie" },
];

export interface SchoolParticipationsTabProps {
  participations: OzipzSchoolParticipation[];
  programs: OzipzProgram[];
  onOpenAdd: () => void;
  onEdit: (item: OzipzSchoolParticipation) => void;
  onDelete: (id: string) => void;
}
```

Key Filter Bar JSX:
```tsx
{/* Pasek filtrów */}
<div className="space-y-2.5 select-none">
  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj po szkole, gminie, koordynatorze..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs h-9"
        />
      </div>

      <div className="w-56">
        <Select
          value={selectedProgramId}
          onChange={(val) => setSelectedProgramId(val || "all")}
          options={[
            { value: "all", label: "Wszystkie programy" },
            ...programs.map((p) => ({ value: p.id, label: p.name })),
          ]}
          searchable={programs.length > 5}
          size="sm"
          placeholder="Wszystkie programy"
        />
      </div>

      {availableSchoolYears.length > 0 && (
        <div className="w-40">
          <Select
            value={selectedYear}
            onChange={(val) => setSelectedYear(val || "all")}
            options={[
              { value: "all", label: "Wszystkie lata szkolne" },
              ...availableSchoolYears.map((y) => ({ value: y, label: y })),
            ]}
            searchable={false}
            size="sm"
            placeholder="Wszystkie lata szkolne"
          />
        </div>
      )}

      {uniqueMunicipalities.length > 0 && (
        <div className="w-44">
          <Select
            value={selectedMunicipality}
            onChange={(val) => setSelectedMunicipality(val || "all")}
            options={[
              { value: "all", label: "Wszystkie gminy" },
              ...uniqueMunicipalities.map((m) => ({ value: m, label: m })),
            ]}
            searchable={uniqueMunicipalities.length > 5}
            size="sm"
            placeholder="Wszystkie gminy"
          />
        </div>
      )}

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
        >
          <FilterX className="size-3.5" />
          Wyczyść ({activeFiltersCount})
        </Button>
      )}
    </div>
  </div>

  {/* Szybkie filtry statusu i gminy */}
  <div className="flex flex-wrap items-center gap-1.5 text-xs select-none">
    <span className="text-[11px] font-semibold text-muted-foreground mr-1">
      Szybkie filtry:
    </span>
    {STATUS_FILTER_OPTIONS.map((opt) => {
      const isActive = statusFilter === opt.id;
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() => setStatusFilter(opt.id)}
          className={
            isActive
              ? "bg-primary text-primary-foreground border-primary shadow-none font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer"
          }
        >
          {opt.label}
        </button>
      );
    })}

    {uniqueMunicipalities.length > 1 && (
      <>
        <span className="text-[11px] font-semibold text-muted-foreground ml-2 mr-1">
          Gmina:
        </span>
        {uniqueMunicipalities.map((muni) => {
          const isActive = selectedMunicipality === muni;
          return (
            <button
              key={muni}
              type="button"
              onClick={() => setSelectedMunicipality(isActive ? "all" : muni)}
              className={
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-none font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer"
              }
            >
              {muni}
            </button>
          );
        })}
      </>
    )}
  </div>
</div>
```

---

## 9. Edge Cases & Type Safety

1. **Empty Municipality Values**:
   Schools or participations without a set municipality should not produce empty string options in `<Select>` or quick chips (`uniqueMunicipalities.filter(Boolean)`).
2. **Empty / Null Name Fields**:
   Safe fallback `row.facilityName || "Brak nazwy"` and `row.programName || prog?.name || "Program"` prevents `undefined` rendering in `line-clamp-2` or `title` tooltips.
3. **Event Bubbling on Tooltip Triggers**:
   Wrapping buttons in `<Tooltip>` causes click events on the button to propagate to the `<tr>` unless `e.stopPropagation()` is explicitly invoked in `onClick`.
4. **LocalStorage Security / SSR**:
   Surround `localStorage.getItem` and `localStorage.setItem` in `try { ... } catch {}` blocks to prevent exceptions in restrictive iframe or private browsing modes.
5. **No `any` Types**:
   All callbacks, props, and mappers use explicit types: `OzipzSchoolParticipation`, `OzipzProgram`, `ColumnDef<T>`, etc.

---

## 10. Verification Plan for Implementer

1. **Unit Tests**:
   - Verify `SchoolParticipationsTab` renders Design System `<Select>` inputs and quick-filter chips.
   - Verify clicking quick-filter chips toggles `reportStatusFilter` between `"all"`, `"submitted"`, `"pending"`.
   - Verify clicking municipality chips updates `selectedMunicipality`.
   - Verify clicking table row invokes `onEdit(row)`.
   - Verify clicking Edit button invokes `onEdit(row)` and calls `e.stopPropagation()`.
   - Verify clicking Delete button invokes `onDelete(row.id)` without triggering `onEdit`.
   - Verify long facility names render with `line-clamp-2`, `break-words`, `leading-tight`, `items-start`, and `title`.
   - Verify `ProgramsSection` toggles `ProgramsStatsHeader` collapse and persists state in `localStorage` under `oz.programsShowKpiSummary`.
2. **Commands**:
   - `npm test` -> 100% pass across all test suites.
   - `npm run typecheck` -> zero TypeScript errors.
   - `npm run build` -> production bundle builds cleanly.
