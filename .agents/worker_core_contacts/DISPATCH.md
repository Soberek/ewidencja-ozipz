## 2026-09-05T07:41:49Z

You are a Worker subagent in Ewidencja OZiPZ for Milestone 3: Contacts Module Harmonization.
Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_contacts
Authoritative Request: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
Project Scope: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_core/PROJECT.md
Guidelines: GEMINI.md in project root
Explorer Reports:
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs/report.md
- /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_targets/report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/features/ozipz/components/contacts/ContactsSection.tsx
- src/features/ozipz/components/contacts/components/ContactsFilterBar.tsx
- src/features/ozipz/components/contacts/components/ContactsTableView.tsx
- src/features/ozipz/components/contacts/components/contactsComponents.test.tsx

Deliverables:
1. Filter Bar & Select size="sm" (R1):
   - In ContactsFilterBar.tsx: replace the two raw HTML <select> elements (position and municipality) with Design System <Select size="sm"> from @/components/ui/select.
   - Add quick-filter chips for roles (Wszystkie, Koordynatorzy, Dyrektorzy, Pedagodzy) with active (bg-primary text-primary-foreground border-primary font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border shadow-none) and inactive (bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer) styling. Add search clear X button.
2. Direct Row Click & Safe Action Isolation (R2):
   - In ContactsTableView.tsx:
     Configure <DataTable> with onRowClick={(row) => onEdit(row)} and rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}.
     In actions cell: wrap content in <div onClick={(e) => e.stopPropagation()}> AND ensure Edit and Trash2 buttons call e.stopPropagation() in onClick handlers.
3. Multi-line Text Wrapping & Tooltips (R3):
   - In ContactsTableView.tsx:
     Column name: min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight with title={row.name}.
     Column facilityName: replace single-line truncate with min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight items-start and title={row.facilityName || "Placówka nieokreślona"}.
4. Collapsible KPI Header with localStorage Persistence (R4):
   - In ContactsSection.tsx: implement showKpiSummary state initialized from localStorage.getItem("oz.contactsShowKpiSummary") !== "false", wrapped in try/catch.
   - Add toggle button in ContactsFilterBar.tsx next to "Nowy Kontakt" with ChevronUp/ChevronDown, aria-expanded, title tooltip, and labels "Zwiń KPI" / "Pokaż KPI".
5. Component Tests & Verification:
   - Create src/features/ozipz/components/contacts/components/contactsComponents.test.tsx testing filter bar Selects, quick chips, onRowClick, action buttons e.stopPropagation(), and collapsible KPI toggle.
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/contacts`.
   - Ensure 0 errors and GEMINI.md compliance (<350-400 lines per file, 0 any types, 0 hardcoded values).

Write handoff report to /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_contacts/handoff.md and notify orchestrator via send_message when done.
