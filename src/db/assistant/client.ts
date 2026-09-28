import { invoke, isTauri } from "@tauri-apps/api/core";
import { z } from "zod";
import {
  AssistantConfigSchema,
  AssistantDraftSchema,
  AssistantSnapshotSchema,
  AssistantDocumentSchema,
  AssistantUsageSchema,
} from "@/features/ozipz/schemas/assistant.schemas";
import type {
  AssistantConfig,
  AssistantDraft,
} from "@/features/ozipz/types/assistant.types";
async function call<T>(
  operation: string,
  payload: unknown,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!isTauri())
    throw new Error(
      "Asystent wymaga aplikacji na komputerze. Otwórz Ewidencję OZiPZ w wersji desktopowej, aby korzystać z folderów i bezpiecznego klucza API.",
    );
  return schema.parse(await invoke("assistant_call", { operation, payload }));
}
export const assistantClient = {
  load: () => call("load", null, AssistantSnapshotSchema),
  saveConfig: (config: AssistantConfig) =>
    call(
      "saveConfig",
      {
        ...config,
        model: config.model.trim(),
        domains: config.domains
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
        programs: config.programs.map((p) => ({
          ...p,
          name: p.name.trim(),
          edition: p.edition.trim(),
          aliases: p.aliases.map((s) => s.trim()).filter(Boolean),
        })),
      },
      AssistantConfigSchema,
    ),
  saveKey: (key: string) => call("saveKey", key, z.boolean()),
  deleteKey: () => call("deleteKey", null, z.boolean()),
  refresh: () => call("refresh", null, z.array(AssistantDocumentSchema)),
  generate: (input: {
    request: string;
    programId?: string;
    id?: string;
    date?: string;
    caseSign?: string;
    signature?: string;
  }) => call("generate", input, AssistantDraftSchema),
  ask: (draft: AssistantDraft, question: string) =>
    call("ask", { draft, question }, AssistantDraftSchema),
  review: (draft: AssistantDraft) =>
    call("review", draft, AssistantDraftSchema),
  saveDraft: (draft: AssistantDraft) =>
    call("saveDraft", draft, AssistantDraftSchema),
  style: () => call("style", null, z.object({ style: z.string() })),
  template: (id: string) =>
    call("template", id, z.array(z.number().int().min(0).max(255))),
  writeDocx: (draftId: string, path: string, bytes: Uint8Array) =>
    call("writeDocx", { draftId, path, bytes: Array.from(bytes) }, z.boolean()),
  settleUsage: (cost: number) =>
    call("settleUsage", cost, AssistantUsageSchema),
};
