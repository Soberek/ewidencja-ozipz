import { z } from "zod";
import { JRWA_DEFAULT_SECTION } from "../constants";
import { isValidOzipzDate } from "../utils/dateUtils";

export const requiredDate = (message: string) => z.string().min(1, message).refine(isValidOzipzDate, "Nieprawidłowa data");
export const optionalDate = () => z.string().refine((value) => !value || isValidOzipzDate(value), "Nieprawidłowa data").optional();

// Enum & Union Schemas
export const HealthPromotionTabSchema = z.enum([
  "pulpit",
  "dzialania",
  "harmonogram",
  "pisma",
  "rozdzielniki",
  "rejestry",
  "sprawozdania",
  "skany",
  "publikacje",
  "lokalizacje",
  "szkoly-w-programie",
  "kontakty",
  "programy",
  "slowniki",
  "osoby",
  "slownik-dzialania",
  "opisy-zadan",
  "znaki",
  "materialy",
  "ustawienia",
  "narzedzia",
  "historia",
]);

export const OzipzActionTypeSchema = z.string().min(1, "Typ działania jest wymagany");

export const OzipzHealthTopicSchema = z.string().optional().default("");

export const OzipzAudienceGroupSchema = z.string().min(1, "Grupa odbiorców jest wymagana");

// 1. Działania Edukacyjne
export const ActionSchema = z.object({
  id: z.string(),
  title: z.string().min(2, "Tytuł działania musi mieć co najmniej 2 znaki"),
  actionType: OzipzActionTypeSchema,
  date: requiredDate("Data działania jest wymagana"),
  facilityId: z.string().optional(),
  facilityName: z.string().min(1, "Nazwa placówki jest wymagana"),
  municipality: z.string().min(1, "Gmina jest wymagana"),
  programId: z.string().optional(),
  programName: z.string().optional(),
  topic: z.string().optional().default(""),
  audienceGroup: OzipzAudienceGroupSchema,
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  jrwaSign: z.string().optional(),
  jrwaCaseId: z.string().optional(),
  izrzSign: z.string().optional(),
  ezdStatus: z.string().optional().default(""),
  status: z.string().optional().default(""),
  sourceInfo: z.string().optional(),
  scheduleEventId: z.string().optional(),
  /** Działanie, z którym ten wpis zapisano razem (np. dystrybucja materiałów wydanych na prelekcji). */
  linkedActionId: z.string().optional(),
  materialId: z.string().optional(),
  numberOfActions: z.number().int().min(1).optional(),
  participantsCount: z.number().int().min(0, "Liczba uczestników nie może być ujemna"),
  indirectRecipientsCount: z.number().int().min(0).optional().default(0),
  materialsDistributedCount: z.number().int().min(0).optional().default(0),
  leadEducator: z.string().min(1, "Osoba prowadząca jest wymagana"),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 2. Programy Profilaktyczne
export const ProgramSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "Kod programu jest wymagany"),
  name: z.string().min(1, "Nazwa programu jest wymagana"),
  editionYear: z.string().min(1, "Rok edycji jest wymagany"),
  jrwaSymbol: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  description: z.string().optional().default(""),
  status: z.string().default("aktywny"),
  participatingSchoolsCount: z.number().int().min(0).optional().default(0),
  totalPupilsReached: z.number().int().min(0).optional().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 3. Deklaracje / Zgłoszenia Placówek do Programów
export const SchoolParticipationSchema = z.object({
  id: z.string(),
  programId: z.string().min(1, "Wybór programu jest wymagany"),
  programName: z.string().min(1, "Nazwa programu jest wymagana"),
  facilityId: z.string().min(1, "Wybór placówki jest wymagany"),
  facilityName: z.string().min(1, "Nazwa placówki jest wymagana"),
  municipality: z.string().min(1, "Gmina jest wymagana"),
  schoolYear: z.string().min(1, "Rok szkolny jest wymagany"),
  schoolCoordinatorName: z.string().min(1, "Koordynator szkolny jest wymagany"),
  schoolCoordinatorContact: z.string().optional().default(""),
  // Powiązanie z kartoteką Spisu Kontaktów; nazwisko i kontakt powyżej to kopia na dzień zgłoszenia
  schoolCoordinatorContactId: z.string().optional(),
  // Drugi (opcjonalny) koordynator – te same zasady co dla pierwszego
  secondCoordinatorName: z.string().optional(),
  secondCoordinatorContact: z.string().optional(),
  secondCoordinatorContactId: z.string().optional(),
  pupilsCount: z.number().int().min(0, "Liczba uczniów nie może być ujemna"),
  hasDeclaration: z.boolean().default(true),
  hasFinalReport: z.boolean().default(false),
  evaluationGrade: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  // Skan / plik zgłoszenia: ścieżka względem folderu bazy (aplikacja desktopowa)
  applicationFile: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 4. Katalog Materiałów Oświatowych
export const MaterialSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tytuł materiału jest wymagany"),
  materialType: z.string().min(1, "Typ materiału jest wymagany"),
  topic: z.string().optional().default(""),
  publisher: z.string().optional().default(""),
  targetAudience: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 5. Rozdzielniki i Przekazania Materiałów
export const DistributionSchema = z.object({
  id: z.string(),
  materialId: z.string().optional(),
  materialTitle: z.string().min(1, "Tytuł materiału jest wymagany"),
  materialType: z.string().optional(),
  recipientName: z.string().min(1, "Odbiorca jest wymagany"),
  facilityId: z.string().optional(),
  municipality: z.string().optional(),
  actionId: z.string().optional(),
  actionTitle: z.string().optional(),
  quantity: z.number().int().min(1, "Ilość musi wynosić co najmniej 1 sztukę"),
  distributionDate: requiredDate("Data przekazania jest wymagana"),
  assignedEducator: z.string().optional().default(""),
  purpose: z.string().optional().default(""),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

// 6. Harmonogram i Plan Pracy
export const ScheduleEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tytuł zadania harmonogramu jest wymagany"),
  activityTypeCode: z.string().optional(),
  activityTypeName: z.string().optional(),
  eventDate: requiredDate("Data realizacji jest wymagana"),
  endDate: optionalDate(),
  category: z.string().optional(),
  topic: OzipzHealthTopicSchema.optional(),
  programId: z.string().optional(),
  programName: z.string().optional(),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  recipientGroup: z.string().optional(),
  location: z.string().optional().default(""),
  facilityId: z.string().optional(),
  actionId: z.string().optional(),
  status: z.string().default("zaplanowane"),
  annotationReasonCode: z.string().optional(),
  annotationReasonLabel: z.string().optional(),
  annotationText: z.string().optional(),
  responsiblePerson: z.string().optional().default(""),
  month: z.number().int().min(1).max(12).optional(),
  monthName: z.string().optional(),
  year: z.number().int().optional(),
  jrwa: z.string().optional(),
  plannedCount: z.number().int().optional(),
  completedCount: z.number().int().optional(),
  manuallyCompleted: z.boolean().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 7. Wykaz Spraw i Znaków JRWA (Instrukcja Kancelaryjna)
export const JrwaCaseSchema = z.object({
  id: z.string(),
  section: z.string().min(1, "Symbol komórki jest wymagany").default(JRWA_DEFAULT_SECTION),
  jrwaSymbol: z.string().min(1, "Symbol JRWA jest wymagany"),
  caseNumber: z.number().int().min(1, "Kolejny numer sprawy musi być dodatni"),
  year: z.number().int().min(2000).max(2099),
  referentInitials: z.string().optional(),
  fullCaseSign: z.string().min(1, "Znak sprawy jest wymagany"),
  title: z.string().min(1, "Przedmiot sprawy / tytuł jest wymagany"),
  facilityId: z.string().optional(),
  facilityName: z.string().optional(),
  programId: z.string().optional(),
  programName: z.string().optional(),
  actionId: z.string().optional(),
  archivalCategory: z.string().optional(),
  startDate: optionalDate(),
  endDate: optionalDate(),
  initiatingDocument: z.string().optional(),
  status: z.string().default("w_toku"),
  assignedEducator: z.string().optional().default(""),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 8. Baza Placówek i Instytucji
export const FacilitySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nazwa placówki jest wymagana"),
  type: z.string().min(1, "Typ placówki jest wymagany"),
  educationTypes: z.array(z.string()).optional(),
  address: z.string().min(1, "Adres jest wymagany"),
  city: z.string().min(1, "Miejscowość jest wymagana"),
  postalCode: z.string().min(1, "Kod pocztowy jest wymagany"),
  municipality: z.string().min(1, "Gmina jest wymagana"),
  county: z.string().optional().default("powiat myśliborski"),
  leadingAuthority: z.string().optional().default(""),
  isComplex: z.boolean().optional().default(false),
  parentFacilityId: z.string().optional(),
  // Kontakt instytucjonalny (sekretariat) — odrębny od szkolnego koordynatora programów
  email: z.string().optional(),
  phone: z.string().optional(),
  defaultCoordinatorName: z.string().optional(),
  defaultCoordinatorPhone: z.string().optional(),
  defaultCoordinatorEmail: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DictionaryItemKindSchema = z.enum(["PROGRAMOWE", "NIEPROGRAMOWE"]);
export type DictionaryItemKind = z.infer<typeof DictionaryItemKindSchema>;

// Obszar kwartalnego sprawozdania GIS (art. 6); "brak" = symbol JRWA nie wchodzi do sprawozdania
export const GisCategorySchema = z.enum(["uzaleznienia", "szczepienia", "otylosc", "sti", "inne", "brak"]);
export type GisCategory = z.infer<typeof GisCategorySchema>;

// 9. Centrum Słowników
export const DictionaryItemSchema = z.object({
  id: z.string(),
  dictType: z.string().min(1, "Kategoria słownika jest wymagana"),
  code: z.string().min(1, "Kod pozycji jest wymagany"),
  label: z.string().min(1, "Etykieta pozycji jest wymagana"),
  description: z.string().optional(),
  postalCode: z.string().optional(),
  kind: z.enum(["PROGRAMOWE", "NIEPROGRAMOWE"]).optional().nullable().or(z.literal("").transform(() => undefined)),
  gisCategory: GisCategorySchema.optional().nullable().or(z.literal("").transform(() => undefined)),
  isSystem: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 10. Spis Kontaktów i Koordynatorów
export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Imię i nazwisko kontaktu jest wymagane"),
  position: z.string().optional().default(""),
  facilityId: z.string().optional(),
  facilityName: z.string().optional().default(""),
  municipality: z.string().optional(),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
