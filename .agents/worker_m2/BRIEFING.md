# BRIEFING — 2026-09-03T17:34:00+02:00

## Mission
Implement Milestone 2 for Ewidencja OZiPZ Programs module: collapsible KPI summary header in `ProgramsSection.tsx` persisted in `localStorage` (`oz.programsShowKpiSummary`) with safe error handling, and the toggle button (`Zwiń KPI` / `Pokaż KPI`) in `ProgramsViewSwitcher.tsx`.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2
- Original parent: 3f807e01-65fe-4275-8901-197dc6fbc3ed
- Milestone: Milestone 2 (Collapsible KPI Header & LocalStorage Persistence)

## 🔒 Key Constraints
- Exclusively own files:
  - `src/features/ozipz/components/programs/ProgramsSection.tsx`
  - `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`
- DO NOT modify any other files.
- No cheating, no hardcoding test results, no dummy implementations.
- Maintain full compatibility with GEMINI.md and PROJECT.md guidelines (file length <350 lines, zero `any`, zero hardcoded domain options).
- Ensure all vitest tests and typecheck (`npm run typecheck`) pass.

## Current Parent
- Conversation ID: 3f807e01-65fe-4275-8901-197dc6fbc3ed
- Updated: 2026-09-03T17:34:00+02:00

## Task Summary
- **What to build**:
  1. In `ProgramsSection.tsx`: State `showKpiSummary` with lazy initializer from `localStorage.getItem("oz.programsShowKpiSummary")`, try/catch error handling falling back to `true`, toggle callback writing `String(next)` with try/catch, conditional rendering `{showKpiSummary && <ProgramsStatsHeader ... />}`, and passing `isKpiVisible` & `onToggleKpi` to `ProgramsViewSwitcher`.
  2. In `ProgramsViewSwitcher.tsx`: Accept `isKpiVisible?: boolean` and `onToggleKpi?: () => void`. Add toggle button in right action container with `ChevronUp`/`ChevronDown`, `Zwiń KPI`/`Pokaż KPI`, and accessibility attributes.
- **Success criteria**:
  - KPI header collapses when toggled.
  - State persists in `localStorage` across page reloads.
  - Graceful fallback on `SecurityError` or `QuotaExceededError`.
  - Typecheck and vitest tests pass (100%).
  - Files strictly <350 lines (`ProgramsSection.tsx`: 144 lines, `ProgramsViewSwitcher.tsx`: 116 lines).
- **Interface contracts**: `PROJECT.md § Interface Contracts`
- **Code layout**: `src/features/ozipz/components/programs/`

## Key Decisions Made
- Followed canonical project pattern from `FacilitiesSection` and `ActionsSection`.
- Key in localStorage: `"oz.programsShowKpiSummary"`.
- Button variant: outline, size: sm, `h-8 gap-1.5 text-xs font-medium cursor-pointer`.
- Wrapped in `{onToggleKpi && (...)}` to preserve safety when switcher is rendered without toggle callback.

## Artifact Index
- `.agents/worker_m2/DISPATCH.md` — Assignment instructions
- `.agents/worker_m2/BRIEFING.md` — Working memory and status
- `.agents/worker_m2/progress.md` — Liveness and step tracking
- `.agents/worker_m2/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**:
  - `src/features/ozipz/components/programs/ProgramsSection.tsx`: Added `showKpiSummary` state with localStorage persistence, `toggleKpiSummary` callback with try/catch error suppression, conditional rendering of `ProgramsStatsHeader`, and forwarded `isKpiVisible` + `onToggleKpi` to `ProgramsViewSwitcher`.
  - `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`: Extended props with `isKpiVisible` and `onToggleKpi`, imported `ChevronUp` and `ChevronDown`, added collapsible KPI toggle button in the action toolbar.
- **Build status**: PASS (`npm run typecheck`, `npx vitest run src/features/ozipz/components/programs/`, full vitest suite 67 files 455 tests passed, `npm run build` passed)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (100% test success rate across entire project)
- **Lint status**: Zero TypeScript compilation errors (`tsc --noEmit`)
- **Tests added/modified**: Verified with `programsComponents.test.tsx` and full vitest suite

## Loaded Skills
- None
