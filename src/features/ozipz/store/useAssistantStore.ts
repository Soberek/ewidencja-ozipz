import { create } from "zustand";
import { assistantClient } from "@/db/assistant/client";
import type {
  AssistantConfig,
  AssistantDraft,
  AssistantSnapshot,
} from "../types/assistant.types";
import { editAssistantDraft } from "../utils/assistantUtils";
interface AssistantState {
  snapshot: AssistantSnapshot | null;
  draft: AssistantDraft | null;
  request: string;
  programId: string;
  busy: string | null;
  error: string | null;
  notice: string | null;
  load: () => Promise<void>;
  run: (label: string, job: () => Promise<void>) => Promise<void>;
  setRequest: (value: string) => void;
  setProgram: (value: string) => void;
  selectDraft: (draft: AssistantDraft | null) => void;
  edit: (changes: Partial<AssistantDraft>) => void;
  generate: () => Promise<void>;
  review: () => Promise<void>;
  save: () => Promise<void>;
  saveConfig: (config: AssistantConfig) => Promise<void>;
}
export const useAssistantStore = create<AssistantState>((set, get) => ({
  snapshot: null,
  draft: null,
  request: "",
  programId: "",
  busy: null,
  error: null,
  notice: null,
  load: async () => {
    await get().run("Wczytywanie asystenta", async () => {
      set({ snapshot: await assistantClient.load() });
    });
  },
  run: async (label, job) => {
    if (get().busy) return;
    set({ busy: label, error: null, notice: null });
    try {
      await job();
    } catch (error) {
      // A paid request may have completed before verification failed. Reload the
      // saved draft list and usage ledger without discarding the open editor.
      if (get().snapshot) {
        try {
          const snapshot = await assistantClient.load();
          if (snapshot) set({ snapshot });
        } catch {
          /* Keep the original actionable error. */
        }
      }
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ busy: null });
    }
  },
  setRequest: (request) =>
    set({
      request,
      draft: get().draft ? editAssistantDraft(get().draft!, { request }) : null,
    }),
  setProgram: (programId) => set({ programId, draft: null }),
  selectDraft: (draft) =>
    set({
      draft,
      request: draft?.request ?? "",
      programId: draft?.programId ?? "",
      error: null,
      notice: null,
    }),
  edit: (changes) => {
    const draft = get().draft;
    if (draft) set({ draft: editAssistantDraft(draft, changes) });
  },
  generate: async () =>
    get().run(
      "Analiza materiałów, pisanie i kontrola — może potrwać kilka minut",
      async () => {
        const { request, draft } = get();
        const programId = get().programId || undefined;
        const result = await assistantClient.generate({
          request,
          programId,
          id: draft?.id,
          date: draft?.date,
          caseSign: draft?.caseSign,
          signature: draft?.signature,
        });
        set({ draft: result, snapshot: await assistantClient.load() });
      },
    ),
  review: async () =>
    get().run("Sprawdzanie twierdzeń i aktualności źródeł", async () => {
      const draft = get().draft;
      if (!draft) return;
      set({
        draft: await assistantClient.review(draft),
        snapshot: await assistantClient.load(),
      });
    }),
  save: async () =>
    get().run("Zapisywanie projektu", async () => {
      const draft = get().draft;
      if (!draft) return;
      set({
        draft: await assistantClient.saveDraft(draft),
        snapshot: await assistantClient.load(),
        notice: "Projekt zapisany. Przed eksportem sprawdź jego treść.",
      });
    }),
  saveConfig: async (config) =>
    get().run("Zapisywanie ustawień", async () => {
      await assistantClient.saveConfig(config);
      set({
        snapshot: await assistantClient.load(),
        notice: "Ustawienia zapisane",
        draft: get().draft ? editAssistantDraft(get().draft!, {}) : null,
      });
    }),
}));
