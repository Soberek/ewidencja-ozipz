import { useCallback, useEffect, useRef, useState } from "react";
import {
  actionDraftKey,
  clearActionDraft,
  hasActionDraftContent,
  loadActionDraft,
  saveActionDraft,
  type ActionDraft,
  type ActionDraftContent,
} from "./actionDraft";

const AUTOSAVE_DELAY_MS = 500;

export interface UseActionEditorDraftParams {
  /** Szkic dotyczy tylko nowego, pustego formularza (nie edycji ani wpisu z planu pracy czy kopii). */
  enabled: boolean;
  content: ActionDraftContent;
  selectedJrwaSymbol: string;
  autoSign: boolean;
  onRestore: (draft: ActionDraft) => void;
}

/**
 * Autozapis niezapisanego nowego działania: szkic przetrwa zamknięcie okna, przejście do innego modułu
 * lub przypadkowe odświeżenie, a przy kolejnym otwarciu formularza można go przywrócić.
 */
export function useActionEditorDraft({ enabled, content, selectedJrwaSymbol, autoSign, onRestore }: UseActionEditorDraftParams) {
  const [pendingDraft, setPendingDraft] = useState<ActionDraft | null>(() => (enabled ? loadActionDraft() : null));
  const key = actionDraftKey(content);
  const baselineRef = useRef<string | null>(null);
  if (baselineRef.current === null) baselineRef.current = key;
  const hasUnsavedContent = enabled && key !== baselineRef.current && hasActionDraftContent(content);

  const latestRef = useRef<ActionDraft | null>(null);
  latestRef.current = hasUnsavedContent
    ? { ...content, savedAt: "", selectedJrwaSymbol, autoSign }
    : null;
  const wroteRef = useRef(false);
  const discardedRef = useRef(false);

  const persist = useCallback(() => {
    const latest = latestRef.current;
    if (!latest || discardedRef.current) return;
    saveActionDraft({ ...latest, savedAt: new Date().toISOString() });
    wroteRef.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!hasUnsavedContent) {
      // Użytkownik wyczyścił wpisane dane — nie zostawiamy nieaktualnego szkicu.
      if (wroteRef.current) { clearActionDraft(); wroteRef.current = false; }
      return;
    }
    const timer = setTimeout(persist, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, hasUnsavedContent, key, selectedJrwaSymbol, autoSign, persist]);

  // Przy wyjściu z formularza zapisujemy ostatnie zmiany, których autozapis nie zdążył utrwalić.
  useEffect(() => () => { if (enabled) persist(); }, [enabled, persist]);

  const restoreDraft = useCallback(() => {
    if (!pendingDraft) return;
    onRestore(pendingDraft);
    setPendingDraft(null);
  }, [pendingDraft, onRestore]);

  const dismissDraft = useCallback(() => {
    clearActionDraft();
    wroteRef.current = false;
    setPendingDraft(null);
  }, []);

  /** Po zapisie działania: usuń szkic i traktuj bieżący stan formularza jako punkt wyjścia. */
  const markSaved = useCallback((contentAfterSave?: ActionDraftContent) => {
    if (enabled) clearActionDraft();
    wroteRef.current = false;
    baselineRef.current = contentAfterSave ? actionDraftKey(contentAfterSave) : key;
    latestRef.current = null;
  }, [enabled, key]);

  /** Świadome porzucenie wpisanych danych (potwierdzone przez użytkownika). */
  const discardDraft = useCallback(() => {
    discardedRef.current = true;
    if (enabled) clearActionDraft();
    wroteRef.current = false;
  }, [enabled]);

  return { pendingDraft: enabled ? pendingDraft : null, hasUnsavedContent, restoreDraft, dismissDraft, markSaved, discardDraft };
}
