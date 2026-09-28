# Implementation Plan: Monolith Decomposition across Ewidencja OZiPZ

## Objective
Decompose monolithic files (>400 lines) into clean, modular, single-responsibility submodules strictly adhering to GEMINI.md Rule 2A (<=350-400 lines), zero `any` types, zero breaking changes, and 100% test pass rate across all 599+ tests.

## Phase 0: Baseline Survey & Verification
- Dispatch Explorer to inspect baseline test suite (`npm test`), TypeScript check (`npm run typecheck`), build (`npm run build`), and verify exact line counts of the target files:
  1. `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines)
  2. `src/db/sqlite-service.ts` (1184 lines) & `src/db/fallback-service.ts` (582 lines)
  3. `src/features/ozipz/utils/ozipzCalculations.ts` (1134 lines) & `src/features/ozipz/utils/reportAnnex.ts` (961 lines)
  4. `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (675 lines) & `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (617 lines)
- Check tests covering these files directly.

## Phase 1: Milestone 1 - Zustand Store Decomposition (R1)
- Map all actions, state properties, and interfaces in `useOzipzDbStore.ts`.
- Dispatch Explorer to design slice division and types.
- Dispatch Worker to implement slices (`actionsSlice.ts`, `programsSlice.ts`, `facilitiesSlice.ts`, `scheduleSlice.ts`, `materialsSlice.ts`, `jrwaSlice.ts`, `dictionariesSlice.ts`, `lettersSlice.ts`, `scansSlice.ts`, `staffSlice.ts`, `registersSlice.ts`, `types.ts`).
- Ensure root `useOzipzDbStore.ts` delegates to slices and satisfies `< 350` lines.
- Run Reviewer, Challenger, and Auditor verification.

## Phase 2: Milestone 2 - Database Service Repository Pattern (R2)
- Map methods in `sqlite-service.ts` and `fallback-service.ts`.
- Dispatch Explorer to design repository interfaces and shared structure.
- Dispatch Worker to implement repositories (e.g. `ActionRepository`, `ProgramRepository`, etc.) for both SQLite and Fallback.
- Ensure `sqlite-service.ts` and `fallback-service.ts` delegate to repositories and each file is `< 350` lines while fulfilling `IOzipzDatabaseService`.
- Run Reviewer, Challenger, and Auditor verification.

## Phase 3: Milestone 3 - Heavy Calculation Utilities Decomposition (R3)
- Map exports and function signatures in `ozipzCalculations.ts` and `reportAnnex.ts`.
- Dispatch Explorer to design breakdown into logical calculators and table generators.
- Dispatch Worker to implement modular sub-calculators and transparent barrel re-exports.
- Ensure all resulting files are `< 350` lines.
- Run Reviewer, Challenger, and Auditor verification.

## Phase 4: Milestone 4 - Action Editor & Filtering Hook Decomposition (R4)
- Map internal state and handlers in `useActionsFiltering.ts` and `useActionEditorState.ts`.
- Dispatch Explorer to structure sub-hooks and pure helper modules.
- Dispatch Worker to implement modular sub-hooks and refactor parent hooks.
- Ensure all resulting files are `< 350` lines.
- Run Reviewer, Challenger, and Auditor verification.

## Phase 5: Milestone 5 - Final Regression Gate & Audit (R5)
- Run complete test suite (`npm test` - 599+ tests).
- Run TypeScript strict typecheck (`npm run typecheck`).
- Run production build (`npm run build`).
- Verify line counts across all created/modified files (all <= 350-400 lines).
- Verify zero `any` usage.
- Reviewer + Forensic Auditor evaluation.
- Compile final report and notify Sentinel.
