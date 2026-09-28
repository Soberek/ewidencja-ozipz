/**
 * Moduł kanonicznych typów kształcenia i narzędzi placówek oświatowych
 * Port i adaptacja z better-oz.
 */

export const TYPY_KSZTALCENIA: readonly string[] = [
  'Przedszkole',
  'Oddział przedszkolny',
  'Przedszkole specjalne',
  'Żłobek',
  'Klub dziecięcy niepubliczny',
  'Szkoła podstawowa',
  'Szkoła podstawowa specjalna',
  'Liceum',
  'Technikum',
  'Szkoła branżowa',
  'Szkoła policealna',
  'Szkoła specjalna',
  'Młodzieżowy ośrodek socjoterapii',
  'Specjalny ośrodek szkolno-wychowawczy',
];

export const CANONICAL_EDUCATION_TYPES = TYPY_KSZTALCENIA;

export interface EducationTypePreset {
  id: string;
  label: string;
  icon: string;
  types: readonly string[];
  description: string;
}

export const EDUCATION_TYPE_PRESETS: readonly EducationTypePreset[] = [
  {
    id: "preschools",
    label: "👶 Edukacja przedszkolna",
    icon: "Baby",
    types: [
      "Przedszkole",
      "Oddział przedszkolny",
      "Przedszkole specjalne",
      "Żłobek",
      "Klub dziecięcy niepubliczny",
    ],
    description: "Przedszkola, oddziały przedszkolne, żłobki i kluby dziecięce",
  },
  {
    id: "primary",
    label: "🎒 Szkoły podstawowe",
    icon: "BookOpen",
    types: [
      "Szkoła podstawowa",
      "Szkoła podstawowa specjalna",
    ],
    description: "Szkoły podstawowe ogólne i specjalne",
  },
  {
    id: "secondary",
    label: "🏫 Ponadpodstawowe",
    icon: "GraduationCap",
    types: [
      "Liceum",
      "Technikum",
      "Szkoła branżowa",
      "Szkoła policealna",
    ],
    description: "Licea, technika, szkoły branżowe i policealne",
  },
  {
    id: "special",
    label: "⭐ Placówki specjalne",
    icon: "Sparkles",
    types: [
      "Przedszkole specjalne",
      "Szkoła podstawowa specjalna",
      "Specjalny ośrodek szkolno-wychowawczy",
      "Młodzieżowy ośrodek socjoterapii",
      "Szkoła specjalna",
    ],
    description: "Ośrodki i szkoły specjalne / socjoterapeutyczne",
  },
];

const PRZEDSZKOLNE = new Set<string>([
  'Przedszkole',
  'Oddział przedszkolny',
  'Przedszkole specjalne',
  'Żłobek',
  'Klub dziecięcy niepubliczny',
]);

export function normalizeTypKey(s: string | null | undefined): string {
  return String(s || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const TYP_MAP = new Map<string, string>(
  TYPY_KSZTALCENIA.map((t) => [normalizeTypKey(t), t])
);

export function mapTypyKsztalcenia(raw: string[] | null | undefined): {
  matched: string[];
  rejected: string[];
} {
  const matched: string[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();

  for (const item of raw || []) {
    const key = normalizeTypKey(item);
    if (!key) continue;
    const canon = TYP_MAP.get(key);
    if (!canon) {
      rejected.push(String(item).trim());
      continue;
    }
    if (seen.has(canon)) continue;
    seen.add(canon);
    matched.push(canon);
  }

  return { matched, rejected };
}

export function inferLokalizacjaTyp(typy: string[] | null | undefined): 'szkoła' | 'przedszkole' {
  if (!typy?.length) return 'szkoła';
  return typy.every((t) => PRZEDSZKOLNE.has(t)) ? 'przedszkole' : 'szkoła';
}

export function collectEmails(
  rows: Array<{ email?: string | null; defaultCoordinatorEmail?: string | null; active?: boolean }>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const r of rows) {
    if (r.active === false) continue;
    const emailField = r.email || r.defaultCoordinatorEmail || '';
    const parts = String(emailField)
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter((e) => e.includes('@') && !e.startsWith('@') && !e.endsWith('@'));

    for (const e of parts) {
      const key = e.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
  }

  return out;
}

export function emailToastCount(n: number): string {
  if (n === 1) return '1 e-mail';
  if (n >= 2 && n <= 4) return `${n} e-maile`;
  return `${n} e-maili`;
}
