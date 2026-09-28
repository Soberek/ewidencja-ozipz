## 2026-09-03T15:34:38Z
# Test Writer M4 Dispatch — Comprehensive Test Suite & Quality Verification

## Exclusive File Ownership:
- `src/features/ozipz/components/programs/components/programsComponents.test.tsx`

DO NOT modify implementation code files.

## References:
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3/report.md` (see test specifications and matrix)
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/src/features/ozipz/components/facilities/components/facilitiesComponents.test.tsx` (reference test patterns)

## Mandatory Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks:
Write a comprehensive, rock-solid automated test suite in `src/features/ozipz/components/programs/components/programsComponents.test.tsx` using `vitest` and `@testing-library/react` (and `@testing-library/user-event` if applicable):
1. **R1 Tests**:
   - `SchoolParticipationsFilterBar`: renders Design System `<Select>` for Program, School Year, and Municipality.
   - Quick-filter chips for final report status (*Wszystkie zgłoszenia*, *Sprawozdanie złożone*, *Oczekuje na sprawozdanie*): verify active chip has `bg-primary text-primary-foreground` and inactive has `bg-muted/40`.
   - Clicking quick-filter chips changes filter state and filters table rows in `SchoolParticipationsTab`.
   - Search input filters rows, and clicking clear button clears query.
2. **R2 Tests**:
   - `ProgramsSection` renders KPI header by default.
   - Toggle button in `ProgramsViewSwitcher` displays `Zwiń KPI` when expanded, and clicking it collapses KPI header, updates button label to `Pokaż KPI`, and stores `"false"` in `localStorage.getItem("oz.programsShowKpiSummary")`.
   - Clicking `Pokaż KPI` restores KPI header and stores `"true"` in `localStorage`.
   - Initial state honors pre-existing `"false"` in `localStorage`.
   - Graceful resilience when `localStorage.getItem` or `setItem` throws an error.
3. **R3 Tests**:
   - `SchoolParticipationsTab`: clicking a table row fires `onEdit(row)`.
   - `SchoolParticipationsTab`: clicking the Edit button fires `onEdit(row)` exactly once and does NOT double-fire via row click.
   - `SchoolParticipationsTab`: clicking the Delete button fires `onDelete(row.id)` and does NOT fire `onEdit(row)`.
   - `ProgramsCatalogTab`: clicking a table row fires `onEdit(row)`.
   - `ProgramsCatalogTab`: clicking the Delete button fires `onDelete(row.id)` and does NOT fire `onEdit(row)`.
4. **R4 Tests**:
   - Facility name in `SchoolParticipationsTab` has `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight`, icon alignment `items-start`, and descriptive `title` attribute matching facility name.
   - Program name in `ProgramsCatalogTab` has `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` and descriptive `title` attribute matching program name.
5. Verification:
   - Run `npx vitest run src/features/ozipz/components/programs/components/programsComponents.test.tsx`.
   - Run `npm test` across entire project.
   - Run `npm run typecheck`.
   - Run `npm run build`.
   - Ensure file length is under 350-400 lines (split into helper or separate test file if needed, adhering to GEMINI.md).
6. Write handoff report in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/test_writer_m4/handoff.md`.
