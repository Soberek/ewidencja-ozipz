# Handoff Report — Explorer Survey 3: Baseline Health, Action Hooks Deep Dive & Codebase Line Audit

## 1. Observation

### 1.1 Baseline Repository Health
All commands executed in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz`:

1. **Automated Unit & Integration Test Suite (`npm test -- --run`)**:
   - **Command**: `npm test -- --run`
   - **Result**: Exit code `0`
   - **Metrics**:
     ```
     Test Files  77 passed (77)
          Tests  599 passed (599)
       Start at  10:23:51
       Duration  52.52s (transform 3.76s, setup 0ms, collect 217.98s, tests 39.80s, environment 76.55s, prepare 5.26s)
     ```
   - **Status**: 100% passing across all 77 test suites. Zero failures, zero flakes.

2. **TypeScript Compilation Check (`npm run typecheck`)**:
   - **Command**: `npm run typecheck` (`tsc --noEmit`)
   - **Result**: Exit code `0`
   - **Output**: 0 type errors. Strict mode fully respected.

3. **Production Build (`npm run build`)**:
   - **Command**: `npm run build` (`tsc && vite build`)
   - **Result**: Exit code `0`
   - **Output**:
     ```
     vite v6.4.3 building for production...
     ✓ 2889 modules transformed.
     dist/index.html                                        0.59 kB │ gzip:   0.38 kB
     dist/assets/index-BTYhAow8.css                        71.62 kB │ gzip:  11.89 kB
     ...
     dist/assets/index-DWhjYofn.js                      1,044.51 kB │ gzip: 171.16 kB
     ✓ built in 4.88s
     ```

---

### 1.2 Entire Codebase Line Count Scan (>400 lines & 350-400 lines)
Scan performed with `find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*"`:

#### Non-Test Source Files Exceeding 400 Lines (Ordered by Line Count):
| File Path | Lines | Role / Domain | Target in ORIGINAL_REQUEST |
|---|---|---|---|
| `src/db/sqlite-service.ts` | 1184 | SQLite DB Service | **R2** |
| `src/features/ozipz/utils/ozipzCalculations.ts` | 1134 | Core KPI & Report Calculations | **R3** |
| `src/features/ozipz/utils/reportAnnex.ts` | 961 | Sprawozdanie Annex Exporter | **R3** |
| `src/features/ozipz/store/useOzipzDbStore.ts` | 955 | Central Zustand Store | **R1** |
| `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` | 675 | Actions Filtering & Selection Hook | **R4** |
| `src/features/ozipz/components/actions/editor/useActionEditorState.ts` | 617 | Action Form State & JRWA Hook | **R4** |
| `src/db/fallback-service.ts` | 582 | Browser LocalStorage DB Service | **R2** |
| `src/components/ui/autocomplete.tsx` | 557 | UI Component (Combobox/Autocomplete) | Generic UI Component |
| `src/features/ozipz/utils/monthlyTargetsUtils.ts` | 466 | Monthly Targets Matrix Math | Domain Utility |
| `src/components/ui/select.tsx` | 465 | UI Component (Radix-based Select) | Generic UI Component |
| `src/components/ui/date-picker.tsx` | 456 | UI Component (Pop-up Date Picker) | Generic UI Component |
| `src/db/types.ts` | 451 | Database Interfaces & SQL Rows | Type Definitions |
| `src/features/ozipz/components/publications/GovImportTab.tsx` | 436 | Gov.pl Scraper UI Tab | Publications Feature |
| `src/features/ozipz/utils/izrzUtils.ts` | 435 | IZRZ/EZD Document Helpers | Domain Utility |
| `src/db/mappers.ts` | 415 | SQL Row <-> Model Mappers | Database Mappers |
| `src/features/ozipz/components/publications/XImportTab.tsx` | 410 | X / Twitter Scraper UI Tab | Publications Feature |

#### Non-Test Source Files in the 350–400 Line Near-Limit Range:
| File Path | Lines | Role / Domain |
|---|---|---|
| `src/features/ozipz/utils/programJrwaUtils.ts` | 398 | Program & JRWA Symbol Utilities |
| `src/features/ozipz/components/actions/ActionsSection.tsx` | 395 | Primary Actions View Container |
| `src/features/ozipz/schemas/ozipz.schemas.ts` | 381 | Zod Validation Schemas |
| `src/features/ozipz/components/dashboard/DashboardCurrentMonthPlanCard.tsx` | 373 | Dashboard Plan View Card |
| `src/features/ozipz/components/registers/RegistersSection.tsx` | 371 | Registers View Container |
| `src/features/ozipz/components/reports/useReportsData.ts` | 365 | Reports Aggregation Hook |
| `src/features/ozipz/components/registers/RegisterDialog.tsx` | 361 | Register Modal Dialog |
| `src/features/ozipz/components/actions/IzrzDocumentDialog.tsx` | 361 | IZRZ Generator Modal Dialog |
| `src/features/ozipz/components/materials/components/MaterialsDistributionsTab.tsx` | 359 | Materials Distribution List Tab |
| `src/features/ozipz/utils/adnotacjaUtils.ts` | 355 | Schedule Annotation Utilities |
| `src/features/ozipz/components/publications/govScraper.ts` | 355 | Gov.pl DOM/HTML Parsing Logic |
| `src/features/ozipz/components/jrwa/JrwaCaseDetailsDialog.tsx` | 352 | JRWA Case View Dialog |

---

### 1.3 Deep Dive: `useActionsFiltering.ts` (675 lines)
- **Path**: `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts`
- **Current Lines**: 676 lines (with trailing newline)
- **Direct Consumers**:
  - `src/features/ozipz/components/actions/ActionsSection.tsx`
  - `src/features/ozipz/components/actions/hooks/useActionsFiltering.test.ts` (16 test cases, 552 lines)
- **Input Parameters**:
  ```ts
  interface UseActionsFilteringParams {
    actions: OzipzAction[];
    onDeleteAction: (id: string) => Promise<void>;
    onUpdateAction: (id: string, updates: Partial<OzipzAction>) => Promise<void>;
  }
  ```
- **Internal State & Logic Analysis**:
  1. **Filter State (lines 20–64)**:
     - Basic: `search`, `selectedMonth`, `periodFilter`, `statusFilter` ("aktywne" | "wszystkie" | "zakonczone")
     - Quick toggles: `quickFilterEzd`, `quickFilterCurrentMonth`, `quickFilterProgramOnly`, `quickFilterInProgress`, `materialsOnlyFilter`, `quickFilterPublications`
     - LocalStorage toggle: `hidePublications` (persisted in `localStorage.getItem("oz.hidePublications")`, default `true`) and `toggleHidePublications`
     - Advanced arrays: `selectedMunicipalities`, `selectedPrograms`, `selectedActivityTypes`, `selectedTopics`, `educatorFilter`, `ezdFilter`, `isAdvancedOpen`
  2. **Multi-Selection & Bulk Operations (lines 65–67, 137–156, 478–580)**:
     - `selectedActionIds` (`Set<string>`)
     - `selectedMetrics` (`recipients`, `materials`, `doEzd`)
     - Selection controls: `handleSelectAll`, `handleSelectFirstN`, `handleToggleSelect`, `isAllSelected`
     - Bulk mutators: `handleBulkDelete`, `handleBulkMarkDone`, `handleBulkMarkEzd`
     - Bulk exports: `handleBulkExportCsv`, `handleBulkCopySummary`
  3. **Month Locking & Auxiliary Tools (lines 68–100)**:
     - `isMonthModalOpen`, `setIsMonthModalOpen`
     - `closedMonths` (`Set<string>`, persisted in `localStorage.getItem("oz.closedMonths")`)
     - `toggleMonthLock`
     - `copiedSignId`, `handleCopySign` (copies JRWA sign to clipboard, resets indicator after 2s)
  4. **Analytics & Audits (lines 102–136)**:
     - `publicationAudit`: identifies publication actions that erroneously have `participantsCount > 0`
     - `stats`: computes global counts (`tasksCount`, `actionsCount`, `recipientsCount`, `materialsCount`, `doEzdCount`)
  5. **Core Filtering Calculation (`filteredActions`, lines 161–290)**:
     - 130 lines of chained filtering:
       - Status condition ("aktywne" excludes "odroczone", "zakonczone" requires "wykonane")
       - Quick filters (EZD, current month, program presence, w_toku/planowane, materials count > 0, publications)
       - Publication suppression when `hidePublications === true` unless explicit publication filter active
       - Period matching (Q1–Q4, H1–H2, 2-digit month)
       - Municipality array match
       - Program array match (including `"none"` for non-program)
       - Activity type array match (handling publication aliases and `normalizeActionType`)
       - Topic array match
       - Lead educator exact match
       - EZD status exact match
       - Full-text search over `title`, `facilityName`, `municipality`, `leadEducator`, `jrwaSign`, `programName`, `actionType`
       - Date descending sort
  6. **Filter Summary & Chips (lines 292–451)**:
     - `activeFiltersCount`
     - `activeFilterChips` (returns array of `ActiveFilterItem` with remove callbacks)
     - `handleClearFilters` (resets all filter state)
  7. **Backward-Compatibility Single-Value Setters (lines 582–595)**:
     - `setMunicipalityFilter`, `setProgramFilter`, `setActivityTypeFilter`, `setTopicFilter`

---

### 1.4 Deep Dive: `useActionEditorState.ts` (617 lines)
- **Path**: `src/features/ozipz/components/actions/editor/useActionEditorState.ts`
- **Current Lines**: 618 lines (with trailing newline)
- **Direct Consumers**:
  - `src/features/ozipz/components/actions/ActionEditorSection.tsx`
  - `src/features/ozipz/components/actions/ActionDialog.tsx`
  - `src/features/ozipz/components/actions/editor/useActionEditorState.test.ts` (9 test cases, 494 lines)
  - `src/features/ozipz/components/actions/editor/actionMaterialsDistribution.test.ts` (4 test cases, 387 lines)
- **Input Parameters**:
  `ActionEditorSectionProps` containing: `editingAction`, `actions`, `programs`, `materials`, `facilities`, `distributions`, `jrwaCases`, `dictionaryItems`, `staff`, `templates`, `onSave`, `onUpdate`, `onCancel`.
- **Internal State & Logic Analysis**:
  1. **React Hook Form Setup (lines 85–110)**:
     - Form resolver: `zodResolver(ActionFormSchema)`
     - Default values from `getDefaultActionFormValues(activityTypeDict, staff)`
     - Watched fields (15 fields)
     - Derived booleans: `isPublication`, `isDistribution`, `isNoJrwa`
  2. **Audience Groups Management (lines 51–57, 198–207)**:
     - Integrates `useAudienceGroups()`
     - Sync effect: updates form `audienceGroup` and `participantsCount` from structured groups unless `isPublication`
  3. **JRWA Resolution & Case Proposal (lines 58–68, 72–75, 243–267, 371–448, 450–490)**:
     - `selectedJrwaSymbol`, `autoCreateJrwaCase`, `generatedJrwaMeta`
     - `jrwaSymbolsList`
     - Handlers: `handleProgramSelect`, `handleJrwaSymbolChange`, `handleProgramOrJrwaSelect`, `handleGenerateJrwaSign`, `setQuickDate` (updates date and regenerates JRWA proposal)
  4. **Distributed Materials Management (lines 49, 124–161, 269–293, 529–554)**:
     - `materialItems` array state (`ActionDistributedMaterialItem[]`)
     - `handleAddMaterialItem`, `handleRemoveMaterialItem`, `handleUpdateMaterialItem`
     - Auto-sync effect: keeps form `materialsDistributedCount` equal to `sum(materialItems.quantity)` and `materialId` equal to first selected item
     - Edit-mode preload effect: loads distributions matching `editingAction`
  5. **Presets and Templates (lines 69, 80–84, 309–353)**:
     - `applyPreset(preset: ActionCardPreset)`: fills prefix, type, topic, audience, JRWA symbol, activities description
     - `handleApplyTemplate(tplId: string)`: pulls template title, topic, type, default audience, description template
     - `selectedTemplateId`
  6. **Facility Name Lookup & Address Auto-fill (lines 46, 228–241, 355–369)**:
     - `facilityAddress`
     - `handleFacilityNameInput(val)`: auto-matches facility by name / name+city, updates `facilityId`, `municipality`, `facilityAddress`
  7. **Publication & Distribution Guard Effects (lines 164–196)**:
     - Enforces 0 participants, 0 materials, "nie_dotyczy" EZD status, resets JRWA/IZRZ for publications
     - Sets "nie_dotyczy" EZD status, resets JRWA/IZRZ for standalone distributions
  8. **Action Initialization Effect (`actionKey`, lines 213–307)**:
     - Watches `editingAction` changes and populates or resets form, audience, notes, facility address, JRWA proposals, and material distribution items
  9. **Form Submission (`onSubmit`, lines 491–567)**:
     - Combines notes and activities description
     - Sanitizes payload (`cleanPayload`)
     - Builds `distributionMaterials` array
     - Distinguishes edit mode (`onUpdate`) vs create mode (`onSave`) with optional auto-created JRWA metadata

---

## 2. Logic Chain

1. **Premise**: GEMINI.md Rule 2A strictly prohibits files exceeding 350–400 lines and mandates modularization. ORIGINAL_REQUEST R4 explicitly targets `useActionsFiltering.ts` (675 lines) and `useActionEditorState.ts` (617 lines).
2. **Analysis of `useActionsFiltering.ts`**:
   - The file mixes 4 separate responsibilities into one monolithic hook:
     - (a) Pure filtering predicate logic across 12 criteria (130 lines) + filter chips generation + filters counter (160 lines total).
     - (b) Multi-action selection, bulk deletion, bulk status update, bulk CSV export, and clipboard summary (170 lines).
     - (c) Filter state management, quick toggles, advanced filter arrays, localStorage persistence for publications, and reset (170 lines).
     - (d) Closed months management and JRWA sign clipboard tool (60 lines).
   - **Deduction**: Extracting (a) into pure helper functions (`actionsFilterLogic.ts`), (b) into `useActionSelection.ts`, (c) into `useActionFilterState.ts`, and (d) into `useActionToolsState.ts` reduces each sub-module to 60–140 lines. The orchestrating `useActionsFiltering.ts` retains the exact same return signature and shrinks to ~120 lines.
3. **Analysis of `useActionEditorState.ts`**:
   - The file mixes 5 separate concerns:
     - (a) JRWA symbol resolution, sign auto-generation, date-based sign updates, and case proposal state (160 lines).
     - (b) Dynamic distributed materials array management, item quantity synchronization with form fields, and distribution formatting (110 lines).
     - (c) Presets and description template application (70 lines).
     - (d) Payload assembly and submission formatting (80 lines).
     - (e) React Hook Form coordination, audience synchronization, facility lookup, and prefill reset (200 lines).
   - **Deduction**: Extracting (a) into `useActionEditorJrwa.ts`, (b) into `useActionEditorMaterials.ts`, (c) into `useActionEditorPresets.ts`, and (d) into `actionEditorSubmitUtils.ts` leaves the main `useActionEditorState.ts` orchestrator at ~200 lines. All sub-modules will be 70–140 lines.
4. **Backward Compatibility Guarantee**:
   - Both hooks have extensive test suites (`useActionsFiltering.test.ts` with 16 tests, `useActionEditorState.test.ts` with 9 tests, `actionMaterialsDistribution.test.ts` with 4 tests).
   - Because the main hooks will continue to return identical object structures and accept identical props, all consumers (`ActionsSection.tsx`, `ActionDialog.tsx`, `ActionEditorSection.tsx`) and test suites will execute without modification or breaking changes.
5. **Full Codebase Audit Synthesis**:
   - There are exactly 16 non-test files exceeding 400 lines in `src/`.
   - 7 of those files are the direct targets of the project's refactoring requirements (R1: `useOzipzDbStore.ts`, R2: `sqlite-service.ts` and `fallback-service.ts`, R3: `ozipzCalculations.ts` and `reportAnnex.ts`, R4: `useActionsFiltering.ts` and `useActionEditorState.ts`).
   - The remaining 9 files are either UI components (`autocomplete.tsx`, `select.tsx`, `date-picker.tsx`, `GovImportTab.tsx`, `XImportTab.tsx`), type/mapper definitions (`types.ts`, `mappers.ts`), or utility calculators (`monthlyTargetsUtils.ts`, `izrzUtils.ts`).

---

## 3. Caveats

1. **Test Files Exceeding 400 Lines**:
   - 16 test files (e.g. `coreModulesAdversarialChallenge.test.tsx` at 1149 lines, `jrwaAdversarialChallenge.test.tsx` at 826 lines) exceed 400 lines. GEMINI.md Rule 2A focuses on source code files, dialogs, and components; test suites aggregate large adversarial suites. These do not block production builds, but could optionally be partitioned in future milestones.
2. **Generic UI Design System Components**:
   - `autocomplete.tsx` (557 lines), `select.tsx` (465 lines), and `date-picker.tsx` (456 lines) are generic UI primitives in `src/components/ui/`. They are not part of the OZiPZ domain logic or targets R1–R4, but should be tracked for modularization if the 400-line limit is applied globally to UI primitives.
3. **Publications Scraper Tabs**:
   - `GovImportTab.tsx` (436 lines) and `XImportTab.tsx` (410 lines) slightly exceed 400 lines due to embedded preview tables and DOM scraping status logic. They are separate from the R1–R4 scope.

---

## 4. Conclusion

### 4.1 Target R4 Architecture: Modular Action Hooks Breakdown
To bring both action hooks strictly under the 350-line limit without breaking existing contracts, the following file structure is proposed:

#### A. Modularization of `useActionsFiltering.ts` (Current: 675 lines -> Target: 5 files, all <150 lines):
1. `src/features/ozipz/components/actions/hooks/actionsFilterLogic.ts` (~140 lines):
   - Pure function `filterActionsList(actions, filters, options)`
   - Pure function `computeActiveFiltersCount(filters)`
   - Pure function `generateActiveFilterChips(filters, setters)`
   - 100% testable without hook harness.
2. `src/features/ozipz/components/actions/hooks/useActionSelection.ts` (~130 lines):
   - State `selectedActionIds`
   - Callbacks: `handleSelectAll`, `handleSelectFirstN`, `handleToggleSelect`, `isAllSelected`
   - Metrics: `selectedMetrics`
   - Bulk mutations: `handleBulkDelete`, `handleBulkMarkDone`, `handleBulkMarkEzd`
   - Bulk exports: `handleBulkExportCsv`, `handleBulkCopySummary`
3. `src/features/ozipz/components/actions/hooks/useActionFilterState.ts` (~130 lines):
   - Basic filter states (`search`, `selectedMonth`, `periodFilter`, `statusFilter`)
   - Quick filter toggles (`quickFilterEzd`, `quickFilterCurrentMonth`, `quickFilterProgramOnly`, `quickFilterInProgress`, `materialsOnlyFilter`, `quickFilterPublications`)
   - Publication visibility toggle (`hidePublications`, `toggleHidePublications`)
   - Advanced multi-filter arrays (`selectedMunicipalities`, `selectedPrograms`, `selectedActivityTypes`, `selectedTopics`, `educatorFilter`, `ezdFilter`, `isAdvancedOpen`)
   - Single-value setter adapters (`setMunicipalityFilter`, etc.)
   - Reset handler `handleClearFilters`
4. `src/features/ozipz/components/actions/hooks/useActionToolsState.ts` (~70 lines):
   - Closed months state (`closedMonths`, `isMonthModalOpen`, `toggleMonthLock`)
   - Sign clipboard helper (`copiedSignId`, `handleCopySign`)
5. `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (~120 lines):
   - Composition facade hook.
   - Computes `publicationAudit` and `stats`.
   - Returns the exact `UseActionsFilteringReturn` contract, maintaining 100% backward compatibility.

#### B. Modularization of `useActionEditorState.ts` (Current: 617 lines -> Target: 5 files, all <200 lines):
1. `src/features/ozipz/components/actions/editor/useActionEditorJrwa.ts` (~130 lines):
   - JRWA state: `selectedJrwaSymbol`, `autoCreateJrwaCase`, `generatedJrwaMeta`
   - Sign generation handlers: `handleProgramSelect`, `handleJrwaSymbolChange`, `handleProgramOrJrwaSelect`, `handleGenerateJrwaSign`
   - Quick date setter: `setQuickDate` (updates date and regenerates proposal)
2. `src/features/ozipz/components/actions/editor/useActionEditorMaterials.ts` (~90 lines):
   - State: `materialItems`, `setMaterialItems`
   - Handlers: `handleAddMaterialItem`, `handleRemoveMaterialItem`, `handleUpdateMaterialItem`
   - Synchronizes `materialsDistributedCount` and `materialId` with React Hook Form
   - Resolves `selectedMaterial`
3. `src/features/ozipz/components/actions/editor/useActionEditorPresets.ts` (~80 lines):
   - Template selection: `selectedTemplateId`, `setSelectedTemplateId`
   - Presets applicator: `applyPreset`
   - Template applicator: `handleApplyTemplate`
4. `src/features/ozipz/components/actions/editor/actionEditorSubmitUtils.ts` (~80 lines):
   - Pure function `buildActionCleanPayload(data, options)`
   - Pure function `buildActionDistributionMaterials(materialItems, materials, cleanPayload)`
5. `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (~200 lines):
   - Main orchestrating hook.
   - Manages React Hook Form (`useForm`), `useAudienceGroups`, `useActionEditorJrwa`, `useActionEditorMaterials`, `useActionEditorPresets`.
   - Executes facility matching (`handleFacilityNameInput`), action prefill synchronization effect, and `onSubmit`.
   - Returns the exact identical object contract.

---

## 5. Verification Method

To independently verify all findings and validate future implementations:

1. **Verify Baseline Tests**:
   ```bash
   npm test -- --run
   ```
   *Expected*: All 77 test suites pass, 599 tests pass, 0 failures.
   *Invalidation condition*: Any test failure or test count dropping below 599.

2. **Verify TypeScript Strict Compilation**:
   ```bash
   npm run typecheck
   ```
   *Expected*: Zero compilation errors (exit code 0).
   *Invalidation condition*: Any type error or use of `any`.

3. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Vite builds bundle successfully in <6s with exit code 0.
   *Invalidation condition*: Rollup/Vite bundling error.

4. **Verify Action Hook Tests Specifically**:
   ```bash
   npx vitest run src/features/ozipz/components/actions/hooks/useActionsFiltering.test.ts
   npx vitest run src/features/ozipz/components/actions/editor/useActionEditorState.test.ts
   npx vitest run src/features/ozipz/components/actions/editor/actionMaterialsDistribution.test.ts
   ```
   *Expected*: All 29 tests across these 3 files pass.

5. **Verify Line Counts of Target Files**:
   ```bash
   wc -l src/features/ozipz/components/actions/hooks/*.ts src/features/ozipz/components/actions/editor/*.ts
   ```
   *Expected*: None of the resulting refactored files exceed 350 lines.
