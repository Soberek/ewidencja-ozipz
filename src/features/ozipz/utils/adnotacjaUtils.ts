/**
 * Moduł adnotacji urzędowych i metryk harmonogramu
 * Port i adaptacja z better-oz.
 */

export const POLISH_MONTHS_GENITIVE: readonly string[] = [
  '',
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

export const POLISH_MONTHS_NOMINATIVE: readonly string[] = [
  '',
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
];

import { getTodayIsoDate } from "./dateUtils";

export function formatDateLongPl(iso: string | null | undefined): string {
  const s = String(iso || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const day = String(Number(m[3]));
  const month = POLISH_MONTHS_GENITIVE[Number(m[2])] || m[2];
  return `${day} ${month} ${m[1]} r.`;
}

export function effectiveDone(p: {
  status?: string | null;
  manuallyCompleted?: boolean | number | null;
  oznaczono_recznie?: number | null;
  plannedCount?: number | null;
  planowana_liczba?: number | null;
  completedCount?: number | null;
  wykonano?: number | null;
}): boolean {
  if (p.status === 'anulowane') return false;
  if (Boolean(p.manuallyCompleted) || Number(p.oznaczono_recznie) === 1) return true;
  const plan = Number(p.plannedCount ?? p.planowana_liczba ?? 0);
  const auto = Number(p.completedCount ?? p.wykonano ?? 0);
  return plan > 0 && auto >= plan;
}

export function effectiveWykonano(p: {
  plannedCount?: number | null;
  planowana_liczba?: number | null;
  completedCount?: number | null;
  wykonano?: number | null;
  manuallyCompleted?: boolean | number | null;
  oznaczono_recznie?: number | null;
}): number {
  const plan = Number(p.plannedCount ?? p.planowana_liczba ?? 0);
  if (Boolean(p.manuallyCompleted) || Number(p.oznaczono_recznie) === 1) return plan;
  return Math.min(Number(p.completedCount ?? p.wykonano ?? 0), plan);
}

export function pctOf(done: number, plan: number): number {
  if (!plan) return 0;
  return Math.min(100, Math.round((done / plan) * 100));
}

export type HarmonogramFilterType = 'all' | 'open' | 'noadn' | 'manual';

export function passesHarmonogramFilter(
  filter: HarmonogramFilterType,
  p: {
    status?: string | null;
    manuallyCompleted?: boolean | number | null;
    oznaczono_recznie?: number | null;
    plannedCount?: number | null;
    planowana_liczba?: number | null;
    completedCount?: number | null;
    wykonano?: number | null;
    annotationReasonCode?: string | null;
    adnotacje_count?: number | null;
  }
): boolean {
  const isManual = Boolean(p.manuallyCompleted) || Number(p.oznaczono_recznie) === 1;
  if (filter === 'manual') return isManual;
  if (filter === 'open' || filter === 'noadn') {
    if (p.status === 'anulowane') return false;
    if (effectiveDone(p)) return false;
    if (filter === 'noadn') {
      const hasAdn = Boolean(p.annotationReasonCode) || Number(p.adnotacje_count || 0) > 0;
      return !hasAdn;
    }
    return true;
  }
  return true;
}

export interface BuildAdnotacjaDataParams {
  pozycja: {
    miesiac?: number | string | null;
    rok?: number | string | null;
    jrwa?: string | null;
    interwencja_nazwa?: string | null;
    dzialanie_nazwa?: string | null;
    planowana_liczba?: number | null;
    wykonano?: number | null;
  };
  sporzadzil: string;
  stanowisko?: string;
  powod: { tytul: string; opis: string };
  tresc: string;
  data?: string;
  miasto?: string;
  dotyczy?: string;
}

export function buildAdnotacjaData(opts: BuildAdnotacjaDataParams) {
  const p = opts.pozycja || {};
  const powod = opts.powod;
  if (!powod?.tytul) throw new Error('Nieprawidłowy powód adnotacji');
  const tresc = String(opts.tresc || '').trim();
  if (!tresc) throw new Error('Brak treści adnotacji');

  const miesiac = POLISH_MONTHS_NOMINATIVE[Number(p.miesiac)] || String(p.miesiac || '');
  const stanowisko = String(opts.stanowisko || '').trim();

  const dotyczy =
    String(opts.dotyczy || '').trim() ||
    [
      `niewykonanie zaplanowanego działania „${p.dzialanie_nazwa || '—'}”`,
      `w programie „${p.interwencja_nazwa || p.jrwa || ''}” (JRWA ${p.jrwa || ''})`,
      `w okresie ${miesiac} ${p.rok || ''}`,
    ].join(' ');

  return {
    miasto: String(opts.miasto || 'Myślibórz').trim() || 'Myślibórz',
    data: formatDateLongPl(opts.data || getTodayIsoDate()),
    sporzadzil: String(opts.sporzadzil || '').trim(),
    stanowisko,
    stanowisko_suffix: stanowisko ? `, ${stanowisko}` : '',
    dotyczy,
    okres: `${miesiac} ${p.rok || ''}`.trim(),
    jrwa: p.jrwa || '',
    program: p.interwencja_nazwa || '',
    dzialanie: p.dzialanie_nazwa || '—',
    plan: String(p.planowana_liczba ?? ''),
    wykonano: String(p.wykonano ?? 0),
    powod_tytul: powod.tytul,
    powod_opis: powod.opis,
    tresc,
  };
}
