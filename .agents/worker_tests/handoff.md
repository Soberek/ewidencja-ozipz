# Handoff Report — Test Coverage & Build Verification (Requirement R4)

**Date**: 2026-09-11  
**Agent**: worker_tests (Test Coverage and Build Worker)  
**Working Directory**: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_tests`  
**Target Milestone**: R4 — Test Coverage & Code Verification Analysis  

---

## 1. Observation

### 1.1 Build Verification (`npm run build`)
The build verification was executed via `run_command` in the project root (`/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz`).

- **Command**: `npm run build` (`tsc && vite build`)
- **Exit Code**: `0` (Clean compilation and bundling)
- **Duration**: `4.99s`
- **Modules Transformed**: `3020` modules
- **TypeScript Typecheck**: Passed cleanly with zero diagnostic errors (`tsc` strict mode).
- **Warnings Observed**:
  - `(node:32090) ExperimentalWarning: SQLite is an experimental feature and might change at any time` (harmless warning from Node.js v22 built-in `node:sqlite`).
  - No Rollup chunk-size overflow warnings (custom limit: 1200 kB in `vite.config.ts`).
- **Bundle Breakdown**:
  | Chunk / Asset | Size | Gzip Size | Description |
  |---|---|---|---|
  | `dist/index.html` | 0.59 kB | 0.38 kB | Application entry HTML |
  | `dist/assets/index-D3g99L5a.css` | 75.62 kB | 12.60 kB | Compiled Tailwind CSS bundle |
  | `dist/assets/TodoApp-ZpROv6kT.css` | 8.22 kB | 2.13 kB | Todo sub-app styles |
  | `dist/assets/vendor-excel-bcCVMg2z.js` | 939.84 kB | 271.14 kB | `exceljs` & `xlsx` heavy vendor chunk |
  | `dist/assets/migratedData-B2nR0p61.js` | 555.13 kB | 53.77 kB | Default seeded historical data |
  | `dist/assets/index-ClyTutqF.js` | 493.78 kB | 118.43 kB | Main application bundle |
  | `dist/assets/vendor-framework-De4L3E1G.js` | 426.67 kB | 133.17 kB | React 19, Zustand, Radix UI, Lucide, Sonner |
  | `dist/assets/docxtemplater-BxiUrB9a.js` | 278.62 kB | 90.43 kB | Docx generation engine for IZRZ |
  | `dist/assets/ReportsSection-lnuDflkG.js` | 93.08 kB | 22.34 kB | Lazy report module (MZ/GIS, Mierniki) |
  | `dist/assets/ActionsSection-DjNj4HON.js` | 67.21 kB | 17.69 kB | Lazy actions list module |
  | `dist/assets/PublicationsSection-O_xVWqWz.js` | 55.52 kB | 14.54 kB | Publications, FB, X scraper module |
  | `dist/assets/dateUtils-fgoWRzSh.js` | 46.76 kB | 11.13 kB | Date formatting & manipulation |
  | `dist/assets/ScheduleSection-D47L1r0D.js` | 42.06 kB | 10.26 kB | Schedule Kanban, Calendar & Table |
  | `dist/assets/RegistersSection-r9XDo4vx.js` | 37.48 kB | 10.09 kB | Official registers module |
  | `dist/assets/JrwaSection-B8qYlNGB.js` | 29.07 kB | 7.45 kB | JRWA Registry & Case Files |
  | `dist/assets/FacilitiesSection-CtzsW2j_.js` | 25.09 kB | 6.64 kB | Facilities database module |
  | `dist/assets/AssistantSection-w-IBsk5m.js` | 23.50 kB | 7.69 kB | AI Assistant / prompt templates |
  | `dist/assets/ProgramsSection-DnfwyCVK.js` | 22.64 kB | 5.72 kB | Educational programs module |
  | `dist/assets/fallback-service-BPshEFEr.js` | 22.55 kB | 4.83 kB | Web LocalStorage fallback engine |
  | `dist/assets/MaterialsSection-BjuWjRG7.js` | 21.60 kB | 5.07 kB | Materials & distribution module |
  | `dist/assets/DashboardSection-Dayc8KiX.js` | 20.88 kB | 5.43 kB | Main dashboard KPI view |
  | `dist/assets/TodoApp-DBe_7lZv.js` | 15.98 kB | 6.03 kB | Auxiliary todo module |
  | `dist/assets/data-table-BINXVVw5.js` | 14.30 kB | 4.83 kB | Generic DataTable design component |
  | `dist/assets/ContactsSection-CDMb1JT7.js` | 13.96 kB | 4.21 kB | School coordinator contacts |
  | `dist/assets/DictionariesSection-BhdY3YDa.js` | 13.22 kB | 4.02 kB | Dictionary center module |
  | `dist/assets/reportExport-DMdyI6i5.js` | 11.38 kB | 4.90 kB | Report export helpers |
  | `dist/assets/TemplatesSection-DbkjB7_B.js` | 10.93 kB | 3.72 kB | Educational description templates |
  | `dist/assets/LettersSection-Ck0kz0WV.js` | 9.21 kB | 3.30 kB | Official letters module |
  | `dist/assets/StaffSection-Dwu-7oca.js` | 7.74 kB | 2.99 kB | Staff administration |
  | `dist/assets/SettingsSection-B2sPSupN.js` | 7.39 kB | 2.54 kB | Diagnostic & DB settings |
  | `dist/assets/ScansSection-D304BKO0.js` | 7.35 kB | 2.95 kB | Document archive scans |
  | `dist/assets/adnotacjaUtils-1J09X6PD.js` | 6.67 kB | 2.45 kB | Schedule annotation logic |
  | `dist/assets/RozdzielnikBlankietDialog-DUKZc7Gh.js`| 5.09 kB | 1.66 kB | Blank distribution generator |
  | `dist/assets/ActionEditorSection-D8p0ox8R.js` | 5.03 kB | 2.22 kB | Multi-step action editor view |
  | `dist/assets/scheduleExecutionUtils-Done1wPu.js`| 4.36 kB | 1.73 kB | Schedule live reconciliation |
  | `dist/assets/metric-card-C0AIqTEW.js` | 3.43 kB | 1.04 kB | UI Metric Card |
  | `dist/assets/empty-state-Ca6IpTcM.js` | 1.10 kB | 0.54 kB | UI Empty State |
  | `dist/assets/downloadHelper-63GTQedp.js` | 0.21 kB | 0.17 kB | Browser file download utility |

---

### 1.2 Test Suite Execution (`npx vitest run`)
The full test suite was executed via `npx vitest run`.

- **Command**: `npx vitest run`
- **Exit Code**: `0`
- **Total Test Files**: `109` (109 passed, 0 failed, 0 skipped)
- **Total Test Cases**: `862` (862 passed, 0 failed, 0 skipped)
- **Duration**: `43.73s` (transform 2.99s, setup 0ms, collect 96.31s, tests 22.10s, environment 38.55s, prepare 3.98s)
- **Coverage Tooling**: Running `npx vitest run --coverage` returned code `1`: `MISSING DEPENDENCY: Cannot find dependency '@vitest/coverage-v8'`.

---

### 1.3 Inventory of Test Suites (109 Files)

1. **Generic Design System UI (`src/components/ui/` - 8 test files)**:
   - `autocomplete.test.tsx`
   - `confirm-dialog.test.tsx`
   - `data-table.test.tsx`
   - `date-picker.test.tsx`
   - `empty-state.test.tsx`
   - `metric-card.test.tsx`
   - `modal-dialog.test.tsx`
   - `select.test.tsx`

2. **Database & Relational SQLite Layer (`src/db/` - 13 test files)**:
   - `sqlite-service.test.ts` (Core SQLite service with mock DB)
   - `sqlite-transactions.adversarial.test.ts` (Real in-memory `node:sqlite` execution with `PRAGMA foreign_keys = ON`, multi-table transactions, atomicity & rollback)
   - `sqlite-migrations.test.ts` (DDL migrations, index creation, trigger tests)
   - `fallback-service.test.ts` (LocalStorage CRUD operations)
   - `fallback-adversarial.test.ts` (Storage corruption, quota errors, isolated instances)
   - `mappers.test.ts` (Bi-directional SQL row <-> Domain Model mapping)
   - `relational.test.ts` (Relational query tests)
   - `serialized-service.test.ts` (Serialization tests)
   - `client-initialization.test.ts` (Dual-mode driver selection logic)
   - `client-backup.test.ts` (DB snapshot & restore mechanics)
   - `backup-storage.test.ts` (Backup file system storage)
   - `vite-sqlite-backup.test.ts` (Dev server SQLite backup endpoint)
   - `vite-sqlite-security.test.ts` (Security barriers & path traversal defense)

3. **Zustand State Management (`src/features/ozipz/store/` - 9 test files)**:
   - `useOzipzDbStore.test.ts` (Basic CRUD, loading states, protected dictionary prevention)
   - `useOzipzDbStore.adversarial.test.ts` (Cascading unlinking on action deletion across 4 collections)
   - `useOzipzDbStore.adversarial.2.test.ts` (Edge cases, multi-material distribution synchronization)
   - `useOzipzDbStore.adversarial.3.test.ts` (Facility deletion cascading across 10 relational entities)
   - `domainHooks.test.ts` (Memoized selectors: `municipalities`, `staffRoles`, `contactPositions`, etc.)
   - `referenceNames.test.ts` (Reference name resolver hooks)
   - `useModalStore.test.ts` (Modal open/close payload store)
   - `useAssistantStore.test.ts` (AI Assistant dialog store)
   - `useUIStore.test.ts` (Font size scale, dark mode, sidebar toggle)

4. **Domain Utilities & Calculations (`src/features/ozipz/utils/` - 21 test files)**:
   - `ozipzCalculations.test.ts` (27 tests: synthetic metrics, direct/indirect recipients, JRWA classification, percentages)
   - `reportAnnex.test.ts` (14 tests: Załącznik nr 1 & 2 aggregations, Excel workbook generation, header formatting)
   - `monthlyTargetsUtils.test.ts` (8 tests: 12-month compliance matrix, achievement threshold formulas)
   - `scheduleExecutionUtils.test.ts` (12 tests: live reconciliation between planned events and recorded actions)
   - `bezpieczneWakacjeUtils.test.ts` (7 tests: summer/winter vacation action classification, age groups)
   - `vacationReporting.test.ts` (12 tests: vacation narrative reporting)
   - `programJrwaUtils.test.ts` (7 tests: JRWA symbol resolution, sequence numbering `OZiPZ.966.X.Y.YEAR`)
   - `izrzGenerator.test.ts` (8 tests: Word docx binary generation, address resolution, XML manipulation)
   - `izrzUtils.test.ts` (7 tests: locality regex matching, ASCII slugging)
   - `actionFormUtils.test.ts` (5 tests: form payload builders)
   - `adnotacjaUtils.test.ts` (5 tests: schedule task change annotations)
   - `dateUtils.test.ts` (7 tests: Polish date formatting, ISO conversions)
   - `locationMapper.test.ts` (8 tests: address normalization)
   - `educationTypesUtils.test.ts` (4 tests: educational form normalization)
   - `opisTemplateUtils.test.ts` (3 tests: task substantive template parser)
   - `participationUtils.test.ts` (3 tests: school participation metrics)
   - `letterUtils.test.ts` (4 tests: incoming/outgoing letter formatting)
   - `reportExport.test.ts` (4 tests: CSV/JSON data export)
   - `downloadHelper.test.ts` (1 test: blob download anchor triggers)
   - `assistantUtils.test.ts` (11 tests: prompt context preparation)
   - `assistantDocx.test.ts` (4 tests: assistant docx generators)

5. **Feature Components & Views (55 test files)**:
   - Actions: `actions.test.ts`, `actionsIntegration.test.ts`, `actionsQuickIntegration.test.tsx`, `ActionQuickForm.test.tsx`, `actionMaterialsDistribution.test.ts`, `actionTemplates.test.tsx`, `editor.test.ts`, `useActionEditorState.test.ts`, `useActionsFiltering.test.ts`, `actionsList.test.tsx`, `actionEzdStatus.test.ts`
   - JRWA: `jrwa.test.ts`, `components/jrwaComponents.test.tsx`, `jrwaAdversarialChallenge.test.tsx`, `jrwaIzrzComprehensive.test.ts`
   - Schedule: `schedule.test.ts`, `components/scheduleComponents.test.tsx`
   - Facilities: `components/facilitiesComponents.test.tsx`
   - Contacts: `contacts.test.ts`, `components/contactsComponents.test.tsx`
   - Registers: `registers.test.ts`, `components/registersComponents.test.tsx`
   - Reports: `reports.test.ts`, `useReportsData.test.ts`, `components/monthlyTargetsComplianceTab.test.tsx`
   - Materials: `materials.test.ts`, `components/materialsComponents.test.tsx`
   - Programs: `programs.test.ts`, `components/programsComponents.test.tsx`, `programsAdversarialChallenge.test.tsx`, `components/programsChallengerStress.test.tsx`
   - Publications: `publications.test.tsx`, `govScraper.test.ts`, `xScraper.test.ts`, `useImportHooks.test.ts`
   - Letters: `components/lettersComponents.test.tsx`
   - Scans: `components/scansComponents.test.tsx`
   - Staff: `components/staffComponents.test.tsx`
   - Templates: `components/templatesComponents.test.tsx`
   - Settings: `components/settingsComponents.test.tsx`
   - Dashboard: `components/dashboard/dashboard.test.tsx`
   - Assistant: `AssistantSection.test.tsx`, `AssistantSettings.test.tsx`
   - Layout: `components/layout/sidebar.test.tsx`
   - Cross-cutting Stress: `coreModulesAdversarialChallenge.test.tsx`, `core_modules_challenger.test.tsx`, `challenger_stress.test.tsx`
   - Data & Schemas: `dictionaries.test.ts`, `taskMapping81.test.ts`, `ozipz.schemas.test.ts`
   - Hooks: `useFontSize.test.ts`, `useKeyboardShortcuts.test.ts`, `useOzipzDb.test.ts`, `modalActionUtils.test.ts`

6. **Auxiliary / Todos (3 test files)**:
   - `TodoApp.test.tsx`, `todo-database.test.ts`, `todo-tree.test.ts`

---

### 1.4 Detailed Inspection of Dialog Coverage (26 Dialogs)
A comprehensive search for all dialog components revealed 26 Dialog files in `src/features/ozipz/components/`:

| Dialog Component | Tested in Vitest? | Test File Reference |
|---|:---:|---|
| `ActionDialog.tsx` | **YES** | `actionsQuickIntegration.test.tsx:41` |
| `JrwaCaseDetailsDialog.tsx` | **YES** | `jrwaComponents.test.tsx:396`, `jrwaAdversarialChallenge.test.tsx:117` |
| `LetterDialog.tsx` | **YES** | `lettersComponents.test.tsx:369` |
| `RegisterDialog.tsx` | **YES** | `registersComponents.test.tsx:399` |
| `ScanDialog.tsx` | **YES** | `scansComponents.test.tsx:158` |
| `StaffDialog.tsx` | **YES** | `staffComponents.test.tsx:143` |
| `TemplateDialog.tsx` | **YES** | `templatesComponents.test.tsx:185` |
| `IzrzDocumentDialog.tsx` | **NO** | *0 mentions in test files* |
| `FacilityDialog.tsx` | **NO** | *0 mentions in test files* |
| `FacilityEmailsCopyDialog.tsx` | **NO** | *0 mentions in test files* |
| `JrwaDialog.tsx` | **NO** | *0 mentions in test files* |
| `DistributionDialog.tsx` | **NO** | *0 mentions in test files* |
| `MaterialDialog.tsx` | **NO** | *0 mentions in test files* |
| `RozdzielnikBlankietDialog.tsx` | **NO** | *0 mentions in test files* |
| `ParticipationDialog.tsx` | **NO** | *0 mentions in test files* |
| `ProgramDialog.tsx` | **NO** | *0 mentions in test files* |
| `PublicationDialog.tsx` | **NO** | *0 mentions in test files* |
| `TargetsDistributeDialog.tsx` | **NO** | *0 mentions in test files* |
| `AdnotacjaDialog.tsx` | **NO** | *0 mentions in test files* |
| `AdnotacjaBulkDialog.tsx` | **NO** | *0 mentions in test files* |
| `AdnotacjeListDialog.tsx` | **NO** | *0 mentions in test files* |
| `CopyYearPlanDialog.tsx` | **NO** | *0 mentions in test files* |
| `ScheduleDialog.tsx` | **NO** | *0 mentions in test files* |
| `ContactDialog.tsx` | **NO** | *0 mentions in test files* |
| `DictionaryDialog.tsx` | **NO** | *0 mentions in test files* |
| `TemplatePreviewDialog.tsx` | **NO** | *0 mentions in test files* |

**Result**: Only **7 out of 26 Dialogs (26.9%)** have component/DOM integration tests. **19 Dialogs (73.1%)** completely lack component-level rendering or submission tests.

---

## 2. Logic Chain

1. **Premise 1 (Build Verification)**:
   - Running `npm run build` executed `tsc && vite build`.
   - `tsc` completed with zero type errors, confirming TypeScript strict compliance across the entire codebase.
   - Vite bundled 3020 modules in 4.99s into well-partitioned chunks (`vendor-excel`, `vendor-framework`, `docxtemplater`, lazy module chunks per domain section).
   - *Inference*: The project's build health is excellent and meets GEMINI.md Rule 3 standards.

2. **Premise 2 (Test Suite Health)**:
   - `npx vitest run` executed 109 test files containing 862 tests with 100% pass rate in 43.73s.
   - The test suite covers diverse aspects from unit math to adversarial multi-table foreign-key cascade tests in SQLite.
   - *Inference*: The existing test base is healthy, fast, and regression-free.

3. **Premise 3 (Gap Identification in Utilities & Database Services)**:
   - Inspection of `src/features/ozipz/utils/` revealed that while major calculation flows (`ozipzCalculations.ts`, `monthlyTargetsUtils.ts`, `reportAnnex.ts`, `scheduleExecutionUtils.ts`) have dedicated tests, helper modules such as `izrzAddressUtils.ts` (inflected locality extraction, postal codes) rely on partial transitive coverage from `izrzUtils.test.ts`.
   - Inspection of `src/db/repositories/` revealed that SQLite and Fallback repository classes (`sqlite-actions.repository.ts`, `sqlite-facilities.repository.ts`, etc.) are tested primarily through top-level services (`sqlite-service.test.ts`, `sqlite-transactions.adversarial.test.ts`), rather than isolated unit tests validating individual SQL syntax permutations and constraint edge cases.

4. **Premise 4 (Gap Identification in Zustand Store)**:
   - `useOzipzDbStore.ts` delegates to 15 slice modules under `src/features/ozipz/store/slices/`.
   - While primary slices (`core`, `actions`, `facilities`, `materials`, `schedule`) have rigorous adversarial cascade tests, secondary slices (`letters.slice.ts`, `scans.slice.ts`, `templates.slice.ts`, `registers.slice.ts`, `publications.slice.ts`) have no direct slice-level unit tests testing failure handling, concurrent operations, or store state mutation hygiene.

5. **Premise 5 (Gap Identification in UI Dialogs)**:
   - A systematic search of all 26 modal dialogs showed that 19 dialogs have zero component rendering or user interaction tests.
   - Among the untested dialogs are high-risk forms: `FacilityDialog.tsx` (complex vs. school structure, coordinates, emails), `IzrzDocumentDialog.tsx` (official IZRZ card generation for EZD), `JrwaDialog.tsx` (official case registration), `ScheduleDialog.tsx` and `AdnotacjaDialog.tsx` (harmonogram modifications), and `MaterialDialog.tsx` / `DistributionDialog.tsx` (stock movements).
   - If a schema or prop regression is introduced in these dialogs, the current test suite will not detect it.

---

## 3. Caveats

- `@vitest/coverage-v8` was not present in `devDependencies`, so line-by-line instrumented coverage percentage was determined through static analysis and AST/import mapping rather than a dynamic coverage report.
- The 19 untested dialogs do not necessarily mean their business logic is untested: the underlying Zod schemas (`ozipz.schemas.test.ts`) and store operations (`useOzipzDbStore.test.ts`) are tested. However, user input handling, form error presentation, field resetting ("Zero Default Values" per GEMINI.md Rule 7), and dialog open/close lifecycles in those 19 dialogs are currently unverified by automated tests.

---

## 4. Conclusion & Recommendations (Tier 1-4 Methodology)

The Ewidencja OZiPZ build pipeline is fully stable (passing in 4.99s with clean TypeScript typechecking). The test suite is solid (862 passing tests across 109 files), with strong domain coverage for report aggregations, miernik metrics, and SQLite transaction rollback.

However, the primary testing blind spots reside in:
1. **Interactive Dialog Integration (19 unverified dialogs)**
2. **Dedicated Unit Tests for Individual DB Repositories**
3. **Automated Coverage Tooling (`@vitest/coverage-v8`)**

### Actionable Test Expansion Roadmap (Tier 1-4):

#### Tier 1: Regulatory & Calculation Edge Cases (Statutory & Financial Compliance)
- **Install Coverage Tooling**: Add `@vitest/coverage-v8` to `devDependencies` and configure Vitest `coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] }` in `vite.config.ts`.
- **Target**: `src/features/ozipz/utils/izrzAddressUtils.ts`: Add dedicated unit tests for all 38 inflected locality cases (e.g. "w Smolnicy", "w Ratajach", "w Cychrach", "w Różańsku") and postal code fallbacks for all municipalities in powiat myśliborski.
- **Target**: `src/features/ozipz/utils/calculators/`: Expand unit test permutations for `isExcludedNieprogramoweWizytacja` and edge cases where non-integer or negative recipient counts might be supplied from legacy imports.

#### Tier 2: Relational Integrity & Repository Units (Database Layer)
- **Target**: `src/db/repositories/sqlite/`: Write unit test suites for individual repository classes (`sqlite-facilities.repository.test.ts`, `sqlite-materials.repository.test.ts`, `sqlite-registry.repository.test.ts`) validating direct SQL error handling (e.g., SQLite constraint violation `SQLITE_CONSTRAINT_FOREIGNKEY`).
- **Target**: `src/db/client.ts`: Add tests verifying graceful degradation when Tauri SQL plugin fails or times out, ensuring fallback to `FallbackDatabaseService` without crashing the application.

#### Tier 3: Store Slice Resilience & Mutation Hygiene (Zustand Layer)
- **Target**: Slices in `src/features/ozipz/store/slices/`: Add focused unit tests for secondary slices:
  - `letters.slice.test.ts`: Verify letter status transitions and filtering.
  - `scans.slice.test.ts`: Verify document upload metadata caching.
  - `templates.slice.test.ts`: Verify custom template creation and placeholder interpolation.
- **Target**: Error recovery in `useOzipzDbStore`: Test that when an update action fails in the database service, the store reverts the optimistic local state or leaves previous state intact.

#### Tier 4: Interactive Dialog Integration & User Workflows (UI Layer)
- **Priority 4A (Critical Domain Dialogs)**:
  - `IzrzDocumentDialog.test.tsx`: Test full rendering, address synthesis, file name generation, and download trigger.
  - `FacilityDialog.test.tsx`: Test form validation with Zod, adding a complex facility, adding standalone schools, and selecting parent complexes. Verify adherence to GEMINI.md Rule 7 ("Zero Default Values" — placeholders must be present and selection required).
  - `ScheduleDialog.test.tsx` & `AdnotacjaDialog.test.tsx`: Test creation of scheduled task, date shifting, and adnotacja reason registration.
  - `JrwaDialog.test.tsx`: Test next case sequence number suggestion and auto-sign formatting.
- **Priority 4B (Operational & Inventory Dialogs)**:
  - `MaterialDialog.test.tsx` & `DistributionDialog.test.tsx`: Test inventory adjustments, recipient assignment, and quantity validation.
  - `ParticipationDialog.test.tsx`: Test school program declaration vs final report toggle.
  - `PublicationDialog.test.tsx`: Test article title, portal type, reach metrics, and link input.

---

## 5. Verification Method

To independently verify the observations and findings in this report:

1. **Verify Build**:
   ```bash
   npm run build
   ```
   *Expected Result*: Exit code 0, 3020 modules transformed, duration ~5s, zero TypeScript compiler errors.

2. **Verify Test Suite**:
   ```bash
   npx vitest run
   ```
   *Expected Result*: Exit code 0, exactly 109 test files passed, 862 tests passed, zero failures.

3. **Verify Dialog Test Gap**:
   Run grep for unmentioned dialogs:
   ```bash
   rg "IzrzDocumentDialog" src/ --glob "*.test.*"
   rg "FacilityDialog" src/ --glob "*.test.*"
   rg "ScheduleDialog" src/ --glob "*.test.*"
   ```
   *Expected Result*: 0 matches in test files, confirming the coverage gap documented in Section 1.4.
