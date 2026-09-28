# BRIEFING — 2026-09-05T08:26:00Z

## Mission
Survey `useActionsFiltering.ts` and `useActionEditorState.ts`, establish baseline repository health (`npm test`, `npm run typecheck`, `npm run build`), and scan the full `src/` codebase for files > 400 lines per GEMINI.md Rule 2A.

## 🔒 My Identity
- Archetype: explorer
- Roles: Codebase Researcher / Explorer 3
- Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3
- Original parent: 9d0bf774-9b60-4881-bd14-10b1be45880c
- Milestone: Survey & UX/UI Audit (Facilities & JRWA)
- Milestone 2: Survey & Analysis: Programs & Participations Row Interaction, Safe Event Isolation & Test Setup (R1-R4)
- Milestone 3: Survey & Analysis: Action Hooks (useActionsFiltering, useActionEditorState), Baseline Verification & Codebase Line Count Scan

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Inspect design system established in Actions
- Investigate Facilities and JRWA modules for UX/UI improvements
- Output findings in handoff.md and send message to orchestrator
- Read ORIGINAL_REQUEST.md, GEMINI.md, and DISPATCH.md
- Investigate DataTable implementation, onRowClick, row styling, cursor
- Investigate SchoolParticipationsTab and ProgramsCatalogTab row rendering & onEdit
- Identify all interactive elements needing e.stopPropagation()
- Audit testing landscape in programs and vitest
- Recommend test strategy for R1, R2, R3, R4
- Survey `useActionsFiltering.ts` (675 lines) and `useActionEditorState.ts` (617 lines)
- Measure baseline health: tests (599+), typecheck, build
- Scan src/ for any other files > 400 lines
- Write comprehensive handoff.md

## Current Parent
- Conversation ID: cafb30d4-7ff5-4c38-8138-08cc15e5e68d
- Updated: 2026-09-05T08:26:00Z

## Investigation State
- **Explored paths**:
  - Full test suite: `npm test -- --run` (77 files, 599 tests passed, 52.52s)
  - Full typecheck: `npm run typecheck` (tsc --noEmit, 0 errors, exit 0)
  - Full production build: `npm run build` (tsc && vite build, built in 4.88s, exit 0)
  - `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (675 lines) & tests (552 lines)
  - `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (617 lines) & tests (493 lines)
  - Consumers: `ActionsSection.tsx`, `ActionDialog.tsx`, `ActionEditorSection.tsx`
  - Full codebase scan across `src/` for all files exceeding 350 and 400 lines
- **Key findings**:
  - Baseline health is 100% green: 599/599 tests pass, TypeScript strict mode passes with 0 errors, build in 4.88s.
  - Exactly 16 non-test source files in `src/` exceed 400 lines. The top 7 correspond directly to R1-R4 refactoring targets (`sqlite-service.ts`, `ozipzCalculations.ts`, `reportAnnex.ts`, `useOzipzDbStore.ts`, `useActionsFiltering.ts`, `useActionEditorState.ts`, `fallback-service.ts`).
  - 12 additional files lie in the 350-400 line range.
  - `useActionsFiltering.ts` (675 lines) can be decomposed into 4 cohesive sub-modules + 1 thin facade hook:
    1) `actionsFilterLogic.ts` (~140 lines, pure functions)
    2) `useActionSelection.ts` (~130 lines, bulk operations & selection)
    3) `useActionFilterState.ts` (~130 lines, filter states & setters)
    4) `useActionToolsState.ts` (~70 lines, month lock & sign clipboard)
    5) `useActionsFiltering.ts` (~120 lines, facade hook preserving 100% public API)
  - `useActionEditorState.ts` (617 lines) can be decomposed into 4 sub-modules + 1 orchestrating hook:
    1) `useActionEditorJrwa.ts` (~130 lines, JRWA resolution & sign generation)
    2) `useActionEditorMaterials.ts` (~90 lines, material distributions & sync)
    3) `useActionEditorPresets.ts` (~80 lines, presets & template application)
    4) `actionEditorSubmitUtils.ts` (~80 lines, pure payload & distribution builder)
    5) `useActionEditorState.ts` (~200 lines, orchestrating hook preserving 100% public API)
- **Unexplored areas**: None. All survey requirements completed.

## Key Decisions Made
- Confirmed zero-breaking-change modularization strategy maintaining 100% API compatibility for both action hooks.
- Categorized all files exceeding 400 lines across the entire codebase into targeted domains, UI components, types/mappers, and utilities.

## Artifact Index
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3/handoff.md — 5-component handoff report
