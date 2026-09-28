import type { AssistantDraft } from "../types/assistant.types";
export function canExportAssistantDraft(draft: AssistantDraft | null): boolean {
  return (
    !!draft &&
    !!draft.review?.passed &&
    draft.review.issues.length === 0 &&
    draft.missing.length === 0 &&
    draft.conflicts.length === 0 &&
    !draft.body.includes("[DO UZUPEŁNIENIA")
  );
}
export function editAssistantDraft(
  draft: AssistantDraft,
  changes: Partial<AssistantDraft>,
): AssistantDraft {
  return { ...draft, ...changes, review: null };
}
