# Audit Execution Plan: Ewidencja OZiPZ

## 1. Objectives & Scope
Conduct an exhaustive architectural audit and code health inspection of the `ewidencja-ozipz` project adhering strictly to `GEMINI.md` and `DATABASE_SCHEMA.md`.

## 2. Investigation Streams & Decomposition
| Stream | Target Requirement | Lead Agent Archetype | Key Responsibilities | Target Artifact |
|--------|--------------------|----------------------|----------------------|-----------------|
| **Stream 1: Architecture & Code Health** | R1 (SRP, DRY, Monoliths >350-400 lines, Type Safety) | `teamwork_preview_explorer` | Line-count inventory across src/, anti-pattern detection, any/loose typing audit, UI-Store-DB separation check | `.agents/explorer_arch/handoff.md` |
| **Stream 2: Database & State Management** | R2 (SQLite, Fallback, Mappers, Zero Default Values, Zustand) | `teamwork_preview_explorer` | Schema inspection vs DATABASE_SCHEMA.md, FKs, index verification, dual-service parity, mapper consistency, Rule 7 compliance | `.agents/explorer_db/handoff.md` |
| **Stream 3: UI/UX & Domain Workflows** | R3 (Core modules, Design System, UX, Edge cases, Accessibility) | `teamwork_preview_explorer` | Workflows in Actions, Schedule, JRWA, Reports, etc., component consistency (DataTable, ModalDialog), useFontSize | `.agents/explorer_ux/handoff.md` |
| **Stream 4: Test & Build Verification** | R4 (Vitest execution, Build health, Untested logic) | `teamwork_preview_worker` | Run `npm run build`, run `npm test` / vitest, assess test suite coverage, identify untested utilities/mappers | `.agents/worker_tests/handoff.md` |

## 3. Synthesis & Reporting (R5)
- Worker compiles comprehensive report into `docs/ARCHITECTURAL_AUDIT_REPORT.md`:
  1. Executive Summary & Codebase Health Scorecard.
  2. Monolithic Files Inventory (>350-400 lines) with specific refactoring strategies.
  3. Strict Verification Matrix against `GEMINI.md` (Rules 1 through 8).
  4. Database, Schema & State Audit (SQLite vs Fallback, Mappers, Rule 7).
  5. UI/UX, Design System & Domain Workflows Critique.
  6. Test Suite, Build Verification & Untested Critical Logic.
  7. Prioritized Remediation Roadmap (Critical, High, Medium, Low) with concrete file paths, line ranges, and refactoring recipes.

## 4. Quality Gate & Acceptance Criteria
- [ ] Comprehensive markdown audit report written to `docs/ARCHITECTURAL_AUDIT_REPORT.md`.
- [ ] Clear inventory of monolithic files (>350-400 lines) and anti-patterns with refactoring strategies.
- [ ] Explicit verification matrix against the engineering rules in `GEMINI.md`.
- [ ] Prioritized list of actionable improvements with clear rationales and implementation guidelines.
- [ ] Current test execution and build status verified with commands (`npm run build`, `npm test`).
