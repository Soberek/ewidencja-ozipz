# Survey Explorer 1: Store & Database Services Architecture

## Mission
Survey `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines), `src/db/sqlite-service.ts` (1184 lines), `src/db/fallback-service.ts` (582 lines), and `src/db/types.ts`.
Document:
1. Exact current line counts and structure.
2. All entities and operations in `useOzipzDbStore.ts`, and proposed slice decomposition plan (actions, programs, facilities, schedule, materials, jrwa, dictionaries, letters, scans, staff, registers).
3. All methods in `sqlite-service.ts` and `fallback-service.ts`, how `IOzipzDatabaseService` is implemented, and proposed domain repository structure under `src/db/repositories/`.
4. Existing tests covering store and db services (`mappers.test.ts`, any store tests).
5. Verify test commands: run tests for store and DB to verify baseline.
6. Write full findings to `.agents/explorer_survey_1/handoff.md`.

## 2026-09-05T08:23:27Z
Read the authoritative user request at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md.
Also read /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md and DATABASE_SCHEMA.md.
Your working directory is /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1.
Your dispatch task is outlined in /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1/DISPATCH.md.
Specifically analyze:
1. `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines) - examine state properties, actions, CRUD functions, subscriber interactions, and design a slice decomposition under `src/features/ozipz/store/slices/`.
2. `src/db/sqlite-service.ts` (1184 lines) and `src/db/fallback-service.ts` (582 lines) - examine how `IOzipzDatabaseService` methods map to SQLite queries and localStorage fallback. Design domain repositories under `src/db/repositories/`.
3. Verify existing tests for DB and store by running them (e.g. `npx vitest run src/db`).
4. Write a comprehensive handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1/handoff.md`. Include exact line counts, method inventories, slice breakdown proposal, and repository interfaces.
When finished, send a completion message back to parent.
