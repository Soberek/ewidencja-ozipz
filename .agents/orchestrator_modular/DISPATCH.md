# Dispatch Log

## 2026-09-05T08:22:26Z

You are the Project Orchestrator for Ewidencja OZiPZ.

## Working Directory & Identity
- Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_modular
- Project Root: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
- Authoritative Request File: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md (also at repo root)
- Guidelines: GEMINI.md in project root
- Database Specification: DATABASE_SCHEMA.md in project root

## Mission
Refactor and decompose monolithic files (>400 lines) across Ewidencja OZiPZ into clean, modular, single-responsibility submodules strictly adhering to GEMINI.md Rule 2A, targeting the Zustand store (slices architecture), SQLite/fallback database services (domain repositories), heavy calculation utilities (ozipzCalculations and reportAnnex), and action hooks (useActionsFiltering and useActionEditorState).

## Requirements

### R1. Zustand Store Decomposition (Slice Architecture)
Decompose `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines) into modular Zustand slices per domain entity (actions, programs, facilities, schedule, materials, jrwa, dictionaries, letters, scans, staff, registers) using standard Zustand slice creator patterns. All slices must be re-exported through the unified `useOzipzDbStore` hook without changing existing public contracts.

### R2. Database Service Repository Pattern
Refactor `src/db/sqlite-service.ts` (1184 lines) and `src/db/fallback-service.ts` (582 lines) into modular domain repositories (e.g. actions, programs, facilities, schedule, contacts, materials, jrwa, etc.) implementing cohesive sub-interfaces, orchestrated by the main service without breaking the `IOzipzDatabaseService` contract.

### R3. Modularization of Heavy Calculation Utilities
Decompose `src/features/ozipz/utils/ozipzCalculations.ts` (1134 lines) and `src/features/ozipz/utils/reportAnnex.ts` (961 lines) into dedicated domain calculators and table builders, maintaining transparent barrel re-exports from `ozipzCalculations.ts` and `reportAnnex.ts` so all existing consumer imports continue to work without modification.

### R4. Action Editor & Filtering Hook Decomposition
Modularize `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (675 lines) and `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (617 lines) into focused sub-hooks/helpers adhering strictly to single responsibility, bringing all resulting files below the line budget.

### R5. Strict GEMINI.md Compliance & Zero-Regression Gate
Ensure all files in the refactored areas strictly respect the 350-400 line maximum limit (Rule 2A), zero `any` types (Rule 3), zero test regressions, 100% test pass rate across the full test suite (599+ tests), zero TypeScript compilation errors (`npm run typecheck`), and clean production build (`npm run build`).
