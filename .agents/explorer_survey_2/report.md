# Technical Report: Heavy Calculation Utilities Decomposition Architecture

**Author**: Explorer Survey 2  
**Target Files**:
1. `src/features/ozipz/utils/ozipzCalculations.ts` (1,134 lines)
2. `src/features/ozipz/utils/reportAnnex.ts` (961 lines)
**Total Monolithic Volume**: 2,095 lines  
**Date**: 2026-09-05  

---

## 1. Executive Summary & Objective

Both `ozipzCalculations.ts` (1,134 lines) and `reportAnnex.ts` (961 lines) severely exceed the architectural boundary defined in `GEMINI.md` Rule 2A (maximum 350–400 lines per non-test source file). 
The objective of this survey is to:
1. Conduct an exhaustive inventory of every exported function, type/interface, constant, and internal helper.
2. Map all active call sites and consumers across the codebase (including unit tests, hooks, and UI components).
3. Design a clean, decoupled submodule architecture (`calculators/` and `annex/`) where **every single submodule is strictly under 300 lines**.
4. Verify zero breaking changes via transparent barrel re-exports from the original file paths.
5. Establish and verify baseline test coverage (all 65 relevant tests passing, 599/599 project-wide tests passing, clean typecheck, clean build).

---

## 2. Inventory: `src/features/ozipz/utils/ozipzCalculations.ts` (1,134 lines)

### A. Exported Interfaces & Types
| Name | Line | Structure / Role |
|---|---|---|
| `TotalRecipientsResult` | 14 | `{ direct: number; indirect: number; total: number; materialsCount: number; }` |
| `SyntheticActionMetrics` | 43 | Aggregate metrics: `{ tasksCount, dzCount, directRecipients, indirectRecipients, totalRecipients, materialsDistributed, executedCount, plannedCount, uniqueFacilitiesCount, uniqueTopicsCount }` |
| `MonthlyBreakdownRow` | 96 | Monthly table row: `{ monthKey, monthNumber, monthName, shortName, year, label, icon, tasksCount, actionsCount, recipientsCount, materialsCount, doneCount, plannedCount, percentageOfMax }` |
| `ActionCategoryFilter` | 113 | `"all" \| "program" \| "non_program"` |
| `JrwaInterwencjaItem` | 115 | `{ jrwa: string; nazwa: string; rodzaj: "PROGRAMOWE" \| "NIEPROGRAMOWE"; aktywna?: boolean; }` |
| `MonthlySummaryResult` | 242 | Aggregate monthly summary: `{ rows, totalTasks, totalActions, totalRecipients, totalMaterials, totalDone, maxMonthlyActions }` |
| `ExpectedMonthlyTarget` | 355 | Target goals per month: `{ tasksCount?, actionsCount?, recipientsCount?, materialsCount?, doneCount? }` |
| `ExpectedMonthlyTargetsMap` | 363 | `Record<string, ExpectedMonthlyTarget>` |
| `MonthlyReconciliationFieldDiff` | 365 | Comparison diff: `{ actual, expected, diff, matches }` |
| `MonthlyReconciliationRow` | 372 | Extends `MonthlyBreakdownRow` with reconciliation flags and `fieldDiffs` |
| `MonthlyReconciliationSummary` | 386 | Full summary with totals and mismatch counter |
| `AudienceGroupStatItem` | 549 | `{ group: string; actionsCount: number; directRecipients: number; }` |
| `FormBreakdownItem` | 576 | `{ form: string; actionsCount, directRecipients, indirectRecipients, materialsDistributed }` |
| `TopicStatItem` | 637 | `{ topic: OzipzHealthTopic; count: number; participants: number; }` |
| `ActionTypeStatItem` | 660 | `{ type: OzipzActionType; count: number; participants: number; }` |
| `ProgramReachSummary` | 692 | `{ programId, programName, participatingSchools, totalPupils, totalParents, actionsCount }` |
| `ProgramParticipationSummary` | 724 | `{ totalSchools, totalPupils, totalParents, declarationsCount, finalReportsCount, completionRate }` |
| `MunicipalityDetailedRow` | 763 | Detailed breakdown per municipality across schools, actions, pupils, and materials |
| `MiernikWykonanieResult` | 1044 | Split of programowe/akcje/razem, planowane, and percentages |
| `MiernikPlanInput` | 1062 | Plan inputs for budget indicators (snake_case and camelCase compatibility) |
| `MiernikPreviewInput` | 1073 | Live preview inputs for budget indicator calculation |

### B. Exported Constants
| Name | Line | Type / Value |
|---|---|---|
| `DEFAULT_INTERWENCJE_JRWA` | 122 | Official catalog of 21 JRWA symbols (`966.1`–`966.18`, `0442`, `9011.1`, `9011.2`) with `PROGRAMOWE` / `NIEPROGRAMOWE` flags |
| `JRWA_INTERVENTION_KIND_MAP` | 146 | Fast lookup `Map<string, "PROGRAMOWE" \| "NIEPROGRAMOWE">` |
| `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS` | 515 | Reference 2026 monthly targets (combined) |
| `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_PROGRAM` | 527 | Reference 2026 monthly targets (programowe) |
| `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_NON_PROGRAM` | 538 | Reference 2026 monthly targets (nieprogramowe) |

### C. Exported Functions
| Name | Line | Signature & Purpose |
|---|---|---|
| `calculateTotalRecipients` | 21 | `(actions?: OzipzAction[]) => TotalRecipientsResult` |
| `calculateRecipients` | 41 | Alias of `calculateTotalRecipients` |
| `calculateSyntheticActionMetrics` | 56 | `(actions: OzipzAction[]) => SyntheticActionMetrics` |
| `extractCleanJrwaSymbol` | 154 | `(action: Partial<OzipzAction>) => string \| null` (sanitizes JRWA code, ignores technical IDs) |
| `isProgramAction` | 214 | `(action: Partial<OzipzAction>, customKindMap?: ReadonlyMap<string, "PROGRAMOWE" \| "NIEPROGRAMOWE">) => boolean` |
| `calculateMonthlySummary` | 252 | `(actions: OzipzAction[], yearFilter?: string, categoryFilter?: ActionCategoryFilter) => MonthlySummaryResult` |
| `reconcileMonthlySummary` | 403 | `(monthlySummary: MonthlySummaryResult, targets: ExpectedMonthlyTargetsMap) => MonthlyReconciliationSummary` |
| `calculateAudienceGroupBreakdown` | 555 | `(actions: OzipzAction[]) => AudienceGroupStatItem[]` |
| `calculateFormBreakdown` | 584 | `(actions: OzipzAction[]) => FormBreakdownItem[]` |
| `filterActionsByPeriod` | 606 | `(actions: OzipzAction[], yearFilter?: string, periodFilter?: string) => OzipzAction[]` |
| `calculateTopicDistribution` | 643 | `(actions: OzipzAction[]) => TopicStatItem[]` |
| `calculateActionTypeStats` | 666 | `(actions: OzipzAction[]) => ActionTypeStatItem[]` |
| `calculateMaterialTypeStats` | 683 | `(materials: OzipzMaterial[]) => { type: string; count: number }[]` |
| `calculateProgramReach` | 701 | `(programs: OzipzProgram[], participations: OzipzSchoolParticipation[], actions: OzipzAction[]) => ProgramReachSummary[]` |
| `calculateProgramParticipationStats` | 733 | `(participations: OzipzSchoolParticipation[]) => ProgramParticipationSummary` |
| `calculateMunicipalityDetailedBreakdown` | 777 | `(participations: OzipzSchoolParticipation[], actions: OzipzAction[], facilities?: OzipzFacility[], distributions?: OzipzDistribution[], knownMunicipalities?: string[]) => MunicipalityDetailedRow[]` |
| `generateSubstantiveReportNarrative` | 924 | `(params: { ... }) => string` (official narrative text for GIS/MZ) |
| `compareJrwa` | 977 | `(a?: string \| null, b?: string \| null) => number` (natural dot-segment comparison) |
| `sanitizeRecentDate` | 1006 | `(iso?: string \| null, opts?: { nowYear?: number; maxDelta?: number }) => string \| null` |
| `validateIntegerAtLeast` | 1027 | `(value: unknown, min: number, label: string) => number` |
| `nonNegativeInt` | 1035 | `(value: unknown) => number` |
| `calculatePercent` | 1040 | `(actual: number, planned: number) => number \| null` |
| `calculateMiernikWykonanie` | 1083 | `(preview?: MiernikPreviewInput, plan?: MiernikPlanInput) => MiernikWykonanieResult` |
| `isExcludedNieprogramoweWizytacja` | 1123 | `(row: { ... }) => boolean` (excludes inspection from non-program counters) |

### D. Internal Helpers (Unexported)
- `jrwaParts(s: string | null | undefined): (string | number)[]` (line 996) — Splits dot-separated segments for `compareJrwa`.

---

## 3. Inventory: `src/features/ozipz/utils/reportAnnex.ts` (961 lines)

### A. Re-exports
- `downloadBlob` (line 11, from `./downloadHelper`)

### B. Exported Constants
| Name | Line | Type / Value |
|---|---|---|
| `POLISH_MONTHS` | 13 | `readonly ["Styczeń", "Luty", ... "Grudzień"]` |
| `STATION_COUNTIES` | 28 | `readonly ["Białogard", ... "Wałcz"]` (21 Zachodniopomorskie counties) |
| `COUNTY_LOCATIVE` | 51 | `Record<string, string>` (locative forms, e.g. "w Myśliborzu") |
| `formatStationForHeader` | 74 | `(stationName: string) => string` |
| `formatPeriodForHeader` | 89 | `(selectedMonths: readonly number[]) => string` |
| `buildDefaultHeaderTitle` | 121 | `(annexNum: 1 \| 2, stationName: string, selectedMonths: readonly number[], year?: number) => string` |

### C. Exported Interfaces & Types
| Name | Line | Structure / Role |
|---|---|---|
| `ReportAnnexKind` | 149 | `"programowe" \| "nieprogramowe"` |
| `ReportAnnexRow` | 151 | `{ kind, programName, jrwa, actionName, actions, visits, people }` |
| `AnnexReportItem` | 161 | `{ lp, name, jrwa?, actionsCount, participantsCount }` |
| `AnnexReportData` | 169 | `{ programs: AnnexReportItem[]; totalActions, totalParticipants }` |
| `ReportHierarchyAction` | 175 | `{ actionName, actions, visits, people }` |
| `ReportHierarchyGroup` | 182 | `{ kind, programName, jrwa, actions, totalActions, totalVisits, totalPeople }` |
| `ReportHierarchySection` | 192 | `{ kind, label, groups, totalActions, totalVisits, totalPeople }` |
| `ProgramsData` | 462 | Nested structure for edu-report parity: `[programType][programName][actionName] -> { people, actionNumber }` |
| `AggregatedMiernikData` | 473 | `{ aggregated: ProgramsData; allPeople, allActions, warnings }` |

### D. Exported Functions
| Name | Line | Signature & Purpose |
|---|---|---|
| `formatReportMonthLabel` | 136 | `(months: readonly number[]) => string` (e.g. "Cały rok", "I Półrocze (I-VI)") |
| `getNormalizedActionType` | 205 | `(action: Partial<OzipzAction>) => string` (standardizes action type labels) |
| `resolveInterventionName` | 276 | `(action: Partial<OzipzAction>, isProg: boolean, interventionNames?: Map<string, string>) => string` |
| `buildReportAnnexRows` | 353 | `(actions: readonly OzipzAction[], customInterventionMap?: ReadonlyMap<...>) => ReportAnnexRow[]` |
| `buildReportHierarchy` | 408 | `(rows: readonly ReportAnnexRow[]) => ReportHierarchySection[]` |
| `aggregateActionsToProgramsData` | 483 | `(actions: readonly OzipzAction[], selectedMonths?: readonly number[]) => AggregatedMiernikData` |
| `exportToTemplate` | 715 | `(data: AggregatedMiernikData \| readonly OzipzAction[], customFileName?, preparedBy?, headerTitle?) => Promise<boolean>` (Zalacznik nr 1) |
| `exportToCumulativeTemplate` | 739 | `(data: AggregatedMiernikData \| readonly OzipzAction[], customFileName?, preparedBy?, headerTitle?) => Promise<boolean>` (Zalacznik nr 2 Narastający) |
| `downloadAnnexReportExcel` | 763 | `(rows: readonly ReportAnnexRow[], annexNumber: 1 \| 2, year, months, preparedBy?) => Promise<void>` |
| `exportToExcel` | 808 | `(data: AggregatedMiernikData \| readonly OzipzAction[], customFileName?) => Promise<boolean>` (arkusz Miernik) |
| `downloadFullReportWorkbook` | 875 | `(actions: readonly OzipzAction[], year, months, preparedBy?) => Promise<void>` (multi-sheet workbook) |

### E. Internal Helpers (Unexported)
- `CELL_STYLES`: line 537 (Excel formatting constants)
- `isProgramNumber(value: unknown): boolean`: line 546
- `styleProgramNameCell(cell: ExcelJS.Cell, numberCell: ExcelJS.Cell): void`: line 548
- `LINE_HEIGHT_PT = 15`: line 553
- `applyNameCellAutoHeight(cell: ExcelJS.Cell, colWidth: number): void`: line 555
- `COLUMN_CONFIG`: line 567 (Excel cell coordinate mappings for Programowe / Nieprogramowe)
- `fillSection(worksheet: ExcelJS.Worksheet, data: ProgramsData, columns: ...): number`: line 572
- `createFallbackAnnexWorkbook(data, annexNumber, headerTitle, preparedBy): ExcelJS.Workbook`: line 625
- `exportToTemplateGeneric(...)`: line 652 (loads template xlsx via fetch, falls back to programmatic workbook)

---

## 4. Consumer / Call Site Mapping

### A. Consumers of `ozipzCalculations.ts`
1. `src/features/ozipz/utils/reportAnnex.ts`:
   - `DEFAULT_INTERWENCJE_JRWA`, `JRWA_INTERVENTION_KIND_MAP`, `isProgramAction`, `extractCleanJrwaSymbol`
2. `src/features/ozipz/utils/programJrwaUtils.ts`:
   - `compareJrwa`
3. `src/features/ozipz/utils/monthlyTargetsUtils.ts`:
   - `isProgramAction`
4. `src/features/ozipz/utils/vacationReporting.ts`:
   - `extractCleanJrwaSymbol`
5. `src/features/ozipz/hooks/useOzipzDb.ts`:
   - `calculateTotalRecipients`
6. `src/features/ozipz/components/DashboardSection.tsx`:
   - `calculateTotalRecipients`
7. `src/features/ozipz/components/reports/useReportsData.ts`:
   - `isProgramAction`
8. `src/features/ozipz/components/reports/ProgramBreakdownTab.tsx`:
   - `compareJrwa`, `isProgramAction`
9. `src/features/ozipz/components/reports/MunicipalityDetailedTab.tsx`:
   - `calculateMunicipalityDetailedBreakdown`
10. `src/features/ozipz/components/reports/NarrativeReportTab.tsx`:
    - `calculateSyntheticActionMetrics`, `calculateProgramParticipationStats`, `calculateAudienceGroupBreakdown`, `calculateMunicipalityDetailedBreakdown`, `generateSubstantiveReportNarrative`
11. `src/features/ozipz/components/reports/MiernikExecutionTab.tsx`:
    - `calculateMiernikWykonanie`, `isProgramAction`, `isExcludedNieprogramoweWizytacja`, `type MiernikPlanInput`
12. `src/features/ozipz/components/reports/MiernikMonthlyReconciliation.tsx`:
    - `isProgramAction`, `isExcludedNieprogramoweWizytacja`
13. `src/features/ozipz/components/reports/MiernikKpiCards.tsx`:
    - `type MiernikWykonanieResult`
14. `src/features/ozipz/components/reports/components/miernik/MiernikPeriodExecutionCard.tsx`:
    - `type MiernikWykonanieResult`
15. `src/features/ozipz/components/reports/components/miernik/MiernikAnnualPlanCard.tsx`:
    - `type MiernikPlanInput`, `type MiernikWykonanieResult`
16. `src/features/ozipz/components/reports/reports.test.ts`:
    - `calculateSyntheticActionMetrics`, `calculateMonthlySummary`, `calculateAudienceGroupBreakdown`, `calculateFormBreakdown`, `calculateProgramParticipationStats`, `calculateMunicipalityDetailedBreakdown`, `generateSubstantiveReportNarrative`, `calculateMiernikWykonanie`
17. `src/features/ozipz/utils/ozipzCalculations.test.ts`:
    - All 23 exported functions and constants

### B. Consumers of `reportAnnex.ts`
1. `src/features/ozipz/utils/reportExport.ts`:
   - `downloadFullReportWorkbook`
2. `src/features/ozipz/utils/reportExport.test.ts`:
   - `import * as reportAnnex from "./reportAnnex"`
   - `vi.spyOn(reportAnnex, "downloadFullReportWorkbook")`
3. `src/features/ozipz/components/reports/useReportsData.ts`:
   - `buildReportAnnexRows`, `buildReportHierarchy`, `downloadAnnexReportExcel`
4. `src/features/ozipz/components/reports/useReportsData.test.ts`:
   - `vi.mock("../../utils/reportAnnex", ...)`
5. `src/features/ozipz/components/reports/SprawozdanieExportTab.tsx`:
   - `downloadAnnexReportExcel`, `buildReportAnnexRows`
6. `src/features/ozipz/components/reports/MiernikExecutionTab.tsx`:
   - `formatReportMonthLabel`
7. `src/features/ozipz/components/reports/components/ReportMiernikTab.tsx`:
   - `aggregateActionsToProgramsData`, `exportToTemplate`, `exportToCumulativeTemplate`, `exportToExcel`, `downloadFullReportWorkbook`, `buildDefaultHeaderTitle`, `formatPeriodForHeader`
8. `src/features/ozipz/components/reports/components/miernik/MiernikExportCard.tsx`:
   - `STATION_COUNTIES`
9. `src/features/ozipz/components/reports/components/miernik/MiernikAnnexProgramsTable.tsx`:
   - `type AggregatedMiernikData`
10. `src/features/ozipz/components/reports/reports.test.ts`:
    - `buildReportAnnexRows`, `buildReportHierarchy`
11. `src/features/ozipz/utils/reportAnnex.test.ts`:
    - All exported constants, formatters, aggregators, and exporters

---

## 5. Proposed Submodule Architecture (< 300 Lines Each)

### A. Submodules for `ozipzCalculations`: `src/features/ozipz/utils/calculators/`

```
src/features/ozipz/utils/
├── ozipzCalculations.ts               # Barrel re-export (~50 lines)
└── calculators/
    ├── actionMetrics.ts               # Total recipients & synthetic action metrics (~95 lines)
    ├── jrwaClassification.ts          # JRWA constants, extraction & program detection (~155 lines)
    ├── monthlyBreakdown.ts            # Monthly breakdown aggregation & types (~140 lines)
    ├── monthlyReconciliation.ts       # Targets reconciliation & default 2026 targets (~180 lines)
    ├── actionDistributions.ts         # Audience, form, topic, type & material stats (~150 lines)
    ├── programReach.ts                # School program participation & reach stats (~80 lines)
    ├── municipalityBreakdown.ts       # Municipality detailed table & report narrative (~170 lines)
    └── miernikCalculations.ts         # Budget indicator KPIs, sanitization & validation (~140 lines)
```

#### Detailed Submodule Allocation:
1. `calculators/actionMetrics.ts` (~95 lines):
   - Interfaces: `TotalRecipientsResult`, `SyntheticActionMetrics`
   - Functions: `calculateTotalRecipients`, `calculateRecipients`, `calculateSyntheticActionMetrics`
2. `calculators/jrwaClassification.ts` (~155 lines):
   - Types: `JrwaInterwencjaItem`
   - Constants: `DEFAULT_INTERWENCJE_JRWA`, `JRWA_INTERVENTION_KIND_MAP`
   - Functions: `extractCleanJrwaSymbol`, `isProgramAction`, `compareJrwa`, `jrwaParts`
3. `calculators/monthlyBreakdown.ts` (~140 lines):
   - Types: `MonthlyBreakdownRow`, `ActionCategoryFilter`, `MonthlySummaryResult`
   - Functions: `calculateMonthlySummary`
4. `calculators/monthlyReconciliation.ts` (~180 lines):
   - Types: `ExpectedMonthlyTarget`, `ExpectedMonthlyTargetsMap`, `MonthlyReconciliationFieldDiff`, `MonthlyReconciliationRow`, `MonthlyReconciliationSummary`
   - Constants: `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS`, `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_PROGRAM`, `DEFAULT_2026_EXPECTED_MONTHLY_TARGETS_NON_PROGRAM`
   - Functions: `reconcileMonthlySummary`
5. `calculators/actionDistributions.ts` (~150 lines):
   - Types: `AudienceGroupStatItem`, `FormBreakdownItem`, `TopicStatItem`, `ActionTypeStatItem`
   - Functions: `calculateAudienceGroupBreakdown`, `calculateFormBreakdown`, `filterActionsByPeriod`, `calculateTopicDistribution`, `calculateActionTypeStats`, `calculateMaterialTypeStats`
6. `calculators/programReach.ts` (~80 lines):
   - Types: `ProgramReachSummary`, `ProgramParticipationSummary`
   - Functions: `calculateProgramReach`, `calculateProgramParticipationStats`
7. `calculators/municipalityBreakdown.ts` (~170 lines):
   - Types: `MunicipalityDetailedRow`
   - Functions: `calculateMunicipalityDetailedBreakdown`, `generateSubstantiveReportNarrative`
8. `calculators/miernikCalculations.ts` (~140 lines):
   - Types: `MiernikWykonanieResult`, `MiernikPlanInput`, `MiernikPreviewInput`
   - Functions: `sanitizeRecentDate`, `validateIntegerAtLeast`, `nonNegativeInt`, `calculatePercent`, `calculateMiernikWykonanie`, `isExcludedNieprogramoweWizytacja`
9. `ozipzCalculations.ts` (~50 lines):
   - Clean barrel re-exports of all 8 files.

---

### B. Submodules for `reportAnnex`: `src/features/ozipz/utils/annex/`

```
src/features/ozipz/utils/
├── reportAnnex.ts                     # Barrel re-export (~40 lines)
└── annex/
    ├── annexConstants.ts              # Month names, counties, locative & header formatters (~135 lines)
    ├── annexTypes.ts                  # Pure interfaces & types (~75 lines)
    ├── annexAggregation.ts            # Row normalization, intervention naming & hierarchy (~280 lines)
    ├── annexTemplateExport.ts         # Template XLSX auto-height, styling & fillSection (~270 lines)
    └── annexWorkbookExport.ts         # Multi-sheet workbook & generic Excel builders (~155 lines)
```

#### Detailed Submodule Allocation:
1. `annex/annexConstants.ts` (~135 lines):
   - Constants: `POLISH_MONTHS`, `STATION_COUNTIES`, `COUNTY_LOCATIVE`
   - Functions: `formatStationForHeader`, `formatPeriodForHeader`, `buildDefaultHeaderTitle`, `formatReportMonthLabel`
2. `annex/annexTypes.ts` (~75 lines):
   - Types: `ReportAnnexKind`, `ReportAnnexRow`, `AnnexReportItem`, `AnnexReportData`, `ReportHierarchyAction`, `ReportHierarchyGroup`, `ReportHierarchySection`, `ProgramsData`, `AggregatedMiernikData`
3. `annex/annexAggregation.ts` (~280 lines):
   - Functions: `getNormalizedActionType`, `resolveInterventionName`, `buildReportAnnexRows`, `buildReportHierarchy`, `aggregateActionsToProgramsData`
4. `annex/annexTemplateExport.ts` (~270 lines):
   - Helpers: `CELL_STYLES`, `isProgramNumber`, `styleProgramNameCell`, `LINE_HEIGHT_PT`, `applyNameCellAutoHeight`, `COLUMN_CONFIG`, `fillSection`, `createFallbackAnnexWorkbook`, `exportToTemplateGeneric`
   - Functions: `exportToTemplate`, `exportToCumulativeTemplate`, `downloadAnnexReportExcel`
5. `annex/annexWorkbookExport.ts` (~155 lines):
   - Functions: `exportToExcel`, `downloadFullReportWorkbook`
6. `reportAnnex.ts` (~40 lines):
   - Re-exports `downloadBlob` from `./downloadHelper`
   - Re-exports all submodules (`annexConstants`, `annexTypes`, `annexAggregation`, `annexTemplateExport`, `annexWorkbookExport`).

---

## 6. Baseline Test Verification & Gate Audit

The test baseline was independently executed across all relevant test suites:
- `src/features/ozipz/utils/ozipzCalculations.test.ts`: **26 passed** (41ms)
- `src/features/ozipz/utils/reportAnnex.test.ts`: **14 passed** (345ms)
- `src/features/ozipz/utils/reportExport.test.ts`: **4 passed** (8ms)
- `src/features/ozipz/components/reports/reports.test.ts`: **14 passed** (25ms)
- `src/features/ozipz/components/reports/useReportsData.test.ts`: **7 passed** (31ms)
- **Calculation & Reporting Subtotal**: **65 passed (100%)**

Full Project Gate Verification:
- Full Test Suite: **77 test files, 599 tests passed (100%)** in 31.54s
- TypeScript strict typecheck (`npm run typecheck`): **0 errors**
- Production bundle build (`npm run build`): **0 errors** (built in 4.81s)

---

## 7. Implementation Roadmap & Guidelines for Worker Agent

1. **Phase 1: Create directories**:
   - Create `src/features/ozipz/utils/calculators/`
   - Create `src/features/ozipz/utils/annex/`

2. **Phase 2: Extract Submodules in dependency order**:
   - `calculators/actionMetrics.ts`
   - `calculators/jrwaClassification.ts`
   - `calculators/monthlyBreakdown.ts` (imports `isProgramAction`)
   - `calculators/monthlyReconciliation.ts`
   - `calculators/actionDistributions.ts`
   - `calculators/programReach.ts`
   - `calculators/municipalityBreakdown.ts`
   - `calculators/miernikCalculations.ts` (imports `isProgramAction`)
   - Update `src/features/ozipz/utils/ozipzCalculations.ts` to re-export all from `./calculators/*`
   - Run `npx vitest run src/features/ozipz/utils/ozipzCalculations.test.ts` to confirm zero regression.

3. **Phase 3: Extract Annex Submodules in dependency order**:
   - `annex/annexConstants.ts`
   - `annex/annexTypes.ts`
   - `annex/annexAggregation.ts`
   - `annex/annexTemplateExport.ts`
   - `annex/annexWorkbookExport.ts`
   - Update `src/features/ozipz/utils/reportAnnex.ts` to re-export `downloadBlob` and all from `./annex/*`
   - Run `npx vitest run src/features/ozipz/utils/reportAnnex.test.ts src/features/ozipz/utils/reportExport.test.ts` to confirm zero regression.

4. **Phase 4: Verification & Line Count Audit**:
   - Verify every file in `calculators/` and `annex/` has `< 300` lines.
   - Run `npm run typecheck`.
   - Run `npm test`.
   - Run `npm run build`.
