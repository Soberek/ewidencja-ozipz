# Worker M2 Dispatch — Collapsible KPI Header & LocalStorage Persistence (R2.1, R2.2)

## Exclusive File Ownership:
- `src/features/ozipz/components/programs/ProgramsSection.tsx`
- `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`

DO NOT modify any other files.

## References:
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_2/report.md`

## Mandatory Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks:
1. In `src/features/ozipz/components/programs/ProgramsSection.tsx`:
   - Initialize `showKpiSummary` state from `localStorage.getItem("oz.programsShowKpiSummary")`.
   - Wrap in `try/catch` to safely handle `SecurityError` and fallback to `true` by default.
   - Implement `toggleKpiSummary` callback persisting `String(next)` to `localStorage.setItem("oz.programsShowKpiSummary", String(next))` with `try/catch`.
   - Conditionally render `{showKpiSummary && <ProgramsStatsHeader ... />}`.
   - Pass `isKpiVisible={showKpiSummary}` and `onToggleKpi={toggleKpiSummary}` to `<ProgramsViewSwitcher>`.
2. In `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`:
   - Accept props `isKpiVisible?: boolean` and `onToggleKpi?: () => void`.
   - In the right-hand action container alongside the Add button, add the collapsible toggle button:
     - `<Button variant="outline" size="sm" onClick={onToggleKpi} className="h-8 gap-1.5 text-xs font-medium cursor-pointer" title={isKpiVisible ? "Zwiń karty podsumowania KPI" : "Rozwiń karty podsumowania KPI"} aria-expanded={isKpiVisible} aria-label={isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}>`
     - Render `ChevronUp` if `isKpiVisible`, else `ChevronDown` (`size-3.5 text-muted-foreground`).
     - Text: `isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"`.
3. Verify:
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/programs/`.
   - Check file length: ensure both files remain `<350` lines.
4. Deliver handoff report in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2/handoff.md`.

## 2026-09-03T15:29:33Z
You are Worker M2 on the Ewidencja OZiPZ project.
Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2
Read /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md, GEMINI.md at repo root, PROJECT.md, and your dispatch at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2/DISPATCH.md.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive file write ownership is:
- `src/features/ozipz/components/programs/ProgramsSection.tsx`
- `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`
Do NOT modify any other files.

Implement Milestone 2:
1. In `src/features/ozipz/components/programs/ProgramsSection.tsx`:
   - State `showKpiSummary` initialized from `localStorage.getItem("oz.programsShowKpiSummary")`.
   - Wrap in `try/catch` to safely handle `SecurityError` and fallback to `true`.
   - Callback `toggleKpiSummary` persisting `String(next)` to `localStorage.setItem("oz.programsShowKpiSummary", String(next))` with `try/catch`.
   - Conditionally render `{showKpiSummary && <ProgramsStatsHeader ... />}`.
   - Pass `isKpiVisible={showKpiSummary}` and `onToggleKpi={toggleKpiSummary}` to `<ProgramsViewSwitcher>`.
2. In `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`:
   - Accept props `isKpiVisible?: boolean` and `onToggleKpi?: () => void`.
   - In the right-hand action container alongside the Add button, add the collapsible toggle button:
     `<Button variant="outline" size="sm" onClick={onToggleKpi} className="h-8 gap-1.5 text-xs font-medium cursor-pointer" title={isKpiVisible ? "Zwiń karty podsumowania KPI" : "Rozwiń karty podsumowania KPI"} aria-expanded={isKpiVisible} aria-label={isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}>`
     `{isKpiVisible ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}`
     `<span>{isKpiVisible ? "Zwiń KPI" : "Pokaż KPI"}</span>`
     `</Button>`
3. Test and verify:
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/programs/`.
   - Verify file lengths <350 lines per GEMINI.md.
4. Write handoff report in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m2/handoff.md` and message parent when complete.
