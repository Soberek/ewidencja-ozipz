import type { GisCategory, OzipzAction, OzipzDictionaryItem } from "../../types/ozipz.types";
import { GisCategorySchema } from "../../schemas/ozipzCoreSchemas";
import { KNOWN_JRWA_CATALOG } from "../programJrwaCatalog";
import { extractCleanJrwaSymbol } from "../calculators/jrwaClassification";
import type { GisReportCategoryId } from "./gisReportTypes";

export interface GisCategoryConfig {
  id: GisReportCategoryId;
  /** Nazwa obszaru dokładnie jak w formularzu GIS */
  label: string;
}

export const GIS_REPORT_CATEGORIES: readonly GisCategoryConfig[] = [
  { id: "uzaleznienia", label: "PROFILAKTYKA UZALEŻNIEŃ" },
  { id: "szczepienia", label: "SZCZEPIENIA" },
  { id: "otylosc", label: "ZAPOBIEGANIE OTYŁOŚCI" },
  { id: "sti", label: "STI (infekcje przenoszone drogą płciową)" },
  { id: "inne", label: "INNE" },
];

export const GIS_CATEGORY_LABELS: Record<GisCategory, string> = {
  uzaleznienia: "PROFILAKTYKA UZALEŻNIEŃ",
  szczepienia: "SZCZEPIENIA",
  otylosc: "ZAPOBIEGANIE OTYŁOŚCI",
  sti: "STI (infekcje przenoszone drogą płciową)",
  inne: "INNE",
  brak: "Nie wchodzi do sprawozdania GIS",
};

export const DEFAULT_JRWA_GIS_CATEGORY_MAP: ReadonlyMap<string, GisCategory> = new Map(
  KNOWN_JRWA_CATALOG.filter((item) => item.gisCategory).map((item) => [item.symbol, item.gisCategory!])
);

function isJrwaDictionaryItem(item: OzipzDictionaryItem): boolean {
  return item.dictType === "jrwaSymbol" || item.dictType === "symbole_jrwa" || item.dictType.toLowerCase().includes("jrwa");
}

/**
 * Mapa symbol JRWA -> obszar sprawozdania GIS. Wartości ze Słowników nadpisują domyślny katalog.
 */
export function buildJrwaGisCategoryMap(dictionaryItems?: readonly OzipzDictionaryItem[]): Map<string, GisCategory> {
  const map = new Map(DEFAULT_JRWA_GIS_CATEGORY_MAP);
  for (const item of dictionaryItems ?? []) {
    const parsed = GisCategorySchema.safeParse(item.gisCategory);
    if (isJrwaDictionaryItem(item) && item.code && parsed.success) {
      map.set(item.code.trim(), parsed.data);
    }
  }
  return map;
}

export interface ResolvedGisCategory {
  symbol: string | null;
  category: GisCategory | null;
}

export function resolveActionGisCategory(
  action: Partial<OzipzAction>,
  gisCategoryMap: ReadonlyMap<string, GisCategory>
): ResolvedGisCategory {
  const symbol = extractCleanJrwaSymbol(action);
  return { symbol, category: symbol ? gisCategoryMap.get(symbol) ?? null : null };
}
