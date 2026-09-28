# Architectural & Code Health Inspection Report (Requirement R1)

## 1. Observation

### A. Codebase Size & Monolithic Files Scan (GEMINI.md Rule 2A)
A comprehensive scan across all 485 files in `src/` revealed that the project maintains a high degree of modularization, but contains **12 production files exceeding the 350-line ceiling** defined in GEMINI.md Rule 2A.

| # | File Path | Lines | Category / Primary Responsibilities |
|---|-----------|-------|--------------------------------------|
| 1 | `src/db/types.ts` | 463 | Database Contracts: 18 SQL row interfaces, `IOzipzDatabaseService` (45+ methods), low-level SQL types, composite action params. |
| 2 | `src/components/ui/autocomplete.tsx` | 399 | UI Design System: Input rendering, token search, keyboard navigation, outside-click detection, list auto-scrolling, option grouping. |
| 3 | `src/features/ozipz/utils/programJrwaUtils.ts` | 398 | Domain Logic: Hardcoded heuristic keyword matching across 18 programs, IZRZ sign generation, JRWA case sign generation/regex, sign formatting. |
| 4 | `src/features/ozipz/schemas/ozipz.schemas.ts` | 392 | Validation Layer: Single god-schema file defining Zod schemas for all 17 domain entities + auxiliary tab/report schemas. |
| 5 | `src/db/client.ts` | 370 | DB Connection & Facade: Multi-environment DB initialization (Tauri, HTTP, Fallback), backup/restore logic, and 90 lines of repetitive delegation boilerplate for `OzipzDbService`. |
| 6 | `src/features/ozipz/components/publications/hooks/useGovImport.ts` | 369 | Scraper & Import Hook: Pagination, filtering, localStorage persistence of imported URLs, mapping, bulk creation of `OzipzPublication` and `OzipzAction`. |
| 7 | `src/components/ui/date-picker.tsx` | 365 | UI Design System: Popover calendar grid (6x7), Polish month/day formatting, input trigger, quick-select buttons, outside-click listener. |
| 8 | `src/features/ozipz/utils/monthlyTargetsUtils.ts` | 362 | Analytics & Reporting: Default templates, conversion utilities, schedule target extraction, 12-month compliance matrix calculation, annual summaries. |
| 9 | `src/features/ozipz/components/reports/useReportsData.ts` | 361 | Reporting State Hook: KPI summary calculation, monthly aggregations, program vs other stats, Excel/Annex export trigger states, and localStorage synchronization. |
| 10 | `src/features/ozipz/utils/scheduleExecutionUtils.ts` | 359 | Execution Matching: `resolveScheduleProgram`, media event heuristics, multi-criteria action-to-schedule matcher (`getMatchingActionsForScheduleEvent`), event enrichment. |
| 11 | `src/features/ozipz/utils/adnotacjaUtils.ts` | 356 | Official Annotations & Utilities: Contains 180 lines of static hardcoded `ADNOTACJA_POWODY` array (25 items) violating Rule 6, plus Markdown/HTML metric builders. |
| 12 | `src/features/ozipz/components/publications/govScraper.ts` | 356 | Web Scraper: URL normalization, HTTP redirect resolution, DOMParser HTML extraction, heuristic topic and JRWA categorization. |

#### Files Near the 350-Line Threshold (330–349 lines):
- `src/features/ozipz/components/schedule/components/ScheduleTableView.tsx` (343 lines)
- `src/features/todos/TodoApp.tsx` (342 lines)
- `src/features/ozipz/components/publications/hooks/useXImport.ts` (342 lines)
- `src/components/ui/select.tsx` (342 lines)
- `src/features/ozipz/components/programs/components/SchoolParticipationsTab.tsx` (341 lines)
- `src/features/ozipz/components/schedule/ScheduleSection.tsx` (340 lines)
- `src/features/ozipz/components/actions/ActionsSection.tsx` (335 lines)
- `src/features/ozipz/components/dictionaries/DictionaryDialog.tsx` (334 lines)
- `src/features/ozipz/components/facilities/FacilityDialog.tsx` (333 lines)

---

### B. Adherence to DRY, SRP, and SOLID (GEMINI.md Rule 1)

1. **Repetitive Delegation Boilerplate in `src/db/client.ts`**:
   Lines 280–369 contain 90 lines of repetitive method forwarding:
   ```typescript
   export const OzipzDbService: IOzipzDatabaseService = {
     async getActions() { return (await resolveService()).getActions(); },
     async addAction(a) { return (await resolveService()).addAction(a); },
     async updateAction(id, u) { return (await resolveService()).updateAction(id, u); },
     ... // 45+ identical forwarding methods
   };
   ```
2. **Duplicated Import/Sync Logic between `useGovImport.ts` and `useXImport.ts`**:
   Both hooks duplicate:
   - Reading/writing manual imported URL sets from `localStorage` as JSON arrays (`LOCAL_STORAGE_MANUAL_IMPORTED_KEY`).
   - Row selection, "select all", and "mark as imported" logic.
   - Bulk creation loop: creating an `OzipzPublication` and corresponding `OzipzAction` with default participant count 0 and status "wykonane".
3. **Hardcoded Domain Dictionaries in Code (Violation of Rule 6)**:
   - `src/features/ozipz/utils/adnotacjaUtils.ts:45–226`: Static hardcoded array `ADNOTACJA_POWODY` containing 25 reason objects with Polish text descriptions.
   - `src/features/ozipz/utils/programJrwaUtils.ts:38–97`: Hardcoded string matching for programs (`trzymaj-forme`, `hiv`, `zdrowe-zeby`, `higiena-tarcza`, etc.) and actions (`konkurs` -> `966.2`, `stoisko` -> `966.3`, `dystrybucja` -> `966.4`).
4. **SRP Violation & Leaking Domain Logic in `ScheduleSection.tsx`**:
   Lines 304–329 in `ScheduleSection.tsx` embed an inline loop inside a dialog callback that copies year plans, mapping 25 fields manually instead of delegating to a domain service/store action (`copyYearPlan`).
5. **Interface Segregation Principle (ISP) Violation in `IOzipzDatabaseService`**:
   `src/db/types.ts:370–462`: A single monolithic interface with 45 methods. Any consumer needing actions, schedule, or facilities depends on the entire 16-domain god-interface.
6. **Suboptimal Store Subscription Granularity in `useOzipzDb.ts`**:
   `src/features/ozipz/hooks/useOzipzDb.ts:8`:
   ```typescript
   export function useOzipzDb() {
     const store = useOzipzDbStore(); // Subscribes to the entire global store object!
   ```
   Whenever any table in the database mutates, every component calling `useOzipzDb()` re-renders, bypassing Zustand's selector optimization.

---

### C. TypeScript Strictness & Type Safety (GEMINI.md Rule 3)

1. **`any` Usage Audit**:
   - **Production code (`src/` excluding tests)**: **0 occurrences** of `any`. The production code adheres strictly to Rule 3.
   - **Test code**: **22 occurrences** of `any` (mock shortcuts, e.g. `dummyPrograms as any`, `eventWithYear: any`).
2. **`as unknown as` Usage in Production (9 occurrences)**:
   - `src/App.tsx:21`: Dynamic component loader casting for `lazyExport`.
   - `src/features/ozipz/components/templates/TemplateDialog.tsx:127, 143, 152`:
     ```typescript
     defaultAudience: "" as unknown as OzipzAudienceGroup,
     ```
     Encountered because `OzipzAudienceGroup` is a strict union of valid audiences that excludes `""`. To satisfy Rule 7 ("Zero Default Values" - initialize select fields with `""`), the component forces an unsafe double-cast instead of typing the form input as `OzipzAudienceGroup | ""`.
   - `src/features/ozipz/utils/annex/annexTemplateExport.ts:32, 65, 77`: Exceljs cell row/column number assertions.
   - `src/features/ozipz/utils/bezpieczneWakacjeUtils.ts:190`: Partial action assertion.
   - `src/features/ozipz/data/migratedData.ts:46`: Raw JSON parsed structure assertion.
3. **Bypassing Validation in Mapper (`src/db/mappers.ts:71–76`)**:
   ```typescript
   const result = ActionSchema.safeParse(raw);
   if (!result.success) {
     console.warn(`[Mappers.toAction] Ostrzeżenie walidacji wiersza akcji ${row.id}:`, result.error.format());
     return raw as OzipzAction; // Unchecked type assertion bypassing schema validation!
   }
   return result.data;
   ```
   Unlike all other mappers which call `.parse(raw)` and enforce runtime validity, `toAction` suppresses validation errors and returns an unvalidated object typed via `as OzipzAction`.
4. **Zod Validation Coverage (`ozipz.schemas.ts`)**:
   - Validation schemas exist for all 17 entities.
   - However, several schemas use `.default(...)` (e.g. `ProgramSchema.status` -> `"aktywny"`, `ScheduleEventSchema.status` -> `"zaplanowane"`, `FacilitySchema.county` -> `"powiat myśliborski"`). When shared between DB parsing and UI forms, this risks masking empty user selections in violation of Rule 7.

---

### D. Separation of Concerns & Modular Architecture

1. **Store vs Database Service Layer**:
   - **Boundary is strictly maintained**: In production code, `OzipzDbService` is imported **exclusively** within `src/features/ozipz/store/slices/*` and `src/db/client.ts`.
   - Zero UI components call `OzipzDbService` directly (only `SettingsSection.tsx` invokes backup/restore methods from `db/client`).
2. **Misplaced IPC Service (`src/db/assistant/client.ts`)**:
   - `src/db/assistant/client.ts` implements Tauri IPC calls (`invoke("assistant_call", ...)`) for the AI Assistant. It does not perform any SQLite or local storage database operations. Placing it under `src/db/` violates directory layout conventions.
3. **Isolated Parallel Mini-Application (`src/features/todos/`)**:
   - `src/features/todos/` implements its own database class `TodoDatabase` (`src/features/todos/todo-database.ts:49–60`) that runs independent raw DDL `CREATE TABLE IF NOT EXISTS todo_tasks`.
   - This table is outside the official schema (`DATABASE_SCHEMA.md`), outside `initTables()`, and unmanaged by `IOzipzDatabaseService`.
   - It also introduces an independent CSS file `todo.css` (8.2 KB).

---

### E. Build & Test Verification
- **TypeScript Compiler (`npx tsc --noEmit`)**: Passed with 0 errors.
- **Production Build (`npm run build`)**: Succeeded in 4.78s (`tsc && vite build`).
- **Unit Test Suite (`npx vitest run`)**: **109 test files passed (109), 862 tests passed (862)** in 43.52s.

---

## 2. Logic Chain

1. **Monolith Identification**:
   - GEMINI.md Rule 2A specifies a strict maximum file size of 350–400 lines to prevent monolithic files and ensure Single Responsibility.
   - Running `wc -l` over production `.ts`/`.tsx` files identified 12 files exceeding 350 lines.
   - Analysis of each of the 12 files reveals distinct, separable concerns (e.g., UI rendering vs. keyboard navigation, DB queries vs. backup management, calculation vs. export triggering).

2. **SOLID & DRY Analysis**:
   - In `src/db/client.ts`, 90 lines are spent manually delegating 45+ calls to `(await resolveService()).method()`. A JavaScript `Proxy` or automated wrapper achieves the exact same functionality in under 10 lines, adhering to DRY.
   - In `useGovImport.ts` and `useXImport.ts`, both implement the identical workflow of managing an imported URL cache in `localStorage` and iterating to dispatch both a publication and an action. Extracting a shared `useBulkImportManager` eliminates over 200 lines of duplicate code.
   - In `src/features/ozipz/utils/adnotacjaUtils.ts`, 180 lines define a static array of 25 annotation reasons. GEMINI.md Rule 6 explicitly mandates 100% relational storage where options originate dynamically from `ozipz_dictionaries`. Hardcoding them violates both DRY (duplicated against DB seeds) and Rule 6.
   - In `src/features/ozipz/hooks/useOzipzDb.ts`, subscribing to the entire store object (`useOzipzDbStore()`) without selectors breaks Zustand's change detection granularity and causes cascading re-renders across the 13 dependent components.

3. **Type Safety Reasoning**:
   - The production codebase achieves 0 `any` types, demonstrating disciplined typing.
   - However, `TemplateDialog.tsx` uses `"" as unknown as OzipzAudienceGroup` to reconcile the requirement that new form inputs start empty (Rule 7) with a domain type that forbids empty strings. Segregating form schemas into `TemplateFormInput` (allowing empty strings for unselected states) and `TemplateFormOutput` (strictly validating selection upon submit) provides 100% type safety without unsafe assertions.
   - In `src/db/mappers.ts:74`, returning `raw as OzipzAction` when `ActionSchema.safeParse` fails allows malformed SQLite rows to circulate as valid domain objects. The schema should be aligned with actual database constraints, or invalid rows must trigger controlled normalization/remediation.

---

## 3. Caveats

1. **Test File Lengths**: Test files were excluded from the monolith audit list above, although several test files (`jrwaIzrzComprehensive.test.ts` at 1252 lines, `coreModulesAdversarialChallenge.test.tsx` at 1149 lines) are large. This is acceptable under standard testing practices because they contain comprehensive suites, but splitting them per test scenario could improve maintainability.
2. **CSS Bundling**: `src/features/todos/todo.css` was analyzed as part of the `TodoApp` evaluation, but was not flagged as a TypeScript monolith since it is a stylesheet.
3. **Browser Storage Fallback**: The dual-mode database service architecture (`SqliteDatabaseService` vs `FallbackDatabaseService`) was examined for architectural boundaries; detailed query performance and relational cascade behavior are analyzed in companion reports.

---

## 4. Conclusion & Concrete Refactoring Recipes

The Ewidencja OZiPZ codebase exhibits high engineering discipline:
- Zero `any` types in production code.
- 100% test pass rate (862/862 tests passing across 109 suites).
- Clean separation between UI components and database services (no direct DB leaks into views; all CRUD operations pass through Zustand slices).

To achieve 100% compliance with GEMINI.md Rules 1, 2A, 3, 6, and 7, the following prioritized refactoring recipes are recommended:

### Priority 1: Decompose the 12 Monolithic Files (>350 lines)

1. **`src/db/types.ts` (463 lines -> 3 modular files <160 lines each)**:
   - Move SQL row interfaces to `src/db/types/sqlRows.ts` (~220 lines).
   - Segregate `IOzipzDatabaseService` into domain repository contracts (`IActionsRepository`, `IScheduleRepository`, `IFacilitiesRepository`, etc.) in `src/db/types/repositories.ts` unified under `IOzipzDatabaseService`.
   - Keep composite operation parameters (`SaveActionWithRelationsParams`, etc.) in `src/db/types/composite.ts`.

2. **`src/components/ui/autocomplete.tsx` (399 lines -> 2 files <150 lines each)**:
   - Extract `useAutocompleteNavigation` (handling token search, keyboard navigation, outside click, auto-scroll, and grouping) into `src/components/ui/useAutocompleteState.ts`.
   - Retain purely the JSX presentation structure in `autocomplete.tsx`.

3. **`src/features/ozipz/utils/programJrwaUtils.ts` (398 lines -> 3 files <140 lines each)**:
   - Move IZRZ sequence generation (`generateNextIzrzSign`) into `src/features/ozipz/utils/izrzUtils.ts` (where other IZRZ utilities reside).
   - Extract JRWA case numbering and sign formatting (`generateNextJrwaSign`, `formatFullJrwaSign`, `getJrwaDetails`) into `src/features/ozipz/utils/jrwaNumberingUtils.ts`.
   - Keep program-to-JRWA fallback heuristics in `src/features/ozipz/utils/programJrwaMapping.ts`.

4. **`src/features/ozipz/schemas/ozipz.schemas.ts` (392 lines -> Domain Schema Modules)**:
   - Decompose into domain files under `src/features/ozipz/schemas/`: `actions.schema.ts`, `schedule.schema.ts`, `programs.schema.ts`, `facilities.schema.ts`, `materials.schema.ts`, etc.
   - Re-export all schemas from `src/features/ozipz/schemas/index.ts` for backward compatibility.
   - Segregate form input schemas from entity schemas to avoid type casts.

5. **`src/db/client.ts` (370 lines -> 2 files <100 lines each)**:
   - Extract backup/restore routines (`createDatabaseBackup`, `restoreDatabaseBackup`, download helpers) into `src/db/backup-manager.ts`.
   - Extract `HttpSqlDatabase` to `src/db/http-sql-database.ts`.
   - Replace the 90 lines of manual delegation boilerplate in `OzipzDbService` with a dynamic `Proxy`:
     ```typescript
     export const OzipzDbService = new Proxy({} as IOzipzDatabaseService, {
       get(_, prop: string) {
         return async (...args: unknown[]) => {
           const service = (await getDatabaseService()) as Record<string, Function>;
           return service[prop](...args);
         };
       },
     });
     ```

6. **`useGovImport.ts` (369 lines) & `useXImport.ts` (342 lines)**:
   - Extract a shared hook `useImportedLinksStorage(storageKey)` and `useBulkImportSelection(items)`.
   - Extract the shared creation logic (`executePublicationBulkImport`) into a dedicated helper.
   - Reduces both hooks to <130 lines each and adheres to DRY.

7. **`src/components/ui/date-picker.tsx` (365 lines -> 2 files <150 lines each)**:
   - Extract popover calendar rendering to `src/components/ui/date-picker-popover.tsx`.
   - Retain input trigger and popover positioning in `date-picker.tsx`.

8. **`src/features/ozipz/utils/monthlyTargetsUtils.ts` (362 lines -> 2 files <180 lines each)**:
   - Extract actuals aggregation (`aggregateMonthlyActuals`) and annual summary calculation into `src/features/ozipz/utils/monthlyTargetsCompliance.ts`.
   - Retain target map conversion and schedule extraction in `monthlyTargetsUtils.ts`.

9. **`src/features/ozipz/components/reports/useReportsData.ts` (361 lines -> 2 hooks <150 lines each)**:
   - Extract Excel/Annex workbook generation and pending state handling into `useReportExports.ts`.
   - Retain KPI aggregations and state in `useReportsData.ts`.
   - Migrate `localStorage` metric plan caching (`ozipz_metric_plan_${year}`) to the relational SQLite table `ozipz_monthly_targets`.

10. **`src/features/ozipz/utils/scheduleExecutionUtils.ts` (359 lines -> 2 files <180 lines each)**:
    - Extract `resolveScheduleProgram` to `src/features/ozipz/utils/scheduleProgramResolver.ts`.
    - Retain event matching and enrichment in `scheduleExecutionUtils.ts`.

11. **`src/features/ozipz/utils/adnotacjaUtils.ts` (356 lines -> 1 utility file <120 lines)**:
    - Eliminate the 180 lines of static `ADNOTACJA_POWODY` array. Ensure all 25 items are seeded into SQLite table `ozipz_dictionaries` under `dict_type = 'annotationReason'` per Rule 6.
    - Keep formatting utilities (`formatDateLongPl`, `budujMarkdownAdnotacji`, `budujMetrykeHtml`) in `adnotacjaUtils.ts`.

12. **`src/features/ozipz/components/publications/govScraper.ts` (356 lines -> 2 files <180 lines each)**:
    - Extract URL redirect tracking (`resolveGovRedirect`) and network cache to `govScraperNetwork.ts`.
    - Retain HTML parsing and DOM extraction in `govScraper.ts`.

---

### Priority 2: Fix Loose Typings & Mapper Schema Bypass
1. In `src/features/ozipz/components/templates/TemplateDialog.tsx:127, 143, 152`:
   - Define `TemplateFormInput` with `defaultAudience: OzipzAudienceGroup | ""` to eliminate `"" as unknown as OzipzAudienceGroup`.
2. In `src/db/mappers.ts:74`:
   - Adjust `ActionSchema` to handle optional/migrated legacy fields cleanly so that `.parse(raw)` passes without throwing or falling back to an unvalidated `raw as OzipzAction`.
3. In `src/features/ozipz/components/schedule/ScheduleSection.tsx:304–329`:
   - Move the inline year-copy loop into `copyYearPlan` inside `useSchedule` / `schedule.slice.ts`.

---

### Priority 3: Architecture & Module Clean-up
1. Relocate `src/db/assistant/client.ts` to `src/features/ozipz/components/assistant/api/assistantClient.ts` to keep `src/db/` strictly reserved for database/storage infrastructure.
2. Evaluate `src/features/todos/`: Either formally integrate `todo_tasks` into `DATABASE_SCHEMA.md` and `initTables()`, or cleanly deprecate the legacy module from the OZiPZ production bundle.
3. In `src/features/ozipz/hooks/useOzipzDb.ts`, replace `const store = useOzipzDbStore()` with targeted slice selectors (`useOzipzDbStore((s) => s.dictionaryItems)`) to prevent unnecessary full-tree re-renders.

---

## 5. Verification Method

To independently verify all findings and validate any subsequent refactorings:

1. **Verify No `any` Types in Production**:
   ```bash
   python3 -c '
   import os, re
   pattern = re.compile(r"\b(as\s+any|:\s*any\b|<any>|any\[\]|<any,|, any>)")
   matches = [f"{os.path.join(r, f)}:{i}: {l.strip()}"
              for r, d, fs in os.walk("src")
              for f in fs if f.endswith((".ts", ".tsx")) and not (".test." in f or ".spec." in f)
              for i, l in enumerate(open(os.path.join(r, f), errors="ignore"), 1)
              if pattern.search(l)]
   print(f"Prod any occurrences: {len(matches)}")
   '
   ```
   *Expected Output*: `Prod any occurrences: 0`

2. **Verify File Length Thresholds (<350 lines)**:
   ```bash
   find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" -exec wc -l {} + | awk '$1 >= 350 {print $1, $2}' | sort -rn
   ```
   *Current Output*: 12 files listed in Table 1.
   *Target Output after refactoring*: Empty (0 files >= 350 lines).

3. **Verify Type-Check & Production Build**:
   ```bash
   npm run build
   ```
   *Expected Output*: Exit code 0, `tsc && vite build` completes without compilation errors.

4. **Verify Test Suite Integrity**:
   ```bash
   npx vitest run
   ```
   *Expected Output*: Exit code 0, all 109 test files and 862 tests pass.
