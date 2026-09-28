# Worker M2 Dispatch: Database Service Repository Pattern (R2)

## Mission
Refactor `src/db/sqlite-service.ts` (1184 lines) and `src/db/fallback-service.ts` (582 lines) into modular domain repositories under `src/db/repositories/`, implementing cohesive sub-interfaces, orchestrated by the main service without breaking the `IOzipzDatabaseService` contract.

## File Boundaries & Ownership
Exclusive write access to:
- `src/db/sqlite-schema.ts` (create)
- `src/db/sqlite-seed.ts` (create)
- `src/db/repositories/*` (create directory, interfaces, sqlite/ and fallback/ subdirectories)
- `src/db/sqlite-service.ts` (refactor to < 150 lines)
- `src/db/fallback-service.ts` (refactor to < 150 lines)

Do not modify files outside this boundary without prior coordination.

## Inputs
- Authoritative Request: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- Architecture Blueprint: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1/handoff.md`
- Gemini Rules: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`
- Schema Spec: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/DATABASE_SCHEMA.md`

## Verification Requirements
- `npx vitest run src/db`
- `npm run typecheck`
- `npm test`
- Line count check: `wc -l src/db/sqlite-service.ts src/db/fallback-service.ts src/db/sqlite-schema.ts src/db/sqlite-seed.ts src/db/repositories/**/*.ts` (all < 350 lines)

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T08:42:43Z
Tasks:
1. Extract DDL and migrations from `src/db/sqlite-service.ts` into `src/db/sqlite-schema.ts` (`initTables` function, < 230 lines).
2. Extract data seeding into `src/db/sqlite-seed.ts` (`seedInitialData` function, < 140 lines).
3. Create domain repository sub-interfaces in `src/db/repositories/interfaces.ts` (< 150 lines).
4. Create SQLite domain repositories in `src/db/repositories/sqlite/`:
   - `sqlite-actions.repository.ts` (< 180 lines)
   - `sqlite-programs.repository.ts` (< 100 lines)
   - `sqlite-materials.repository.ts` (< 100 lines)
   - `sqlite-schedule.repository.ts` (< 80 lines)
   - `sqlite-jrwa.repository.ts` (< 70 lines)
   - `sqlite-facilities.repository.ts` (< 110 lines)
   - `sqlite-dictionaries.repository.ts` (< 70 lines)
   - `sqlite-staff-contacts.repository.ts` (< 120 lines)
   - `sqlite-registry.repository.ts` (< 190 lines)
   - `sqlite-monthly-targets.repository.ts` (< 80 lines)
5. Create Fallback domain repositories in `src/db/repositories/fallback/`:
   - `storage.ts` (< 40 lines)
   - `fallback-actions.repository.ts` (< 120 lines)
   - `fallback-programs.repository.ts` (< 90 lines)
   - `fallback-materials.repository.ts` (< 80 lines)
   - `fallback-schedule.repository.ts` (< 60 lines)
   - `fallback-jrwa.repository.ts` (< 60 lines)
   - `fallback-facilities.repository.ts` (< 90 lines)
   - `fallback-dictionaries.repository.ts` (< 70 lines)
   - `fallback-staff-contacts.repository.ts` (< 80 lines)
   - `fallback-registry.repository.ts` (< 130 lines)
   - `fallback-monthly-targets.repository.ts` (< 60 lines)
6. Refactor `src/db/sqlite-service.ts` into an orchestrating facade (< 150 lines) implementing `IOzipzDatabaseService` by delegating to SQLite repositories, and re-exporting `initTables` and `seedInitialData`.
7. Refactor `src/db/fallback-service.ts` into an orchestrating facade (< 150 lines) implementing `IOzipzDatabaseService` by delegating to fallback repositories.
8. Verify that `IOzipzDatabaseService` contract and `src/db/client.ts` are 100% satisfied without breaking changes.
9. Run tests: `npx vitest run src/db`, `npm run typecheck`, and `npm test`. Verify 100% pass rate.
10. Check line counts of all created and modified files (`wc -l`), ensuring all are strictly < 350 lines.
11. Write full report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2_db/handoff.md` and message parent.

