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

  // 3. Symbol przypisany programowi w katalogu programów
  const progSym = getProgramJrwaSymbol(action);
  if (progSym) return progSym;

  // 4. Nazwa programu lub tytuł zawiera nazwę pozycji słownika JRWA
  const storeItems = getStoreJrwaItems();
  const texts = [`${action.programId || ""} ${action.programName || ""}`, action.title || ""].map((t) => t.toLowerCase());
  for (const text of texts) {
    const item = storeItems?.find((i) => i.label && text.includes(i.label.toLowerCase()));
    if (item) return item.code.trim();
  }

  return null;
}

/** Symbol wybranego programu z katalogu programów (po id, a gdy go brak – po dokładnej nazwie). */
function getProgramJrwaSymbol(action: Partial<OzipzAction>): string | undefined {
  if (action.programId) {
    const progSym = getStoreProgramJrwaSymbol(action.programId);
    if (progSym) return progSym;
  }
  if (action.programName && action.programName.trim()) {
    return getStoreProgramJrwaSymbolByName(action.programName);
  }
  return undefined;
}

/**
 * Symbol JRWA, według którego działanie trafia do sprawozdań (programowe/nieprogramowe, obszar GIS,
 * miernik). Decyduje wybrany program i jego symbol ze słownika; znak sprawy jest drugorzędny
 * i rozstrzyga tylko wtedy, gdy działanie nie ma programu z symbolem ze słownika.
 */
export function resolveReportingJrwaSymbol(
  action: Partial<OzipzAction>,
  knownSymbols?: readonly string[]
): string | null {
  const known = knownSymbols && knownSymbols.length > 0 ? knownSymbols : getStoreJrwaSymbols();
  const progSym = getProgramJrwaSymbol(action);
  if (progSym && known.includes(progSym)) return progSym;
  return extractCleanJrwaSymbol(action, knownSymbols);
}

/** Rodzaj programu: rodzaj jego symbolu JRWA w słowniku (brak symbolu lub rodzaju – brak rodzaju). */
export function getProgramKind(
  jrwaSymbol: string | null | undefined,
  customKindMap?: ReadonlyMap<string, JrwaKind>
): JrwaKind | undefined {
  const symbol = jrwaSymbol?.trim();
  return symbol ? getActiveJrwaKindMap(customKindMap).get(symbol) : undefined;
}

/**
 * Działanie programowe czy nieprogramowe – decyduje wyłącznie wybrany program i rodzaj jego symbolu
 * w słowniku JRWA. Znak sprawy nie ma wpływu; działanie bez programu o określonym rodzaju jest nieprogramowe.
 */
export function isProgramAction(
  action: Partial<OzipzAction>,
  customKindMap?: ReadonlyMap<string, JrwaKind>
): boolean {
  return getProgramKind(getProgramJrwaSymbol(action), customKindMap) === "PROGRAMOWE";
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
