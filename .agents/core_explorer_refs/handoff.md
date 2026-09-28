# Handoff Report: Reference Pattern Analysis (Actions, Facilities, Programs)

**Author**: Explorer Subagent  
**Working Directory**: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs`  
**Report File**: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs/report.md`  
**Recipient**: Project Orchestrator (`da236400-b6d5-45cf-ab25-634666be2bbd`)  
**Type**: Hard Handoff (Investigation & Reference Synthesis Complete)

---

## 1. Observation

Direct observations from codebase inspection and test suite execution:

1. **Design System Select Usage**:
   - `src/features/ozipz/components/programs/components/SchoolParticipationsFilterBar.tsx` (lines 84-126): `<Select size="sm">` is used inside width wrappers (`w-56`, `w-40`, `w-44`) with `searchable={items.length > 5}` and `options={[{ value: "all", label: "..." }, ...items.map(...)]}`.
   - `src/features/ozipz/components/facilities/components/FacilitiesFilterBar.tsx` (lines 61-92): uses `<Select size="sm">` for `filterType` (`w-52`) and `selectedMunicipality` (`w-48`).
   - `src/features/ozipz/components/actions/list/ActionsFilterBar.tsx` (lines 85-131): uses `<Select size="sm">` for `selectedMonth` (`w-52`) and `statusFilter` (`w-40`).
   - In contrast, native `<select>` tags are still present in target modules:
     - `src/features/ozipz/components/contacts/components/ContactsFilterBar.tsx` (lines 46-58, 61-73)
     - `src/features/ozipz/components/materials/components/MaterialsCatalogTab.tsx` (lines 186-198)
     - `src/features/ozipz/components/letters/LettersSection.tsx` (lines 176-184)

2. **Quick-Filter Chips**:
   - In `SchoolParticipationsFilterBar.tsx` (lines 147-193):
     Container: `<div className="flex flex-wrap items-center gap-1.5 text-xs select-none">`
     Label: `<span className="text-[11px] font-semibold text-muted-foreground mr-1">Szybkie filtry:</span>`
     Active class: `bg-primary text-primary-foreground border-primary font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border shadow-none`
     Inactive class: `bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer`
   - Verified verbatim in `src/features/ozipz/components/programs/programsAdversarialChallenge.test.tsx` (lines 219-253):
     `expect(submittedChip.className).toContain("bg-primary text-primary-foreground border-primary");`
     `expect(allChip.className).toContain("bg-muted/40 text-muted-foreground border-border");`

3. **Collapsible KPI & Summary Headers**:
   - `src/features/ozipz/components/actions/ActionsSection.tsx` (lines 186-206): `localStorage.getItem("oz.showKpiSummary")`.
   - `src/features/ozipz/components/facilities/FacilitiesSection.tsx` (lines 52-72): `localStorage.getItem("oz.facilitiesShowKpiSummary")`.
   - `src/features/ozipz/components/programs/ProgramsSection.tsx` (lines 64-84): `localStorage.getItem("oz.programsShowKpiSummary")`.
   - Initial state hook pattern wraps access in `try / catch`, defaulting to `true`.
   - Toggle button renders `<Button variant="outline" size="sm" onClick={onToggleKpi}>` with `ChevronUp` / `ChevronDown` (icon `size-3.5`), `aria-expanded={isKpiVisible}`, and text `"Zwiń KPI"` / `"Pokaż KPI"`.

4. **`<DataTable>` onRowClick & Safe Action Isolation**:
   - In `src/components/ui/data-table/data-table-row.tsx` (lines 42-50):
     `<tr onClick={() => onRowClick?.(item)} className={cn(..., onRowClick && "cursor-pointer hover:bg-muted/40")}>`
   - In `SchoolParticipationsTab.tsx` (lines 224-265) & `FacilitiesTableView.tsx` (lines 156-195):
     Actions cell wrapper has `onClick={(e) => e.stopPropagation()}` and action buttons have `onClick={(e) => { e.stopPropagation(); onEdit(row); }}`.
   - Tested in `programsAdversarialChallenge.test.tsx` (lines 330-377):
     `expect(handleEdit).toHaveBeenCalledTimes(1);` (clicking Edit button must not trigger row onEdit).
     `expect(handleDelete).toHaveBeenCalledTimes(1); expect(handleEdit).not.toHaveBeenCalled();` (clicking Delete must never trigger Edit).

5. **Text Column Multi-line Wrapping**:
   - In `SchoolParticipationsTab.tsx` (lines 121-140) & `FacilitiesTableView.tsx` (lines 51-67):
     Column container: `<div className="min-w-[200px] max-w-[340px] space-y-0.5">`
     Icon wrapper: `<div className="flex items-start gap-1.5 font-medium text-xs ...">`
     Icon: `<Building2 className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />`
     Text span: `<span className="line-clamp-2 break-words leading-tight" title={titleText}>{titleText}</span>`
   - Main span strictly avoids `truncate` (which enforces single line).

6. **React DOM searchPlaceholder Warning**:
   - Command: `npm test -- --run`
   - Result: 73 test files passed (524 tests).
   - Stderr warning observed:
     `React does not recognize the searchPlaceholder prop on a DOM element.`
     Triggered in `lettersComponents.test.tsx` and `staffComponents.test.tsx` because `src/components/ui/autocomplete.tsx` line 96 leaves `searchPlaceholder` in `...restInputProps` and spreads it onto native `<input>` at line 375.

---

## 2. Logic Chain

1. **Premise**: Actions, Facilities, and Programs represent the target UX/UI standard approved for the application.
2. **Observation -> Deduction (Filter Bars)**: In all three reference modules, raw HTML `<select>` elements were eliminated in favor of `@/components/ui/select` `<Select size="sm">`, giving consistent keyboard navigation, searchable dropdowns, and theming. The target modules (`ContactsFilterBar`, `MaterialsCatalogTab`, `LettersSection`) still use raw `<select>`, causing visual discordance and UX degradation.
3. **Observation -> Deduction (Quick Chips)**: Quick-filter chips provide instant 1-click filtering for common status/categories. The active token `bg-primary text-primary-foreground border-primary` combined with inactive `bg-muted/40 text-muted-foreground border-border` guarantees contrast across light/dark themes. The toggle-to-"all" pattern allows quick clearing of category filters without requiring a separate clear button click.
4. **Observation -> Deduction (KPI Headers)**: Fixed KPI counters waste vertical screen real estate on smaller laptops (e.g. 13-14 inch screens). Persisting the collapse preference in `localStorage` under `oz.<module>ShowKpiSummary` preserves user state across reloads. The `try/catch` guard is essential because browsers in private mode or strict iframe settings throw `SecurityError` or `QuotaExceededError`.
5. **Observation -> Deduction (Row Clicks & Propagation)**: Enabling `onRowClick` on `<DataTable>` provides immediate ergonomics (click anywhere on a row to edit). However, because DOM click events bubble up from child elements to `<tr>`, inner action buttons (Edit, Delete, Link) will inadvertently trigger the row click handler unless `e.stopPropagation()` is called on both the wrapper `<div>` and the individual buttons.
6. **Observation -> Deduction (Multi-line Wrapping)**: Polish institutional names are frequently 60-120 characters long. With `truncate`, users cannot distinguish between "Szkoła Podstawowa nr 1" and "Szkoła Podstawowa nr 2". Replacing `truncate` with `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` and `title={name}` preserves legibility while preventing table distortion.

---

## 3. Caveats

- **Scope boundary**: This investigation is strictly read-only. No source files under `src/` were edited.
- **Backend/DB Schema**: No modifications to SQLite schema or store structures are required for this UI harmonization; all changes are strictly presentational and state-driven.
- **Test coverage**: When replacing `<select>` in target modules, existing tests expecting `getByRole("combobox")` on raw select may need updating to target `<Select>` triggers or use test-ids/labels.

---

## 4. Conclusion

The reference patterns are mature, robust, and empirically validated by 524 passing tests. The workers can implement the exact blueprints detailed in `report.md`:
1. Upgrade `ContactsFilterBar`, `MaterialsCatalogTab`, and `LettersSection` to `<Select size="sm">`.
2. Introduce quick-filter chips matching `bg-primary text-primary-foreground` across the 4 target modules.
3. Add collapsible KPI toggles (`oz.materialsShowKpiSummary`, `oz.registersShowKpiSummary`, `oz.contactsShowKpiSummary`, `oz.lettersShowKpiSummary`) with `try/catch` persistence.
4. Enable `onRowClick` on `<DataTable>` in all four target modules with double event isolation (`onClick={(e) => e.stopPropagation()}`).
5. Standardize primary textual columns to `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` with `items-start` icons and `title` tooltips.
6. Fix `src/components/ui/autocomplete.tsx` by destructuring `searchPlaceholder` out of `restInputProps` to eliminate the React DOM warning.

---

## 5. Verification Method

To independently verify these findings and subsequently verify implementation:
1. **Full test suite execution**:
   ```bash
   npm test -- --run
   ```
   All 73 test suites must pass (0 failures).
2. **TypeScript strict compilation**:
   ```bash
   npm run typecheck
   ```
   Must exit with code 0 and 0 errors.
3. **Inspect reference files**:
   - `src/features/ozipz/components/programs/components/SchoolParticipationsTab.tsx`
   - `src/features/ozipz/components/programs/components/SchoolParticipationsFilterBar.tsx`
   - `src/features/ozipz/components/programs/components/ProgramsStatsHeader.tsx`
   - `src/features/ozipz/components/facilities/components/FacilitiesTableView.tsx`
   - `src/features/ozipz/components/programs/programsAdversarialChallenge.test.tsx`
4. **Invalidation conditions**:
   - If any action button inside a `<DataTable>` row triggers `onRowClick` when clicked.
   - If quick-filter chips use arbitrary custom colors instead of `bg-primary text-primary-foreground` and `bg-muted/40`.
   - If long facility/material names are truncated to 1 line with ellipsis mid-word without `line-clamp-2`.
   - If `localStorage` access throws uncaught exceptions in private browsing.
