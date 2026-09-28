import { isValid, parse } from "date-fns";
import type { OzipzProgram, OzipzDictionaryItem } from "../../../types/ozipz.types";
import { getTodayIsoDate } from "../../../utils/dateUtils";
import { linkKey } from "../matching/publicationMatcher";
import { matchTopicAndJrwa } from "./topicMatcher";
import { fetchSourcePage } from "./webFetch";
import type { ScrapedPublication } from "./importTypes";

export const GOV_ORIGIN = "https://www.gov.pl";
export const PSSE_PATH_PREFIX = "/web/psse-mysliborz/";
export const GOV_AKTUALNOSCI_BASE = `${GOV_ORIGIN}${PSSE_PATH_PREFIX}aktualnosci2`;
export const GOV_PAGE_SIZE = 10;
const REDIRECT_CONCURRENCY = 4;

/** Parsuje datę z formatu DD.MM.YYYY do YYYY-MM-DD */
export function parseGovDate(raw: string): string | null {
  const m = String(raw || "").trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m || !isValid(parse(m[0], "d.M.yyyy", new Date()))) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** Zamienia relatywny URL z gov.pl na absolutny */
export function absolutizeGovUrl(href: string): string {
  const h = String(href || "").trim();
  if (!h) return "";
  if (/^https?:\/\//i.test(h)) return h;
  return h.startsWith("/") ? `${GOV_ORIGIN}${h}` : `${GOV_ORIGIN}/${h}`;
}

/** Sprawdza, czy URL prowadzi do podstrony PSSE Myślibórz na gov.pl */
export function isPsseMysliborzUrl(url: string): boolean {
  try {
    const u = new URL(String(url || "").trim());
    return u.hostname.replace(/^www\./i, "").toLowerCase() === "gov.pl" && u.pathname.startsWith(PSSE_PATH_PREFIX);
  } catch {
    return false;
  }
}

const HTML_ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", bdquo: "„", rdquo: "”", ndash: "–", mdash: "—" };

export function decodeHtmlText(raw: string): string {
  return String(raw || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => HTML_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

export interface GovPageParseResult {
  items: ScrapedPublication[];
  totalPages: number | null;
}

/** Parsuje kod HTML strony aktualności gov.pl */
export function parseGovAktualnosciHtml(
  html: string,
  programs: OzipzProgram[] = [],
  jrwaSymbols: OzipzDictionaryItem[] = []
): GovPageParseResult {
  const text = String(html || "");
  const items: ScrapedPublication[] = [];
  const seen = new Set<string>();

  for (const [chunk] of text.matchAll(/<li[\s>][\s\S]*?<\/li>/gi)) {
    if (!/class=["']title["']/i.test(chunk)) continue;
    const linkM = chunk.match(/class=["']title["'][\s\S]*?<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkM) continue;
    const url = absolutizeGovUrl(decodeHtmlText(linkM[1]));
    const title = decodeHtmlText(linkM[2]);
    const key = linkKey(url);
    if (!title || !url || !key || seen.has(key)) continue;
    seen.add(key);

    const rawDate = chunk.match(/class=["']date["'][^>]*>\s*([\d.]+)\s*</i)?.[1] || "";
    const external = !isPsseMysliborzUrl(url);
    items.push({
      key,
      source: "gov",
      date: parseGovDate(rawDate) || getTodayIsoDate(),
      title,
      url,
      finalUrl: url,
      external,
      unverified: !external,
      ...matchTopicAndJrwa(title, programs, jrwaSymbols),
    });
  }

  const total = text.match(/id=["']js-pagination-pages-count["'][^>]*>\s*(\d+)\s*</i)?.[1]
    ?? text.match(/class=["']pagination__total-count["'][\s\S]*?>\s*(\d+)\s*</i)?.[1];
  return { items, totalPages: total ? Number(total) : null };
}

/**
 * Sprawdza, dokąd prowadzi wpis. Portal gov.pl wyświetla w aktualnościach PSSE również
 * artykuły GIS/WSSE – ich adres /web/psse-mysliborz/… przekierowuje na stronę innej jednostki.
 */
export async function resolveGovRedirect(item: ScrapedPublication): Promise<ScrapedPublication> {
  if (item.external) return { ...item, unverified: false };
  try {
    const { finalUrl } = await fetchSourcePage(item.url, { headOnly: true });
    const target = finalUrl || item.url;
    return { ...item, finalUrl: target, external: !isPsseMysliborzUrl(target), unverified: false };
  } catch {
    return { ...item, unverified: true };
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return out;
}

export async function fetchGovAktualnosciPage(
  page: number,
  programs: OzipzProgram[] = [],
  jrwaSymbols: OzipzDictionaryItem[] = []
): Promise<{ items: ScrapedPublication[]; hasMore: boolean; totalPages: number | null }> {
  const targetUrl = `${GOV_AKTUALNOSCI_BASE}?page=${page}&size=${GOV_PAGE_SIZE}`;
  let html: string;
  try {
    const res = await fetchSourcePage(targetUrl);
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    html = res.body;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Nie udało się pobrać aktualności PSSE Myślibórz z gov.pl (${detail}).`);
  }

  const parsed = parseGovAktualnosciHtml(html, programs, jrwaSymbols);
  const items = await mapPool(parsed.items, REDIRECT_CONCURRENCY, resolveGovRedirect);
  const hasMore = parsed.totalPages != null ? page < parsed.totalPages : items.length >= GOV_PAGE_SIZE;
  return { items, hasMore, totalPages: parsed.totalPages };
}
