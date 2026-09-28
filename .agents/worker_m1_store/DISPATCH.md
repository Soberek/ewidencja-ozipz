# Worker M1 Dispatch: Zustand Store Decomposition (R1)

## Mission
Decompose `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines) into modular Zustand slices per domain entity in `src/features/ozipz/store/slices/` and `src/features/ozipz/store/domainHooks.ts`, re-exporting all hooks and types from `useOzipzDbStore.ts` with 100% backward compatibility and zero regressions.

## File Boundaries & Ownership
Exclusive write access to:
- `src/features/ozipz/store/slices/*` (create directory and slice files)
- `src/features/ozipz/store/domainHooks.ts`
- `src/features/ozipz/store/useOzipzDbStore.ts`

Do not modify files outside this boundary without prior coordination.

## Inputs
- Authoritative Request: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- Architecture Blueprint: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1/handoff.md`
- Gemini Rules: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`

## Verification Requirements
- `npx vitest run src/features/ozipz/store`
- `npm run typecheck`
- `npm test`
- Line count check: `wc -l src/features/ozipz/store/useOzipzDbStore.ts src/features/ozipz/store/domainHooks.ts src/features/ozipz/store/slices/*.ts` (all < 350 lines)

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T08:27:56Z
Tasks:
1. Create `src/features/ozipz/store/slices/` directory.
2. Implement domain slices with full type safety (zero `any`):
   - `types.ts`
   - `actions.slice.ts`
   - `programs.slice.ts`
   - `facilities.slice.ts`
   - `schedule.slice.ts`
   - `materials.slice.ts`
   - `jrwa.slice.ts`
   - `dictionaries.slice.ts`
   - `letters.slice.ts`
   - `scans.slice.ts`
   - `staff.slice.ts`
   - `contacts.slice.ts`
   - `registers.slice.ts`
   - `templates.slice.ts`
   - `publications.slice.ts`
   - `core.slice.ts`
3. Extract domain hooks into `src/features/ozipz/store/domainHooks.ts` (< 270 lines).
4. Refactor `src/features/ozipz/store/useOzipzDbStore.ts` into a concise orchestrator (< 100 lines) combining slices via `create<OzipzDbState>()` and re-exporting `OzipzDbState` and all domain hooks from `domainHooks.ts`.
5. Run tests: `npx vitest run src/features/ozipz/store`, `npm run typecheck`, and `npm test`. Verify 100% pass rate.
6. Verify line counts of all created and modified files (`wc -l`), ensuring all are strictly < 350 lines.
7. Write full report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m1_store/handoff.md` and send a completion message to parent.
