# Worker M3 Dispatch — ProgramsCatalog Interaction & Wrapping (R3.3, R3.4, R4.2)

## Exclusive File Ownership:
- `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`

DO NOT modify any other files.

## References:
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/explorer_survey_3/report.md`

## Mandatory Warning:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks:
1. In `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`:
   - Configure `<DataTable>`: pass `onRowClick={(row) => onEdit(row)}` and `rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}`.
   - Action column: Add `e.stopPropagation()` and `aria-label` to Edit and Delete buttons. Add `onClick={(e) => e.stopPropagation()}` to the outer cell container `div`.
   - Program name column: Ensure program name has `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` and descriptive `title={row.name}` tooltip so long titles wrap cleanly without truncation mid-word.
2. Verify:
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/programs/`.
   - Check file length: ensure it remains `<350` lines and strictly adheres to GEMINI.md.
3. Deliver handoff report in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3/handoff.md`.

## 2026-09-03T15:29:33Z

You are Worker M3 on the Ewidencja OZiPZ project.
Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3
Read /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md, GEMINI.md at repo root, PROJECT.md, and your dispatch at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3/DISPATCH.md.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive file write ownership is:
- `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`
Do NOT modify any other files.

Implement Milestone 3:
1. In `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`:
   - Configure `<DataTable>`: pass `onRowClick={(row) => onEdit(row)}` and `rowClassName={() => "hover:bg-muted/40 cursor-pointer transition-colors"}`.
   - Action column: Add `e.stopPropagation()` and `aria-label` to Edit and Delete buttons. Add `onClick={(e) => e.stopPropagation()}` to the outer cell container `div`.
   - Program name column: Update to `min-w-[200px] max-w-[340px] line-clamp-2 break-words leading-tight` with descriptive `title={row.name}` tooltip so long titles wrap cleanly without truncation mid-word.
2. Test and verify:
   - Run `npm run typecheck` and `npx vitest run src/features/ozipz/components/programs/`.
   - Verify file length <350 lines per GEMINI.md.
3. Write handoff report in `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_m3/handoff.md` and message parent when complete.

