import { format, isValid, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { formatDatePl } from "./dateUtils";
import { findPolishHoliday } from "./polishHolidays";
import { escapeHtml, escapeMultiline, officialFormDocument } from "./printHtml";

/** Wniosek do Dyrektora PSSE o zgodę na pracę w dniu wolnym (sobota, niedziela, święto) lub poza zwykłym dniem pracy. */

export interface WorkDayRequestEmployee {
  id: string;
  /** Komórka organizacyjna, np. „OZiPZ”, „EP”. */
  unit: string;
  fullName: string;
}

export interface WorkDayRequest {
  /** Nadawca — komórka organizacyjna (lewy górny róg). */
  senderUnit: string;
  senderStation: string;
  issuePlace: string;
  /** Data sporządzenia wniosku (ISO). */
  issueDate: string;
  recipient: string;
  /** Po „W związku z” — w narzędniku, np. „organizacją stoiska profilaktyczno-edukacyjnego”. */
  purpose: string;
  /** Nazwa wydarzenia bez cudzysłowu; pusta = zdanie bez „podczas wydarzenia…”. */
  eventName: string;
  /** Miejsce tak, jak brzmi w zdaniu, np. „w Barlinku”. */
  location: string;
  /** Dzień pracy (ISO). */
  workDate: string;
  /** Godziny pracy (HH:mm) — obie albo żadna. */
  timeFrom: string;
  timeTo: string;
  employees: WorkDayRequestEmployee[];
}

export const WORK_DAY_REQUEST_DEFAULTS = {
  senderUnit: "Oświata Zdrowotna i Promocja Zdrowia",
  senderStation: "PSSE w Myśliborzu",
  issuePlace: "Myślibórz",
  recipient: "Dyrektor Powiatowej Stacji Sanitarno-Epidemiologicznej\nw Myśliborzu",
} as const;

export type WorkDayKind = "saturday" | "sunday" | "holiday" | "workday";

export interface WorkDayInfo {
  kind: WorkDayKind;
  /** Krótka etykieta do interfejsu, np. „Sobota”, „Święto: Wszystkich Świętych”. */
  label: string;
  /** Fraza do treści wniosku, np. „w sobotę 3 października 2026 r.”. */
  phrase: string;
}

const WEEKDAY_ACCUSATIVE = ["w niedzielę", "w poniedziałek", "we wtorek", "w środę", "w czwartek", "w piątek", "w sobotę"];

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function describeWorkDay(isoDate: string): WorkDayInfo | null {
  const date = parseIsoDate(isoDate);
  if (!date) return null;
  const dayText = `${format(date, "d MMMM yyyy", { locale: pl })} r.`;
  const weekday = date.getDay();
  const holiday = findPolishHoliday(isoDate);

  if (holiday) return { kind: "holiday", label: `Święto: ${holiday}`, phrase: `${WEEKDAY_ACCUSATIVE[weekday]} ${dayText} (${holiday})` };
  if (weekday === 6) return { kind: "saturday", label: "Sobota", phrase: `w sobotę ${dayText}` };
  if (weekday === 0) return { kind: "sunday", label: "Niedziela", phrase: `w niedzielę ${dayText}` };
  return {
    kind: "workday",
    label: `Dzień roboczy (${format(date, "EEEE", { locale: pl })})`,
    phrase: `${WEEKDAY_ACCUSATIVE[weekday]} ${dayText}`,
  };
}

// ——— Walidacja ———

export type WorkDayRequestField =
  | "issueDate"
  | "purpose"
  | "eventName"
  | "location"
  | "workDate"
  | "time"
  | "employees"
  | `employee:${string}:unit`
  | `employee:${string}:fullName`;

export interface WorkDayRequestIssue {
  field: WorkDayRequestField;
  severity: "error" | "warning";
  message: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const LOCATION_PREPOSITION = /^(w|we|na|przy|pod|nad|u|obok|koło|kolo)\s/i;

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Sprawdza wniosek. Błędy blokują druk, ostrzeżenia tylko zwracają uwagę.
 */
export function validateWorkDayRequest(request: WorkDayRequest): WorkDayRequestIssue[] {
  const issues: WorkDayRequestIssue[] = [];
  const error = (field: WorkDayRequestField, message: string) => issues.push({ field, severity: "error", message });
  const warning = (field: WorkDayRequestField, message: string) => issues.push({ field, severity: "warning", message });

  const issueDate = request.issueDate ? parseIsoDate(request.issueDate) : null;
  if (!request.issueDate) error("issueDate", "Podaj datę sporządzenia wniosku.");
  else if (!issueDate) error("issueDate", "Data wniosku jest nieprawidłowa.");

  const purpose = request.purpose.trim();
  if (!purpose) error("purpose", "Opisz, w związku z czym potrzebna jest praca (np. „organizacją stoiska…”).");
  else if (/^w\s+związku\s+z/i.test(purpose)) warning("purpose", "Usuń „W związku z” z początku — ta fraza jest już w treści wniosku.");

  if (/[„”"«»]/.test(request.eventName)) warning("eventName", "Nazwę wydarzenia wpisz bez cudzysłowu — zostanie dodany automatycznie.");

  const location = request.location.trim();
  if (!location) error("location", "Podaj miejsce (np. „w Barlinku”).");
  else if (!LOCATION_PREPOSITION.test(location)) {
    warning("location", "Miejsce wpisz tak, jak ma brzmieć w zdaniu, z przyimkiem — np. „w Barlinku”, a nie „Barlinek”.");
  }

  const workDay = request.workDate ? describeWorkDay(request.workDate) : null;
  if (!request.workDate) error("workDate", "Podaj dzień, w którym będzie wykonywana praca.");
  else if (!workDay) error("workDate", "Data pracy jest nieprawidłowa.");
  else {
    if (workDay.kind === "workday") {
      warning("workDate", `${formatDatePl(request.workDate)} to zwykły dzień roboczy — sprawdź, czy data jest właściwa.`);
    }
    if (issueDate && request.workDate < request.issueDate) {
      error("workDate", "Dzień pracy jest wcześniejszy niż data wniosku — wniosek składa się przed terminem.");
    }
  }

  const { timeFrom, timeTo } = request;
  if (timeFrom || timeTo) {
    if (!timeFrom || !timeTo) error("time", "Podaj obie godziny (od i do) albo usuń obie.");
    else if (!TIME_PATTERN.test(timeFrom) || !TIME_PATTERN.test(timeTo)) error("time", "Godziny muszą mieć format GG:MM.");
    else if (timeFrom >= timeTo) error("time", "Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.");
  }

  if (request.employees.length === 0) error("employees", "Dodaj co najmniej jednego pracownika.");
  const seen = new Set<string>();
  request.employees.forEach((employee, index) => {
    const position = `Pracownik nr ${index + 1}`;
    if (!employee.unit.trim()) error(`employee:${employee.id}:unit`, `${position}: podaj komórkę organizacyjną (np. OZiPZ, EP).`);
    const name = normalizeName(employee.fullName);
    if (!name) error(`employee:${employee.id}:fullName`, `${position}: podaj imię i nazwisko.`);
    else if (!name.includes(" ")) warning(`employee:${employee.id}:fullName`, `${position}: wpisz imię i nazwisko, nie samo nazwisko.`);
    else if (seen.has(name)) error(`employee:${employee.id}:fullName`, `${position}: ${employee.fullName.trim()} jest już na liście.`);
    if (name) seen.add(name);
  });

  return issues;
}

// ——— Wydruk ———

function stripQuotes(value: string): string {
  return value.trim().replace(/^[„”"«»]+|[„”"«»]+$/g, "").trim();
}

export function buildWorkDayRequestSentence(request: WorkDayRequest): string {
  const workDay = describeWorkDay(request.workDate);
  const dayPhrase = workDay?.phrase ?? "w dniu ............";
  const eventName = stripQuotes(request.eventName);
  const where = request.location.trim() ? ` ${request.location.trim()}` : "";
  const hours = request.timeFrom && request.timeTo ? ` w godzinach ${request.timeFrom}–${request.timeTo}` : "";
  const ask = `wnioskujemy o wyrażenie zgody na pracę w tym dniu${hours} dla następujących pracowników:`;
  const purpose = request.purpose.trim() || "............";

  if (eventName) return `W związku z ${purpose} podczas wydarzenia „${eventName}”${where}, które odbędzie się ${dayPhrase}, ${ask}`;
  return `W związku z ${purpose}${where} ${dayPhrase} ${ask}`;
}

const CSS = `
    body { font-size: 12pt; line-height: 1.5; }
    .page { padding: 22mm 20mm 20mm 22mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm; }
    .sender div + div { margin-top: 3mm; }
    .recipient { margin: 38mm 0 0 auto; width: fit-content; max-width: 110mm; text-align: right; }
    .body { margin-top: 24mm; }
    ul { margin: 6mm 0 0 12mm; list-style: none; }
    li { margin-top: 3mm; padding-left: 8mm; position: relative; }
    li::before { content: "\\2022"; position: absolute; left: 0; }
    .signature { margin-top: 30mm; width: 70mm; font-size: 9pt; }
`;

export function buildWorkDayRequestHtml(request: WorkDayRequest): string {
  const issueDateText = request.issueDate ? `${formatDatePl(request.issueDate, "............")} r.` : "............";
  const employees = request.employees.filter((employee) => employee.fullName.trim() || employee.unit.trim());
  const items = employees
    .map((employee, index) => {
      const text = [employee.unit.trim(), employee.fullName.trim()].filter(Boolean).join(" – ");
      return `<li>${escapeHtml(text)}${index === employees.length - 1 ? "." : ""}</li>`;
    })
    .join("");

  return officialFormDocument(
    "Wniosek o zgodę na pracę",
    CSS,
    `
    <div class="header">
      <div class="sender">
        <div>${escapeHtml(request.senderUnit)}</div>
        <div>${escapeHtml(request.senderStation)}</div>
      </div>
      <div>${escapeHtml(request.issuePlace)}, dn. ${escapeHtml(issueDateText)}</div>
    </div>

    <div class="recipient">${escapeMultiline(request.recipient)}</div>

    <div class="body">
      <p>${escapeHtml(buildWorkDayRequestSentence(request))}</p>
      <ul>${items}</ul>
    </div>

    <div class="signature">
      <div class="dotted-line"></div>
      (podpis wnioskującego)
    </div>`
  );
}
