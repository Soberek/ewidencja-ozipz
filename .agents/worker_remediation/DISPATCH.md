# Dispatch Assignment: Worker Remediation (Challenger 1 Feedback Resolution)

- **Role**: Remediation Worker
- **Working Directory**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_remediation
- **Authoritative Request**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
- **Engineering Standards**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md
- **Project Scope**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md
- **Challenger 1 Feedback**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/challenger_1/handoff.md

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks to Fix
1. **Fix TypeScript typecheck error in `src/features/ozipz/components/jrwa/jrwaAdversarialChallenge.test.tsx` (around line 596)**:
   - In `<ScheduleFilterBar ... />`, remove `selectedYear={2026}` and `onYearChange={vi.fn()}` which do not exist on `ScheduleFilterBarProps`.
   - Ensure `npm run typecheck` exits with code 0.
2. **Fix test timeout in `src/features/ozipz/components/actions/editor/editor.test.ts` (line 290)**:
   - On the test `it("verifies ActionEditorProgramCard does NOT contain duplicate Znak Sprawy field", ...)` add `{ timeout: 15000 }` or convert inline dynamic `await import` to top-level imports to ensure it does not time out under full concurrent test suite runs.
3. **Fix duplicate React key warnings in `src/features/ozipz/components/reports/components/summary/ReportHierarchyCard.tsx` (lines 101 & 123)**:
   - Update `key={'group-${group.programName}'}` to `key={'group-${section.kind}-${group.programName}'}`.
   - Update `key={'act-${group.programName}-${aIdx}'}` to `key={'act-${section.kind}-${group.programName}-${aIdx}'}`.
4. **Verification**:
   - Run `npm run typecheck` -> must exit 0.
   - Run `npm test` -> all 67 test files must pass 100%.
   - Run `npm run build` -> must build cleanly.
5. Write your handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_remediation/handoff.md` and send a message when done.
