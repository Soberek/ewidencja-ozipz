import type { OzipzProgram, OzipzDictionaryItem } from "../../../types/ozipz.types";
import { getTodayIsoDate } from "../../../utils/dateUtils";
import { matchTopicAndJrwa } from "./topicMatcher";
import { fetchSourcePage } from "./webFetch";
import type { ScrapedPublication } from "./importTypes";

export const X_PROFILE_HANDLE = "PSSEMysliborz";
export const X_PROFILE_URL = `https://x.com/${X_PROFILE_HANDLE}`;
export const TWITTER_SNOWFLAKE_EPOCH = 1288834974657n; // 2010-11-04T01:42:54.657Z
const TIMELINE_URL = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${X_PROFILE_HANDLE}?showReplies=false&lang=pl`;
const TITLE_MAX = 140;

export const xStatusUrl = (id: string) => `${X_PROFILE_URL}/status/${id}`;

/** Wylicza datę publikacji wpisu (YYYY-MM-DD, czas lokalny) z identyfikatora Snowflake */
export function dateFromTweetId(tweetIdStr: string): string {
  try {
    const raw = String(tweetIdStr || "").trim().match(/\d+/)?.[0];
    if (!raw) return getTodayIsoDate();
    const date = new Date(Number((BigInt(raw) >> 22n) + TWITTER_SNOWFLAKE_EPOCH));
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 2010 || date.getFullYear() > 2050) return getTodayIsoDate();
    return getTodayIsoDate(date);
  } catch {
    return getTodayIsoDate();
  }
}

/** Wyciąga identyfikatory wpisów z wklejonych linków x.com / twitter.com albo samych numerów */
export function extractTweetIds(input: string): string[] {
  const ids = new Set<string>();
  for (const m of String(input || "").matchAll(/(?:(?:x|twitter)\.com\/[^/\s]+\/status(?:es)?\/)?(\d{15,20})/gi)) ids.add(m[1]);
  return Array.from(ids);
}

/** Czyści treść wpisu z linków i emoji */
export function cleanTweetText(raw: string): string {
  return String(raw || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/** Krótki, czytelny tytuł: pierwsze zdanie wpisu bez końcowych hashtagów */
export function tweetTitle(raw: string): string {
  const text = cleanTweetText(raw).replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const sentence = text.match(/^.{12,}?[.!?](?=\s|$)/u)?.[0] ?? text;
  if (sentence.length <= TITLE_MAX) return sentence.trim();
  const cut = sentence.slice(0, TITLE_MAX);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 60 ? cut.lastIndexOf(" ") : TITLE_MAX).trim()}…`;
}

interface RawTweet {
  id_str: string;
  full_text?: string;
  text?: string;
  created_at?: string;
  user?: { screen_name?: string };
  retweeted_status?: unknown;
  note_tweet?: { note_tweet_results?: { result?: { text?: string } } };
}

function isRawTweet(value: unknown): value is RawTweet {
  const v = value as RawTweet;
  return Boolean(v && typeof v === "object" && typeof v.id_str === "string" && /^\d+$/.test(v.id_str) && (typeof v.full_text === "string" || typeof v.text === "string"));
}

function collectTweets(node: unknown, out: RawTweet[], depth = 0): void {
  if (!node || typeof node !== "object" || depth > 40) return;
  if (isRawTweet(node)) out.push(node);
  for (const value of Object.values(node as Record<string, unknown>)) collectTweets(value, out, depth + 1);
}

function tweetDate(tweet: RawTweet): string {
  const parsed = tweet.created_at ? new Date(tweet.created_at) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? getTodayIsoDate(parsed) : dateFromTweetId(tweet.id_str);
}

function toPublication(tweet: RawTweet, programs: OzipzProgram[], jrwaSymbols: OzipzDictionaryItem[]): ScrapedPublication {
  const content = tweet.note_tweet?.note_tweet_results?.result?.text || tweet.full_text || tweet.text || "";
  const text = cleanTweetText(content);
  const title = tweetTitle(content) || `Wpis na X z ${tweetDate(tweet)}`;
  const url = xStatusUrl(tweet.id_str);
  return {
    key: `x:${tweet.id_str}`,
    source: "x",
    date: tweetDate(tweet),
    title,
    text,
    url,
    finalUrl: url,
    external: false,
    ...matchTopicAndJrwa(text, programs, jrwaSymbols),
  };
}

const ownTweet = (t: RawTweet) =>
  !t.retweeted_status &&
  !/^RT @/.test(t.full_text || t.text || "") &&
  (!t.user?.screen_name || t.user.screen_name.toLowerCase() === X_PROFILE_HANDLE.toLowerCase());

/** Parsuje stronę osi czasu profilu (syndication) – dane wpisów są w JSON __NEXT_DATA__ */
export function parseXTimelineHtml(
  html: string,
  programs: OzipzProgram[] = [],
  jrwaSymbols: OzipzDictionaryItem[] = []
): ScrapedPublication[] {
  const json = String(html || "").match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!json) return [];
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  const tweets: RawTweet[] = [];
  collectTweets(data, tweets);
  const byId = new Map<string, ScrapedPublication>();
  tweets.filter(ownTweet).forEach((t) => byId.has(t.id_str) || byId.set(t.id_str, toPublication(t, programs, jrwaSymbols)));
  return Array.from(byId.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/** Pobiera najnowsze wpisy z profilu @PSSEMysliborz */
export async function fetchXTimeline(programs: OzipzProgram[] = [], jrwaSymbols: OzipzDictionaryItem[] = []): Promise<ScrapedPublication[]> {
  const res = await fetchSourcePage(TIMELINE_URL);
  if (res.status === 429) {
    throw new Error("Serwis X chwilowo ogranicza liczbę zapytań (429). Spróbuj za kilka minut albo wklej linki do wpisów.");
  }
  if (res.status >= 400) throw new Error(`Serwis X odrzucił zapytanie (HTTP ${res.status}). Wklej linki do wpisów ręcznie.`);
  const posts = parseXTimelineHtml(res.body, programs, jrwaSymbols);
  if (posts.length === 0) throw new Error("Nie odczytano wpisów z osi czasu X. Wklej linki do wpisów ręcznie.");
  return posts;
}

/** Token wymagany przez publiczny endpoint osadzania wpisów (jak w bibliotece react-tweet) */
export const tweetResultToken = (id: string) => ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");

/** Pobiera pojedynczy wpis po identyfikatorze; gdy X nie odpowie – zwraca wpis z datą wyliczoną z ID */
export async function fetchXPostById(id: string, programs: OzipzProgram[] = [], jrwaSymbols: OzipzDictionaryItem[] = []): Promise<ScrapedPublication> {
  try {
    const res = await fetchSourcePage(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${tweetResultToken(id)}&lang=pl`);
    if (res.status < 400 && res.body.trim()) {
      const tweet: unknown = JSON.parse(res.body);
      if (isRawTweet(tweet)) return toPublication(tweet, programs, jrwaSymbols);
    }
  } catch {
    // Poniżej: wpis bez treści – użytkownik uzupełni tytuł.
  }
  const url = xStatusUrl(id);
  return {
    key: `x:${id}`,
    source: "x",
    date: dateFromTweetId(id),
    title: "",
    url,
    finalUrl: url,
    external: false,
    unverified: true,
    ...matchTopicAndJrwa("", programs, jrwaSymbols),
  };
}
