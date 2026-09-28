# Dispatch Assignment: Worker M4 (JRWA Registry & Case Management UX/UI Enhancements)

- **Role**: Worker M4 (Implementation)
- **Working Directory**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m4
- **Authoritative Request**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
- **Engineering Standards**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md
- **Project Scope**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md
- **Survey Findings**: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3/handoff.md

## Exclusive File Ownership
You exclusively own and may edit files in:
`src/features/ozipz/components/jrwa/`
- `JrwaSection.tsx`
- `JrwaCaseDetailsDialog.tsx`
- `components/JrwaCasesFilterBar.tsx`
- `components/JrwaCasesTable.tsx`
- `components/JrwaSignGeneratorCard.tsx`
- `components/JrwaStatsHeader.tsx`
- `components/jrwaComponents.test.tsx`
- `jrwa.test.ts`

You MUST NOT edit any files outside `src/features/ozipz/components/jrwa/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks & Acceptance Criteria for Milestone 4
1. **Direct Row Click & Action Isolation (`JrwaCasesTable.tsx`)**:
   - In `<DataTable>`, pass `onRowClick={(row) => onOpenDetails(row)}` and `rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}` so clicking anywhere on a case row opens case details/metrics.
   - In the `actions` column, add `e.stopPropagation()` to:
     - View details button (`onOpenDetails`)
     - Edit button (`onEdit`)
     - Delete button (`onDelete`)
2. **One-Click Case Sign Copying with Visual Confirmation**:
   - In `JrwaCasesTable.tsx`, increase the copy button target size with a subtle border/hover background (`p-1 rounded-[2px] border border-border/40 hover:border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors`), and ensure clicking it calls `e.stopPropagation()` and triggers an immediate visual `Check` icon confirmation for the copied row.
   - In `JrwaSignGeneratorCard.tsx`, add a one-click copy button next to the generated case sign with `toast.success` and visual confirmation.
   - In `JrwaCaseDetailsDialog.tsx`, ensure `handleCopySign` shows a success toast and checkmark feedback.
3. **EZD Registration Status Indicators & Alerts**:
   - In `JrwaSection.tsx`, dynamically link cases with actions (via `useActions()`) to determine pending EZD counts per case (actions where `ezdStatus === "do_ezd"` or missing EZD sign for non-media actions).
   - In `JrwaCasesTable.tsx`, render an explicit EZD status column/badge:
     - If pending EZD actions exist: urgent warning badge `! Wymaga EZD ({count})` with `bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-semibold`.
     - If all actions are registered in EZD: success badge `w EZD ({count})` with `bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold`.
     - If no actions are attached: subtle badge `Brak pism`.
4. **Unified Filter Bar & Quick Filters (`JrwaCasesFilterBar.tsx`)**:
   - Add a quick filter bar row matching Actions:
     - `Wszystkie sprawy` (`activeQuickFilter === "all"`)
     - `W toku` (`activeQuickFilter === "w_toku"`)
     - `Zakończone` (`activeQuickFilter === "zakonczona"`)
     - `! Wymaga EZD` (`requiresEzdFilter` active) with `bg-destructive text-destructive-foreground border-destructive shadow-none font-semibold` when active!
   - In `JrwaSection.tsx`, add collapsible KPI toggle (`showKpiSummary`) persisted in `localStorage.getItem("oz.jrwaShowKpiSummary")`.
   - In `JrwaCasesFilterBar.tsx`, add collapsible KPI toggle button ("Zwiń KPI" / "Pokaż KPI" with `ChevronUp`/`ChevronDown`).
5. **Unit Tests & Verification (`jrwaComponents.test.tsx`)**:
   - Add unit tests verifying:
     - Table row click opens case details.
     - Delete and edit buttons stop propagation and do NOT open details.
     - Case sign copying copies text and toggles `Check` icon.
     - EZD alert badge is displayed when pending EZD actions exist.
     - Quick filter chips filter cases properly.
     - KPI toggle button collapses/expands the stats header.
   - Run tests (`npx vitest run src/features/ozipz/components/jrwa/`), typecheck (`npm run typecheck`), and build (`npm run build`).
6. Write detailed handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m4/handoff.md`.

## 2026-09-03T10:01:17Z
You are Worker M4 for the Ewidencja OZiPZ UX/UI enhancement project.
Your working directory is: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m4
Read your instructions in:
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m4/DISPATCH.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You exclusively own files in src/features/ozipz/components/jrwa/. Implement:
1. DataTable onRowClick in JrwaCasesTable.tsx to open case details/metrics dialog.
2. e.stopPropagation() on all table action buttons (Eye, Edit, Trash2, Copy).
3. One-click case sign copying with visual Checkmark confirmation and toast notifications across table, details dialog, and sign generator card.
4. Dynamic EZD registration indicators: calculate pending EZD count per case from actions, render "! Wymaga EZD" warning badge and "w EZD" success badge.
5. Unified filter bar in JrwaCasesFilterBar.tsx with quick filter chips (Wszystkie, W toku, Zakończone, and "! Wymaga EZD" with red warning accent), and collapsible KPI toggle.
6. Unit tests in jrwaComponents.test.tsx covering row click, stop propagation, clipboard copying, and EZD status badges.
7. Verify with npx vitest run src/features/ozipz/components/jrwa/, npm run typecheck, and npm run build.
8. Write your handoff report to /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m4/handoff.md and send a message when done.
