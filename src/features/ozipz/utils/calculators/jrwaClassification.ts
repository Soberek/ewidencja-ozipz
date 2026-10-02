import type { OzipzAction, OzipzDictionaryItem } from "../../types/ozipz.types";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";

type JrwaKind = "PROGRAMOWE" | "NIEPROGRAMOWE";

const isJrwaDictionaryItem = (item: OzipzDictionaryItem) =>
  item.dictType === "jrwaSymbol" || item.dictType === "symbole_jrwa" || item.dictType.toLowerCase().includes("jrwa");

/**
 * Mapa klasyfikacji (PROGRAMOWE / NIEPROGRAMOWE) ze słownika JRWA w bazie danych.
 */
export function buildJrwaInterventionKindMap(dictionaryItems?: readonly OzipzDictionaryItem[]): Map<string, JrwaKind> {
  const map = new Map<string, JrwaKind>();
  for (const item of dictionaryItems ?? []) {
    if (isJrwaDictionaryItem(item) && item.code && (item.kind === "PROGRAMOWE" || item.kind === "NIEPROGRAMOWE")) {
      map.set(item.code.trim(), item.kind);
    }
  }
  return map;
}

/**
 * Mapa nazw symboli JRWA ze słownika w bazie danych.
 */
export function buildJrwaInterventionNamesMap(dictionaryItems?: readonly OzipzDictionaryItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of dictionaryItems ?? []) {
    if (isJrwaDictionaryItem(item) && item.code && item.label) {
      const cleanCode = item.code.trim();
      const cleanLabel = item.label.replace(new RegExp(`^${cleanCode.replace(/\./g, "\\.")}\\s*[-–:]?\\s*`), "").trim();
      map.set(cleanCode, cleanLabel || item.label.trim());
    }
  }
  return map;
}

export function getStoreJrwaItems(): readonly OzipzDictionaryItem[] | undefined {
  try {
    const store = useOzipzDbStore.getState();
    if (store && Array.isArray(store.dictionaryItems) && store.dictionaryItems.length > 0) {
      return store.dictionaryItems.filter(isJrwaDictionaryItem);
    }
  } catch {
    // Store not initialized or isolated environment
  }
  return undefined;
}

function getStoreJrwaSymbols(): string[] {
  return Array.from(new Set((getStoreJrwaItems() ?? []).map((i) => i.code?.trim()).filter(Boolean)));
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

function getStoreProgramJrwaSymbolByName(name: string): string | undefined {
  const wanted = name.trim().toLowerCase();
  try {
    const prog = useOzipzDbStore.getState().programs?.find((p) => p.name?.trim().toLowerCase() === wanted);
    return prog?.jrwaSymbol?.trim() || undefined;
  } catch {
    return undefined;
  }
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

export function getActiveJrwaKindMap(customKindMap?: ReadonlyMap<string, JrwaKind>): ReadonlyMap<string, JrwaKind> {
  return customKindMap ?? buildJrwaInterventionKindMap(getStoreJrwaItems());
}

export function getActiveJrwaNamesMap(customNamesMap?: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
  return customNamesMap ?? buildJrwaInterventionNamesMap(getStoreJrwaItems());
}

const symbolPattern = (sym: string) => new RegExp(`(?:^|[^0-9])${sym.replace(/\./g, "\\.")}(?![0-9])`);

/**
 * Wyciąga symbol JRWA z encji działania (np. "966.1", "966.14", "9011.1", "0442").
 * Rozpoznaje wyłącznie symbole ze słownika JRWA w bazie; techniczne identyfikatory
 * (np. "jrwa-1788342527615-1-b3vw") i symbole spoza słownika dają null.
 */
export function extractCleanJrwaSymbol(
  action: Partial<OzipzAction>,
  knownSymbols?: readonly string[]
): string | null {
  const customList = knownSymbols && knownSymbols.length > 0 ? knownSymbols : getStoreJrwaSymbols();
  const sorted = [...customList].sort((a, b) => b.length - a.length);
  const findIn = (text: string) => sorted.find((sym) => symbolPattern(sym).test(text)) ?? null;

  // 1. Znak sprawy JRWA (np. "OZiPZ.966.14.40.2026")
  if (action.jrwaSign && action.jrwaSign.trim()) {
    const found = findIn(action.jrwaSign.trim());
    if (found) return found;
  }

  // 2. jrwaCaseId: relacja do ozipz_jrwa_cases lub starszy zapis będący symbolem
  if (action.jrwaCaseId && action.jrwaCaseId.trim()) {
    const trimmed = action.jrwaCaseId.trim();
    // Sprawa z symbolem spoza słownika (np. 0444) nie rozstrzyga – decyduje wtedy symbol programu.
    const caseSym = getStoreCaseJrwaSymbol(trimmed);
    if (caseSym && customList.includes(caseSym)) return caseSym;
    if (customList.includes(trimmed)) return trimmed;
    const found = findIn(trimmed);
    if (found) return found;
  }

  // 3. Symbol przypisany programowi w katalogu programów (po id, a gdy go brak – po dokładnej nazwie)
  if (action.programId) {
    const progSym = getStoreProgramJrwaSymbol(action.programId);
    if (progSym) return progSym;
  }
  if (action.programName && action.programName.trim()) {
    const progSym = getStoreProgramJrwaSymbolByName(action.programName);
    if (progSym) return progSym;
  }

  // 4. Nazwa programu lub tytuł zawiera nazwę pozycji słownika JRWA
  const storeItems = getStoreJrwaItems();
  const texts = [`${action.programId || ""} ${action.programName || ""}`, action.title || ""].map((t) => t.toLowerCase());
  for (const text of texts) {
    const item = storeItems?.find((i) => i.label && text.includes(i.label.toLowerCase()));
    if (item) return item.code.trim();
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
