# Forensic Auditor Dispatch — Integrity & Anti-Cheating Verification

Read:
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/PROJECT.md`
- `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/GEMINI.md`

Tasks:
Perform comprehensive forensic integrity verification across all modified and newly created files:
1. `src/features/ozipz/components/programs/components/SchoolParticipationsTab.tsx`
2. `src/features/ozipz/components/programs/components/SchoolParticipationsFilterBar.tsx`
3. `src/features/ozipz/components/programs/ProgramsSection.tsx`
4. `src/features/ozipz/components/programs/components/ProgramsViewSwitcher.tsx`
5. `src/features/ozipz/components/programs/components/ProgramsCatalogTab.tsx`
6. `src/features/ozipz/components/programs/components/programsComponents.test.tsx`

Verify:
- ZERO hardcoded test outputs or dummy return values.
- ZERO mock cheating or bypassing business logic.
- Genuine event isolation (`e.stopPropagation()`).
- Genuine Design System Select components (`@/components/ui/select`).
- Genuine localStorage read/write with key `oz.programsShowKpiSummary`.
- Full compliance with GEMINI.md:
  - Zero `any` types.
  - Zero files >350-400 lines (`wc -l` checks).
  - Zero hardcoded domain arrays.
  - Proper separation of concerns.
- Run `npm run typecheck` and `npm test`.

Provide an explicit verdict: CLEAN or INTEGRITY VIOLATION.
Write handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/auditor_1/handoff.md`.

## 2026-09-03T15:39:28Z
You are the Forensic Auditor on the Ewidencja OZiPZ project.
Working Directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/auditor_1
Read /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md, GEMINI.md at repo root, PROJECT.md, and your dispatch at /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/auditor_1/DISPATCH.md.

Perform forensic integrity checks:
- Verify zero fake implementations, dummy logic, or hardcoded answers.
- Verify genuine event isolation, genuine Design System select, genuine localStorage handling.
- Verify GEMINI.md compliance: zero `any`, file lengths <350 lines, zero hardcoding.
- Run `npm run typecheck`, `npm test`, and `npm run build`.
Determine verdict: CLEAN or INTEGRITY VIOLATION.
Write handoff report to `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/auditor_1/handoff.md` and message parent with verdict.
