/**
 * Typy domenowe OZiPZ inferowane w 100% ze schematów Zod (SSOT)
 */
import { z } from "zod";
import {
  HealthPromotionTabSchema,
  OzipzActionTypeSchema,
  OzipzHealthTopicSchema,
  OzipzAudienceGroupSchema,
  ActionSchema,
  ProgramSchema,
  SchoolParticipationSchema,
  MaterialSchema,
  DistributionSchema,
  ScheduleEventSchema,
  JrwaCaseSchema,
  FacilitySchema,
  DictionaryItemSchema,
  ContactSchema,
  RegisterItemSchema,
  RegisterMappingSchema,
  StaffSchema,
  TemplateSchema,
  PublicationSchema,
  LetterSchema,
  ScanSchema,
  FacilityActivitySummarySchema,
  MonthlyTargetSchema,
} from "../schemas/ozipz.schemas";

// Re-eksport schematów
export * from "../schemas/ozipz.schemas";

// Inferencja typów TypeScript ze schematów Zod
export type HealthPromotionTab = z.infer<typeof HealthPromotionTabSchema>;
export type OzipzSectionTab = HealthPromotionTab;

export type OzipzActionType = z.infer<typeof OzipzActionTypeSchema>;
export type OzipzHealthTopic = z.infer<typeof OzipzHealthTopicSchema>;
export type OzipzAudienceGroup = z.infer<typeof OzipzAudienceGroupSchema>;

export type OzipzAction = z.infer<typeof ActionSchema>;
export type OzipzProgram = z.infer<typeof ProgramSchema>;
export type OzipzSchoolParticipation = z.infer<typeof SchoolParticipationSchema>;
export type OzipzMaterial = z.infer<typeof MaterialSchema>;
export type OzipzDistribution = z.infer<typeof DistributionSchema>;
export type OzipzScheduleEvent = z.infer<typeof ScheduleEventSchema>;
export type OzipzJrwaCase = z.infer<typeof JrwaCaseSchema>;
export type OzipzFacility = z.infer<typeof FacilitySchema>;
export type OzipzDictionaryItem = z.infer<typeof DictionaryItemSchema>;
export type OzipzContact = z.infer<typeof ContactSchema>;
export type OzipzRegisterItem = z.infer<typeof RegisterItemSchema>;
export type OfficialRegisterKey = "informacje" | "publikacje" | "wizytacje";
export type RegisterTabKey = "informacje" | "publikacje" | "wizytacje" | "konfiguracja";
export type OzipzRegisterMapping = z.infer<typeof RegisterMappingSchema>;
export type OzipzStaff = z.infer<typeof StaffSchema>;
export type OzipzTemplate = z.infer<typeof TemplateSchema>;
export type OzipzPublication = z.infer<typeof PublicationSchema>;
export type OzipzLetter = z.infer<typeof LetterSchema>;
export type OzipzScan = z.infer<typeof ScanSchema>;
export type FacilityActivitySummary = z.infer<typeof FacilityActivitySummarySchema>;
export type OzipzMonthlyTarget = z.infer<typeof MonthlyTargetSchema>;

export type OzipzDictionaryType =
  | "activityType"
  | "recipientGroup"
  | "locationType"
  | "materialType"
  | "campaign"
  | "annotationReason"
  | "topic"
  | "tematyki"
  | "formy_dzialan"
  | "grupy_odbiorcow"
  | "symbole_jrwa"
  | "edukatorzy"
  | string;

export type OzipzRegisterType =
  | "szkolenia"
  | "narady"
  | "interwencje"
  | "konkursy"
  | "wizytacje"
  | "dystrybucja"
  | string;
