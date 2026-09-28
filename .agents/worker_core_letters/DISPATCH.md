## 2026-09-05T07:41:49Z
You are a Worker subagent in Ewidencja OZiPZ for Milestone 4: Letters Module Harmonization.
Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_letters
Authoritative Request: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
Project Scope: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_core/PROJECT.md
Guidelines: GEMINI.md in project root
Explorer Reports:
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs/report.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_targets/report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/features/ozipz/components/letters/LettersSection.tsx
- src/features/ozipz/components/letters/components/LettersStatsHeader.tsx (new component, <100 lines)
- src/features/ozipz/components/letters/lettersComponents.test.tsx

Deliverables:
1. Filter Bar & Select size="sm" (R1):
   - In LettersSection.tsx: replace raw HTML <select> for directionFilter with Design System <Select size="sm"> from @/components/ui/select.
   - Add quick-filter chips for direction (Wszystkie pisma, Wychodzące, Przychodzące) with active (bg-primary text-primary-foreground border-primary font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border shadow-none) and inactive (bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer) styling. Add search clear X button.
2. Direct Row Click & Safe Action Isolation (R2):
   - In LettersSection.tsx: configure <DataTable> with onRowClick={(row) => onOpenEdit(row)} and rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}.
   - Ensure Edit and Trash2 action buttons call e.stopPropagation() in their onClick handlers.
3. Multi-line Text Wrapping & Tooltips (R3):
   - In LettersSection.tsx:
     Column subject: min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight with title={row.subject}.
     Subtext senderRecipient: title={row.senderRecipient}.
     Column assigned: title tooltip.
4. Collapsible KPI Header with localStorage Persistence (R4):
   - Create src/features/ozipz/components/letters/components/LettersStatsHeader.tsx (<100 lines) showing:
     1. Wszystkie Pisma (letters.length)
     2. Pisma Wychodzące
     3. Pisma Przychodzące
     4. Ze Znakiem Sprawy JRWA
   - In LettersSection.tsx: implement showKpiSummary state initialized from localStorage.getItem("oz.lettersShowKpiSummary") !== "false" with try/catch.
   - Add toggle button in header next to "Zarejestruj Pismo Urzędowe" with ChevronUp/ChevronDown, aria-expanded, title tooltip, and labels "Zwiń KPI" / "Pokaż KPI".
5. Component Tests & Verification:
   - Update src/features/ozipz/components/letters/lettersComponents.test.tsx testing Select size="sm", quick-filter chips, onRowClick, action buttons e.stopPropagation(), and collapsible KPI header.
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/letters`.
   - Ensure 0 errors and GEMINI.md compliance (<350-400 lines per file, 0 any types, 0 hardcoded values).

Write handoff report to /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_letters/handoff.md and notify orchestrator via send_message when done.
