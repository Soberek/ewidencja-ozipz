import { JRWA_DEFAULT_SECTION } from "../constants";
/**
 * Moduł narzędziowy rejestru pism i korespondencji
 * Port i adaptacja z better-oz.
 */

export interface PismaOrgDefaults {
  nadawca: string;
  komorka_organizacyjna: string;
  skrocona_nazwa_komorki: string;
  pelna_nazwa_podmiotu: string;
}

export const PISMA_ORG_DEFAULTS: PismaOrgDefaults = {
  nadawca: 'Państwowy Powiatowy Inspektor Sanitarny w Myśliborzu',
  komorka_organizacyjna: 'Oświata zdrowotna i promocja zdrowia',
  skrocona_nazwa_komorki: 'OZiPZ',
  pelna_nazwa_podmiotu: 'Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu',
};

/**
 * Tworzy krótkie zdanie do pola „Sprawa” na podstawie treści pisma.
 * Wybiera pierwsze pełne zdanie (do 360 znaków) z poprawnym domknięciem kropką.
 */
export function oneSentencePismoSummary(text: string | null | undefined): string | null {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return null;

  const sentenceMatch = normalized.match(/^(.{1,360}?[.!?])(?:\s|$)/);
  const sentence = sentenceMatch?.[1];
  let result = sentence || normalized.slice(0, 360).trim();
  if (result.length > 360) {
    result = `${result.slice(0, 357).replace(/\s+\S*$/, '').trim()}…`;
  }
  if (!/[.!?…]$/.test(result)) result += '.';
  return result;
}

/**
 * Uzupełnia pole dotyczy / sprawa gdy ekstrakcja nie podała tematu.
 */
export function ensurePismoDotyczy<T extends { dotyczy?: string | null; tresc?: string | null }>(
  extraction: T | null | undefined
): (T & { dotyczy_fallback?: boolean }) | null | undefined {
  if (!extraction || String(extraction.dotyczy || '').trim()) {
    return extraction;
  }
  const dotyczy = oneSentencePismoSummary(extraction.tresc);
  if (!dotyczy) return extraction;
  return { ...extraction, dotyczy, dotyczy_fallback: true };
}

/**
 * Formatuje uwagi do pisma z listy wykrytych załączników.
 */
export function uwagiZZalacznikow(zalaczniki: unknown): string {
  const list = Array.isArray(zalaczniki)
    ? zalaczniki.map((z) => String(z || '').trim()).filter(Boolean)
    : [];
  if (!list.length) return '';
  return `Załączniki:\n${list.map((z, i) => `${i + 1}. ${z}`).join('\n')}`;
}

/**
 * Formatuje znak pisma w ramach danej sprawy JRWA zgodnie z Instrukcją Kancelaryjną:
 * [znak_sprawy].[kolejny_nr_pisma] lub [znak_sprawy].[kolejny_nr_pisma].[inicjaly]
 * np. OZiPZ.966.1.5.2026 -> OZiPZ.966.1.5.1.2026 (lub OZiPZ.966.1.5.1.2026.KP)
 */
export function formatCaseLetterSign(params: {
  caseSign: string;
  letterIndex?: number;
  initials?: string;
}): string {
  const { caseSign, letterIndex, initials } = params;
  const cleanSign = String(caseSign || '').trim();
  if (!cleanSign) return '';

  const yearMatch = cleanSign.match(/^(.*?)\.(\d{4})$/);
  const base = yearMatch ? yearMatch[1] : cleanSign;
  const year = yearMatch ? yearMatch[2] : '';

  const idx = letterIndex && Number.isFinite(letterIndex) && letterIndex > 0 ? letterIndex : null;
  const init = initials?.trim() ? initials.trim().toUpperCase() : null;

  let result = cleanSign;
  if (idx && year) {
    result = `${base}.${idx}.${year}`;
  } else if (idx) {
    result = `${cleanSign}.${idx}`;
  }

  if (init) {
    result = `${result}.${init}`;
  }

  return result;
}

/**
 * Parsuje urzędowy znak pisma powiązanego ze sprawą JRWA
 */
export function parseLetterCaseSign(
  sign: string | null | undefined
): {
  section?: string;
  jrwaSymbol?: string;
  caseNumber?: number;
  letterIndex?: number;
  year?: number;
  initials?: string;
} | null {
  const s = String(sign || '').trim();
  if (!s) return null;

  // 1. Znak z 2-częściowym symbolem JRWA (np. 966.1, 9011.1) i sub-numerem pisma: OZiPZ.966.1.5.1.2026(.KP)?
  const m2Full = s.match(
    /^(?:(?:PSSE\.)?([A-Za-z0-9_-]+)\.)?(966\.\d+|9011\.\d+)\.(\d+)\.(\d+)\.(\d{4})(?:\.([A-Za-z0-9]+))?$/
  );
  if (m2Full) {
    return {
      section: m2Full[1] || JRWA_DEFAULT_SECTION,
      jrwaSymbol: m2Full[2],
      caseNumber: Number(m2Full[3]),
      letterIndex: Number(m2Full[4]),
      year: Number(m2Full[5]),
      initials: m2Full[6],
    };
  }

  // 2. Znak z 2-częściowym symbolem JRWA (966.X, 9011.X) bez sub-numeru pisma: OZiPZ.966.1.5.2026(.KP)?
  const m2Case = s.match(
    /^(?:(?:PSSE\.)?([A-Za-z0-9_-]+)\.)?(966\.\d+|9011\.\d+)\.(\d+)\.(\d{4})(?:\.([A-Za-z0-9]+))?$/
  );
  if (m2Case) {
    return {
      section: m2Case[1] || JRWA_DEFAULT_SECTION,
      jrwaSymbol: m2Case[2],
      caseNumber: Number(m2Case[3]),
      year: Number(m2Case[4]),
      initials: m2Case[5],
    };
  }

  // 3. Znak z 1-częściowym symbolem JRWA (np. 0442) i sub-numerem pisma: OZiPZ.0442.2.1.2026(.KP)?
  const m1Full = s.match(
    /^(?:(?:PSSE\.)?([A-Za-z0-9_-]+)\.)?(\d{3,5})\.(\d+)\.(\d+)\.(\d{4})(?:\.([A-Za-z0-9]+))?$/
  );
  if (m1Full) {
    return {
      section: m1Full[1] || JRWA_DEFAULT_SECTION,
      jrwaSymbol: m1Full[2],
      caseNumber: Number(m1Full[3]),
      letterIndex: Number(m1Full[4]),
      year: Number(m1Full[5]),
      initials: m1Full[6],
    };
  }

  // 4. Znak z 1-częściowym symbolem JRWA bez sub-numeru pisma: OZiPZ.0442.2.2026(.KP)?
  const m1Case = s.match(
    /^(?:(?:PSSE\.)?([A-Za-z0-9_-]+)\.)?(\d{3,5})\.(\d+)\.(\d{4})(?:\.([A-Za-z0-9]+))?$/
  );
  if (m1Case) {
    return {
      section: m1Case[1] || JRWA_DEFAULT_SECTION,
      jrwaSymbol: m1Case[2],
      caseNumber: Number(m1Case[3]),
      year: Number(m1Case[4]),
      initials: m1Case[5],
    };
  }

  return null;
}

/**
 * Generuje kolejny numer w dzienniku korespondencji (np. "1/2026", "2/2026" lub "W/1/2026")
 */
export function generateNextLetterJournalNumber(params: {
  existingLetters?: { letterNumber?: string; letterDate?: string; direction?: string }[];
  year: number;
  direction?: "wychodzace" | "przychodzace";
  prefix?: string;
}): string {
  const { existingLetters = [], year, direction, prefix } = params;
  let maxNum = 0;

  const regex = /^(?:[A-Za-z]+\/)?(\d+)\s*\/\s*(\d{2,4})$/;

  existingLetters.forEach((l) => {
    if (direction && l.direction && l.direction !== direction) return;
    const numStr = String(l.letterNumber || "").trim();
    const match = numStr.match(regex);
    if (match) {
      const nr = Number(match[1]);
      let yr = Number(match[2]);
      if (match[2].length === 2) yr = 2000 + yr;
      if (yr === year && Number.isFinite(nr) && nr > maxNum) {
        maxNum = nr;
      }
    }
  });

  const nextNum = maxNum + 1;
  const pfx = prefix ? `${prefix}/` : "";
  return `${pfx}${nextNum}/${year}`;
}
