import type { OzipzAction, OzipzPublication } from "../../../types/ozipz.types";

/**
 * Silnik rozpoznawania, czy pobrana publikacja jest już w systemie.
 *
 * W bazie publikacje występują w dwóch postaciach:
 *  - rekordy ewidencji publikacji (ozipz_publications) – zwykle z linkiem,
 *  - działania "Publikacja media (…)" – historycznie często bez linku, z tytułem w polu tytułu
 *    albo w uwagach (gdy tytuł to np. "Publikacja media (Strona)").
 * Dlatego porównujemy linki (dokładnie), a gdy ich brak – tytuł/treść i datę (heurystycznie).
 */

export type ChannelFamily = "gov" | "x" | "fb" | "other";
export type MatchLevel = "linked" | "probable" | "possible";

export interface RegistryEntry {
  kind: "publication" | "action";
  id: string;
  title: string;
  date: string;
  channel: ChannelFamily;
  /** Działanie powiązane z publikacją (lub samo działanie). */
  actionId?: string;
  /** Rekord ewidencji publikacji (lub publikacja wskazująca na to działanie). */
  publicationId?: string;
  hasLink: boolean;
  linkKeys: string[];
  texts: { normalized: string; tokens: Set<string> }[];
}

export interface PublicationMatch {
  level: MatchLevel;
  entry: RegistryEntry;
  reason: string;
  score: number;
}

export interface MatchCandidate {
  urls: string[];
  title: string;
  /** Pełna treść (np. wpisu na X), porównywana dodatkowo z tytułem. */
  text?: string;
  date: string;
  channel: ChannelFamily;
}

const DAY_MS = 86_400_000;
const STOPWORDS = new Set([
  "oraz", "jest", "sie", "dla", "the", "and", "czy", "jak", "przez", "ich", "nas", "was", "tym", "tak", "juz",
  "sa", "ale", "lub", "po", "pod", "nad", "przy", "psse", "mysliborz", "mysliborzu", "www", "http", "https",
]);
const GENERIC_ACTION_TITLE = /^publikacja media\b/i;
const AUTO_NOTE_PREFIX = /^(automatyczn\w+ (utworzone działanie|import)[^.]*\.|uwagi:)\s*/i;

export function channelFamilyOf(value: string | undefined): ChannelFamily {
  const v = String(value || "").toLowerCase();
  if (/gov\.pl|strona|www/.test(v)) return "gov";
  if (/portal x|twitter|\(x\)|@psse|\bx\b/.test(v)) return "x";
  if (/facebook|\bfb\b/.test(v)) return "fb";
  return "other";
}

/** Klucz porównania linku: ID wpisu X, ścieżka gov.pl bez domeny "www", w pozostałych przypadkach znormalizowany URL. */
export function linkKey(raw: string | undefined): string | null {
  const text = String(raw || "").trim();
  if (!text) return null;
  const status = text.match(/(?:twitter\.com|x\.com)\/(?:[^/\s]+\/)?status(?:es)?\/(\d{6,})/i) || text.match(/^x:(\d+)$/);
  if (status) return `x:${status[1]}`;
  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, "").toLowerCase() || "/";
    const query = host === "gov.pl" ? "" : url.search;
    return `${host}${path}${query}`;
  } catch {
    return text.toLowerCase().replace(/\/+$/, "");
  }
}

export function extractUrls(text: string | undefined): string[] {
  // Skrócone linki t.co prowadzą do grafik/treści wpisu, a nie do samej publikacji – pomijamy je.
  return Array.from(String(text || "").matchAll(/https?:\/\/[^\s"'<>)\]]+/gi), (m) => m[0].replace(/[.,;:!?]+$/, "")).filter(
    (url) => !/^https?:\/\/t\.co\//i.test(url)
  );
}

export function normalizeText(text: string | undefined): string {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Tokeny porównania: słowa ≥3 znaków skrócone do 6 znaków (prosta obsługa polskiej odmiany). */
function tokensOf(normalized: string): Set<string> {
  return new Set(normalized.split(" ").filter((t) => t.length >= 3 && !STOPWORDS.has(t)).map((t) => t.slice(0, 6)));
}

function textEntry(text: string) {
  const normalized = normalizeText(text);
  return { normalized, tokens: tokensOf(normalized) };
}

function dayDiff(a: string, b: string): number {
  const da = Date.parse(`${String(a).slice(0, 10)}T00:00:00Z`);
  const db = Date.parse(`${String(b).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return Number.POSITIVE_INFINITY;
  return Math.round(Math.abs(da - db) / DAY_MS);
}

function cleanNote(notes: string | undefined): string {
  return String(notes || "")
    .replace(AUTO_NOTE_PREFIX, "")
    .replace(/\[JRWA:[^\]]*\]/gi, "")
    .replace(/Link:\s*\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Tytuł działania nie opisuje publikacji (np. "Publikacja media (Strona)", skrót "BW" albo sama nazwa programu). */
export function isGenericActionTitle(action: Pick<OzipzAction, "title" | "programName">): boolean {
  const title = action.title.trim();
  return GENERIC_ACTION_TITLE.test(title) || title.length < 4 || (Boolean(action.programName) && title === action.programName?.trim());
}

/** Czytelny tytuł publikacji zapisanej jako działanie: tytuł działania albo – gdy jest ogólnikowy – pierwsza linia uwag. */
export function actionPublicationTitle(action: Pick<OzipzAction, "title" | "programName" | "notes">): string {
  const note = cleanNote(action.notes).split("\n")[0].trim();
  return isGenericActionTitle(action) && note ? note : action.title;
}

export const isPublicationAction = (a: Pick<OzipzAction, "actionType" | "sourceInfo">) =>
  /^publikacja media/i.test(a.actionType || "") || /^publikacja media/i.test(a.sourceInfo?.split(" - ").pop() || "");

export function buildPublicationRegistry(publications: OzipzPublication[], actions: OzipzAction[]): RegistryEntry[] {
  const publicationByAction = new Map<string, OzipzPublication>();
  publications.forEach((p) => p.actionId && publicationByAction.set(p.actionId, p));
  const actionById = new Map(actions.map((a) => [a.id, a]));

  const entries: RegistryEntry[] = publications.map((p) => {
    const action = p.actionId ? actionById.get(p.actionId) : undefined;
    const links = [p.link, ...extractUrls(p.notes), ...extractUrls(action?.notes)];
    const texts = [p.title, action && !GENERIC_ACTION_TITLE.test(action.title) ? action.title : ""].filter(Boolean);
    return {
      kind: "publication",
      id: p.id,
      title: p.title,
      date: p.publicationDate,
      channel: channelFamilyOf(p.channel),
      actionId: p.actionId,
      publicationId: p.id,
      hasLink: Boolean(p.link?.trim()),
      linkKeys: links.map(linkKey).filter((k): k is string => Boolean(k)),
      texts: texts.map(textEntry),
    };
  });

  actions
    .filter(isPublicationAction)
    .forEach((a) => {
      const linkedPublication = publicationByAction.get(a.id);
      const note = cleanNote(a.notes);
      const genericTitle = isGenericActionTitle(a);
      const texts = [genericTitle ? "" : a.title, note && note.length <= 600 ? note : ""].filter(Boolean);
      entries.push({
        kind: "action",
        id: a.id,
        title: actionPublicationTitle(a),
        date: a.date,
        channel: channelFamilyOf(a.actionType + " " + (a.sourceInfo || "")),
        actionId: a.id,
        publicationId: linkedPublication?.id,
        hasLink: Boolean(linkedPublication?.link?.trim()),
        linkKeys: extractUrls(a.notes).map(linkKey).filter((k): k is string => Boolean(k)),
        texts: texts.map(textEntry),
      });
    });

  return entries;
}

function similarity(a: { normalized: string; tokens: Set<string> }, b: { normalized: string; tokens: Set<string> }) {
  if (!a.normalized || !b.normalized) return { equal: false, dice: 0, containment: 0, common: 0, minSize: 0 };
  if (a.normalized === b.normalized) return { equal: true, dice: 1, containment: 1, common: a.tokens.size, minSize: a.tokens.size };
  let common = 0;
  a.tokens.forEach((t) => b.tokens.has(t) && (common += 1));
  const minSize = Math.min(a.tokens.size, b.tokens.size);
  return {
    equal: false,
    dice: a.tokens.size + b.tokens.size ? (2 * common) / (a.tokens.size + b.tokens.size) : 0,
    containment: minSize ? common / minSize : 0,
    common,
    minSize,
  };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const daysLabel = (d: number) => (d === 0 ? "ta sama data" : `różnica ${d} dn.`);

/** Ocena tekstowa jednego wpisu rejestru; zwraca najlepsze dopasowanie albo null. */
function scoreEntry(candidate: MatchCandidate, texts: ReturnType<typeof textEntry>[], entry: RegistryEntry): PublicationMatch | null {
  const days = dayDiff(candidate.date, entry.date);
  let best: PublicationMatch | null = null;
  const consider = (level: MatchLevel, score: number, reason: string) => {
    if (!best || score > best.score) best = { level, score, reason, entry };
  };

  for (const c of texts) {
    for (const e of entry.texts) {
      const s = similarity(c, e);
      if (s.equal && days <= 45) consider("probable", 0.97 - days / 1000, `Identyczny tytuł, ${daysLabel(days)}`);
      else if (s.equal) consider("possible", 0.7, `Identyczny tytuł, ale ${daysLabel(days)}`);
      else if (s.dice >= 0.75 && days <= 10) consider("probable", 0.8 + s.dice / 10 - days / 200, `Bardzo podobny tytuł (${pct(s.dice)}), ${daysLabel(days)}`);
      else if (s.containment >= 0.8 && (s.minSize >= 3 || (s.minSize >= 2 && days === 0)) && days <= 3) consider("probable", 0.78 + s.containment / 10 - days / 100, `Tytuł zawarty w treści (${pct(s.containment)}), ${daysLabel(days)}`);
      else if (s.dice >= 0.55 && days <= 30) consider("possible", 0.5 + s.dice / 5, `Podobny tytuł (${pct(s.dice)}), ${daysLabel(days)}`);
      else if (s.containment >= 0.6 && s.minSize >= 3 && days <= 7) consider("possible", 0.45 + s.containment / 5, `Częściowo zgodna treść (${pct(s.containment)}), ${daysLabel(days)}`);
      else if (s.common >= 1 && days === 0 && candidate.channel === entry.channel) consider("possible", 0.35 + s.dice / 10, "Wpis w tym kanale z tego samego dnia o zbliżonym tytule");
    }
  }
  if (!best && days === 0 && candidate.channel === entry.channel && entry.channel !== "other" && entry.texts.length === 0) {
    consider("possible", 0.3, "Wpis w tym kanale z tego samego dnia (bez tytułu)");
  }
  return best;
}

const LEVEL_RANK: Record<MatchLevel, number> = { linked: 3, probable: 2, possible: 1 };

export function findPublicationMatch(candidate: MatchCandidate, registry: RegistryEntry[]): PublicationMatch | null {
  const keys = new Set(candidate.urls.map(linkKey).filter((k): k is string => Boolean(k)));
  const texts = [candidate.title, candidate.text || ""].filter(Boolean).map(textEntry);
  let best: PublicationMatch | null = null;

  for (const entry of registry) {
    let match: PublicationMatch | null = null;
    if (entry.linkKeys.some((k) => keys.has(k))) {
      match = { level: "linked", score: 2, reason: "Ten sam link w ewidencji", entry };
    } else if (entry.channel === candidate.channel || entry.channel === "other" || candidate.channel === "other") {
      match = scoreEntry(candidate, texts, entry);
    }
    if (!match) continue;
    // Rekord publikacji ma pierwszeństwo przed działaniem przy tej samej ocenie – to on przechowuje link.
    const better =
      !best ||
      LEVEL_RANK[match.level] > LEVEL_RANK[best.level] ||
      (LEVEL_RANK[match.level] === LEVEL_RANK[best.level] &&
        (match.score > best.score || (match.score === best.score && match.entry.kind === "publication")));
    if (better) best = match;
  }
  return best;
}

/** Jeden rekord logiczny: publikacja i jej działanie liczą się razem. */
const recordKey = (entry: RegistryEntry) => (entry.actionId ? `action:${entry.actionId}` : `publication:${entry.id}`);

/**
 * Dopasowuje wiele kandydatów naraz. Dopasowanie heurystyczne (nie po linku) jest wyłączne:
 * jeden istniejący wpis może "pokryć" tylko najlepiej pasującego kandydata, pozostali szukają dalej.
 */
export function matchPublicationCandidates(candidates: MatchCandidate[], registry: RegistryEntry[]): (PublicationMatch | null)[] {
  const results = candidates.map((c) => findPublicationMatch(c, registry));
  for (let round = 0; round < 4; round += 1) {
    const owner = new Map<string, number>();
    results.forEach((m, i) => {
      if (!m || m.level === "linked") return;
      const key = recordKey(m.entry);
      const current = owner.get(key);
      if (current === undefined || (results[current]?.score ?? 0) < m.score) owner.set(key, i);
    });
    const losers = results.flatMap((m, i) => (m && m.level !== "linked" && owner.get(recordKey(m.entry)) !== i ? [i] : []));
    if (losers.length === 0) break;
    const available = registry.filter((e) => !owner.has(recordKey(e)));
    losers.forEach((i) => (results[i] = findPublicationMatch(candidates[i], available)));
  }
  return results;
}
