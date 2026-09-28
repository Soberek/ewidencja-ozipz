import type { z } from "zod";
import type {
  AssistantConfigSchema,
  AssistantDraftSchema,
  AssistantSourceSchema,
  AssistantSnapshotSchema,
} from "../schemas/assistant.schemas";
export type AssistantConfig = z.infer<typeof AssistantConfigSchema>;
export type AssistantDraft = z.infer<typeof AssistantDraftSchema>;
export type AssistantSource = z.infer<typeof AssistantSourceSchema>;
export type AssistantSnapshot = z.infer<typeof AssistantSnapshotSchema>;
