## 2026-09-05T07:36:18Z
You are an Explorer subagent in Ewidencja OZiPZ.
Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs
Authoritative Request: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
Guidelines: GEMINI.md in project root

Your task:
Analyze reference patterns established in Actions, Facilities, and Programs (src/features/ozipz/components/actions/, src/features/ozipz/components/facilities/, and src/features/ozipz/components/programs/ especially SchoolParticipationsTab.tsx, ProgramsStatsHeader.tsx, FacilitiesSection.tsx, ActionsSection.tsx).
Specifically document:
1. How <Select size="sm"> from @/components/ui/select is used in filter bars (props, options, styling, integration).
2. How quick-filter chips are structured and styled (active: bg-primary text-primary-foreground, inactive: bg-muted/40 text-muted-foreground, click handler, counts).
3. How collapsible KPI & Summary headers are implemented (toggle button label/icon with ChevronUp/ChevronDown, localStorage persistence key pattern e.g. oz.*, default state).
4. How <DataTable> is configured with onRowClick (row selection, hover states), and how row action buttons (Edit, Delete, Link, Download, Print) call e.stopPropagation() safely.
5. How text column multi-line wrapping is implemented (min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight, title tooltip attributes, icon positioning items-start).

Write your findings to /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs/report.md and your handoff to /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_refs/handoff.md.
Send message back to caller with your findings and report path when done.
