import { z } from "zod";
import {
  OzipzActionTypeSchema,
  OzipzHealthTopicSchema,
} from "./ozipzCoreSchemas";

// 11. Rejestry Urzędowe OZiPZ
export const OfficialRegisterKeySchema = z.enum(["informacje", "publikacje", "wizytacje"]);
export const RegisterTabKeySchema = z.enum(["informacje", "publikacje", "wizytacje", "konfiguracja"]);

export const RegisterMappingSchema = z.object({
  id: z.string(),
  activityType: z.string().min(1, "Forma działania jest wymagana"),
  actionId: z.string().optional(),
  registers: z.array(OfficialRegisterKeySchema),
  updatedAt: z.string(),
});

export const RegisterItemSchema = z.object({
  id: z.string(),
  registerType: z.string().min(1, "Typ rejestru jest wymagany"),
  registerNumber: z.string().optional(),
  date: z.string().min(1, "Data wpisu jest wymagana"),
  title: z.string().min(1, "Tytuł / przedmiot rejestru jest wymagany"),
  organizer: z.string().optional().default(""),
  location: z.string().optional().default(""),
  facilityId: z.string().optional(),
  facilityName: z.string().optional(),
  programId: z.string().optional(),
  programName: z.string().optional(),
  jrwaSign: z.string().optional(),
  participantsCount: z.number().int().min(0).default(0),
  targetAudience: z.string().optional(),
  outcome: z.string().optional(),
  responsiblePerson: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const RegisterSchema = RegisterItemSchema;

// 12. Kadra Pracownicza OZiPZ
export const StaffSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, "Imię i nazwisko pracownika jest wymagane"),
  role: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  active: z.boolean().default(true),
  specialization: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 13. Szablony Zadań i Opisy Merytoryczne
export const ActionTemplateDefaultsSchema = z.object({
  title: z.string(),
  leadEducator: z.string(),
  campaignId: z.string(),
});

export const TemplateSchema = z.object({
  actionDefaults: ActionTemplateDefaultsSchema.optional(),
  id: z.string(),
  title: z.string().min(1, "Tytuł szablonu jest wymagany"),
  topic: OzipzHealthTopicSchema,
  actionType: OzipzActionTypeSchema,
  descriptionTemplate: z.string().optional().default(""),
  defaultAudience: z.string(),
  suggestedMaterials: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 14. Publikacje Internetowe i Media
export const PublicationSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tytuł publikacji jest wymagany"),
  channel: z.string().min(1, "Kanał publikacji jest wymagany"),
  publicationDate: z.string().min(1, "Data publikacji jest wymagana"),
  topic: OzipzHealthTopicSchema,
  link: z.string().optional(),
  reachCount: z.number().int().min(0).optional(),
  actionId: z.string().optional(),
  author: z.string().optional().default(""),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 15. Dziennik Korespondencji i Pisma Urzędowe
export const LetterSchema = z.object({
  id: z.string(),
  direction: z.enum(["wychodzace", "przychodzace"]),
  letterNumber: z.string().min(1, "Numer pisma jest wymagany"),
  letterDate: z.string().min(1, "Data pisma jest wymagana"),
  caseSign: z.string().optional(),
  senderRecipient: z.string().optional().default(""),
  facilityId: z.string().optional(),
  subject: z.string().min(1, "Dotyczy / przedmiot pisma jest wymagany"),
  programId: z.string().optional(),
  assignedPerson: z.string().optional().default(""),
  status: z.string().default("nowe"),
  notes: z.string().optional(),
  /** Termin odpowiedzi lub załatwienia sprawy (RRRR-MM-DD) — źródło przypomnień na pulpicie. */
  responseDueDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 16. Cyfrowe Archiwum Skanów
export const ScanSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tytuł dokumentu jest wymagany"),
  documentType: z.string().min(1, "Typ dokumentu jest wymagany"),
  facilityId: z.string().optional(),
  facilityName: z.string().optional().default(""),
  programId: z.string().optional(),
  programName: z.string().optional(),
  scanDate: z.string().min(1, "Data skanu jest wymagana"),
  fileSizeKb: z.number().min(0).optional(),
  fileName: z.string().optional().default(""),
  filePath: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

// Pomocnicze podsumowanie aktywności placówki
export const FacilityActivitySummarySchema = z.object({
  facilityId: z.string(),
  facilityName: z.string(),
  programsCount: z.number().int().min(0),
  actionsCount: z.number().int().min(0),
  totalPupilsReached: z.number().int().min(0),
  totalMaterialsReceived: z.number().int().min(0),
  lastActionDate: z.string().optional(),
});

// 17. Miesięczne Cele i Plan Wykonania Miernika (Zgodność Pracy)
export const MonthlyTargetSchema = z.object({
  id: z.string(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  programActions: z.number().int().min(0).default(0),
  programRecipients: z.number().int().min(0).default(0),
  otherActions: z.number().int().min(0).default(0),
  otherRecipients: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
