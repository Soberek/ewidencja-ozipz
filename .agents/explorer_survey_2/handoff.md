# Handoff Report — Heavy Calculation Utilities Decomposition Architecture

**Agent**: Explorer Survey 2  
**Target Files**:
- `src/features/ozipz/utils/ozipzCalculations.ts` (1,134 lines)
- `src/features/ozipz/utils/reportAnnex.ts` (961 lines)  
**Date**: 2026-09-05  
**Working Directory**: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2`

---

## 1. Observation

### Current Line Counts and Monolith Status
- `wc -l src/features/ozipz/utils/ozipzCalculations.ts src/features/ozipz/utils/reportAnnex.ts`:
  ```
      1134 src/features/ozipz/utils/ozipzCalculations.ts
       961 src/features/ozipz/utils/reportAnnex.ts
      2095 total
  ```
  Both files massively violate `GEMINI.md` Rule 2A (maximum 350–400 lines per file).

### Exhaustive Export and Helper Inventory
1. **`src/features/ozipz/utils/ozipzCalculations.ts`**:
   - **Types & Interfaces (21)**: `TotalRecipientsResult` (line 14), `SyntheticActionMetrics` (line 43), `MonthlyBreakdownRow` (line 96), `ActionCategoryFilter` (line 113), `JrwaInterwencjaItem` (line 115), `MonthlySummaryResult` (line 242), `ExpectedMonthlyTarget` (line 355), `ExpectedMonthlyTargetsMap` (line 363), `MonthlyReconciliationFieldDiff` (line 365), `MonthlyReconciliationRow` (line 372), `MonthlyReconciliationSummary` (line 386), `AudienceGroupStatItem` (line 549), `FormBreakdownItem` (line 576), `TopicStatItem` (line 637), `ActionTypeStatItem` (line 660), `ProgramReachSummary` (line 692), `ProgramParticipationSummary` (line 724), `MunicipalityDetailedRow` (line 763), `MiernikWykonanieResult` (line 1044), `MiernikPlanInput` (line 1062), `MiernikPreviewInput` (line 1073).
   - **Constants (5)**: `DEFAULT_INTERWENCJE_JRWA` (line 122), `JRWA_INTERVENTION_KIND_MAP` (line 146), `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS` (line 515), `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_PROGRAM` (line 527), `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_NON_PROGRAM` (line 538).
   - **Functions (24)**: `calculateTotalRecipients` (line 21), `calculateRecipients` (line 41 alias), `calculateSyntheticActionMetrics` (line 56), `extractCleanJrwaSymbol` (line 154), `isProgramAction` (line 214), `calculateMonthlySummary` (line 252), `reconcileMonthlySummary` (line 403), `calculateAudienceGroupBreakdown` (line 555), `calculateFormBreakdown` (line 584), `filterActionsByPeriod` (line 606), `calculateTopicDistribution` (line 643), `calculateActionTypeStats` (line 666), `calculateMaterialTypeStats` (line 683), `calculateProgramReach` (line 701), `calculateProgramParticipationStats` (line 733), `calculateMunicipalityDetailedBreakdown` (line 777), `generateSubstantiveReportNarrative` (line 924), `compareJrwa` (line 977), `sanitizeRecentDate` (line 1006), `validateIntegerAtLeast` (line 1027), `nonNegativeInt` (line 1035), `calculatePercent` (line 1040), `calculateMiernikWykonanie` (line 1083), `isExcludedNieprogramoweWizytacja` (line 1123).
   - **Internal Helper (1)**: `jrwaParts` (line 996).

2. **`src/features/ozipz/utils/reportAnnex.ts`**:
   - **Re-exports (1)**: `downloadBlob` (line 11, from `./downloadHelper`).
   - **Constants (3)**: `POLISH_MONTHS` (line 13), `STATION_COUNTIES` (line 28), `COUNTY_LOCATIVE` (line 51).
   - **Header & Label Formatters (4)**: `formatStationForHeader` (line 74), `formatPeriodForHeader` (line 89), `buildDefaultHeaderTitle` (line 121), `formatReportMonthLabel` (line 136).
   - **Types & Interfaces (9)**: `ReportAnnexKind` (line 149), `ReportAnnexRow` (line 151), `AnnexReportItem` (line 161), `AnnexReportData` (line 169), `ReportHierarchyAction` (line 175), `ReportHierarchyGroup` (line 182), `ReportHierarchySection` (line 192), `ProgramsData` (line 462), `AggregatedMiernikData` (line 473).
   - **Exported Functions (7)**: `getNormalizedActionType` (line 205), `resolveInterventionName` (line 276), `buildReportAnnexRows` (line 353), `buildReportHierarchy` (line 408), `aggregateActionsToProgramsData` (line 483), `exportToTemplate` (line 715), `exportToCumulativeTemplate` (line 739), `downloadAnnexReportExcel` (line 763), `exportToExcel` (line 808), `downloadFullReportWorkbook` (line 875).
   - **Internal Helpers & Constants (9)**: `CELL_STYLES` (line 537), `isProgramNumber` (line 546), `styleProgramNameCell` (line 548), `LINE_HEIGHT_PT` (line 553), `applyNameCellAutoHeight` (line 555), `COLUMN_CONFIG` (line 567), `fillSection` (line 572), `createFallbackAnnexWorkbook` (line 625), `exportToTemplateGeneric` (line 652).

### Active Call Sites and Consumers
- **Consumers of `ozipzCalculations.ts`**:
  - `src/features/ozipz/utils/reportAnnex.ts`: `DEFAULT_INTERWENCJE_JRWA, JRWA_INTERVENTION_KIND_MAP, isProgramAction, extractCleanJrwaSymbol`
  - `src/features/ozipz/utils/programJrwaUtils.ts`: `compareJrwa`
  - `src/features/ozipz/utils/monthlyTargetsUtils.ts`: `isProgramAction`
  - `src/features/ozipz/utils/vacationReporting.ts`: `extractCleanJrwaSymbol`
  - `src/features/ozipz/hooks/useOzipzDb.ts`: `calculateTotalRecipients`
  - `src/features/ozipz/components/DashboardSection.tsx`: `calculateTotalRecipients`
  - `src/features/ozipz/components/reports/useReportsData.ts`: `isProgramAction`
  - `src/features/ozipz/components/reports/ProgramBreakdownTab.tsx`: `compareJrwa, isProgramAction`
  - `src/features/ozipz/components/reports/MunicipalityDetailedTab.tsx`: `calculateMunicipalityDetailedBreakdown`
  - `src/features/ozipz/components/reports/NarrativeReportTab.tsx`: `calculateSyntheticActionMetrics, calculateProgramParticipationStats, calculateAudienceGroupBreakdown, calculateMunicipalityDetailedBreakdown, generateSubstantiveReportNarrative`
  - `src/features/ozipz/components/reports/MiernikExecutionTab.tsx`: `calculateMiernikWykonanie, isProgramAction, isExcludedNieprogramoweWizytacja, type MiernikPlanInput`
  - `src/features/ozipz/components/reports/MiernikMonthlyReconciliation.tsx`: `isProgramAction, isExcludedNieprogramoweWizytacja`
  - `src/features/ozipz/components/reports/MiernikKpiCards.tsx`: `type MiernikWykonanieResult`
  - `src/features/ozipz/components/reports/components/miernik/MiernikPeriodExecutionCard.tsx`: `type MiernikWykonanieResult`
  - `src/features/ozipz/components/reports/components/miernik/MiernikAnnualPlanCard.tsx`: `type MiernikPlanInput, type MiernikWykonanieResult`
  - `src/features/ozipz/components/reports/reports.test.ts`: `calculateSyntheticActionMetrics, calculateMonthlySummary, calculateAudienceGroupBreakdown, calculateFormBreakdown, calculateProgramParticipationStats, calculateMunicipalityDetailedBreakdown, generateSubstantiveReportNarrative, calculateMiernikWykonanie`
  - `src/features/ozipz/utils/ozipzCalculations.test.ts`: 26 comprehensive unit tests covering all functions

- **Consumers of `reportAnnex.ts`**:
  - `src/features/ozipz/utils/reportExport.ts`: `downloadFullReportWorkbook`
  - `src/features/ozipz/utils/reportExport.test.ts`: `import * as reportAnnex from "./reportAnnex"`, `vi.spyOn(reportAnnex, "downloadFullReportWorkbook")`
  - `src/features/ozipz/components/reports/useReportsData.ts`: `buildReportAnnexRows, buildReportHierarchy, downloadAnnexReportExcel`
  - `src/features/ozipz/components/reports/useReportsData.test.ts`: `vi.mock("../../utils/reportAnnex", ...)`
  - `src/features/ozipz/components/reports/SprawozdanieExportTab.tsx`: `downloadAnnexReportExcel, buildReportAnnexRows`
  - `src/features/ozipz/components/reports/MiernikExecutionTab.tsx`: `formatReportMonthLabel`
  - `src/features/ozipz/components/reports/components/ReportMiernikTab.tsx`: `aggregateActionsToProgramsData, exportToTemplate, exportToCumulativeTemplate, exportToExcel, downloadFullReportWorkbook, buildDefaultHeaderTitle, formatPeriodForHeader`
  - `src/features/ozipz/components/reports/components/miernik/MiernikExportCard.tsx`: `STATION_COUNTIES`
  - `src/features/ozipz/components/reports/components/miernik/MiernikAnnexProgramsTable.tsx`: `type AggregatedMiernikData`
  - `src/features/ozipz/components/reports/reports.test.ts`: `buildReportAnnexRows, buildReportHierarchy`
  - `src/features/ozipz/utils/reportAnnex.test.ts`: 14 comprehensive unit tests

### Baseline Verification Results
1. `npx vitest run src/features/ozipz/utils/ozipzCalculations.test.ts src/features/ozipz/utils/reportAnnex.test.ts src/features/ozipz/utils/reportExport.test.ts src/features/ozipz/components/reports/reports.test.ts src/features/ozipz/components/reports/useReportsData.test.ts`:
   - Result: **5 test files passed, 65 tests passed (100%)**
2. Full project test suite (`npm test`):
   - Result: **77 test files passed, 599 tests passed (100%)**
3. Typecheck (`npm run typecheck`):
   - Result: **0 errors** (`tsc --noEmit` exited with 0)
4. Production build (`npm run build`):
   - Result: **0 errors** (`tsc && vite build` completed in 4.81s)

---

## 2. Logic Chain

1. **Monolith Boundary Analysis**:
   `ozipzCalculations.ts` (1,134 lines) and `reportAnnex.ts` (961 lines) exceed the 350–400 line limit by 2.8x and 2.4x respectively.
   Both files combine distinct responsibilities:
   - `ozipzCalculations.ts` mixes JRWA recognition, recipient summing, monthly budget reconciliations, categorical groupings, municipality demographic statistics, narrative text synthesis, and input sanitization.
   - `reportAnnex.ts` mixes geographic county nomenclature, Polish grammatical locatives, edu-report aggregation hierarchies, template-based Excel generation with ExcelJS, and custom multi-sheet workbook generation.

2. **Decoupling Strategy for `ozipzCalculations`**:
   Dividing into `src/features/ozipz/utils/calculators/`:
   - `actionMetrics.ts` (~95 lines): Single Responsibility = Total recipient sums & synthetic DZ/ODB/MAT counters.
   - `jrwaClassification.ts` (~155 lines): Single Responsibility = JRWA catalog, regex matching, program vs non-program detection, natural dot-segment JRWA sorting.
   - `monthlyBreakdown.ts` (~140 lines): Single Responsibility = Monthly breakdown aggregation across the 12 calendar months.
   - `monthlyReconciliation.ts` (~180 lines): Single Responsibility = Live-to-target monthly reconciliation and default target definitions.
   - `actionDistributions.ts` (~150 lines): Single Responsibility = Audience groups, activity forms, topics, action types, and material types distributions.
   - `programReach.ts` (~80 lines): Single Responsibility = Educational school program reach, pupils/parents totals, and declaration rates.
   - `municipalityBreakdown.ts` (~170 lines): Single Responsibility = Territorial cross-table of municipalities and substantive narrative text generator.
   - `miernikCalculations.ts` (~140 lines): Single Responsibility = Budget indicators 20.5.1.W / 20.5.1.2.W, plan vs live completion %, sanitizers.
   - Original `ozipzCalculations.ts` (~50 lines): Pure barrel re-export.
   *Every single resulting file is < 190 lines (well under the 300 line limit).*

3. **Decoupling Strategy for `reportAnnex`**:
   Dividing into `src/features/ozipz/utils/annex/`:
   - `annexConstants.ts` (~135 lines): Single Responsibility = Polish month names, 21 Zachodniopomorskie counties, locative dictionary, header title formatters.
   - `annexTypes.ts` (~75 lines): Single Responsibility = Pure TypeScript interfaces and types for annex structures.
   - `annexAggregation.ts` (~280 lines): Single Responsibility = Label normalization, intervention name resolution, 2-tier hierarchy builders (`ReportHierarchySection`), and `ProgramsData` aggregator.
   - `annexTemplateExport.ts` (~270 lines): Single Responsibility = ExcelJS template-based sheet filler (`zalnr1.xlsx`, `zalnr2.xlsx`) with automatic height calculation and cell font styling.
   - `annexWorkbookExport.ts` (~155 lines): Single Responsibility = Programmatic Excel generation (`exportToExcel` for "Miernik" sheet and `downloadFullReportWorkbook` with 3 tabs).
   - Original `reportAnnex.ts` (~40 lines): Re-exports `downloadBlob` and all submodule exports.
   *Every single resulting file is < 290 lines (strictly under the 300 line limit).*

4. **Zero-Regression Guarantee via Barrel Re-exports**:
   Because `src/features/ozipz/utils/ozipzCalculations.ts` and `src/features/ozipz/utils/reportAnnex.ts` remain in their exact filesystem locations and re-export 100% of symbols:
   - Existing consumers (UI components, hooks, stores) will not require a single line change.
   - `reportExport.test.ts` imports `* as reportAnnex` and uses `vi.spyOn(reportAnnex, "downloadFullReportWorkbook")` — this will continue to function seamlessly because the barrel re-exports the function as an exported module property.
   - `useReportsData.test.ts` uses `vi.mock("../../utils/reportAnnex", ...)` — this will continue to intercept the barrel module without any path updates.

---

## 3. Caveats

- No caveats regarding API coverage: all 21 types, 5 constants, and 24 functions in `ozipzCalculations`, as well as 9 types, 7 constants/formatters, and 7 functions in `reportAnnex` are completely mapped.
- When creating `annexWorkbookExport.ts`, note that `downloadFullReportWorkbook` internally calls `aggregateActionsToProgramsData` (from `annexAggregation.ts`) and `isProgramAction` (from `ozipzCalculations.ts`). Submodule imports should use explicit relative paths (e.g. `./annexAggregation` and `../ozipzCalculations`).
- In `exportToTemplateGeneric` (`annexTemplateExport.ts`), `fetch(templatePath)` is used in browser environments, falling back to `createFallbackAnnexWorkbook` if unavailable or in Node/Vitest test environments. This fallback logic must be preserved exactly as-is.

---

## 4. Conclusion

The proposed modularization plan will:
1. Decompose `ozipzCalculations.ts` (1,134 lines) into 8 submodules in `src/features/ozipz/utils/calculators/`, each between 80 and 180 lines, plus a ~50-line barrel file.
2. Decompose `reportAnnex.ts` (961 lines) into 5 submodules in `src/features/ozipz/utils/annex/`, each between 75 and 280 lines, plus a ~40-line barrel file.
3. Bring **100% of target files below 300 lines**, strictly fulfilling `GEMINI.md` Rule 2A (< 350–400 lines) and Requirement R3 of `ORIGINAL_REQUEST.md`.
4. Maintain 100% backward compatibility for all 28 consumer files and tests across the codebase.
5. Provide a zero-regression baseline confirmed by 65 calculation/report unit tests and 599 total project tests.

---

## 5. Verification Method

To independently verify the baseline and validate any subsequent implementation by the worker agent:

1. **Verify Target File Line Counts**:
   ```bash
   wc -l src/features/ozipz/utils/ozipzCalculations.ts src/features/ozipz/utils/reportAnnex.ts
   # Once modularized, verify all submodules are < 300 lines:
   wc -l src/features/ozipz/utils/calculators/*.ts src/features/ozipz/utils/annex/*.ts
   ```

2. **Execute Dedicated Calculation & Report Test Suites**:
   ```bash
   npx vitest run src/features/ozipz/utils/ozipzCalculations.test.ts \
                  src/features/ozipz/utils/reportAnnex.test.ts \
                  src/features/ozipz/utils/reportExport.test.ts \
                  src/features/ozipz/components/reports/reports.test.ts \
                  src/features/ozipz/components/reports/useReportsData.test.ts
   ```
   *Expected result: 5 test files, 65 tests passing.*

3. **Execute Full Project Test Suite**:
   ```bash
   npm test
   ```
   *Expected result: 77 test files, 599 tests passing.*

4. **Verify TypeScript Strict Compilation**:
   ```bash
   npm run typecheck
   ```
   *Expected result: 0 errors.*

5. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected result: successful Vite build without errors.*

6. **Invalidation Conditions**:
   - Any file in `calculators/` or `annex/` exceeding 300 lines.
   - Any broken consumer import or missing re-export in `ozipzCalculations.ts` or `reportAnnex.ts`.
   - Any test failure in `reportExport.test.ts` (spying on `downloadFullReportWorkbook`) or `useReportsData.test.ts` (mocking `reportAnnex`).
   - Any `any` type introduced into calculation signatures.
