# Survey Explorer 2: Heavy Calculation Utilities Architecture

## Mission
Survey `src/features/ozipz/utils/ozipzCalculations.ts` (1134 lines) and `src/features/ozipz/utils/reportAnnex.ts` (961 lines).
Document:
1. Exact current line counts and structure.
2. All exported functions, constants, types, and internal helpers in both files.
3. List of consumers/import sites across the project for both utilities.
4. Proposed modular breakdown into submodules (< 300 lines each) and clean barrel re-exports from original paths so consumer imports don't break.
5. Identify all tests covering these calculations (e.g. `reports.test.ts`, calculation tests). Run those tests to establish baseline.
6. Write full findings to `.agents/explorer_survey_2/handoff.md`.

## 2026-09-05T08:23:27Z
Read the authoritative user request at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md.
Also read /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md.
Your working directory is /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2.
Your dispatch task is outlined in /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2/DISPATCH.md.
Specifically analyze:
1. `src/features/ozipz/utils/ozipzCalculations.ts` (1134 lines) and `src/features/ozipz/utils/reportAnnex.ts` (961 lines).
2. Inventory every single exported function, type, and internal helper in both files.
3. Map all call sites/consumers across the codebase to ensure 100% backward compatibility via barrel re-exports.
4. Design a clean submodule architecture (e.g. `calculators/` and `annex/`) where every submodule is < 300 lines.
5. Identify and run all relevant calculation and report tests (e.g. `npx vitest run src/features/ozipz/components/reports/reports.test.ts`) to verify baseline.
6. Write a comprehensive handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2/handoff.md`.
When finished, send a completion message back to parent.
