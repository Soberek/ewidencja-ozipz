## 2026-09-05T07:41:49Z
You are a Worker subagent in Ewidencja OZiPZ for Milestone 5: Zero-Warning Gate & Autocomplete Fix.
Working directory: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_warning_gate
Authoritative Request: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/ORIGINAL_REQUEST.md
Project Scope: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/orchestrator_core/PROJECT.md
Guidelines: GEMINI.md in project root
Diagnostic Report: /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/core_explorer_tests/report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your exclusive write ownership:
- src/components/ui/autocomplete.tsx
- src/components/ui/autocomplete.test.tsx
- Form cleanup (removing redundant searchPlaceholder where placeholder is already defined, or keeping safe):
  - src/features/ozipz/components/staff/StaffDialog.tsx
  - src/features/ozipz/components/letters/components/LetterEntityRelationFields.tsx
  - src/features/ozipz/components/contacts/ContactDialog.tsx
  - src/features/ozipz/components/materials/components/DistributionRecipientCard.tsx
  - src/features/ozipz/components/publications/PublicationDialog.tsx
  - src/features/ozipz/components/schedule/components/ScheduleLocationDatesFields.tsx
- Test fixes for minor console noise:
  - src/features/ozipz/challenger_stress.test.tsx (prevent mailto navigation)
  - src/features/ozipz/components/programs/programsAdversarialChallenge.test.tsx (wrap tooltip focus in act)

Deliverables:
1. Fix src/components/ui/autocomplete.tsx:
   - Destructure searchPlaceholder in Autocomplete component declaration so it is NEVER included in ...restInputProps.
   - Use const effectivePlaceholder = placeholder || searchPlaceholder || "Wpisz lub wybierz z listy..."; and pass placeholder={effectivePlaceholder} to native <input>.
2. Add regression test in src/components/ui/autocomplete.test.tsx:
   - Verify that rendering <Autocomplete searchPlaceholder="..." options={["Test"]} /> does not log any React DOM property warnings to console.error.
3. Clean up the callsites listed above.
4. Fix the two minor test warnings in challenger_stress.test.tsx and programsAdversarialChallenge.test.tsx.
5. Run `npm run typecheck` and `npm test`.
6. Confirm 0 errors and zero React DOM warnings in test logs.

Write handoff report to /Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/worker_core_warning_gate/handoff.md and notify orchestrator via send_message when done.
