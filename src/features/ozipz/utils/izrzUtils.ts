/**
 * Moduł narzędziowy IZRZ (Informacja z Realizacji Zadania)
 * Port i adaptacja z better-oz z pełnym typowaniem TypeScript Strict Mode.
 */

export type IzrzSeria = 'standard' | 'wizytacja' | 'narada';

export interface IzrzSeriaMeta {
  prefix: string | null;
  example: string;
  label: string;
}

export const IZRZ_SERIE: Record<IzrzSeria, IzrzSeriaMeta> = {
  standard: { prefix: null, example: '66/2026', label: 'numer/rok' },
  wizytacja: { prefix: 'PZ', example: 'PZ/6/2026', label: 'PZ/numer/rok' },
  narada: { prefix: 'N', example: 'N/1/2026', label: 'N/numer/rok' },
};

const POLISH_CHAR_MAP: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ż: 'z', ź: 'z',
  Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ż: 'Z', Ź: 'Z',
};

export function toAsciiSlug(input: string | null | undefined, maxLength?: number): string {
  const ascii = String(input || '')
    .replace(/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, (c) => POLISH_CHAR_MAP[c] ?? c)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (maxLength && ascii.length > maxLength) {
    return ascii.slice(0, maxLength).replace(/-$/, '');
  }
  return ascii;
}

export function isWizytacjaDzialanie(nazwa: string | null | undefined): boolean {
  return /wizytacj/i.test(nazwa || '');
}

export function isNaradaDzialanie(nazwa: string | null | undefined): boolean {
  return /^narad/i.test(String(nazwa || '').trim());
}

export function izrzSeriaForDzialanie(nazwaDzialania: string | null | undefined): IzrzSeria {
  if (isWizytacjaDzialanie(nazwaDzialania)) return 'wizytacja';
  if (isNaradaDzialanie(nazwaDzialania)) return 'narada';
  return 'standard';
}

export function normalizeIzrzSeria(seria: string | null | undefined): IzrzSeria {
  if (seria === 'wizytacja' || seria === 'narada') return seria;
  return 'standard';
}

export function parseNumerIzrz(
  raw: string | null | undefined
): { nr: number; rok: number; seria: IzrzSeria } | null {
  let s = String(raw || '').trim();
  if (!s) return null;
  s = s.replace(/^izrz[:\s]*/i, '').trim();
  if (!s) return null;

  const pref = s.match(/^([A-Za-z]+)\s*\/\s*(\d{1,5})\s*\/\s*(\d{2}|\d{4})$/);
  if (pref) {
    const code = pref[1].toUpperCase();
    const nr = Number(pref[2]);
    let rok = Number(pref[3]);
    if (!Number.isFinite(nr) || nr < 1) return null;
    if (pref[3].length === 2) rok = 2000 + rok;
    if (!Number.isFinite(rok) || rok < 1000 || rok > 9999) return null;
    if (code === 'PZ') return { nr, rok, seria: 'wizytacja' };
    if (code === 'N') return { nr, rok, seria: 'narada' };
    return null;
  }

  const m = s.match(/^(\d{1,5})\s*\/\s*(\d{2}|\d{4})$/);
  if (!m) return null;
  const nr = Number(m[1]);
  let rok = Number(m[2]);
  if (!Number.isFinite(nr) || nr < 1) return null;
  if (m[2].length === 2) rok = 2000 + rok;
  if (!Number.isFinite(rok) || rok < 1000 || rok > 9999) return null;
  return { nr, rok, seria: 'standard' };
}

export function formatNumerIzrz(parts: { nr: number; rok: number; seria?: IzrzSeria }): string {
  const n = Number(parts.nr);
  const r = Number(parts.rok);
  const s = normalizeIzrzSeria(parts.seria);
  if (!Number.isFinite(n) || n < 1 || !Number.isFinite(r) || r < 1000 || r > 9999) {
    throw new Error('Niepełne dane numeru IZRZ');
  }
  const meta = IZRZ_SERIE[s];
  if (meta.prefix) return `${meta.prefix}/${n}/${r}`;
  return `${n}/${r}`;
}

export function izrzSeriaUi(seria: IzrzSeria): { placeholder: string; title: string; want: string } {
  const s = normalizeIzrzSeria(seria);
  const meta = IZRZ_SERIE[s];
  return {
    placeholder: `np. ${meta.example}`,
    title: `${meta.label} (np. ${meta.example})`,
    want: `${meta.label}, np. ${meta.example}`,
  };
}

export function normalizeNumerIzrz(
  raw: string | null | undefined,
  opts: { seria?: IzrzSeria } = {}
): string | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  const wantSeria = opts.seria ? normalizeIzrzSeria(opts.seria) : null;
  const parsed = parseNumerIzrz(s);
  if (!parsed) {
    throw new Error(`Numer IZRZ musi być w formacie ${izrzSeriaUi(wantSeria || 'standard').want}`);
  }
  if (wantSeria && parsed.seria !== wantSeria) {
    throw new Error(`Numer IZRZ musi być w formacie ${izrzSeriaUi(wantSeria).want}`);
  }
  return formatNumerIzrz(parsed);
}

export {
  MUNICIPALITY_POSTAL_CONFIG,
  getPostalDetailsForMunicipality,
  extractLocalityFromFacilityName,
  formatAdresIzrz,
} from "./izrzAddressUtils";

export function shortDzialanieLabel(nazwa: string | null | undefined): string {
  const s = String(nazwa || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s || 'Działanie';
}

export function isPolkolonieGrupa(grupa: string | null | undefined): boolean {
  return /p[oó]łkolon/i.test(String(grupa || ''));
}

export function shortGrupaLabel(grupa: string, opts: { hasKlasy?: boolean } = {}): string {
  const g = String(grupa || '').trim();
  if (!g) return '';
  if (isPolkolonieGrupa(g)) return g;
  if (opts.hasKlasy && /uczniowie/i.test(g)) return 'Uczniowie';
  if (/kadra pedagogiczna/i.test(g)) return 'Nauczyciele';
  if (/rodzice\s*\/\s*opiekunowie/i.test(g)) return 'Rodzice';
  return g;
}

export function parseKlasyList(raw: string | null | undefined): string[] {
  let s = String(raw || '').trim();
  if (!s) return [];
  s = s.replace(/^(klas[ay]|kl\.?)\s*/i, '').trim();
  return s.split(/[,;/|]+/).map((x) => x.trim()).filter(Boolean);
}

export function formatWiekShort(od: number | null | undefined, do_: number | null | undefined): string {
  const a = od == null || od === ('' as unknown) ? null : Number(od);
  const b = do_ == null || do_ === ('' as unknown) ? null : Number(do_);
  const okA = a != null && Number.isFinite(a);
  const okB = b != null && Number.isFinite(b);
  if (okA && okB) {
    if (a === b) return `${a} lat`;
    return `${a}–${b} lat`;
  }
  if (okA) return `od ${a} lat`;
  if (okB) return `do ${b} lat`;
  return '';
}

export function formatOdbiorcaLine(o: {
  grupa_nazwa?: string | null;
  klasy?: string | null;
  wiek_od?: number | null;
  wiek_do?: number | null;
  liczba_osob?: number | null;
} = {}): string {
  const n = Number(o.liczba_osob) || 0;
  const grupa = String(o.grupa_nazwa || '').trim();
  const klasy = parseKlasyList(o.klasy);
  const wiek = formatWiekShort(o.wiek_od, o.wiek_do);
  const polkol = isPolkolonieGrupa(grupa);

  let label: string;
  if (polkol) {
    label = grupa || 'Uczestnicy półkolonii';
    if (wiek) label = `${label} (${wiek})`;
  } else if (klasy.length) {
    const short = shortGrupaLabel(grupa, { hasKlasy: true }) || 'Uczniowie';
    label = `${short} klasy ${klasy.join(', ')}`;
  } else {
    const short = shortGrupaLabel(grupa, { hasKlasy: false }) || grupa || 'Odbiorcy';
    label = short;
    if (wiek) label = `${label} (${wiek})`;
  }

  return `${label} - ${n}`;
}

export interface ParticipantItem {
  nr_dzialania?: number | null;
  grupa_nazwa?: string | null;
  liczba_osob?: number | null;
  klasy?: string | null;
  wiek_od?: number | null;
  wiek_do?: number | null;
}

export function buildLiczbaOsobOpis(
  odbiorcy: ParticipantItem[] = [],
  opts: { dzialanieNazwa?: string | null; liczbaDzialan?: number | null } = {}
): string {
  const label = shortDzialanieLabel(opts.dzialanieNazwa);
  const declared = Math.max(1, Number(opts.liczbaDzialan) || 1);

  const byNr = new Map<
    number,
    Map<
      string,
      {
        grupa_nazwa: string;
        klasy: string[];
        wiek_od: number | null;
        wiek_do: number | null;
        liczba_osob: number;
      }
    >
  >();

  for (const o of odbiorcy || []) {
    const grupa = String(o.grupa_nazwa || '').trim();
    const klasyRaw = String(o.klasy || '').trim();
    const wiekOd = o.wiek_od == null || o.wiek_od === ('' as unknown) ? null : Number(o.wiek_od);
    const wiekDo = o.wiek_do == null || o.wiek_do === ('' as unknown) ? null : Number(o.wiek_do);
    const liczba = Number(o.liczba_osob) || 0;
    if (!grupa && !klasyRaw && wiekOd == null && wiekDo == null && liczba <= 0) continue;

    const nr = Math.max(1, Number(o.nr_dzialania) || 1);
    if (!byNr.has(nr)) byNr.set(nr, new Map());
    const bucketMap = byNr.get(nr)!;

    const wiekKey = `${Number.isFinite(wiekOd) ? wiekOd : ''}:${Number.isFinite(wiekDo) ? wiekDo : ''}`;
    const key = `${grupa.toLocaleLowerCase('pl')}|${wiekKey}`;
    let row = bucketMap.get(key);
    if (!row) {
      row = {
        grupa_nazwa: grupa,
        klasy: [],
        wiek_od: Number.isFinite(wiekOd) ? wiekOd : null,
        wiek_do: Number.isFinite(wiekDo) ? wiekDo : null,
        liczba_osob: 0,
      };
      bucketMap.set(key, row);
    }
    row.liczba_osob += liczba;
    for (const k of parseKlasyList(klasyRaw)) {
      if (!row.klasy.includes(k)) row.klasy.push(k);
    }
  }

  const nrs = [...byNr.keys()].sort((a, b) => a - b);
  const maxNr = nrs.length ? Math.max(...nrs, declared) : declared;
  const showHeaders = maxNr > 1;

  const blocks: string[] = [];
  const nums = showHeaders
    ? Array.from({ length: maxNr }, (_, i) => i + 1).filter((nr) => byNr.has(nr))
    : nrs.length
    ? nrs
    : [];

  if (!nums.length && !showHeaders) {
    return '';
  }

  for (const nr of nums.length ? nums : [1]) {
    const rows = byNr.get(nr);
    if (!rows || !rows.size) continue;
    const lines: string[] = [];
    if (showHeaders) lines.push(`${label} ${nr}:`);
    for (const r of rows.values()) {
      lines.push(
        formatOdbiorcaLine({
          grupa_nazwa: r.grupa_nazwa,
          klasy: r.klasy.join(', '),
          wiek_od: r.wiek_od,
          wiek_do: r.wiek_do,
          liczba_osob: r.liczba_osob,
        })
      );
    }
    blocks.push(lines.join('\n'));
  }

  return blocks.join('\n');
}

export function buildIzrzFileName(
  data: {
    numer_izrz?: string;
    miasto?: string;
    nazwa_programu?: string;
    data?: string;
  },
  isoDate?: string
): string {
  const dateIso =
    String(isoDate || '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] ||
    String(data.data || '').split('.').reverse().join('-');
  const segments = [
    'IZRZ',
    toAsciiSlug(data.numer_izrz),
    dateIso,
    toAsciiSlug(data.miasto),
    toAsciiSlug(data.nazwa_programu, 40),
  ].filter((s) => s && s.length > 0);
  return segments.join('_') || 'IZRZ';
}
