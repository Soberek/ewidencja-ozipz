# BRIEFING — 2026-09-11T06:31:00Z

## Mission
Deep audit of the database, schema, mappers, and state management layers focusing on Requirement R2 for Ewidencja OZiPZ.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Database and State Explorer
- Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_db
- Original parent: 2ecc915f-4831-483a-9d54-580df5ed237a
- Milestone: Audit Database, Schema, Mappers, and State Management (R2)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement changes in source code
- Inspect SQLite Schema vs DATABASE_SCHEMA.md (Rule 6)
- Dual-Mode Database Architecture (SQLite vs Fallback)
- Mappers Integrity & Data Conversions (src/db/mappers.ts)
- "Zero Default Values" Audit (GEMINI.md Rule 7)
- State Management & Zustand Hygiene (Rule 2B)

## Current Parent
- Conversation ID: 2ecc915f-4831-483a-9d54-580df5ed237a
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `DATABASE_SCHEMA.md`, `GEMINI.md`
  - `src/db/sqlite-service.ts`, `src/db/sqlite-migrations.ts`, `src/db/sqlite-schema.ts`, `src/db/types.ts`
  - `src/db/fallback-service.ts`, `src/db/repositories/sqlite/*`, `src/db/repositories/fallback/*`, `src/db/serialized-service.ts`
  - `src/db/mappers.ts`, `src/db/secondary-mappers.ts`, `src/db/mappers.test.ts`
  - `src/features/ozipz/schemas/ozipz.schemas.ts`, `src/features/ozipz/components/*Dialog*.tsx`
  - `src/features/ozipz/store/useOzipzDbStore.ts`, `src/features/ozipz/store/slices/*`, `src/features/ozipz/hooks/useOzipzDb.ts`, `src/features/ozipz/store/useModalStore.ts`, `src/features/ozipz/store/useUIStore.ts`
- **Key findings**:
  - `ozipz_schedule` in `DATABASE_SCHEMA.md` Table 7 is missing 17 columns present in `SCHEMA_SQL` and TS types (major documentation desynchronization).
  - Columns omitted from `DATABASE_SCHEMA.md`: `ozipz_facilities.education_types`, `ozipz_dictionaries.postal_code`, `ozipz_contacts.municipality`, `ozipz_templates.action_defaults`, `ozipz_scans.updated_at`.
  - Foreign keys: 25 FKs present and fully indexed with `idx_*`. CASCADE vs RESTRICT policy contradiction between GEMINI.md Rule 6.3 and DATABASE_SCHEMA.md.
  - Dual-mode LSP violation: `FallbackDatabaseService` defines `toggleScheduleStatus` not in `IOzipzDatabaseService` or `SqliteDatabaseService`.
  - Fallback service concurrency risk: not wrapped with `serializeDatabaseService`.
  - Fallback missing uniqueness checks: JRWA cases and Dictionaries do not assert unique constraints.
  - Zero Default Values violation: `getDefaultActionFormValues` in `editorUtils.ts` preselects `leadEducator: staff[0]?.fullName`.
  - Two explicit `any` types found in `StaffDialog.tsx:55` and `DictionaryDialog.tsx:50`.
  - Zustand subscription anti-pattern: `useOzipzDb.ts` calls `useOzipzDbStore()` without a selector, causing whole-store re-render cascading.
  - `useDictionaries()` returns 10 unmemoized array allocations on every call.
- **Unexplored areas**: None remaining.

## Key Decisions Made
- Confirmed that executable schema is `SCHEMA_SQL` in `src/db/sqlite-migrations.ts` (17 tables, 25 FKs).
- Verified test suite and build status.

## Artifact Index
- DISPATCH.md — incoming dispatch instructions
- BRIEFING.md — situational awareness
- progress.md — liveness heartbeat
- handoff.md — structured handoff report
