# Worker M3 Dispatch: Modularization of Heavy Calculation Utilities (R3)

## Mission
Decompose `src/features/ozipz/utils/ozipzCalculations.ts` (1134 lines) and `src/features/ozipz/utils/reportAnnex.ts` (961 lines) into dedicated domain calculators under `src/features/ozipz/utils/calculators/` and report annex modules under `src/features/ozipz/utils/annex/`, maintaining transparent barrel re-exports from `ozipzCalculations.ts` and `reportAnnex.ts` so all existing consumer imports continue to work without modification.

## File Boundaries & Ownership
Exclusive write access to:
- `src/features/ozipz/utils/calculators/*` (create directory and submodules)
- `src/features/ozipz/utils/annex/*` (create directory and submodules)
- `src/features/ozipz/utils/ozipzCalculations.ts` (refactor to barrel re-export < 60 lines)
- `src/features/ozipz/utils/reportAnnex.ts` (refactor to barrel re-export < 50 lines)

Do not modify files outside this boundary without prior coordination.

## Inputs
- Authoritative Request: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- Architecture Blueprint: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2/handoff.md` and `report.md`
- Gemini Rules: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`

## Verification Requirements
- `npx vitest run src/features/ozipz/utils/ozipzCalculations.test.ts src/features/ozipz/utils/reportAnnex.test.ts src/features/ozipz/utils/reportExport.test.ts src/features/ozipz/components/reports/reports.test.ts src/features/ozipz/components/reports/useReportsData.test.ts`
- `npm run typecheck`
- `npm test`
- Line count check: `wc -l src/features/ozipz/utils/ozipzCalculations.ts src/features/ozipz/utils/reportAnnex.ts src/features/ozipz/utils/calculators/*.ts src/features/ozipz/utils/annex/*.ts` (all < 300 lines)

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T09:01:16Z
Read the authoritative user request at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md.
Read GEMINI.md at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md.
Read your detailed dispatch instructions at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3_calc/DISPATCH.md.
Read the architecture blueprint from Explorer 2 at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2/handoff.md and report.md.
Your working directory is /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3_calc.

Tasks:
1. Create `src/features/ozipz/utils/calculators/`:
   - `actionMetrics.ts` (< 100 lines)
   - `jrwaClassification.ts` (< 160 lines)
   - `monthlyBreakdown.ts` (< 150 lines)
   - `monthlyReconciliation.ts` (< 190 lines)
   - `actionDistributions.ts` (< 160 lines)
   - `programReach.ts` (< 90 lines)
   - `municipalityBreakdown.ts` (< 180 lines)
   - `miernikCalculations.ts` (< 150 lines)
2. Refactor `src/features/ozipz/utils/ozipzCalculations.ts` into a clean barrel re-export (< 60 lines) re-exporting 100% of types, constants, and functions.
3. Create `src/features/ozipz/utils/annex/`:
   - `annexConstants.ts` (< 140 lines)
   - `annexTypes.ts` (< 80 lines)
   - `annexAggregation.ts` (< 290 lines)
   - `annexTemplateExport.ts` (< 280 lines)
   - `annexWorkbookExport.ts` (< 160 lines)
4. Refactor `src/features/ozipz/utils/reportAnnex.ts` into a clean barrel re-export (< 50 lines) re-exporting `downloadBlob` and all annex functions/types.
5. Verify that all 28 consumer files and all test mocks/spies (e.g. `reportExport.test.ts`, `useReportsData.test.ts`) continue working without errors.
6. Run tests: `npx vitest run src/features/ozipz/utils/ozipzCalculations.test.ts src/features/ozipz/utils/reportAnnex.test.ts src/features/ozipz/utils/reportExport.test.ts src/features/ozipz/components/reports/reports.test.ts src/features/ozipz/components/reports/useReportsData.test.ts`, `npm run typecheck`, and `npm test`. Verify 100% pass rate.
7. Check line counts of all created and modified files (`wc -l`), ensuring all are strictly < 300 lines.
8. Write full report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3_calc/handoff.md` and message parent.

