/**
 * Adresy e-mail: rozpoznawanie kilku adresów w jednym polu, zbieranie listy do pola DW/UDW
 * i kopiowanie do schowka. Wspólne dla Placówek i Spisu kontaktów.
 */

const EMAIL_RE = /^[^\s@;,<>"']+@[^\s@;,<>"']+\.[^\s@;,<>"'.]{2,}$/;

/** Separatory spotykane w polach z kilkoma adresami: średnik, przecinek, ukośnik, spacja, nowa linia. */
const SEPARATOR_RE = /[;,/\s]+/;

export function isValidEmail(value: string | null | undefined): boolean {
  return EMAIL_RE.test(String(value || "").trim());
}

/** Zdejmuje opakowania z wklejonych adresów: „mailto:”, nawiasy ostre, cudzysłowy, kropkę na końcu zdania. */
function cleanToken(token: string): string {
  return token
    .trim()
    .replace(/^mailto:/i, "")
    .replace(/^[<("'[]+|[>)"'\].:]+$/g, "");
}

/** Wszystkie adresy z pola tekstowego, np. „sekretariat@sp.pl; Jan Kowalski <jan@sp.pl>”. */
export function parseEmails(raw: string | null | undefined): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of String(raw || "").split(SEPARATOR_RE)) {
    const email = cleanToken(token);
    if (!email) continue;
    if (isValidEmail(email)) valid.push(email);
    else if (email.includes("@")) invalid.push(email);
  }
  return { valid, invalid };
}

export function extractEmails(raw: string | null | undefined): string[] {
  return parseEmails(raw).valid;
}

/** Unikalne adresy (bez rozróżniania wielkości liter) w kolejności wystąpienia. */
export function uniqueEmails(values: Iterable<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    for (const email of extractEmails(raw)) {
      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(email);
    }
  }
  return out;
}

/** Niepoprawne wpisy wyglądające na adres – do pokazania użytkownikowi, co zostało pominięte. */
export function invalidEmails(values: Iterable<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const raw of values) parseEmails(raw).invalid.forEach((e) => out.add(e));
  return [...out];
}

/** Link mailto: dla pola z jednym lub kilkoma adresami (RFC 6068 – rozdzielone przecinkiem). */
export function mailtoHref(raw: string | null | undefined): string {
  const emails = extractEmails(raw);
  return `mailto:${emails.length > 0 ? emails.join(",") : String(raw || "").trim()}`;
}

/** „1 e-mail”, „3 e-maile”, „5 e-maili”, „22 e-maile”, „112 e-maili”. */
export function emailCountLabel(n: number): string {
  const lastTwo = n % 100;
  const last = n % 10;
  if (n === 1) return "1 e-mail";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} e-maile`;
  return `${n} e-maili`;
}

export const EMAIL_SEPARATOR_OPTIONS = [
  { value: "; ", label: "Średnik (Outlook)" },
  { value: ", ", label: "Przecinek (Gmail, Thunderbird)" },
  { value: "\n", label: "Nowa linia (Excel, lista)" },
];

/**
 * Kopiuje tekst do schowka. Gdy Clipboard API jest niedostępne lub odmówi (np. okno aplikacji straciło fokus),
 * kopiuje przez zaznaczenie: widocznego pola `selectable` (w oknach dialogowych, które trzymają fokus)
 * albo pomocniczego, ukrytego pola.
 */
export async function copyTextToClipboard(text: string, selectable?: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // przechodzimy do metody zapasowej
  }
  return selectable && selectable.value === text ? copyFromField(selectable) : copyWithHiddenField(text);
}

function execCopy(): boolean {
  try {
    return typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    return false;
  }
}

function copyFromField(field: HTMLTextAreaElement): boolean {
  field.focus();
  field.select();
  return execCopy();
}

function copyWithHiddenField(text: string): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  area.style.pointerEvents = "none";
  document.body.appendChild(area);
  area.select();
  const ok = execCopy();
  area.remove();
  active?.focus?.();
  return ok;
}
