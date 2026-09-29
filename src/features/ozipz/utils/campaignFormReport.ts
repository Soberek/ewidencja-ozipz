import type { ActionBreakdown, ActionBreakdownEntry } from "./actionBreakdown";

/**
 * Zestawienie rozpiski akcji w układzie formularza sprawozdania z kampanii
 * (wzór „Nie odbieraj sobie głosu”: pozycje 3–39). Zwraca tylko pozycje, dla których są działania.
 */

export type CampaignFormCategory =
  | "wyklady"
  | "konferencje"
  | "plenerowe"
  | "konkursy"
  | "konsultacje"
  | "wystawy"
  | "dystrybucja"
  | "szkolenia"
  | "www"
  | "media"
  | "social"
  | "wywiady"
  | "inne";

export interface CampaignFormItem {
  no: number;
  label: string;
  value: string;
  /** Wyjaśnienie, skąd liczba (pokazywane pod pozycją, bez kopiowania). */
  hint?: string;
}

export interface CampaignFormSection {
  category: CampaignFormCategory;
  title: string;
  /** Formy działań z ewidencji, które złożyły się na sekcję, np. „Prelekcja (warsztat) ×8”. */
  sources: string[];
  items: CampaignFormItem[];
}

// „ł” nie rozkłada się w NFD, więc zamieniamy je osobno.
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pl-PL").replace(/ł/g, "l");

// Kolejność ma znaczenie: pierwsze trafienie wygrywa (np. „Publikacja media (Portal X)” to social media, nie WWW).
const FORM_RULES: readonly [CampaignFormCategory, RegExp][] = [
  ["wywiady", /wywiad/],
  ["social", /facebook|portal x|twitter|instagram|tiktok|youtube|social|post\b/],
  ["www", /strona|www|internet/],
  ["media", /prasow|komunikat|prasa|radio|telewiz|publikacja w mediach|media/],
  ["konferencje", /konferencj/],
  ["szkolenia", /szkoleni|webinar|narad/],
  ["konkursy", /konkurs|quiz|olimpiad|turniej/],
  ["wystawy", /wystaw|ekspozycj|gazetk/],
  ["konsultacje", /rozmowa indywidualna|instruktaz|konsultacj|porad/],
  ["plenerowe", /happening|piknik|festyn|plener|stoisko|event|przemarsz|marsz|dni otwarte|dzien otwarty/],
  ["wyklady", /wyklad|prelekcj|pogadank|zajeci|lekcj|warsztat|prezentacj/],
  ["dystrybucja", /dystrybucj|rozdzielnik|kolportaz/],
];

/**
 * Kategoria formularza wynika wyłącznie z formy działania. Tytuł nie decyduje:
 * pismo (list intencyjny) zapraszające na webinar to nadal pismo, nie szkolenie.
 */
export function classifyCampaignFormCategory(entry: Pick<ActionBreakdownEntry, "form">): CampaignFormCategory {
  const form = normalize(entry.form);
  for (const [category, re] of FORM_RULES) if (re.test(form)) return category;
  return "inne";
}

/**
 * Nazwy grup odbiorców z pola „Grupa odbiorców”, np.
 * „Grupa 1: Uczniowie - 22, Rodzice - 1\nGrupa 2: Uczniowie - 21” → Uczniowie (43), Rodzice (1).
 */
export function summarizeAudienceGroups(texts: readonly string[], { withCounts = true } = {}): string {
  const groups = new Map<string, { label: string; count: number | null }>();
  for (const text of texts) {
    const pieces = text
      .split(/\n|;/)
      // Nowa grupa zaczyna się wielką literą: „…- 22, Rodzice - 1” albo „…- 95 Pracownicy - 5”.
      .flatMap((line) => line.split(/,\s*(?=\p{Lu})|(?<=\d)\s+(?=\p{Lu})/u))
      .map((piece) => piece.replace(/^\s*grupa\s+[\dIVXLC]+\s*[:.)-]?\s*/i, "").trim());
    for (const piece of pieces) {
      const match = piece.match(/^(.*?)\s*[-–:]\s*(\d+)\s*$/);
      const label = (match ? match[1] : piece).trim();
      if (!label) continue;
      const key = normalize(label);
      const current = groups.get(key) ?? { label, count: null };
      if (match) current.count = (current.count ?? 0) + Number(match[2]);
      groups.set(key, current);
    }
  }
  return Array.from(groups.values())
    .sort((a, b) => (b.count ?? -1) - (a.count ?? -1) || a.label.localeCompare(b.label, "pl"))
    .map((g) => (withCounts && g.count !== null ? `${g.label} (${g.count.toLocaleString("pl-PL")})` : g.label))
    .join(", ");
}

const n = (value: number) => value.toLocaleString("pl-PL");

function countForms(entries: readonly ActionBreakdownEntry[]): string[] {
  const forms = new Map<string, number>();
  for (const e of entries) forms.set(e.form, (forms.get(e.form) ?? 0) + e.actions);
  return Array.from(forms, ([form, count]) => `${form} ×${n(count)}`);
}

const sum = (entries: readonly ActionBreakdownEntry[], key: "actions" | "recipients" | "materials") =>
  entries.reduce((s, e) => s + e[key], 0);

interface StandardSpec {
  category: CampaignFormCategory;
  title: string;
  count: [number, string];
  recipients?: [number, string];
  groups?: [number, string];
}

const STANDARD_SECTIONS: readonly StandardSpec[] = [
  { category: "wyklady", title: "Wykłady", count: [3, "Łączna liczba wykładów / zajęć edukacyjnych"], recipients: [4, "Łączna liczba odbiorców wykładów / zajęć edukacyjnych"], groups: [5, "Grupy odbiorców działań"] },
  { category: "konferencje", title: "Konferencje", count: [6, "Liczba zorganizowanych konferencji"], recipients: [7, "Szacunkowa liczba uczestników konferencji"], groups: [8, "Grupy odbiorców działań"] },
  { category: "plenerowe", title: "Imprezy plenerowe", count: [9, "Liczba wydarzeń plenerowych"], recipients: [10, "Szacunkowa liczba uczestników wydarzeń plenerowych"], groups: [11, "Grupy odbiorców działań"] },
  { category: "konkursy", title: "Konkursy", count: [12, "Liczba zorganizowanych konkursów"], recipients: [13, "Liczba uczestników konkursów"], groups: [14, "Grupy odbiorców działań"] },
  { category: "konsultacje", title: "Konsultacje", count: [15, "Liczba przeprowadzonych konsultacji / instruktaży indywidualnych"], recipients: [16, "Liczba odbiorców konsultacji / instruktaży indywidualnych"], groups: [17, "Grupy odbiorców działań"] },
  { category: "wystawy", title: "Wystawy", count: [18, "Liczba zorganizowanych wystaw tematycznych"], recipients: [19, "Szacunkowa liczba odbiorców wystaw"], groups: [20, "Grupy odbiorców działań"] },
  { category: "szkolenia", title: "Szkolenia", count: [26, "Liczba przeprowadzonych szkoleń"], recipients: [27, "Liczba uczestników szkoleń"], groups: [28, "Rodzaj uczestników szkoleń"] },
  { category: "www", title: "WWW", count: [29, "Liczba publikacji na stronach internetowych"], groups: [30, "Główne grupy odbiorców publikacji"] },
  { category: "media", title: "Media", count: [31, "Liczba informacji prasowych przekazanych do mediów"], groups: [32, "Główne grupy odbiorców przekazów medialnych"] },
  { category: "social", title: "Social media", count: [33, "Liczba opublikowanych postów"] },
  { category: "wywiady", title: "Wywiady", count: [35, "Liczba udzielonych wywiadów (radio / TV / prasa / internet)"] },
];

function standardSection(spec: StandardSpec, entries: readonly ActionBreakdownEntry[]): CampaignFormSection {
  const items: CampaignFormItem[] = [{ no: spec.count[0], label: spec.count[1], value: n(sum(entries, "actions")) }];
  if (spec.recipients) items.push({ no: spec.recipients[0], label: spec.recipients[1], value: n(sum(entries, "recipients")) });
  if (spec.groups) {
    const groups = summarizeAudienceGroups(entries.map((e) => e.audience));
    if (groups) items.push({ no: spec.groups[0], label: spec.groups[1], value: groups });
  }
  return { category: spec.category, title: spec.title, sources: countForms(entries), items };
}

export function buildCampaignFormReport(breakdown: ActionBreakdown): CampaignFormSection[] {
  const byCategory = new Map<CampaignFormCategory, ActionBreakdownEntry[]>();
  for (const entry of breakdown.entries) {
    const category = classifyCampaignFormCategory(entry);
    byCategory.set(category, [...(byCategory.get(category) ?? []), entry]);
  }

  const sections: CampaignFormSection[] = [];
  const push = (spec: StandardSpec) => {
    const entries = byCategory.get(spec.category);
    if (entries?.length) sections.push(standardSection(spec, entries));
  };

  STANDARD_SECTIONS.slice(0, 6).forEach(push);

  // Materiały wydane w ramach dowolnego działania (dystrybucja, stoisko, prelekcja…).
  const withMaterials = breakdown.entries.filter((e) => e.materials > 0 || classifyCampaignFormCategory(e) === "dystrybucja");
  if (withMaterials.length) {
    const byType = new Map<string, number>();
    for (const m of breakdown.materials) {
      const type = m.type || "inne";
      byType.set(type, (byType.get(type) ?? 0) + m.quantity);
    }
    const types = Array.from(byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, qty]) => `${type} (${n(qty)} szt.)`)
      .join(", ");
    const points = new Set(withMaterials.map((e) => e.facility || e.id)).size;
    const pieces = sum(withMaterials, "materials");
    const items: CampaignFormItem[] = [
      { no: 22, label: "Liczba punktów dystrybucji materiałów", value: n(points), hint: "placówki, w których wydano materiały" },
    ];
    if (types) {
      items.push({
        no: 23,
        label: "Rodzaj dystrybuowanych materiałów",
        value: types,
        hint: breakdown.materials.map((m) => `${m.title} – ${n(m.quantity)} szt.`).join("; "),
      });
    }
    if (pieces > 0) {
      items.push({ no: 24, label: "Szacunkowa liczba odbiorców materiałów", value: n(pieces), hint: "1 egzemplarz ≈ 1 odbiorca" });
    }
    // Przy dystrybucji liczba w grupie to placówka-odbiorca, nie osoby — pokazujemy same nazwy grup.
    const groups = summarizeAudienceGroups(withMaterials.map((e) => e.audience), { withCounts: false });
    if (groups) items.push({ no: 25, label: "Grupy odbiorców materiałów", value: groups });
    sections.push({ category: "dystrybucja", title: "Materiały – dystrybucja", sources: countForms(withMaterials), items });
  }

  STANDARD_SECTIONS.slice(6).forEach(push);

  const other = byCategory.get("inne") ?? [];
  if (other.length) {
    const descriptions = new Map<string, number>();
    for (const e of other) {
      const key = e.title ? `${e.form} – ${e.title}` : e.form;
      descriptions.set(key, (descriptions.get(key) ?? 0) + e.actions);
    }
    const items: CampaignFormItem[] = [
      {
        no: 36,
        label: "Opis innych działań",
        value: Array.from(descriptions, ([d, c]) => (c > 1 ? `${d} (${n(c)})` : d)).join("; "),
      },
      { no: 37, label: "Liczba innych działań", value: n(sum(other, "actions")) },
      { no: 38, label: "Szacunkowa liczba odbiorców innych działań", value: n(sum(other, "recipients")) },
    ];
    const groups = summarizeAudienceGroups(other.map((e) => e.audience));
    if (groups) items.push({ no: 39, label: "Rodzaje odbiorców innych działań", value: groups });
    sections.push({ category: "inne", title: "Inne działania", sources: countForms(other), items });
  }

  return sections;
}

/** Tekst do schowka: tylko numer, pozycja i wartość. */
export function formatCampaignFormText(sections: readonly CampaignFormSection[], heading: string): string {
  const lines = [heading, ""];
  for (const section of sections) {
    for (const item of section.items) lines.push(`${item.no}. [${section.title.toUpperCase()}] ${item.label}: ${item.value}`);
  }
  return lines.join("\n");
}
