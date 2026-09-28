# BRIEFING — 2026-09-05T10:52:00+02:00

## Mission
Refactor `src/db/sqlite-service.ts` (1184 lines) and `src/db/fallback-service.ts` (582 lines) into modular domain repositories under `src/db/repositories/` (< 350 lines per file, strictly complying with target line counts), implementing cohesive sub-interfaces, orchestrated by facades implementing `IOzipzDatabaseService`.

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2_db
- Original parent: cafb30d4-7ff5-4c38-8138-08cc15e5e68d
- Milestone: M2 - Database Service Repository Pattern (R2)

## 🔒 Key Constraints
- DO NOT CHEAT. Genuine implementations only. No hardcoded tests/outputs, no dummy facades.
- All files created/modified must be strictly < 350 lines. Target line budgets specified in dispatch.
- Preserve 100% compatibility with `IOzipzDatabaseService` contract and `src/db/client.ts`.
- Zero functional regression: `npx vitest run src/db`, `npm run typecheck`, and `npm test` must all pass.
- Write only to exclusive boundary: `src/db/sqlite-schema.ts`, `src/db/sqlite-seed.ts`, `src/db/repositories/*`, `src/db/sqlite-service.ts`, `src/db/fallback-service.ts`, and `.agents/worker_m2_db/*`.

## Current Parent
- Conversation ID: cafb30d4-7ff5-4c38-8138-08cc15e5e68d
- Updated: 2026-09-05T10:43:00+02:00

## Task Summary
- **What to build**: Extract DDL schema, seeding, and domain repositories for both SQLite and Fallback implementations. Orchestrate via facades in `sqlite-service.ts` and `fallback-service.ts`.
- **Success criteria**: All tests pass (624 tests across 81 suites), typecheck passes (0 errors), build succeeds, line counts within limits, no contract breaks.
- **Interface contracts**: `src/db/types.ts` (`IOzipzDatabaseService`), `src/db/repositories/interfaces.ts`
- **Code layout**: Repository pattern under `src/db/repositories/{sqlite,fallback}`.

## Change Tracker
- **Files modified**:
  - `src/db/sqlite-service.ts`: refactored from 1184 to 147 lines (orchestrating facade)
  - `src/db/fallback-service.ts`: refactored from 582 to 129 lines (orchestrating facade)
  - `src/db/sqlite-schema.ts`: created with 143 lines (`initTables` DDL and migrations)
  - `src/db/sqlite-seed.ts`: created with 118 lines (`seedInitialData` function)
  - `src/db/repositories/interfaces.ts`: created with 121 lines (10 domain repository sub-interfaces)
  - `src/db/repositories/id-generator.ts`: created with 6 lines (shared ID generator)
  - `src/db/repositories/sqlite/`: 10 domain repositories (40-171 lines)
  - `src/db/repositories/fallback/`: 11 domain repositories and storage helper (19-118 lines)
- **Build status**: PASS (`npm run build` and `npm run typecheck` succeeded)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (81 test files passed, 624 tests passed in `npm test`; 4 test files, 38 tests passed in `src/db`)
- **Lint status**: 0 errors
- **Tests added/modified**: Verified against existing test suites `sqlite-service.test.ts`, `fallback-service.test.ts`, `relational.test.ts`, and full application suite.

## Loaded Skills
- None specified in prompt.

## Key Decisions Made
- `SqliteActionsRepository` and `FallbackActionsRepository` support dependency injection of peer repositories (`jrwa`, `schedule`, `materials`) so that atomic cross-entity transactions (`saveActionWithRelations`) maintain clean domain boundaries and reuse code.
- Shared `generateId` extracted to `src/db/repositories/id-generator.ts` to follow DRY principle across both SQLite and Fallback repos.
- Facades preserve exact constructor signatures and public method signatures of `IOzipzDatabaseService`, as well as re-exporting `initTables` and `seedInitialData` to guarantee zero breakages for `client.ts` and test suites.

## Artifact Index
- DISPATCH.md — Assignment and instructions
- BRIEFING.md — Working memory
- progress.md — Liveness heartbeat
- handoff.md — Final handoff report
