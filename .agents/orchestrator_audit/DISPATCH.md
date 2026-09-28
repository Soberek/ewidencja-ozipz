## 2026-09-11T08:29:10Z

You are the Project Orchestrator for Ewidencja OZiPZ.

## Working Directory & Identity
- Archetype: orchestrator
- Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_audit
- Project Root: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
- Authoritative Request File: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
- Guidelines & Rules: GEMINI.md in project root
- Database Specification: DATABASE_SCHEMA.md in project root

## Mission
Conduct a comprehensive, multi-perspective architectural critique and code audit of the Ewidencja OZiPZ application, evaluating code quality, database and state integrity, UX/domain workflows, and test coverage to produce an actionable, prioritized improvement roadmap.

## Requirements
### R1. Architectural & Code Health Inspection
Audit the codebase against modern TypeScript/React best practices and GEMINI.md engineering standards:
- Adherence to SRP, DRY, and modular design.
- Detection of files exceeding 350-400 lines (monolith avoidance per GEMINI.md Rule 2A).
- Strict type safety (identifying any `any` usage, loose typing, or incomplete schema validation per Rule 3).
- Separation of concerns between UI components, Zustand stores, and database services.

### R2. Database, Schema & State Management Audit
Inspect the relational SQLite layer (`src/db/`) and Zustand stores (`src/features/ozipz/store/`):
- SQLite schema design, foreign keys, cascading rules, and indexing efficiency per Rule 6 and DATABASE_SCHEMA.md.
- Dual-mode architecture (`SqliteDatabaseService` vs `FallbackDatabaseService`) and mapper consistency (`src/db/mappers.ts`).
- Enforcement of the "Zero Default Values" rule in models and forms (Rule 7).
- State mutation hygiene and store subscription granularity.

### R3. UI/UX & Domain Workflow Critique
Review user workflows across core OZiPZ modules (Działania Edukacyjne, Harmonogram/Kanban, Kancelaria JRWA, Mierniki i Raporty MZ/GIS, Rejestry, Materiały, Publikacje):
- Form validation UX, error states, and empty states.
- Consistency of design system components (`DataTable`, `ModalDialog`, `Badge`, `Card`).
- Edge-case handling (e.g., date boundary issues, empty relations, invalid data migration states).
- Accessibility and responsive scaling (`useFontSize`).

### R4. Test Coverage & Code Verification Analysis
Evaluate the testing suite and build pipeline:
- Current `vitest` unit test coverage and identification of untested critical business logic (e.g. calculation utilities, mappers, complex dialogs).
- Run and verify build and test health (`npm test`, `npm run build`).

### R5. Prioritized Remediation Roadmap
Synthesize findings into a structured, prioritized report:
- Categorized by severity/impact (Critical, High, Medium, Low).
- Concrete code locations (file paths and line ranges).
- Specific, actionable recommendations and refactoring recipes.

## Acceptance Criteria
- [ ] Comprehensive markdown audit report detailing architecture, database, domain UX, and testing, written to `docs/ARCHITECTURAL_AUDIT_REPORT.md`.
- [ ] Clear inventory of monolithic files (>350-400 lines) and anti-patterns with refactoring strategies.
- [ ] Explicit verification matrix against the engineering rules in `GEMINI.md`.
- [ ] Prioritized list of actionable improvements with clear rationales and implementation guidelines.
- [ ] Current test execution and build status verified with commands (`npm run build`, `npm test`).
