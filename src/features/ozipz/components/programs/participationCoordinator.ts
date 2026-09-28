import { UserCheck, User } from "lucide-react";
import type { SelectOption } from "@/components/ui/select";
import type { OzipzContact, OzipzFacility } from "../../types/ozipz.types";
import { getContactRole, normalizeText } from "../contacts/contactUtils";

/**
 * Logika wyboru szkolnego koordynatora programu ze Spisu Kontaktów:
 * dopasowanie kontaktów do placówki, podpowiedzi i rozpoznawanie wpisów sprzed powiązania z kartoteką.
 */

export const DEFAULT_COORDINATOR_POSITION = "Szkolny Koordynator Programu";

const TITLE_PREFIX = /^(mgr|dr|inz|lic)\.?\s+/g;
const personKey = (name: string | null | undefined) => normalizeText(name).replace(TITLE_PREFIX, "");

/** Kontakt należy do placówki – po powiązaniu w kartotece albo (starsze wpisy) po identycznej nazwie placówki. */
export function isContactOfFacility(contact: OzipzContact, facility: OzipzFacility | null | undefined): boolean {
  if (!facility) return false;
  if (contact.facilityId) return contact.facilityId === facility.id;
  return normalizeText(contact.facilityName) === normalizeText(facility.name);
}

/** Kontakt bez rozpoznanej placówki – przy wyborze warto go do niej przypisać. */
export function isContactWithoutFacility(contact: OzipzContact, facilities: OzipzFacility[]): boolean {
  if (contact.facilityId) return !facilities.some((f) => f.id === contact.facilityId);
  const name = normalizeText(contact.facilityName);
  return !name || !facilities.some((f) => normalizeText(f.name) === name);
}

const byCoordinatorThenName = (a: OzipzContact, b: OzipzContact) => {
  const ra = getContactRole(a.position) === "coordinator" ? 0 : 1;
  const rb = getContactRole(b.position) === "coordinator" ? 0 : 1;
  return ra - rb || a.name.localeCompare(b.name, "pl");
};

/** Opcje listy: najpierw kontakty wybranej placówki, potem cały spis (koordynatorzy na górze każdej grupy). */
export function buildCoordinatorOptions(contacts: OzipzContact[], facility: OzipzFacility | null | undefined): SelectOption[] {
  const own = contacts.filter((c) => isContactOfFacility(c, facility)).sort(byCoordinatorThenName);
  const others = contacts.filter((c) => !isContactOfFacility(c, facility)).sort(byCoordinatorThenName);
  const toOption = (c: OzipzContact, group: string, isOwn: boolean): SelectOption => {
    const isCoordinator = getContactRole(c.position) === "coordinator";
    return {
      value: c.id,
      label: c.name,
      group,
      description: [c.position, isOwn ? "" : c.facilityName, c.phone, c.email].filter(Boolean).join(" · "),
      icon: isCoordinator ? UserCheck : User,
      badge: isCoordinator ? "Koordynator" : undefined,
      badgeVariant: "secondary",
    };
  };
  return [
    ...own.map((c) => toOption(c, `Kontakty placówki (${own.length})`, true)),
    ...others.map((c) => toOption(c, facility ? "Pozostałe kontakty ze spisu" : "Spis kontaktów", false)),
  ];
}

/**
 * Kontakt, który z dużą pewnością jest wpisanym koordynatorem (to samo imię i nazwisko).
 * Przy kilku osobach o tym samym nazwisku wygrywa ta z wybranej placówki; niejednoznaczne – brak dopasowania.
 */
export function matchCoordinatorContact(
  name: string | null | undefined,
  contacts: OzipzContact[],
  facility: OzipzFacility | null | undefined
): OzipzContact | undefined {
  const key = personKey(name);
  if (key.length < 5) return undefined;
  const matches = contacts.filter((c) => personKey(c.name) === key);
  if (matches.length === 1) return matches[0];
  const own = matches.filter((c) => isContactOfFacility(c, facility));
  return own.length === 1 ? own[0] : undefined;
}

/**
 * Podpowiedź po wyborze placówki: jedyny koordynator tej placówki w spisie,
 * a gdy go brak – kontakt odpowiadający koordynatorowi z karty placówki.
 */
export function suggestCoordinator(contacts: OzipzContact[], facility: OzipzFacility | null | undefined): OzipzContact | undefined {
  if (!facility) return undefined;
  const fromCard = matchCoordinatorContact(facility.defaultCoordinatorName, contacts, facility);
  if (fromCard) return fromCard;
  const coordinators = contacts.filter((c) => isContactOfFacility(c, facility) && getContactRole(c.position) === "coordinator");
  return coordinators.length === 1 ? coordinators[0] : undefined;
}

export interface CoordinatorDraft {
  name: string;
  phone: string;
  email: string;
}

/** Rozdziela zapis „600 000 000 / a.nowak@szkola.pl” na telefon i e-mail (do przeniesienia do kartoteki). */
export function splitContactLine(line: string | null | undefined): Pick<CoordinatorDraft, "phone" | "email"> {
  const parts = (line || "").split(/\s*[/;,]\s*|\s+(?=\S+@)/).map((p) => p.trim()).filter(Boolean);
  const email = parts.find((p) => p.includes("@")) || "";
  const phone = parts.filter((p) => !p.includes("@") && /\d/.test(p)).join(" / ");
  return { phone, email };
}

/** Koordynator z karty placówki, którego nie ma jeszcze w Spisie Kontaktów – do dodania jednym kliknięciem. */
export function facilityCardCoordinator(
  facility: OzipzFacility | null | undefined,
  contacts: OzipzContact[]
): CoordinatorDraft | null {
  const name = facility?.defaultCoordinatorName?.trim();
  if (!facility || !name || matchCoordinatorContact(name, contacts, facility)) return null;
  return { name, phone: facility.defaultCoordinatorPhone?.trim() || "", email: facility.defaultCoordinatorEmail?.trim() || "" };
}

/** Stanowisko nowego kontaktu: pozycja słownika „koordynator…”, a bez słownika – nazwa domyślna. */
export function pickCoordinatorPosition(positions: string[]): string {
  return positions.find((p) => getContactRole(p) === "coordinator") || DEFAULT_COORDINATOR_POSITION;
}
