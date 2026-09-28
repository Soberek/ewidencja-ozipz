# Worker M1 Dispatch — SchoolParticipations Harmonization (R1.1, R1.2, R1.3, R3.1, R3.2, R4.1)

## Exclusive File Ownership:
- `src/features/ozipz/components/programs/components/SchoolParticipationsTab.tsx`
- `src/features/ozipz/components/programs/components/SchoolParticipationsFilterBar.tsx` (new component)

DO NOT modify any other files.

## References:
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_1/report.md`

## Mandatory Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks:
1. Extract `SchoolParticipationsFilterBar.tsx` to maintain `<350` lines per file in accordance with GEMINI.md.
2. In `SchoolParticipationsFilterBar.tsx`:
   - Replace raw HTML `<select>` with `<Select size="sm">` from `@/components/ui/select`.
   - Implement filters for: Program (`w-56`), School Year (`w-40`), Municipality (`w-44` dynamic derived from data).
   - Add report status quick-filter chips (*Wszystkie zgłoszenia*, *Sprawozdanie złożone*, *Oczekuje na sprawozdanie*).
   - Unified chip styling: active `bg-primary text-primary-foreground border-primary font-semibold rounded-[3px] px-2.5 py-1 text-[11px] border shadow-none`, inactive `bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground rounded-[3px] px-2.5 py-1 text-[11px] font-medium border cursor-pointer`.
   - Add Search input with clear button.
3. In `SchoolParticipationsTab.tsx`:
   - Integrate `SchoolParticipationsFilterBar`.
   - Update `<DataTable>`: pass `onRowClick={(row) => onEdit(row)}` and `rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}`.
   - Action column: Add `e.stopPropagation()` and `aria-label` to Edit and Delete buttons. Add `onClick={(e) => e.stopPropagation()}` to the action cell container `div`.
   - Facility name column: Update to `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight`, `items-start gap-1.5`, `Building2 mt-0.5`, and `title={row.facilityName || "Brak nazwy"}`. Remove single-line `truncate`.
   - Program column: Ensure legible rendering with title attribute and multi-line wrapping.
4. Verify:
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/programs/`.
   - Ensure all files are strictly `<350` lines and comply with `GEMINI.md`.
5. Deliver handoff report in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m1/handoff.md`.
