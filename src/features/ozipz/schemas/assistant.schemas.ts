import { z } from "zod";
export const AssistantSourceSchema = z.object({
  id: z.string(),
  path: z.string(),
  location: z.string(),
  version: z.string(),
  text: z.string(),
  fetchedAt: z.string().nullable(),
});
export const AssistantFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  folder: z.string(),
  edition: z.string(),
});
export const AssistantConfigSchema = z.object({
  model: z.string().min(1),
  monthlyLimitUsd: z.number().positive(),
  rootFolder: z.string().default(""),
  programs: z.array(AssistantFolderSchema),
  styleFiles: z.array(z.string()),
  templatePath: z.string(),
  domains: z.array(z.string()),
  style: z.string(),
  styleApproved: z.boolean(),
});
export const AssistantFactSchema = z.object({
  text: z.string(),
  sourceId: z.string(),
  quote: z.string(),
});
export const AssistantReviewSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()),
  claims: z.array(AssistantFactSchema),
  fingerprint: z.string(),
  checkedAt: z.string(),
});
export const AssistantDraftSchema = z.object({
  id: z.string(),
  programId: z.string(),
  edition: z.string(),
  request: z.string(),
  subject: z.string(),
  body: z.string(),
  recipient: z.string(),
  date: z.string(),
  caseSign: z.string(),
  signature: z.string(),
  facts: z.array(AssistantFactSchema),
  missing: z.array(z.string()),
  conflicts: z.array(z.string()),
  sources: z.array(AssistantSourceSchema),
  warnings: z.array(z.string()),
  review: AssistantReviewSchema.nullable(),
  discussion: z
    .array(
      z.object({
        question: z.string(),
        facts: z.array(AssistantFactSchema),
        missing: z.array(z.string()),
        conflicts: z.array(z.string()),
        sources: z.array(AssistantSourceSchema),
      }),
    )
    .optional(),
});
export const AssistantUsageSchema = z.object({
  month: z.string(),
  cost: z.number(),
  pending: z.number(),
});
export const AssistantDocumentSchema = z.object({
  path: z.string(),
  status: z.string(),
});
export const AssistantSnapshotSchema = z.object({
  config: AssistantConfigSchema,
  drafts: z.array(AssistantDraftSchema),
  documents: z.array(AssistantDocumentSchema),
  usage: AssistantUsageSchema,
  hasKey: z.boolean(),
  indexError: z.string().nullable(),
});
