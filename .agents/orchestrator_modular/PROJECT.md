# Project: Ewidencja OZiPZ Modularization & Anti-Monolith Refactoring

## Architecture
The application is a desktop/web app (Tauri + React 19 + TypeScript strict + TailwindCSS + SQLite / LocalStorage fallback + Zustand) for PSSE OZiPZ.
This refactoring addresses monolithic files (>400 lines) violating GEMINI.md Rule 2A by decomposing them into single-responsibility submodules while preserving 100% backward compatibility of public APIs.

### Baseline & Current Health:
- Baseline Tests: 77 test suites, 599 tests passed.
- Milestone 1 Tests: 80 test suites, 624 tests passed.
- Milestone 2 Tests: 83 test suites, 652 tests passed (100% pass rate).
- TypeScript Typecheck: 0 errors (`tsc --noEmit`).
- Production Build: 0 errors (`tsc && vite build`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Baseline Survey & Verification | Verify test suite (599+ tests), typecheck, build, and map all monolithic files | M0 | Survey (Complete) |
| 2 | Zustand Store Slices (R1) | Decompose `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines) into domain slices in `slices/` and `domainHooks.ts` (<100 lines each) | M1 | Request R1 (DONE) |
| 3 | DB Repositories Pattern (R2) | Decompose `sqlite-service.ts` (1184 lines) and `fallback-service.ts` (582 lines) into DDL, seeding, and domain repositories in `src/db/repositories/` (<180 lines each) | M2 | Request R2 (DONE) |
| 4 | Calculation Utilities (R3) | Decompose `ozipzCalculations.ts` (1134 lines) and `reportAnnex.ts` (961 lines) into dedicated calculators in `calculators/` and `annex/` (<280 lines each) | M3 | Request R3 |
| 5 | Action Hooks (R4) | Decompose `useActionsFiltering.ts` (675 lines) and `useActionEditorState.ts` (617 lines) into sub-hooks and pure helpers (<150 lines each) | M4 | Request R4 |
| 6 | Comprehensive Regression Gate & Audit (R5) | Full regression verification (599+ tests, typecheck, build, line budget audit <= 350 lines, zero `any` types) | M5 | Request R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Baseline Survey & Verification | Explorer survey across R1, R2, R3, R4, R5 | none | DONE |
| M1 | Zustand Store Slices | `src/features/ozipz/store/useOzipzDbStore.ts` -> `slices/` | M0 | DONE |
| M2 | DB Service Repositories | `src/db/sqlite-service.ts`, `src/db/fallback-service.ts` -> `repositories/` | M0 | DONE |
| M3 | Modular Calculation Utilities | `ozipzCalculations.ts`, `reportAnnex.ts` -> `calculators/`, `annex/` | M0 | IN_PROGRESS |
| M4 | Modular Action Hooks | `useActionsFiltering.ts`, `useActionEditorState.ts` -> sub-hooks | M0 | PLANNED |
| M5 | Final Regression Gate & Audit | Full test suite (599+), typecheck, build, line budget audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Store Slices ↔ useOzipzDbStore [VERIFIED & PASSING]
- Slices export `StateCreator` functions typed against unified `OzipzDbState`.
- `useOzipzDbStore.ts` (43 lines) combines 15 domain slices via Zustand `create<OzipzDbState>()`.
- Domain hooks (`useActions`, `useFacilities`, etc.) are re-exported transparently from `domainHooks.ts` (269 lines).
- Public store interface `OzipzDbState` and all selector signatures remain 100% unchanged.

### DB Repositories ↔ IOzipzDatabaseService [VERIFIED & PASSING]
- `IOzipzDatabaseService` interface in `src/db/types.ts` is unchanged (67 methods).
- `SqliteDatabaseService` (147 lines) and `FallbackDatabaseService` (129 lines) instantiate 10 domain repositories and delegate operations.
- `sqlite-schema.ts` (143 lines) and `sqlite-seed.ts` (118 lines) encapsulate schema DDL and initial seeding.
- All 27 files in `src/db/` are strictly < 175 lines (budget < 350 lines).

### Calculators & Annex ↔ Consumers
- Barrel re-exports from `ozipzCalculations.ts` and `reportAnnex.ts` retain exact named exports and signatures.
- All 21 types, 5 constants, and 24 functions in `ozipzCalculations` preserved.
- All 9 types, 7 constants/formatters, and 7 functions in `reportAnnex` preserved.

### Action Hooks ↔ Consumers
- Return contracts of `useActionsFiltering` and `useActionEditorState` remain 100% identical.
- All consumers (`ActionsSection.tsx`, `ActionDialog.tsx`, `ActionEditorSection.tsx`) and tests run without change.

## Code Layout
- `src/features/ozipz/store/slices/`: 16 files (<125 lines each) + `domainHooks.ts` (269 lines) + `useOzipzDbStore.ts` (43 lines)
- `src/db/repositories/`:
  - `interfaces.ts` (121 lines)
  - `sqlite/`: 10 repositories (all <175 lines)
  - `fallback/`: 10 repositories + storage.ts (all <120 lines)
  - `sqlite-schema.ts` (143 lines), `sqlite-seed.ts` (118 lines)
  - `sqlite-service.ts` (147 lines), `fallback-service.ts` (129 lines)
- `src/features/ozipz/utils/calculators/`: 8 submodules (all <190 lines)
- `src/features/ozipz/utils/annex/`: 5 submodules (all <290 lines)
- `src/features/ozipz/components/actions/hooks/`: sub-hooks (<150 lines each)
- `src/features/ozipz/components/actions/editor/`: sub-hooks (<200 lines each)
