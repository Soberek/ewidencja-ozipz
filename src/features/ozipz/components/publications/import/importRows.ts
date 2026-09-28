import type { ScrapedPublication } from "../sources/importTypes";
import {
  matchPublicationCandidates,
  type PublicationMatch,
  type RegistryEntry,
} from "../matching/publicationMatcher";

/**
 * Status wiersza importu:
 *  - new       – brak w systemie, domyślnie zaznaczony,
 *  - possible  – jest podobny wpis (słaba przesłanka) – do decyzji użytkownika,
 *  - probable  – prawie na pewno już zaewidencjonowany (tytuł + data), ale bez linku,
 *  - linked    – ten sam link jest już w ewidencji – import zablokowany,
 *  - external  – artykuł innej jednostki (przekierowanie GIS/WSSE) – nie jest publikacją PSSE,
 *  - skipped   – ręcznie pominięty przez użytkownika.
 */
export type ImportRowStatus = "new" | "possible" | "probable" | "linked" | "external" | "skipped";

export interface ImportRow extends ScrapedPublication {
  customTopic: string;
  customJrwa: string;
}

export interface EvaluatedRow extends ImportRow {
  status: ImportRowStatus;
  match: PublicationMatch | null;
  selectable: boolean;
  selected: boolean;
}

export const SELECTABLE_STATUSES: ReadonlySet<ImportRowStatus> = new Set(["new", "possible", "probable"]);

export function toImportRow(item: ScrapedPublication): ImportRow {
  return {
    ...item,
    customTopic: item.topic,
    customJrwa: item.suggestedJrwa || "9011",
  };
}

export function evaluateImportRows(
  rows: ImportRow[],
  registry: RegistryEntry[],
  skipped: ReadonlySet<string>,
  selection: ReadonlyMap<string, boolean>
): EvaluatedRow[] {
  const matches = matchPublicationCandidates(
    rows.map((r) => ({
      urls: [r.url, r.finalUrl],
      title: r.title,
      text: r.text,
      date: r.date,
      channel: r.source === "gov" ? "gov" : "x",
    })),
    registry
  );

  return rows.map((row, i) => {
    const match = matches[i];
    const status: ImportRowStatus =
      match?.level === "linked"
        ? "linked"
        : row.external
          ? "external"
          : skipped.has(row.key)
            ? "skipped"
            : match?.level ?? "new";
    const selectable = SELECTABLE_STATUSES.has(status);
    return {
      ...row,
      status,
      match: match ?? null,
      selectable,
      selected: selectable && (selection.get(row.key) ?? status === "new"),
    };
  });
}

export function countByStatus(rows: EvaluatedRow[]): Record<ImportRowStatus, number> {
  const counts: Record<ImportRowStatus, number> = { new: 0, possible: 0, probable: 0, linked: 0, external: 0, skipped: 0 };
  rows.forEach((r) => (counts[r.status] += 1));
  return counts;
}

/** Scala nowo pobrane pozycje z istniejącymi, zachowując zmiany użytkownika w już widocznych wierszach. */
export function mergeImportRows(previous: ImportRow[], incoming: ScrapedPublication[]): ImportRow[] {
  const known = new Map(previous.map((r) => [r.key, r]));
  const merged = [...previous];
  incoming.forEach((item) => {
    const existing = known.get(item.key);
    if (existing) {
      const index = merged.indexOf(existing);
      merged[index] = { ...existing, finalUrl: item.finalUrl, external: item.external, unverified: item.unverified, text: item.text ?? existing.text, title: existing.title || item.title };
    } else {
      const row = toImportRow(item);
      known.set(item.key, row);
      merged.push(row);
    }
  });
  return merged.sort((a, b) => b.date.localeCompare(a.date));
}
