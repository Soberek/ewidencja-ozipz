/**
 * Moduł analizy i raportowania akcji „Bezpieczne Wakacje / Ferie” (JRWA 966.14)
 * Port i adaptacja z better-oz.
 */

import type { OzipzAction } from "../types/ozipz.types";
import { isVacationAction, resolveActivityFormLabel } from "./vacationReporting";

export const BEZPIECZNE_WAKACJE_JRWA = '966.14';

export function isAdultGrupa(name: string | null | undefined): boolean {
  const normalized = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return /rodzic|opiekun|kadra|nauczyciel|dorosli|senior|media|przedstawiciel|pracownik|instytucj/.test(
    normalized
  );
}

export function ageRangeLabel(
  od: number | null | undefined,
  do_: number | null | undefined
): string | null {
  const a = od == null || od === ('' as unknown) ? null : Number(od);
  const b = do_ == null || do_ === ('' as unknown) ? null : Number(do_);
  const okA = a != null && Number.isFinite(a);
  const okB = b != null && Number.isFinite(b);
  if (okA && okB) {
    if (a === b) return `${a} lat`;
    return `${Math.min(a, b)}–${Math.max(a, b)} lat`;
  }
  if (okA) return `od ${a} lat`;
  if (okB) return `do ${b} lat`;
  return null;
}

export interface ClassifyOdbiorcaResult {
  kind: 'wiek' | 'dorosli' | 'grupa';
  label: string;
}

export function classifyOdbiorcaBw(
  o: {
    grupa_nazwa?: string | null;
    audienceGroup?: string | null;
    wiek_od?: number | null;
    wiek_do?: number | null;
  } = {}
): ClassifyOdbiorcaResult {
  const grupa = String(o.grupa_nazwa || o.audienceGroup || '').trim() || 'Bez grupy';
  const ageFrom = o.wiek_od == null || o.wiek_od === ('' as unknown) ? null : Number(o.wiek_od);
  const isAdultByAge = ageFrom != null && Number.isFinite(ageFrom) && ageFrom >= 18;
  if (isAdultGrupa(grupa) || isAdultByAge) {
    return { kind: 'dorosli', label: 'Dorośli' };
  }
  const age = ageRangeLabel(o.wiek_od, o.wiek_do);
  if (age) {
    return { kind: 'wiek', label: age };
  }
  return { kind: 'grupa', label: grupa };
}

export interface BwSummaryRow {
  name?: string;
  label?: string;
  actions?: number;
  people?: number;
  zadania?: number;
  rows?: number;
  typ?: string;
  sztuki?: number;
}

export interface BezpieczneWakacjeSummary {
  jrwa: string;
  rok: number;
  months: number[];
  zadaniaCount: number;
  allActions: number;
  allPeople: number;
  allMaterialy: number;
  odbiorcySplit: {
    dorosli: number;
    zWiekiem: number;
    bezWieku: number;
  };
  byDzialanie: Array<{ name: string; actions: number; people: number; zadania: number }>;
  byGrupa: Array<{ label: string; people: number; rows: number }>;
  byWiek: Array<{ label: string; people: number; rows: number }>;
  byKategoria: Array<{ label: string; people: number; rows: number }>;
  byMaterial: Array<{ name: string; typ: string; sztuki: number }>;
  byMaterialTyp: Array<{ typ: string; sztuki: number }>;
}

export interface BwActionInput {
  id?: string;
  jrwaSign?: string | null;
  jrwaCaseId?: string | null;
  jrwa?: string | null;
  status?: string | null;
  actionType?: string | null;
  title?: string | null;
  topic?: string | null;
  dzialanie_nazwa?: string | null;
  date?: string | null;
  data?: string | null;
  numberOfActions?: number | null;
  liczba_dzialan?: number | null;
  participantsCount?: number | null;
  materialsDistributedCount?: number | null;
  audienceGroup?: string | null;
  odbiorcy?: Array<{
    grupa_nazwa?: string | null;
    liczba_osob?: number | null;
    wiek_od?: number | null;
    wiek_do?: number | null;
  }>;
  materialy?: Array<{
    material_nazwa?: string | null;
    material_typ?: string | null;
    liczba_sztuk?: number | null;
  }>;
}

function bump(map: Map<string, { label: string; people: number; rows: number }>, label: string, people: number) {
  let row = map.get(label);
  if (!row) {
    row = { label, people: 0, rows: 0 };
    map.set(label, row);
  }
  row.people += people;
  row.rows += 1;
}

export function buildBezpieczneWakacjeSummary(
  zadania: BwActionInput[] = [],
  opts: { rok: number; months: number[]; jrwa?: string }
): BezpieczneWakacjeSummary {
  const rok = Number(opts.rok);
  const months = new Set(
    (opts.months || []).map(Number).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12)
  );
  const jrwa = String(opts.jrwa || BEZPIECZNE_WAKACJE_JRWA).trim();
  if (!Number.isFinite(rok) || rok < 2000) throw new Error('Nieprawidłowy rok');
  if (!months.size) {
    return {
      jrwa,
      rok,
      months: [],
      zadaniaCount: 0,
      allActions: 0,
      allPeople: 0,
      allMaterialy: 0,
      odbiorcySplit: { dorosli: 0, zWiekiem: 0, bezWieku: 0 },
      byDzialanie: [],
      byGrupa: [],
      byWiek: [],
      byKategoria: [],
      byMaterial: [],
      byMaterialTyp: [],
    };
  }

  let zadaniaCount = 0;
  let allActions = 0;
  let allPeople = 0;
  let allMaterialy = 0;

  const byDzialanie = new Map<string, { name: string; actions: number; people: number; zadania: number }>();
  const byGrupa = new Map<string, { label: string; people: number; rows: number }>();
  const byWiek = new Map<string, { label: string; people: number; rows: number }>();
  const byKategoria = new Map<string, { label: string; people: number; rows: number }>();
  const byMaterial = new Map<string, { name: string; typ: string; sztuki: number }>();
  const byMaterialTyp = new Map<string, { typ: string; sztuki: number }>();

  let dorosliPeople = 0;
  let dzieciZWiekiem = 0;
  let dzieciBezWieku = 0;

  for (const z of zadania) {
    const rawJrwa = z.jrwa || z.jrwaSign || '';
    if (/\b(966\.\d+|9011\.\d+|0442|0444)\b/.test(rawJrwa) && !rawJrwa.includes(jrwa)) {
      continue;
    }
    const asAction: Partial<OzipzAction> = {
      ...z,
      jrwaSign: z.jrwaSign || z.jrwa || undefined,
      jrwaCaseId: z.jrwaCaseId || (rawJrwa.includes(jrwa) ? jrwa : undefined),
    } as unknown as Partial<OzipzAction>;
    if (!isVacationAction(asAction)) continue;
    if (z.status === 'robocze' || z.status === 'anulowane' || z.status === 'odroczone' || z.status === 'odwolane') continue;

    const data = String(z.date || z.data || '');
    const m = data.match(/^(\d{4})-(\d{2})/);
    if (!m) continue;
    if (Number(m[1]) !== rok) continue;
    const month = Number(m[2]);
    if (!months.has(month)) continue;

    zadaniaCount += 1;
    const actions = Math.max(0, Number(z.numberOfActions ?? z.liczba_dzialan) || 1);
    allActions += actions;

    const dzName = resolveActivityFormLabel(z);
    let dz = byDzialanie.get(dzName);
    if (!dz) {
      dz = { name: dzName, actions: 0, people: 0, zadania: 0 };
      byDzialanie.set(dzName, dz);
    }
    dz.actions += actions;
    dz.zadania += 1;

    let peopleHere = 0;
    const odbiorcyList = z.odbiorcy && z.odbiorcy.length
      ? z.odbiorcy
      : [{ grupa_nazwa: z.audienceGroup || 'Odbiorcy', liczba_osob: Number(z.participantsCount) || 0 }];

    for (const o of odbiorcyList) {
      const n = Number(o.liczba_osob) || 0;
      peopleHere += n;
      const grupa = String(o.grupa_nazwa || '').trim() || 'Bez grupy';
      bump(byGrupa, grupa, n);

      const cls = classifyOdbiorcaBw(o);
      bump(byKategoria, cls.label, n);
      if (cls.kind === 'wiek') {
        bump(byWiek, cls.label, n);
        dzieciZWiekiem += n;
      } else if (cls.kind === 'dorosli') {
        dorosliPeople += n;
      } else {
        dzieciBezWieku += n;
      }
    }
    allPeople += peopleHere;
    dz.people += peopleHere;

    const mats = z.materialy || [];
    if (!mats.length && (Number(z.materialsDistributedCount) || 0) > 0) {
      const matCount = Number(z.materialsDistributedCount);
      allMaterialy += matCount;
      const key = `ulotka|Materiały profilaktyczne`;
      let row = byMaterial.get(key);
      if (!row) {
        row = { name: 'Materiały profilaktyczne', typ: 'ulotka', sztuki: 0 };
        byMaterial.set(key, row);
      }
      row.sztuki += matCount;
      let t = byMaterialTyp.get('ulotka');
      if (!t) {
        t = { typ: 'ulotka', sztuki: 0 };
        byMaterialTyp.set('ulotka', t);
      }
      t.sztuki += matCount;
    } else {
      for (const mat of mats) {
        const sztuki = Number(mat.liczba_sztuk) || 0;
        if (sztuki <= 0) continue;
        allMaterialy += sztuki;
        const name = String(mat.material_nazwa || '—').trim() || '—';
        const typ = String(mat.material_typ || 'inne').trim() || 'inne';
        const key = `${typ}|${name}`;
        let row = byMaterial.get(key);
        if (!row) {
          row = { name, typ, sztuki: 0 };
          byMaterial.set(key, row);
        }
        row.sztuki += sztuki;

        let t = byMaterialTyp.get(typ);
        if (!t) {
          t = { typ, sztuki: 0 };
          byMaterialTyp.set(typ, t);
        }
        t.sztuki += sztuki;
      }
    }
  }

  const sortPeople = (a: { label: string; people: number }, b: { label: string; people: number }) =>
    b.people - a.people || a.label.localeCompare(b.label, 'pl');
  const sortSztuki = (a: { name: string; sztuki: number }, b: { name: string; sztuki: number }) =>
    b.sztuki - a.sztuki || a.name.localeCompare(b.name, 'pl');

  return {
    jrwa,
    rok,
    months: [...months].sort((a, b) => a - b),
    zadaniaCount,
    allActions,
    allPeople,
    allMaterialy,
    odbiorcySplit: {
      dorosli: dorosliPeople,
      zWiekiem: dzieciZWiekiem,
      bezWieku: dzieciBezWieku,
    },
    byDzialanie: [...byDzialanie.values()].sort((a, b) => b.actions - a.actions || b.people - a.people),
    byGrupa: [...byGrupa.values()].sort(sortPeople),
    byWiek: [...byWiek.values()].sort(sortPeople),
    byKategoria: [...byKategoria.values()].sort(sortPeople),
    byMaterial: [...byMaterial.values()].sort(sortSztuki),
    byMaterialTyp: [...byMaterialTyp.values()].sort((a, b) => b.sztuki - a.sztuki || a.typ.localeCompare(b.typ, 'pl')),
  };
}
