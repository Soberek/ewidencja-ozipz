# Project: Ewidencja OZiPZ — Programs & Participations UX/UI Polish

## Architecture
- Module: `src/features/ozipz/components/programs/`
- Target components:
  - `components/SchoolParticipationsTab.tsx` (Tab 1: School participations list)
  - `components/SchoolParticipationsFilterBar.tsx` (Design System filter bar & quick-filter chips)
  - `components/ProgramsCatalogTab.tsx` (Tab 2: Programs catalog list)
  - `components/ProgramsViewSwitcher.tsx` (Top view toolbar with tab switcher and KPI collapse toggle)
  - `ProgramsSection.tsx` (Parent container managing active tab, KPI collapse state, and dialogs)
  - `components/programsComponents.test.tsx` (Comprehensive unit and component regression tests)
- Design System: `@/components/ui/select`, `@/components/ui/data-table`, `@/components/ui/button`, `@/components/ui/badge`

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | R1.1: Design System Select | Replace raw HTML `<select>` with `<Select size="sm">` for programs, school years, and municipalities in `SchoolParticipationsTab` | M1 | DONE | ORIGINAL_REQUEST §1 |
| 2 | R1.2: Report Status Quick Chips | Quick-filter chips for final report submission status (*Wszystkie zgłoszenia*, *Sprawozdanie złożone*, *Oczekuje na sprawozdanie*) with primary active and muted inactive styling | M1 | DONE | ORIGINAL_REQUEST §1 |
| 3 | R1.3: Municipality Filter | Dynamic municipality filter dropdown and chips derived from data | M1 | DONE | ORIGINAL_REQUEST §1 |
| 4 | R4.1: Facility Name Multi-line Wrapping | Update educational facility names to `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight`, `items-start gap-1.5`, `Building2 mt-0.5`, descriptive `title` | M1 | DONE | ORIGINAL_REQUEST §4 |
| 5 | R2.1: Collapsible KPI State | Implement `showKpiSummary` in `ProgramsSection` with persistent `localStorage` key `oz.programsShowKpiSummary` (with try/catch error suppression) | M2 | DONE | ORIGINAL_REQUEST §2 |
| 6 | R2.2: KPI Toggle Button | Implement `[Zwiń KPI]` / `[Pokaż KPI]` toggle button with `ChevronUp` / `ChevronDown` in `ProgramsViewSwitcher` | M2 | DONE | ORIGINAL_REQUEST §2 |
| 7 | R3.1: Participations Row Interaction | Configure `<DataTable>` in `SchoolParticipationsTab` with `onRowClick={(row) => onEdit(row)}` and active hover styling | M1 | DONE | ORIGINAL_REQUEST §3 |
| 8 | R3.2: Participations Action Isolation | Ensure Edit and Delete buttons in `SchoolParticipationsTab` call `e.stopPropagation()` | M1 | DONE | ORIGINAL_REQUEST §3 |
| 9 | R3.3: Programs Catalog Row Interaction | Configure `<DataTable>` in `ProgramsCatalogTab` with `onRowClick={(row) => onEdit(row)}` and active hover styling | M3 | DONE | ORIGINAL_REQUEST §3 |
| 10 | R3.4: Programs Catalog Action Isolation | Ensure Edit and Delete buttons in `ProgramsCatalogTab` call `e.stopPropagation()` | M3 | DONE | ORIGINAL_REQUEST §3 |
| 11 | R4.2: Program Name Multi-line Wrapping | Update program name column in `ProgramsCatalogTab` to `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` with descriptive `title` | M3 | DONE | ORIGINAL_REQUEST §4 |
| 12 | R5.1: Automated Test Suite | Comprehensive unit/component tests in `programsComponents.test.tsx` verifying R1, R2, R3, R4 | M4 | DONE | ORIGINAL_REQUEST Acceptance Criteria |
| 13 | R5.2: Strict Quality Gate | `npm run typecheck`, `npm test`, `npm run build`, and `GEMINI.md` compliance (zero any, <350 lines per file, zero hardcoding) | M4 | DONE | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status | Outputs |
|---|------|-------|-------------|--------|---------|
| 1 | M1: SchoolParticipations Harmonization | `SchoolParticipationsTab.tsx`, `SchoolParticipationsFilterBar.tsx` (R1.1, R1.2, R1.3, R3.1, R3.2, R4.1) | none | DONE | FilterBar with Select & chips, multi-line wrapping, onRowClick, button stopPropagation |
| 2 | M2: Collapsible KPI Header | `ProgramsSection.tsx`, `ProgramsViewSwitcher.tsx` (R2.1, R2.2) | none | DONE | showKpiSummary, localStorage persistence (`oz.programsShowKpiSummary`), toggle button |
| 3 | M3: ProgramsCatalog Interaction & Wrapping | `ProgramsCatalogTab.tsx` (R3.3, R3.4, R4.2) | none | DONE | onRowClick, button stopPropagation, multi-line program name wrapping |
| 4 | M4: Test Coverage & Quality Verification | `programsComponents.test.tsx`, vitest suite, typecheck, build, GEMINI.md audit | M1, M2, M3 | DONE | 12 tests in programsComponents.test.tsx, 495 tests passing across project, clean audit |

## Interface Contracts
### SchoolParticipationsFilterBar ↔ SchoolParticipationsTab
- `searchQuery: string`, `onSearchChange: (q: string) => void`
- `selectedProgramId: string`, `onProgramChange: (id: string) => void`
- `selectedSchoolYear: string`, `onSchoolYearChange: (yr: string) => void`
- `selectedMunicipality: string`, `onMunicipalityChange: (m: string) => void`
- `statusFilter: "all" | "submitted" | "pending"`, `onStatusFilterChange: (status: "all" | "submitted" | "pending") => void`
- `programs: OzipzProgram[]`
- `schoolYears: string[]`
- `municipalities: string[]`
- `onClearFilters: () => void`, `hasActiveFilters: boolean`

### ProgramsViewSwitcher ↔ ProgramsSection
- `isKpiVisible?: boolean`
- `onToggleKpi?: () => void`

## Code Layout
- `src/features/ozipz/components/programs/components/SchoolParticipationsTab.tsx`: Owns participations table and dialog integrations (334 lines).
- `src/features/ozipz/components/programs/components/SchoolParticipationsFilterBar.tsx`: Owns filters, selects, and quick chips (197 lines).
- `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`: Owns programs catalog table and dialog integrations (254 lines).
- `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`: Owns tab toggles and KPI collapse button (117 lines).
- `src/features/ozipz/components/programs/ProgramsSection.tsx`: Owns parent state, dialog state, and KPI visibility (145 lines).
- `src/features/ozipz/components/programs/components/programsComponents.test.tsx`: Owns automated component tests for programs (339 lines).
