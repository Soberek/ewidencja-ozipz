# DISPATCH — 2026-09-05T09:41:49+02:00

You are a Worker subagent in Ewidencja OZiPZ for Milestone 2: Registers Module Harmonization.
Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_registers
Authoritative Request: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
Project Scope: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_core/PROJECT.md
Guidelines: GEMINI.md in project root
Explorer Reports:
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs/report.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_targets/report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/features/ozipz/components/registers/RegistersSection.tsx
- src/features/ozipz/components/registers/components/RegistersFilterBar.tsx
- src/features/ozipz/components/registers/components/RegistersTypeTabs.tsx
- src/features/ozipz/components/registers/components/InformationRegisterTable.tsx
- src/features/ozipz/components/registers/components/PublicationsRegisterTable.tsx
- src/features/ozipz/components/registers/components/VisitationsRegisterTable.tsx
- src/features/ozipz/components/registers/components/registersComponents.test.tsx

Deliverables:
1. Filter Bar & Quick Chips (R1):
   - In RegistersFilterBar.tsx: add quick-filter chips for JRWA symbols or time periods (e.g. Wszystkie wpisy, Bieżący rok, 966.1, 966.3, 966.4) with active (bg-primary text-primary-foreground border-primary font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border shadow-none) and inactive (bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer) styling. Ensure clear X button on search input works cleanly.
2. Row Click & Action Isolation (R2):
   - In InformationRegisterTable.tsx, PublicationsRegisterTable.tsx, and VisitationsRegisterTable.tsx:
     Add rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"} to <DataTable> so rows clearly indicate clickability on hover.
     Ensure any action buttons or links inside cells call e.stopPropagation().
3. Multi-line Text Wrapping & Tooltips (R3):
   - In InformationRegisterTable.tsx: column subject with min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight and title={row.subject} tooltip. Column leadEducator and notes with descriptive title tooltips.
   - In PublicationsRegisterTable.tsx: column topic with min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight and title={row.topic} tooltip. Column leadEducator with title tooltip.
   - In VisitationsRegisterTable.tsx: column subject with min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight and title={row.subject} tooltip. Column leadEducator with title tooltip.
4. Collapsible KPI Header with localStorage Persistence (R4):
   - In RegistersSection.tsx: implement showKpiSummary state initialized from localStorage.getItem("oz.registersShowKpiSummary") !== "false", wrapped in try/catch.
   - Add toggle button in RegistersTypeTabs.tsx or header with ChevronUp/ChevronDown, aria-expanded, title tooltip, and labels "Zwiń KPI" / "Pokaż KPI".
5. Component Tests & Verification:
   - Create/update src/features/ozipz/components/registers/components/registersComponents.test.tsx to thoroughly test quick-filter chips, collapsible KPI toggle, row hover class, and text wrapping.
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/registers`.
   - Ensure 0 errors and GEMINI.md compliance (<350-400 lines per file, 0 any types, 0 hardcoded values).
