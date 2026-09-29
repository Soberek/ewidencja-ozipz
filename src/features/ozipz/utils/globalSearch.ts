import type {
  OzipzAction, OzipzContact, OzipzDistribution, OzipzFacility, OzipzJrwaCase, OzipzLetter, OzipzMaterial,
  OzipzProgram, OzipzPublication, OzipzRegisterItem, OzipzScheduleEvent, OzipzSchoolParticipation, OzipzStaff,
} from "../types/ozipz.types";
import type { ModalPayloadMap, ModalType } from "../store/useModalStore";
import { normalizeNavQuery } from "../components/layout/navigation";
import { formatDatePl } from "./dateUtils";

export interface SearchSources {
  actions: OzipzAction[];
  letters: OzipzLetter[];
  jrwaCases: OzipzJrwaCase[];
  scheduleEvents: OzipzScheduleEvent[];
  facilities: OzipzFacility[];
  contacts: OzipzContact[];
  programs: OzipzProgram[];
  participations: OzipzSchoolParticipation[];
  materials: OzipzMaterial[];
  distributions: OzipzDistribution[];
  publications: OzipzPublication[];
  registers: OzipzRegisterItem[];
  staff: OzipzStaff[];
}

/** Rekord w wynikach wyszukiwania wraz z tym, jak go otworzyć. */
export interface SearchEntry {
  key: string;
  group: string;
  title: string;
  subtitle: string;
  path: string;
  modal?: { [T in ModalType]: { type: T; payload: ModalPayloadMap[T] } }[ModalType];
  /** Znormalizowany tekst, w którym szukamy (bez polskich znaków i wielkości liter). */
  haystack: string;
}

const joinParts = (...parts: Array<string | number | null | undefined>) =>
  parts.filter((part) => part !== undefined && part !== null && String(part).trim() !== "").join(" · ");

function entry(fields: Omit<SearchEntry, "haystack">, ...extra: Array<string | number | null | undefined>): SearchEntry {
  return { ...fields, haystack: normalizeNavQuery([fields.title, fields.subtitle, ...extra].filter(Boolean).join(" ")) };
}

/** Buduje indeks wszystkich rekordów ewidencji do globalnej wyszukiwarki. */
export function buildSearchIndex(sources: SearchSources): SearchEntry[] {
  return [
    ...sources.actions.map((item) => entry({
      key: `action-${item.id}`, group: "Działania", title: item.title,
      subtitle: joinParts(formatDatePl(item.date), item.actionType, item.facilityName),
      path: `/dzialania/${item.id}/edytuj`,
    }, item.municipality, item.programName, item.topic, item.leadEducator)),
    ...sources.letters.map((item) => entry({
      key: `letter-${item.id}`, group: "Pisma", title: item.subject,
      subtitle: joinParts(item.letterNumber, formatDatePl(item.letterDate), item.senderRecipient),
      path: "/pisma", modal: { type: "letter", payload: { item } },
    }, item.caseSign, item.assignedPerson)),
    ...sources.jrwaCases.map((item) => entry({
      key: `jrwa-${item.id}`, group: "Sprawy JRWA", title: item.title,
      subtitle: joinParts(item.fullCaseSign, item.facilityName, item.programName),
      path: "/znaki", modal: { type: "jrwa", payload: { item } },
    }, item.assignedEducator)),
    ...sources.scheduleEvents.map((item) => entry({
      key: `schedule-${item.id}`, group: "Harmonogram", title: item.title,
      subtitle: joinParts(formatDatePl(item.eventDate), item.location, item.programName),
      path: "/harmonogram", modal: { type: "schedule", payload: { item } },
    }, item.responsiblePerson, item.campaignName)),
    ...sources.facilities.map((item) => entry({
      key: `facility-${item.id}`, group: "Placówki", title: item.name,
      subtitle: joinParts(item.city, item.municipality, item.type),
      path: "/lokalizacje", modal: { type: "facility", payload: { item } },
    }, item.address, item.postalCode)),
    ...sources.contacts.map((item) => entry({
      key: `contact-${item.id}`, group: "Kontakty", title: item.name,
      subtitle: joinParts(item.position, item.facilityName, item.phone),
      path: "/kontakty", modal: { type: "contact", payload: { item } },
    }, item.email, item.municipality)),
    ...sources.programs.map((item) => entry({
      key: `program-${item.id}`, group: "Programy", title: item.name,
      subtitle: joinParts(item.code, item.editionYear, item.status),
      path: "/programy", modal: { type: "program", payload: { item } },
    }, item.jrwaSymbol)),
    ...sources.participations.map((item) => entry({
      key: `participation-${item.id}`, group: "Udział w programach", title: `${item.facilityName} — ${item.programName}`,
      subtitle: joinParts(item.schoolYear, item.schoolCoordinatorName),
      path: "/szkoly-w-programie", modal: { type: "participation", payload: { item } },
    }, item.municipality)),
    ...sources.materials.map((item) => entry({
      key: `material-${item.id}`, group: "Materiały", title: item.title,
      subtitle: joinParts(item.materialType, item.publisher),
      path: "/materialy", modal: { type: "material", payload: { item } },
    }, item.topic)),
    ...sources.distributions.map((item) => entry({
      key: `distribution-${item.id}`, group: "Rozdzielniki", title: `${item.materialTitle} → ${item.recipientName}`,
      subtitle: joinParts(formatDatePl(item.distributionDate), `${item.quantity} szt.`),
      path: "/rozdzielniki", modal: { type: "distribution", payload: { item } },
    }, item.municipality, item.assignedEducator)),
    ...sources.publications.map((item) => entry({
      key: `publication-${item.id}`, group: "Publikacje", title: item.title,
      subtitle: joinParts(formatDatePl(item.publicationDate), item.channel),
      path: "/publikacje", modal: { type: "publication", payload: { item } },
    }, item.author, item.topic)),
    ...sources.registers.map((item) => entry({
      key: `register-${item.id}`, group: "Rejestry", title: item.title,
      subtitle: joinParts(item.registerNumber, formatDatePl(item.date), item.facilityName),
      path: "/rejestry", modal: { type: "register", payload: { item } },
    }, item.organizer, item.location, item.jrwaSign)),
    ...sources.staff.map((item) => entry({
      key: `staff-${item.id}`, group: "Kadra", title: item.fullName,
      subtitle: joinParts(item.role, item.phone),
      path: "/osoby", modal: { type: "staff", payload: { item } },
    }, item.email)),
  ];
}

export const SEARCH_RESULT_LIMIT = 60;

/** Każde słowo zapytania musi wystąpić w rekordzie; trafienia w tytule są wyżej. */
export function searchIndex(index: SearchEntry[], query: string, limit = SEARCH_RESULT_LIMIT): SearchEntry[] {
  const tokens = normalizeNavQuery(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const scored: Array<{ item: SearchEntry; score: number }> = [];
  for (const item of index) {
    if (!tokens.every((token) => item.haystack.includes(token))) continue;
    const title = normalizeNavQuery(item.title);
    const score = tokens.reduce((sum, token) => sum + (title.startsWith(token) ? 3 : title.includes(token) ? 2 : 0), 0);
    scored.push({ item, score });
  }
  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
