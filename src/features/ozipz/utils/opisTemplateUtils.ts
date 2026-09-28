/**
 * Moduł dobierania i renderowania szablonów opisu merytorycznego zadań
 * Port i adaptacja z better-oz.
 */

export interface OpisTemplateItem {
  id?: string | number;
  title?: string;
  jrwa?: string | null;
  dzialanie_id?: string | number | null;
  liczba_od?: number | null;
  liczba_do?: number | null;
  description_template?: string;
  opis?: string;
  kolejnosc?: number | null;
  aktywny?: boolean | number;
}

export interface OpisMatchContext {
  jrwa?: string | null;
  dzialanie_id?: string | number | null;
  liczba_dzialan?: number | null;
  minSpecificity?: number | null;
}

export interface OpisRenderContext {
  liczba?: number | string | null;
  liczba_dzialan?: number | string | null;
  program?: string | null;
  nazwa_programu?: string | null;
  jrwa?: string | null;
  dzialanie?: string | null;
  dzialanie_nazwa?: string | null;
  lokalizacja?: string | null;
  lokalizacja_nazwa?: string | null;
  data?: string | null;
  liczba_osob?: number | string | null;
  grupy?: string | null;
}

/**
 * Oblicza specyficzność szablonu: JRWA (+4), działanie (+2).
 * Pełne dopasowanie = 6 punktów.
 */
export function opisSpecificity(s: OpisTemplateItem | null | undefined): number {
  let n = 0;
  if (s?.jrwa != null && s.jrwa !== '') n += 4;
  if (s?.dzialanie_id != null && s.dzialanie_id !== '') n += 2;
  return n;
}

/**
 * Dobiera najlepszy szablon opisu na podstawie kontekstu zadania.
 */
export function dopasujOpis(
  szablony: OpisTemplateItem[] = [],
  ctx: OpisMatchContext = {}
): OpisTemplateItem | null {
  const liczba = Number(ctx.liczba_dzialan ?? 1) || 1;
  const jrwa = ctx.jrwa || null;
  const dzialanieId =
    ctx.dzialanie_id != null && ctx.dzialanie_id !== ''
      ? String(ctx.dzialanie_id)
      : null;
  const minSpec = ctx.minSpecificity != null ? Number(ctx.minSpecificity) : 0;

  const candidates = (szablony || []).filter((s) => {
    if (s.aktywny === 0 || s.aktywny === false) return false;
    const od = Number(s.liczba_od ?? 1);
    const do_ = Number(s.liczba_do ?? 999);
    if (liczba < od || liczba > do_) return false;
    if (s.jrwa != null && s.jrwa !== '' && s.jrwa !== jrwa) return false;
    if (
      s.dzialanie_id != null &&
      s.dzialanie_id !== '' &&
      String(s.dzialanie_id) !== dzialanieId
    ) {
      return false;
    }
    if (opisSpecificity(s) < minSpec) return false;
    return true;
  });

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const scoreA = opisSpecificity(a);
    const scoreB = opisSpecificity(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const rangeA = Number(a.liczba_do ?? 999) - Number(a.liczba_od ?? 1);
    const rangeB = Number(b.liczba_do ?? 999) - Number(b.liczba_od ?? 1);
    if (rangeA !== rangeB) return rangeA - rangeB;
    const kol = Number(a.kolejnosc || 0) - Number(b.kolejnosc || 0);
    if (kol !== 0) return kol;
    return Number(a.id || 0) - Number(b.id || 0);
  });

  return candidates[0];
}

/**
 * Podstawia zmienne kontekstowe do szablonu opisu zadania.
 */
export function renderOpis(tresc: string | null | undefined, ctx: OpisRenderContext = {}): string {
  if (!tresc) return '';
  const map: Record<string, string> = {
    liczba: String(ctx.liczba ?? ctx.liczba_dzialan ?? ''),
    program: String(ctx.program ?? ctx.nazwa_programu ?? ''),
    jrwa: String(ctx.jrwa ?? ''),
    dzialanie: String(ctx.dzialanie ?? ctx.dzialanie_nazwa ?? ''),
    lokalizacja: String(ctx.lokalizacja ?? ctx.lokalizacja_nazwa ?? ''),
    data: String(ctx.data ?? ''),
    liczba_osob: String(ctx.liczba_osob ?? ''),
    grupy: String(ctx.grupy ?? ''),
  };

  let out = String(tresc).replace(/\{([a-z_]+)\}/gi, (_, key) => {
    const k = key.toLowerCase();
    return map[k] != null ? map[k] : '';
  });

  out = out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return out;
}

export const OPIS_ZNACZNIKI: readonly string[] = [
  '{liczba}',
  '{program}',
  '{jrwa}',
  '{dzialanie}',
  '{lokalizacja}',
  '{data}',
  '{liczba_osob}',
  '{grupy}',
];

/** Minimalna specyficzność do auto-podstawienia przy ekstrakcji (JRWA + działanie = 6). */
export const OPIS_MIN_SPEC_AUTO = 6;
