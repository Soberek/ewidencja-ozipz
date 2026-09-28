# Original User Request

## Initial Request — 2026-09-03T17:23:14+02:00

You are the Project Orchestrator for Ewidencja OZiPZ.

## Working Directory & Identity
- Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_programs
- Project Root: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
- Authoritative Request File: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md (also at repo root)
- Guidelines: GEMINI.md in project root

## Mission
Enhance and polish the "Szkoły w programie" (Lokalizacje w programie / School Participations & Programs) module to match the high UX/UI, ergonomics, and design system standards established in the "Lokalizacje" (Facilities) and "Działania" (Actions) modules.

## Requirements:
1. R1. School Participations Filter Bar & Design System Harmonization:
   Upgrade `SchoolParticipationsTab.tsx` by replacing raw HTML `<select>` elements with Design System `<Select size="sm">` from `@/components/ui/select`. Add a cohesive row of quick-filter chips (*Wszystkie zgłoszenia*, *Sprawozdanie złożone*, *Oczekuje na sprawozdanie*) and municipality filter with unified primary active styling (`bg-primary text-primary-foreground`) and muted inactive styling (`bg-muted/40`).
2. R2. Collapsible Programs & Participations KPI Header:
   Implement a collapsible toggle button (`Zwiń KPI` / `Pokaż KPI` with `ChevronUp`/`ChevronDown`) for `ProgramsStatsHeader.tsx` / `ProgramsSection.tsx`, persisting the user's view preference in `localStorage` (`oz.programsShowKpiSummary`) to save vertical workspace on laptops.
3. R3. Direct Row Interaction & Safe Action Isolation:
   Configure `<DataTable>` in `SchoolParticipationsTab` (and `ProgramsCatalogTab`) with `onRowClick={(row) => onEdit(row)}` and active hover styling. Ensure all inner interactive elements (Edit and Delete icon buttons, tooltips) safely stop event propagation (`e.stopPropagation()`) so clicking them does not trigger duplicate row-click handlers.
4. R4. Multi-line Text Wrapping for School & Program Names:
   Eliminate single-line ellipsis truncations (`truncate`) in the educational facility name and program name table columns. Implement `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` with `items-start` icon alignment and descriptive `title` tooltips so long school and kindergarten names are immediately legible.

## Acceptance Criteria:
- Raw HTML `<select>` elements in `SchoolParticipationsTab` are replaced with `@/components/ui/select` `<Select size="sm">`.
- Quick-filter chips for report submission status (*Wszystkie*, *Złożone*, *Oczekuje*) use unified primary active styling consistent with the application design system.
- Table rows across `SchoolParticipationsTab` and `ProgramsCatalogTab` support direct row-click to open edit modals, with action buttons protected by `e.stopPropagation()`.
- Educational facility names wrap cleanly on 2 lines with `line-clamp-2` instead of cutting off mid-word.
- The KPI header can be collapsed via a toggle button, and its state is preserved across reloads in `localStorage`.
- TypeScript strict compilation passes with zero errors (`npm run typecheck`).
- All existing and new automated unit tests pass 100% (`npm test`).
- Production build succeeds without errors (`npm run build`).
- Compliance with `GEMINI.md`: zero `any` types, zero files exceeding 350-400 lines, zero hardcoded domain options, and clean separation of concerns.

## Protocol:
- Maintain your own BRIEFING.md and progress.md in your working directory.
- Coordinate specialists (explorers, workers, reviewers, testers) as needed.
- Verify with tests and build before claiming victory.
- When finished, deliver handoff.md and report completion.

## Request — 2026-09-05T07:34:41Z

Harmonize UX/UI, ergonomics, and design system standards across the remaining core modules of Ewidencja OZiPZ (Materiały oświatowe, Rejestry urzędowe, Spis kontaktów, Dziennik korespondencji/pism), matching the high standards established in Actions, Facilities, and Programs.

Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
Integrity mode: development

## Requirements

### R1. Filter Bar & Design System Harmonization
Upgrade the filter and search toolbars across all four modules (Materiały, Rejestry, Kontakty, Pisma) to use Design System `<Select size="sm">` from `@/components/ui/select`, and add unified quick-filter chips with primary active (`bg-primary text-primary-foreground`) and muted inactive (`bg-muted/40`) styling.

### R2. Direct Row Interaction & Safe Action Isolation
Configure `<DataTable>` in all four target modules with `onRowClick` to open the edit/details modal on row selection with active hover state, while ensuring all inner interactive action buttons (Edit, Delete, Download, Print, Link) call `e.stopPropagation()` to prevent unwanted row-click triggers.

### R3. Multi-line Text Wrapping & Column Readability
Replace single-line ellipsis truncations (`truncate`) in primary textual columns (e.g. material titles, register descriptions, contact names/roles, letter subjects/senders) with `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` and descriptive `title` tooltips so long entries remain readable without clipping.

### R4. Collapsible KPI & Summary Headers
Implement collapsible toggle controls for statistics, KPI counters, and summary cards in the target modules with preference persistence in `localStorage`, conserving vertical screen space on laptops and compact displays.

### R5. Test Cleanliness & Zero-Warning Gate
Resolve any React DOM property warnings in test console outputs (e.g. invalid `searchPlaceholder` attributes on native inputs) and ensure all component tests run cleanly without console errors.

## Acceptance Criteria

### Design System & Filtering
- [ ] Filter bars across Materials, Registers, Contacts, and Letters modules use Design System `<Select size="sm">` components.
- [ ] Quick-filter chips are available for key status/category filters in each module with standardized active (`bg-primary text-primary-foreground`) and inactive styling.

### Row Interaction & Ergonomics
- [ ] Clicking any table row across the four target modules triggers the corresponding entity edit or details dialog.
- [ ] Action buttons inside table rows call `e.stopPropagation()` and do not trigger row-click events.
- [ ] Long names, titles, and descriptions wrap cleanly on up to two lines (`line-clamp-2 break-words`) with full text accessible via `title` attribute.

### KPI & Layout
- [ ] Summary/KPI headers in the target modules can be collapsed or expanded via toggle buttons.
- [ ] Collapsed state preferences persist across browser reloads via `localStorage`.

### Quality & Standards Gate
- [ ] Zero invalid React DOM attribute warnings appear during test execution.
- [ ] TypeScript strict mode compiles with zero errors (`npm run typecheck`).
- [ ] All unit and component tests pass 100% without failures (`npm test`).
- [ ] Production build succeeds with zero errors (`npm run build`).
- [ ] Full compliance with `GEMINI.md` (no files exceeding 350-400 lines, zero `any` types, zero hardcoded domain options, clean separation of concerns).

## Request — 2026-09-05T08:21:44Z

Refactor and decompose monolithic files (>400 lines) across Ewidencja OZiPZ into clean, modular, single-responsibility submodules strictly adhering to GEMINI.md Rule 2A, targeting the Zustand store (slices architecture), SQLite/fallback database services (domain repositories), heavy calculation utilities (ozipzCalculations and reportAnnex), and action hooks (useActionsFiltering and useActionEditorState).

Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
Integrity mode: development

## Requirements

### R1. Zustand Store Decomposition (Slice Architecture)
Decompose `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines) into modular Zustand slices per domain entity (actions, programs, facilities, schedule, materials, jrwa, dictionaries, letters, scans, staff, registers) using standard Zustand slice creator patterns. All slices must be re-exported through the unified `useOzipzDbStore` hook without changing existing public contracts.

### R2. Database Service Repository Pattern
Refactor `src/db/sqlite-service.ts` (1184 lines) and `src/db/fallback-service.ts` (582 lines) into modular domain repositories (e.g. actions, programs, facilities, schedule, contacts, materials, jrwa, etc.) implementing cohesive sub-interfaces, orchestrated by the main service without breaking the `IOzipzDatabaseService` contract.

### R3. Modularization of Heavy Calculation Utilities
Decompose `src/features/ozipz/utils/ozipzCalculations.ts` (1134 lines) and `src/features/ozipz/utils/reportAnnex.ts` (961 lines) into dedicated domain calculators and table builders, maintaining transparent barrel re-exports from `ozipzCalculations.ts` and `reportAnnex.ts` so all existing consumer imports continue to work without modification.

### R4. Action Editor & Filtering Hook Decomposition
Modularize `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (675 lines) and `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (617 lines) into focused sub-hooks/helpers adhering strictly to single responsibility, bringing all resulting files below the line budget.

### R5. Strict GEMINI.md Compliance & Zero-Regression Gate
Ensure all files in the refactored areas strictly respect the 350-400 line maximum limit (Rule 2A), zero `any` types (Rule 3), zero test regressions, 100% test pass rate across the full test suite (599+ tests), zero TypeScript compilation errors (`npm run typecheck`), and clean production build (`npm run build`).

## Acceptance Criteria

### Architecture & Line Limits
- [ ] `useOzipzDbStore.ts` and all domain slice files are each under 350 lines.
- [ ] `sqlite-service.ts`, `fallback-service.ts`, and all domain repository files are each under 350 lines, fully satisfying `IOzipzDatabaseService`.
- [ ] `ozipzCalculations.ts`, `reportAnnex.ts`, and all modular sub-calculators are each under 350 lines.
- [ ] `useActionsFiltering.ts`, `useActionEditorState.ts`, and their sub-hooks are each under 350 lines.

### Backward Compatibility & Contracts
- [ ] Zero breaking changes: all public APIs, hook signatures, store state selectors, and calculation function signatures remain 100% backward-compatible.
- [ ] Zero `any` types used in any slice, repository, or utility refactoring.

### Verification & Quality Gate
- [ ] TypeScript strict mode compiles with zero errors (`npm run typecheck`).
- [ ] 100% of automated unit, integration, and component tests pass without regressions (`npm test`).
- [ ] Production build succeeds with zero errors (`npm run build`).
- [ ] Codebase audit confirms no non-test source files in target domains exceed the 350-400 line limit.

## Follow-up — 2026-09-11T06:28:01Z

Conduct a comprehensive, multi-perspective architectural critique and code audit of the Ewidencja OZiPZ application, evaluating code quality, database and state integrity, UX/domain workflows, and test coverage to produce an actionable, prioritized improvement roadmap.

Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
Integrity mode: development

## Requirements

### R1. Architectural & Code Health Inspection
Audit the codebase against modern TypeScript/React best practices and GEMINI.md engineering standards:
- Adherence to SRP, DRY, and modular design.
- Detection of files exceeding 350-400 lines (monolith avoidance).
- Strict type safety (identifying any `any` usage, loose typing, or incomplete schema validation).
- Separation of concerns between UI components, Zustand stores, and database services.

### R2. Database, Schema & State Management Audit
Inspect the relational SQLite layer (`src/db/`) and Zustand stores (`src/features/ozipz/store/`):
- SQLite schema design, foreign keys, cascading rules, and indexing efficiency.
- Dual-mode architecture (`SqliteDatabaseService` vs `FallbackDatabaseService`) and mapper consistency.
- Enforcement of the "Zero Default Values" rule in models and forms.
- State mutation hygiene and store subscription granularity.

### R3. UI/UX & Domain Workflow Critique
Review user workflows across core OZiPZ modules (Działania Edukacyjne, Harmonogram/Kanban, Kancelaria JRWA, Mierniki i Raporty MZ/GIS, Rejestry, Materiały, Publikacje):
- Form validation UX, error states, and empty states.
- Consistency of design system components (`DataTable`, `ModalDialog`, `Badge`, `Card`).
- Edge-case handling (e.g., date boundary issues, empty relations, invalid data migration states).
- Accessibility and responsive scaling (`useFontSize`).

### R4. Test Coverage & Code Verification Analysis
Evaluate the testing suite and build pipeline:
- Current `vitest` unit test coverage and identification of untested critical business logic (e.g. calculation utilities, mappers, complex dialogs).
- Build and compilation health (`npm run build`).

### R5. Prioritized Remediation Roadmap
Synthesize findings into a structured, prioritized report:
- Categorized by severity/impact (Critical, High, Medium, Low).
- Concrete code locations (file paths and line ranges).
- Specific, actionable recommendations and refactoring recipes.

## Acceptance Criteria

### Audit Depth & Deliverables
- [ ] Comprehensive markdown audit report detailing architecture, database, domain UX, and testing.
- [ ] Clear inventory of monolithic files (>350-400 lines) and anti-patterns with refactoring strategies.
- [ ] Explicit verification matrix against the engineering rules in `GEMINI.md`.
- [ ] Prioritized list of actionable improvements with clear rationales and implementation guidelines.
- [ ] Current test execution and build status verified with commands (`npm run build`, `npm test`).
