# Worker M4 Dispatch: Action Editor & Filtering Hook Decomposition (R4)

## Mission
Modularize `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (675 lines) and `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (617 lines) into focused sub-hooks/helpers adhering strictly to single responsibility, bringing all resulting files below the line budget (< 350 lines, target < 200 lines).

## File Boundaries & Ownership
Exclusive write access to:
- `src/features/ozipz/components/actions/hooks/actionsFilterLogic.ts` (create)
- `src/features/ozipz/components/actions/hooks/useActionSelection.ts` (create)
- `src/features/ozipz/components/actions/hooks/useActionFilterState.ts` (create)
- `src/features/ozipz/components/actions/hooks/useActionToolsState.ts` (create)
- `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts` (refactor to facade < 150 lines)
- `src/features/ozipz/components/actions/editor/useActionEditorJrwa.ts` (create)
- `src/features/ozipz/components/actions/editor/useActionEditorMaterials.ts` (create)
- `src/features/ozipz/components/actions/editor/useActionEditorPresets.ts` (create)
- `src/features/ozipz/components/actions/editor/actionEditorSubmitUtils.ts` (create)
- `src/features/ozipz/components/actions/editor/useActionEditorState.ts` (refactor to orchestrator < 220 lines)

Do not modify files outside this boundary without prior coordination.

## Inputs
- Authoritative Request: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- Architecture Blueprint: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3/handoff.md`
- Gemini Rules: `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`

## Verification Requirements
- `npx vitest run src/features/ozipz/components/actions/hooks/useActionsFiltering.test.ts src/features/ozipz/components/actions/editor/useActionEditorState.test.ts src/features/ozipz/components/actions/editor/actionMaterialsDistribution.test.ts`
- `npm run typecheck`
- `npm test`
- Line count check: `wc -l src/features/ozipz/components/actions/hooks/*.ts src/features/ozipz/components/actions/editor/*.ts` (all < 350 lines)

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-05T09:20:12Z
Tasks:
1. Modularize `src/features/ozipz/components/actions/hooks/useActionsFiltering.ts`:
   - Create `actionsFilterLogic.ts` (<150 lines): pure functions `filterActionsList`, `computeActiveFiltersCount`, `generateActiveFilterChips`.
   - Create `useActionSelection.ts` (<140 lines): multi-selection state, metrics, and bulk operations.
   - Create `useActionFilterState.ts` (<140 lines): filter states, quick toggles, advanced filter arrays, localStorage publication visibility, reset handler.
   - Create `useActionToolsState.ts` (<80 lines): closed months state, JRWA sign clipboard helper.
   - Refactor `useActionsFiltering.ts` into a composition hook (<140 lines) returning the exact identical contract.
2. Modularize `src/features/ozipz/components/actions/editor/useActionEditorState.ts`:
   - Create `useActionEditorJrwa.ts` (<140 lines): JRWA symbol state, sign auto-generation, proposals, date updates.
   - Create `useActionEditorMaterials.ts` (<100 lines): distributed materials array, sync with form fields, `selectedMaterial`.
   - Create `useActionEditorPresets.ts` (<90 lines): presets & templates applicator.
   - Create `actionEditorSubmitUtils.ts` (<90 lines): pure functions `buildActionCleanPayload`, `buildActionDistributionMaterials`.
   - Refactor `useActionEditorState.ts` into an orchestrator (<220 lines) returning the exact identical contract.
3. Ensure 100% backward compatibility for all consumer components (`ActionsSection.tsx`, `ActionDialog.tsx`, `ActionEditorSection.tsx`) and tests.
4. Ensure 0 `any` types (GEMINI.md Rule 3).
5. Run tests:
   - `npx vitest run src/features/ozipz/components/actions/hooks/useActionsFiltering.test.ts src/features/ozipz/components/actions/editor/useActionEditorState.test.ts src/features/ozipz/components/actions/editor/actionMaterialsDistribution.test.ts`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
6. Check line counts: `wc -l src/features/ozipz/components/actions/hooks/*.ts src/features/ozipz/components/actions/editor/*.ts` (all strictly < 350 lines).
7. Write full handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m4_hooks/handoff.md` and message parent.
