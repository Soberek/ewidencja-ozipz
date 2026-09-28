## 2026-09-05T07:35:24Z

You are the Project Orchestrator for Ewidencja OZiPZ.

## Working Directory & Identity
- Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_core
- Project Root: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz
- Authoritative Request File: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md (Request timestamp: 2026-09-05T07:34:41Z)
- Guidelines: GEMINI.md in project root

## Mission
Harmonize UX/UI, ergonomics, and design system standards across the remaining core modules of Ewidencja OZiPZ (Materiały oświatowe, Rejestry urzędowe, Spis kontaktów, Dziennik korespondencji/pism), matching the high standards established in Actions, Facilities, and Programs.

## Requirements

### R1. Filter Bar & Design System Harmonization
Upgrade the filter and search toolbars across all four modules (Materiały, Rejestry, Kontakty, Pisma) to use Design System `<Select size="sm">` from `@/components/ui/select`, and add unified quick-filter chips with primary active (`bg-primary text-primary-foreground`) and muted inactive (`bg-muted/40`) styling.

### R2. Direct Row Interaction & Safe Action Isolation
Configure `<DataTable>` in all four target modules with `onRowClick` to open the edit/details modal on row selection with active hover state, while ensuring all inner interactive action buttons (Edit, Delete, Download, Print, Link) call `e.stopPropagation()` to prevent unwanted row-click triggers.

### R3. Multi-line Text Wrapping & Column Readability
Replace single-line ellipsis truncations (`truncate`) in primary textual columns (e.g. material titles, register descriptions, contact names/roles, letter subjects/senders) with `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` and descriptive `title` tooltips so long entries remain readable without clipping.

### R4. Collapsible KPI & Summary Headers
Implement collapsible toggle controls for statistics, KPI counters, and summary cards in the target modules with preference persistence in `localStorage`, conserving vertical screen space on laptops and compact displays.

### R5. Test Cleanliness & Zero-Warning Gate
Resolve any React DOM property warnings in test console outputs (e.g. invalid `searchPlaceholder` attributes on native inputs) and ensure all component tests run cleanly without console errors.

## Acceptance Criteria
- [ ] Filter bars across Materials, Registers, Contacts, and Letters modules use Design System `<Select size="sm">` components.
- [ ] Quick-filter chips are available for key status/category filters in each module with standardized active (`bg-primary text-primary-foreground`) and inactive styling.
- [ ] Clicking any table row across the four target modules triggers the corresponding entity edit or details dialog.
- [ ] Action buttons inside table rows call `e.stopPropagation()` and do not trigger row-click events.
- [ ] Long names, titles, and descriptions wrap cleanly on up to two lines (`line-clamp-2 break-words`) with full text accessible via `title` attribute.
- [ ] Summary/KPI headers in the target modules can be collapsed or expanded via toggle buttons.
- [ ] Collapsed state preferences persist across browser reloads via `localStorage`.
- [ ] Zero invalid React DOM attribute warnings appear during test execution.
- [ ] TypeScript strict mode compiles with zero errors (`npm run typecheck`).
- [ ] All unit and component tests pass 100% without failures (`npm test`).
- [ ] Production build succeeds with zero errors (`npm run build`).
- [ ] Full compliance with `GEMINI.md` (no files exceeding 350-400 lines, zero `any` types, zero hardcoded domain options, clean separation of concerns).
