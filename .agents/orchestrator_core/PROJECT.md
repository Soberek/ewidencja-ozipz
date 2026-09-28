# Project: Ewidencja OZiPZ — Core Modules UX/UI Harmonization

## Architecture
Harmonizing UX/UI, ergonomics, and design system standards across the four core modules of Ewidencja OZiPZ:
1. Materiały oświatowe (`src/features/ozipz/components/materials/`)
2. Rejestry urzędowe (`src/features/ozipz/components/registers/`)
3. Spis kontaktów (`src/features/ozipz/components/contacts/`)
4. Dziennik korespondencji/pism (`src/features/ozipz/components/letters/`)

Plus Design System autocomplete fix in `src/components/ui/autocomplete.tsx` eliminating React DOM property warnings.

Reference standards adopted from:
- Actions (`src/features/ozipz/components/actions/`)
- Facilities (`src/features/ozipz/components/facilities/`)
- Programs (`src/features/ozipz/components/programs/`)

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| F1 | Select size="sm" in Filter Bars | Upgrade filter bars in Materials, Registers, Contacts, Letters to use Design System `<Select size="sm">` from `@/components/ui/select` | M1, M2, M3, M4 | ORIGINAL_REQUEST R1 | DONE |
| F2 | Unified Quick-Filter Chips | Primary active (`bg-primary text-primary-foreground`) and muted inactive (`bg-muted/40 text-muted-foreground`) quick-filter chips | M1, M2, M3, M4 | ORIGINAL_REQUEST R1 | DONE |
| F3 | DataTable onRowClick & Event Isolation | Direct row click opening edit dialog + `rowClassName` hover styling + `e.stopPropagation()` on all inner action buttons | M1, M2, M3, M4 | ORIGINAL_REQUEST R2 | DONE |
| F4 | Multi-line Text Wrapping & Tooltips | Primary textual columns use `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` with descriptive `title` tooltips | M1, M2, M3, M4 | ORIGINAL_REQUEST R3 | DONE |
| F5 | Collapsible KPI & Summary Headers | Toggle controls (`ChevronUp`/`ChevronDown`, "Zwiń KPI"/"Pokaż KPI") with `localStorage` persistence (`oz.*ShowKpiSummary`) | M1, M2, M3, M4 | ORIGINAL_REQUEST R4 | DONE |
| F6 | Test Cleanliness & Zero React DOM Warnings | Fix `src/components/ui/autocomplete.tsx` destructuring of `searchPlaceholder`, cleanup callsites, regression test | M5 | ORIGINAL_REQUEST R5 | DONE |
| F7 | Quality Gate: Zero Errors & Full Verification | Strict typecheck (`npm run typecheck`), 100% passing tests (`npm test`), production build (`npm run build`) | M5 | Acceptance Criteria | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Codebase Exploration | Reference patterns, target module audits, R5 warning diagnostics | none | DONE |
| M1 | Materials Module Harmonization | `MaterialsCatalogTab.tsx`, `MaterialsDistributionsTab.tsx`, `MaterialsViewSwitcher.tsx`, `MaterialsSection.tsx`, tests | M0 | DONE |
| M2 | Registers Module Harmonization | `RegistersFilterBar.tsx`, `RegistersTypeTabs.tsx`, `InformationRegisterTable.tsx`, `PublicationsRegisterTable.tsx`, `VisitationsRegisterTable.tsx`, `RegistersSection.tsx`, tests | M0 | DONE |
| M3 | Contacts Module Harmonization | `ContactsFilterBar.tsx`, `ContactsTableView.tsx`, `ContactsSection.tsx`, tests | M0 | DONE |
| M4 | Letters Module Harmonization | `LettersSection.tsx`, `components/LettersStatsHeader.tsx`, tests | M0 | DONE |
| M5 | Zero-Warning Gate & Final Verification | `src/components/ui/autocomplete.tsx`, regression tests, full typecheck, test suite, and build | M1, M2, M3, M4 | DONE |
| M6 | Independent Review, Stress-Challenge & Forensic Audit | 2 Reviewers, 2 Challengers, 1 Forensic Auditor | M1-M5 | DONE |

## Code Layout & File Ownership
- Shared Design System (Milestone 5):
  - `src/components/ui/autocomplete.tsx`
  - `src/components/ui/autocomplete.test.tsx`
- Materials Module (Milestone 1):
  - `src/features/ozipz/components/materials/MaterialsSection.tsx`
  - `src/features/ozipz/components/materials/components/MaterialsCatalogTab.tsx`
  - `src/features/ozipz/components/materials/components/MaterialsDistributionsTab.tsx`
  - `src/features/ozipz/components/materials/components/MaterialsViewSwitcher.tsx`
  - `src/features/ozipz/components/materials/components/materialsComponents.test.tsx`
- Registers Module (Milestone 2):
  - `src/features/ozipz/components/registers/RegistersSection.tsx`
  - `src/features/ozipz/components/registers/components/RegistersFilterBar.tsx`
  - `src/features/ozipz/components/registers/components/RegistersTypeTabs.tsx`
  - `src/features/ozipz/components/registers/components/InformationRegisterTable.tsx`
  - `src/features/ozipz/components/registers/components/PublicationsRegisterTable.tsx`
  - `src/features/ozipz/components/registers/components/VisitationsRegisterTable.tsx`
  - `src/features/ozipz/components/registers/components/registersComponents.test.tsx`
- Contacts Module (Milestone 3):
  - `src/features/ozipz/components/contacts/ContactsSection.tsx`
  - `src/features/ozipz/components/contacts/components/ContactsFilterBar.tsx`
  - `src/features/ozipz/components/contacts/components/ContactsTableView.tsx`
  - `src/features/ozipz/components/contacts/components/contactsComponents.test.tsx`
- Letters Module (Milestone 4):
  - `src/features/ozipz/components/letters/LettersSection.tsx`
  - `src/features/ozipz/components/letters/components/LettersStatsHeader.tsx` (new)
  - `src/features/ozipz/components/letters/lettersComponents.test.tsx`
