# Dispatch Log

## 2026-09-03T15:23:14Z

Initial dispatch from user/parent:

Enhance and polish the "Szkoły w programie" (Lokalizacje w programie / School Participations & Programs) module to match the high UX/UI, ergonomics, and design system standards established in the "Lokalizacje" (Facilities) and "Działania" (Actions) modules.

Requirements:
1. R1. School Participations Filter Bar & Design System Harmonization:
   Upgrade `SchoolParticipationsTab.tsx` by replacing raw HTML `<select>` elements with Design System `<Select size="sm">` from `@/components/ui/select`. Add a cohesive row of quick-filter chips (*Wszystkie zgłoszenia*, *Sprawozdanie złożone*, *Oczekuje na sprawozdanie*) and municipality filter with unified primary active styling (`bg-primary text-primary-foreground`) and muted inactive styling (`bg-muted/40`).
2. R2. Collapsible Programs & Participations KPI Header:
   Implement a collapsible toggle button (`Zwiń KPI` / `Pokaż KPI` with `ChevronUp`/`ChevronDown`) for `ProgramsStatsHeader.tsx` / `ProgramsSection.tsx`, persisting the user's view preference in `localStorage` (`oz.programsShowKpiSummary`) to save vertical workspace on laptops.
3. R3. Direct Row Interaction & Safe Action Isolation:
   Configure `<DataTable>` in `SchoolParticipationsTab` (and `ProgramsCatalogTab`) with `onRowClick={(row) => onEdit(row)}` and active hover styling. Ensure all inner interactive elements (Edit and Delete icon buttons, tooltips) safely stop event propagation (`e.stopPropagation()`) so clicking them does not trigger duplicate row-click handlers.
4. R4. Multi-line Text Wrapping for School & Program Names:
   Eliminate single-line ellipsis truncations (`truncate`) in the educational facility name and program name table columns. Implement `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` with `items-start` icon alignment and descriptive `title` tooltips so long school and kindergarten names are immediately legible.
