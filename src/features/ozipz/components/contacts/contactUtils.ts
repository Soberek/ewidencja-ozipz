import type { OzipzContact, OzipzSchoolParticipation } from "../../types/ozipz.types";
import { participationCoordinators } from "../../utils/participationUtils";
import { extractEmails, isValidEmail, uniqueEmails } from "../../utils/emailUtils";

export { isValidEmail };

/**
 * Logika domenowa Spisu Kontaktów: normalizacja wyszukiwania, klasyfikacja ról,
 * formatowanie telefonów, kontrola kompletności, wykrywanie duplikatów oraz eksport vCard.
 */

export type ContactRole = "coordinator" | "director" | "pedagogue" | "other";

export type ContactRoleFilter =
  | "all"
  | "coordinators"
  | "directors"
  | "pedagogues"
  | "incomplete";

/** Małe litery bez polskich znaków diakrytycznych – "Myślibórz" → "mysliborz". */
export function normalizeText(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function digitsOnly(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

export function getContactRole(position: string | null | undefined): ContactRole {
  const pos = normalizeText(position);
  if (pos.includes("koordynator")) return "coordinator";
  if (pos.includes("dyrektor") || pos.includes("wicedyrektor")) return "director";
  if (pos.includes("pedagog") || pos.includes("psycholog")) return "pedagogue";
  return "other";
}

export function hasPhone(c: Pick<OzipzContact, "phone">): boolean {
  return digitsOnly(c.phone).length > 0;
}

export function hasEmail(c: Pick<OzipzContact, "email">): boolean {
  return Boolean(c.email && c.email.trim());
}

/** Braki w kartotece – puste pole telefonu i e-maila, niepoprawny e-mail lub brak placówki. */
export function getContactIssues(c: OzipzContact): string[] {
  const issues: string[] = [];
  if (!hasPhone(c) && !hasEmail(c)) issues.push("Brak telefonu i e-maila");
  if (hasEmail(c) && extractEmails(c.email).length === 0) issues.push("Niepoprawny adres e-mail");
  if (!(c.facilityName || "").trim()) issues.push("Brak przypisanej placówki");
  if (!(c.position || "").trim()) issues.push("Brak stanowiska");
  return issues;
}

export function isContactIncomplete(c: OzipzContact): boolean {
  return getContactIssues(c).length > 0;
}

// Prefiksy sieci komórkowych w Polsce (pozostałe 9-cyfrowe numery to stacjonarne z kierunkowym).
const MOBILE_PREFIXES = new Set(["45", "50", "51", "53", "57", "60", "66", "69", "72", "73", "78", "79", "88"]);

/**
 * Formatuje polski numer do czytelnej postaci:
 * stacjonarny "957472233" → "95 747 22 33", komórkowy "600000000" → "600 000 000".
 * Numerów wewnętrznych, wielu numerów i nietypowych formatów nie modyfikuje.
 */
export function formatPhone(value: string | null | undefined): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/[a-zA-Z,;/]/.test(raw)) return raw;

  let digits = digitsOnly(raw);
  let prefix = "";
  if (digits.length === 11 && digits.startsWith("48")) {
    digits = digits.slice(2);
    prefix = "+48 ";
  }
  if (digits.length !== 9) return raw;

  const formatted = MOBILE_PREFIXES.has(digits.slice(0, 2))
    ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    : `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  return prefix + formatted;
}

/** Link tel: – bierze pierwszy numer z pola (np. "95 747 22 33 / 600 000 000"). */
export function phoneHref(value: string | null | undefined): string | null {
  const first = (value || "").split(/[/,;]|\bwew\b/i)[0];
  const digits = digitsOnly(first);
  if (digits.length < 9) return null;
  const national = digits.length === 11 && digits.startsWith("48") ? digits.slice(2) : digits;
  return `tel:+48${national}`;
}

/** Wyszukiwanie odporne na wielkość liter, polskie znaki i format numeru telefonu. */
export function matchesContactSearch(c: OzipzContact, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;

  const haystack = normalizeText(
    [c.name, c.facilityName, c.position, c.email, c.municipality, c.notes, c.phone].join(" | ")
  );
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.every((t) => haystack.includes(t))) return true;

  const qDigits = digitsOnly(query);
  return qDigits.length >= 3 && qDigits.length === query.replace(/[\s\-+()]/g, "").length
    ? digitsOnly(c.phone).includes(qDigits)
    : false;
}

export function matchesRoleFilter(c: OzipzContact, filter: ContactRoleFilter): boolean {
  switch (filter) {
    case "coordinators":
      return getContactRole(c.position) === "coordinator";
    case "directors":
      return getContactRole(c.position) === "director";
    case "pedagogues":
      return getContactRole(c.position) === "pedagogue";
    case "incomplete":
      return isContactIncomplete(c);
    default:
      return true;
  }
}

export interface ContactDuplicate {
  contact: OzipzContact;
  reason: "email" | "phone" | "name";
}

/** Kontakty, które prawdopodobnie opisują tę samą osobę (ten sam e-mail, telefon lub imię i nazwisko). */
export function findDuplicateContacts(
  draft: Pick<OzipzContact, "name" | "email" | "phone">,
  contacts: OzipzContact[],
  excludeId?: string
): ContactDuplicate[] {
  const email = normalizeText(draft.email);
  const phone = digitsOnly(draft.phone);
  const name = normalizeText(draft.name).replace(/^(mgr|dr|inz|lic)\.?\s+/g, "");

  const result: ContactDuplicate[] = [];
  for (const c of contacts) {
    if (c.id === excludeId) continue;
    if (email && normalizeText(c.email) === email) {
      result.push({ contact: c, reason: "email" });
    } else if (phone.length >= 9 && digitsOnly(c.phone).endsWith(phone.slice(-9))) {
      result.push({ contact: c, reason: "phone" });
    } else if (
      name.length >= 5 &&
      normalizeText(c.name).replace(/^(mgr|dr|inz|lic)\.?\s+/g, "") === name
    ) {
      result.push({ contact: c, reason: "name" });
    }
  }
  return result;
}

/** Unikalne, poprawne adresy e-mail – gotowe do wklejenia w pole UDW / DW. */
export function collectEmails(contacts: OzipzContact[]): string[] {
  return uniqueEmails(contacts.map((c) => c.email));
}

/**
 * Programy, które dana osoba koordynuje – zgłoszenia powiązane z kontaktem, a dla starszych wpisów
 * bez powiązania dopasowanie po nazwisku koordynatora (lub jego danych kontaktowych).
 */
export function buildContactProgramsIndex(
  contacts: OzipzContact[],
  participations: OzipzSchoolParticipation[]
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  if (participations.length === 0) return index;

  for (const c of contacts) {
    const name = normalizeText(c.name);
    const email = normalizeText(c.email);
    const phone = digitsOnly(c.phone).slice(-9);
    const programs = new Set<string>();

    for (const p of participations) {
      const matches = participationCoordinators(p).some((coordinator) => {
        if (coordinator.contactId) return coordinator.contactId === c.id;
        const coordName = normalizeText(coordinator.name);
        const coordContact = coordinator.contact || "";
        const byName = name.length >= 5 && coordName.length >= 5 && (coordName.includes(name) || name.includes(coordName));
        const byEmail = Boolean(email) && normalizeText(coordContact).includes(email);
        const byPhone = phone.length === 9 && digitsOnly(coordContact).includes(phone);
        return byName || byEmail || byPhone;
      });
      if (matches) programs.add(p.programName);
    }

    if (programs.size > 0) {
      index.set(c.id, Array.from(programs).sort((a, b) => a.localeCompare(b, "pl")));
    }
  }
  return index;
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** Plik vCard 3.0 – do importu w telefonie służbowym, Outlooku lub Kontaktach Google. */
export function contactsToVCard(contacts: OzipzContact[]): string {
  return contacts
    .map((c) => {
      const fullName = c.name.trim();
      const parts = fullName.replace(/^(mgr|dr|inż\.?|lic\.?)\s+/i, "").split(/\s+/);
      const last = parts.length > 1 ? parts[parts.length - 1] : fullName;
      const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${escapeVCard(fullName)}`,
        `N:${escapeVCard(last)};${escapeVCard(first)};;;`,
      ];
      if (c.facilityName) lines.push(`ORG:${escapeVCard(c.facilityName)}`);
      if (c.position) lines.push(`TITLE:${escapeVCard(c.position)}`);
      const tel = phoneHref(c.phone);
      if (tel) lines.push(`TEL;TYPE=WORK,VOICE:${tel.replace("tel:", "")}`);
      for (const email of extractEmails(c.email)) lines.push(`EMAIL;TYPE=INTERNET,WORK:${email}`);
      if (c.municipality) lines.push(`ADR;TYPE=WORK:;;;;${escapeVCard(c.municipality)};;PL`);
      const note = [c.notes, "Ewidencja OZiPZ"].filter(Boolean).join(" · ");
      lines.push(`NOTE:${escapeVCard(note)}`);
      lines.push("END:VCARD");
      return lines.join("\r\n");
    })
    .join("\r\n");
}
