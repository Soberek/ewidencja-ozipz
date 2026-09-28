import type { OzipzAction, OzipzDictionaryItem } from "../../types/ozipz.types";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";

export interface JrwaInterwencjaItem {
  jrwa: string;
  nazwa: string;
  rodzaj: "PROGRAMOWE" | "NIEPROGRAMOWE";
  aktywna?: boolean;
}

export const DEFAULT_INTERWENCJE_JRWA: JrwaInterwencjaItem[] = [
  { jrwa: "966.1", nazwa: "Trzymaj Formę", rodzaj: "PROGRAMOWE" },
  { jrwa: "966.2", nazwa: "Krajowy Program Zapobiegania Zakażeniom HIV i Zwalczania AIDS", rodzaj: "PROGRAMOWE" },
  { jrwa: "966.3", nazwa: "Zdrowe zęby mamy, marchewkę zajadamy", rodzaj: "PROGRAMOWE" },
  { jrwa: "966.4", nazwa: "Higiena naszą tarczą ochronną", rodzaj: "PROGRAMOWE" },
  { jrwa: "966.5", nazwa: "Porozmawiajmy o zdrowiu i nowych zagrożeniach", rodzaj: "PROGRAMOWE" },
  { jrwa: "966.6", nazwa: "Profilaktyka używania substancji psychoaktywnych (NSP, nikotyna i światowe dni związane z nikotyną, alkohol)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.7", nazwa: "Promocja zdrowego stylu życia, aktywności fizycznej i prawidłowego odżywiania (#mojaszkołazdrowaszkoła, Dni otwarte PIS, FitSchool)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.8", nazwa: "Profilaktyka chorób zakaźnych (Podstępne WZW, Jesień bez infekcji, borelioza, KZM, grypa, covid, HPV)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.9", nazwa: "Profilaktyka chorób nowotworowych (Znamię! znam je?, Bądź swoją bohaterką)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.10", nazwa: "Promocja bezpiecznego grzybobrania i profilaktyka zatruć grzybami", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.11", nazwa: "Promocja szczepień ochronnych (Europejski Tydzień Szczepień)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.12", nazwa: "Światowy Dzień Zdrowia", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.13", nazwa: "Europejski i Światowy Dzień Wiedzy o Antybiotykach", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.14", nazwa: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne ferie i wakacje)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.15", nazwa: "Seniorzy (Senior w roli głównej)", rodzaj: "PROGRAMOWE" },
  { jrwa: "966.16", nazwa: "Promocja zdrowia psychicznego (Tylko pomyśl, depresja)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.17", nazwa: "Wpływ czynników środowiskowych na zdrowie (PEM, radon)", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "966.18", nazwa: "#MłodziŚwiadomi", rodzaj: "PROGRAMOWE" },
  { jrwa: "0442", nazwa: "Sprawozdawczość statystyczna", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "9011.1", nazwa: "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z WSSE", rodzaj: "NIEPROGRAMOWE" },
  { jrwa: "9011.2", nazwa: "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z organami podległymi", rodzaj: "NIEPROGRAMOWE" },
];

export const JRWA_INTERVENTION_KIND_MAP = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">(
  DEFAULT_INTERWENCJE_JRWA.map((item) => [item.jrwa, item.rodzaj])
);

/**
 * Buduje dynamiczną mapę klasyfikacji (PROGRAMOWE / NIEPROGRAMOWE) ze słownika bazy danych
 */
export function buildJrwaInterventionKindMap(
  dictionaryItems?: readonly OzipzDictionaryItem[]
): Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE"> {
  const map = new Map<string, "PROGRAMOWE" | "NIEPROGRAMOWE">(JRWA_INTERVENTION_KIND_MAP);
  if (!dictionaryItems || dictionaryItems.length === 0) {
    return map;
  }
  for (const item of dictionaryItems) {
    if (
      item.dictType === "jrwaSymbol" ||
      item.dictType === "symbole_jrwa" ||
      item.dictType.toLowerCase().includes("jrwa")
    ) {
      if ((item.kind === "PROGRAMOWE" || item.kind === "NIEPROGRAMOWE") && item.code) {
        map.set(item.code.trim(), item.kind);
      }
    }
  }
  return map;
}

/**
 * Buduje dynamiczną mapę nazw JRWA ze słownika bazy danych
 */
export function buildJrwaInterventionNamesMap(
  dictionaryItems?: readonly OzipzDictionaryItem[]
): Map<string, string> {
  const map = new Map<string, string>(DEFAULT_INTERWENCJE_JRWA.map((i) => [i.jrwa, i.nazwa]));
  if (!dictionaryItems || dictionaryItems.length === 0) {
    return map;
  }
  for (const item of dictionaryItems) {
    if (
      item.dictType === "jrwaSymbol" ||
      item.dictType === "symbole_jrwa" ||
      item.dictType.toLowerCase().includes("jrwa")
    ) {
      if (item.code && item.label) {
        const cleanCode = item.code.trim();
        const cleanLabel = (item.label || "").replace(new RegExp(`^${cleanCode.replace(/\./g, "\\.")}\\s*[-–:]?\\s*`), "").trim();
        map.set(cleanCode, cleanLabel || item.label.trim());
      }
    }
  }
  return map;
}

function getStoreJrwaItems(): readonly OzipzDictionaryItem[] | undefined {
  try {
    const store = useOzipzDbStore.getState();
    if (store && Array.isArray(store.dictionaryItems) && store.dictionaryItems.length > 0) {
      return store.dictionaryItems.filter(
        (d) => d.dictType === "jrwaSymbol" || d.dictType === "symbole_jrwa" || d.dictType.toLowerCase().includes("jrwa")
      );
    }
  } catch {
    // Store not initialized or isolated environment
  }
  return undefined;
}

function getStoreJrwaSymbols(): string[] {
  const symbolSet = new Set<string>();
  const items = getStoreJrwaItems();
  if (items) {
    for (const i of items) {
      if (i.code) symbolSet.add(i.code.trim());
    }
  }
  for (const def of DEFAULT_INTERWENCJE_JRWA) {
    symbolSet.add(def.jrwa.trim());
  }
  return Array.from(symbolSet);
}

function getStoreProgramJrwaSymbol(programId?: string | null): string | undefined {
  if (!programId) return undefined;
  try {
    const store = useOzipzDbStore.getState();
    if (store && Array.isArray(store.programs)) {
      const prog = store.programs.find((p) => p.id === programId);
      if (prog?.jrwaSymbol && prog.jrwaSymbol.trim()) {
        return prog.jrwaSymbol.trim();
      }
    }
  } catch {
    // Isolated environment
  }
  return undefined;
}

function getStoreCaseJrwaSymbol(caseId?: string | null): string | undefined {
  if (!caseId) return undefined;
  try {
    const store = useOzipzDbStore.getState();
    if (store && Array.isArray(store.jrwaCases)) {
      const c = store.jrwaCases.find((item) => item.id === caseId);
      if (c?.jrwaSymbol && c.jrwaSymbol.trim()) {
        return c.jrwaSymbol.trim();
      }
    }
  } catch {
    // Isolated environment
  }
  return undefined;
}

export function getActiveJrwaKindMap(
  customKindMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">
): ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE"> {
  if (customKindMap) return customKindMap;
  const storeItems = getStoreJrwaItems();
  if (storeItems && storeItems.length > 0) {
    return buildJrwaInterventionKindMap(storeItems);
  }
  return JRWA_INTERVENTION_KIND_MAP;
}

export function getActiveJrwaNamesMap(
  customNamesMap?: ReadonlyMap<string, string>
): ReadonlyMap<string, string> {
  if (customNamesMap) return customNamesMap;
  const storeItems = getStoreJrwaItems();
  if (storeItems && storeItems.length > 0) {
    return buildJrwaInterventionNamesMap(storeItems);
  }
  return new Map(DEFAULT_INTERWENCJE_JRWA.map((i) => [i.jrwa, i.nazwa]));
}

/**
 * Wyciąga czysty symbol JRWA z encji działania (np. "966.1", "966.14", "9011.1", "0442").
 * Bezwzględnie odrzuca techniczne identyfikatory UUID/SQLite (np. "jrwa-1788342527615-1-b3vw").
 * Dynamicznie rozpoznaje nowe symbole zarejestrowane w słowniku bazy danych.
 */
export function extractCleanJrwaSymbol(
  action: Partial<OzipzAction>,
  knownSymbols?: readonly string[]
): string | null {
  const customList = knownSymbols && knownSymbols.length > 0 ? knownSymbols : getStoreJrwaSymbols();
  const sorted = [...customList].sort((a, b) => b.length - a.length);

  // 1. Znak sprawy JRWA (np. "OZiPZ.966.14.40.2026", "966.1", "9011.1", "OZiPZ.851.1.1.2026")
  if (action.jrwaSign && action.jrwaSign.trim()) {
    const sign = action.jrwaSign.trim();
    for (const sym of sorted) {
      const escaped = sym.replace(/\./g, "\\.");
      const regex = new RegExp(`(?:^|[^0-9])${escaped}(?![0-9])`);
      if (regex.test(sign)) {
        return sym;
      }
    }
    const match = sign.match(/\b(966\.\d+|9011\.\d+|0442|0444)\b/);
    if (match) return match[1];
  }

  // 2. jrwaCaseId (relacja do ozipz_jrwa_cases lub legacy symbol)
  if (action.jrwaCaseId && action.jrwaCaseId.trim()) {
    const trimmed = action.jrwaCaseId.trim();
    // 2a. Relacja do ozipz_jrwa_cases
    const caseSym = getStoreCaseJrwaSymbol(trimmed);
    if (caseSym) return caseSym;

    // 2b. Legacy format będący symbolem
    if (customList.includes(trimmed)) {
      return trimmed;
    }
    for (const sym of sorted) {
      const escaped = sym.replace(/\./g, "\\.");
      const regex = new RegExp(`(?:^|[^0-9])${escaped}(?![0-9])`);
      if (regex.test(trimmed)) {
        return sym;
      }
    }
    if (/^(966\.\d+|9011\.\d+|0442|0444)$/.test(trimmed)) {
      return trimmed;
    }
  }

  // 3. Rozpoznanie po ID programu (wprost ze słownika programów) lub nazwie programu
  if (action.programId) {
    const progSym = getStoreProgramJrwaSymbol(action.programId);
    if (progSym) return progSym;
  }

  const progText = `${action.programId || ""} ${action.programName || ""}`.toLowerCase();
  const storeItems = getStoreJrwaItems();
  if (storeItems) {
    for (const item of storeItems) {
      if (item.label && progText.includes(item.label.toLowerCase())) {
        return item.code.trim();
      }
    }
  }
  if (progText.includes("trzymaj-forme") || progText.includes("trzymaj form")) return "966.1";
  if (progText.includes("hiv") || progText.includes("aids")) return "966.2";
  if (progText.includes("zdrowe-zeby") || progText.includes("zęby") || progText.includes("zeby") || progText.includes("marchewk")) return "966.3";
  if (progText.includes("higiena") || progText.includes("tarcza")) return "966.4";
  if (progText.includes("porozmawiajmy")) return "966.5";
  if (progText.includes("substancj") || progText.includes("nikotyn") || progText.includes("alkohol")) return "966.6";
  if (progText.includes("zdrowy-styl-zycia") || progText.includes("stylu życia") || progText.includes("fitschool")) return "966.7";
  if (progText.includes("choroby-zakazne") || progText.includes("zakaźn") || progText.includes("wzw") || progText.includes("borelioz") || progText.includes("grypa")) return "966.8";
  if (progText.includes("nowotwor") || progText.includes("znamię") || progText.includes("znamie")) return "966.9";
  if (progText.includes("grzyb")) return "966.10";
  if (progText.includes("szczepien")) return "966.11";
  if (progText.includes("swiatowy-dzien-zdrowia") || progText.includes("dzień zdrowia")) return "966.12";
  if (progText.includes("antybiotyk")) return "966.13";
  if (progText.includes("bezpieczne-wakacje") || progText.includes("bezpieczne-ferie") || progText.includes("wypoczynk") || progText.includes("wakacj") || progText.includes("ferie")) return "966.14";
  if (progText.includes("senior")) return "966.15";
  if (progText.includes("psychiczn") || progText.includes("depresj")) return "966.16";
  if (progText.includes("srodowisk") || progText.includes("środowisk") || progText.includes("radon") || progText.includes("pem")) return "966.17";
  if (progText.includes("mlodzi-swiadomi") || progText.includes("młodziświadomi")) return "966.18";
  if (progText.includes("sprawozdawcz") || progText.includes("stat")) return "0442";

  // 4. Rozpoznanie po tytule działania
  if (action.title) {
    const tLower = action.title.toLowerCase();
    if (storeItems) {
      for (const item of storeItems) {
        if (item.label && tLower.includes(item.label.toLowerCase())) {
          return item.code.trim();
        }
      }
    }
    if (tLower.includes("wakacj") || tLower.includes("ferie") || tLower.includes("wypoczynek") || tLower.includes("koloni")) return "966.14";
    if (tLower.includes("trzymaj form")) return "966.1";
    if (tLower.includes("hiv") || tLower.includes("aids")) return "966.2";
    if (tLower.includes("zęby") || tLower.includes("zeby") || tLower.includes("marchewk")) return "966.3";
    if (tLower.includes("higien") || tLower.includes("tarcza")) return "966.4";
    if (tLower.includes("nowych zagrożeni") || tLower.includes("porozmawiajmy")) return "966.5";
    if (tLower.includes("nikotyn") || tLower.includes("papieros") || tLower.includes("alkohol") || tLower.includes("dopalacz")) return "966.6";
    if (tLower.includes("fitschool") || tLower.includes("aktywności fizyczn") || tLower.includes("odżywiani")) return "966.7";
    if (tLower.includes("zakaźn") || tLower.includes("wzw") || tLower.includes("borelioz") || tLower.includes("kzm") || tLower.includes("grypa")) return "966.8";
    if (tLower.includes("nowotwor") || tLower.includes("znamię") || tLower.includes("rak")) return "966.9";
    if (tLower.includes("grzyb")) return "966.10";
    if (tLower.includes("szczepien")) return "966.11";
    if (tLower.includes("dzień zdrowia")) return "966.12";
    if (tLower.includes("antybiotyk")) return "966.13";
    if (tLower.includes("senior")) return "966.15";
    if (tLower.includes("psychiczn") || tLower.includes("depresj")) return "966.16";
    if (tLower.includes("środowisk") || tLower.includes("radon")) return "966.17";
    if (tLower.includes("młodziświadomi")) return "966.18";
  }

  return null;
}

export function isProgramAction(
  action: Partial<OzipzAction>,
  customKindMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">
): boolean {
  const kindMap = getActiveJrwaKindMap(customKindMap);
  const knownSymbols = customKindMap ? Array.from(customKindMap.keys()) : undefined;

  // 1. Sprawdź czy działanie ma rozpoznawalny symbol JRWA (SSOT w słowniku bazy danych!)
  const symbol = extractCleanJrwaSymbol(action, knownSymbols);
  if (symbol) {
    const kind = kindMap.get(symbol);
    if (kind) {
      return kind === "PROGRAMOWE";
    }
  }

  // 2. Fallback na actionType, jeśli brak dopasowania w słowniku JRWA
  if (action.actionType === "nieprogramowe" || action.actionType === "wlasne" || action.actionType === "akcyjne") {
    return false;
  }
  if (action.actionType === "programowe") {
    return true;
  }

  // 3. Fallback na programId (jeśli program nie jest oznaczony jako "inne"/"brak")
  if (action.programId && action.programId !== "inne" && action.programId !== "brak") {
    return true;
  }

  return false;
}

/**
 * Porównanie numerów JRWA (naturalne, po segmentach oddzielonych kropką).
 * Np. 966.2 < 966.10, 0442 < 966.1 < 9011.1
 */
export function compareJrwa(a: string | null | undefined, b: string | null | undefined): number {
  const pa = jrwaParts(a);
  const pb = jrwaParts(b);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    if (i >= pa.length) return -1;
    if (i >= pb.length) return 1;
    const x = pa[i];
    const y = pb[i];
    if (typeof x === "number" && typeof y === "number") {
      if (x !== y) return x - y;
      continue;
    }
    const c = String(x).localeCompare(String(y), "pl", { sensitivity: "base" });
    if (c) return c;
  }
  return 0;
}

function jrwaParts(s: string | null | undefined): (string | number)[] {
  return String(s || "")
    .split(".")
    .filter((p) => p.length > 0)
    .map((p) => (/^\d+$/.test(p) ? Number(p) : p.toLowerCase()));
}
