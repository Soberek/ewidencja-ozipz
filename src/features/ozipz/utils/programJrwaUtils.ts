import type { OzipzProgram, OzipzDictionaryItem } from "../types/ozipz.types";
import { compareJrwa, getProgramKind } from "./ozipzCalculations";

/**
 * Symbol JRWA programu — wyłącznie wartość przypisana w bazie (katalog programów).
 * Nie zgadujemy symbolu po nazwie ani formie działania: brak symbolu = pusty tekst.
 */
export function getProgramJrwaSymbol(program: OzipzProgram | undefined | null): string {
  return program?.jrwaSymbol?.trim() || "";
}

const isHiddenJrwaItem = (d: OzipzDictionaryItem) => d.code === "070" || d.code === "9010" || d.id.startsWith("dict-jrw-");

/**
 * Lista symboli JRWA ze słownika bazy danych (jedyne źródło symboli i ich nazw).
 */
export function getAllJrwaSymbols(dictionaryItems: OzipzDictionaryItem[] = []): { symbol: string; label: string }[] {
  const symbolMap = new Map<string, string>();
  dictionaryItems
    .filter((d) => d.dictType === "jrwaSymbol" && d.code && !isHiddenJrwaItem(d))
    .forEach((d) => {
      const code = d.code.trim();
      const cleanLabel = (d.label || "").replace(new RegExp(`^${code.replace(/\./g, "\\.")}\\s*[-–:]?\\s*`), "");
      symbolMap.set(code, cleanLabel || d.description || code);
    });

  return Array.from(symbolMap.entries())
    .map(([symbol, label]) => ({ symbol, label }))
    .sort((a, b) => compareJrwa(a.symbol, b.symbol));
}

const KIND_GROUPS = {
  PROGRAMOWE: "Programy – PROGRAMOWE",
  NIEPROGRAMOWE: "Programy – NIEPROGRAMOWE",
  none: "Programy – bez rodzaju w słowniku JRWA",
} as const;

/**
 * Opcje pola „Program lub klasyfikacja” (wartości `prog:<id>` / `jrwa:<symbol>`) — wspólne dla działania i szablonu.
 * Programy są pogrupowane według rodzaju ze słownika JRWA, bo to on decyduje o programowe/nieprogramowe w sprawozdaniach;
 * sama klasyfikacja bez programu liczy się jako nieprogramowa.
 */
export function buildClassificationOptions(
  programs: OzipzProgram[],
  jrwaSymbols: { symbol: string; label: string }[],
  kindMap?: ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">
) {
  const kindOrder = (p: OzipzProgram) => {
    const kind = getProgramKind(getProgramJrwaSymbol(p), kindMap);
    return kind === "PROGRAMOWE" ? 0 : kind === "NIEPROGRAMOWE" ? 1 : 2;
  };
  return [
    // Symbol JRWA odróżnia programy o podobnych nazwach i pozwala szukać po numerze teczki.
    ...[...programs].sort((a, b) => kindOrder(a) - kindOrder(b)).map((p) => {
      const symbol = getProgramJrwaSymbol(p);
      const kind = getProgramKind(symbol, kindMap);
      return {
        value: `prog:${p.id}`,
        label: p.name,
        description: [symbol && `JRWA ${symbol}`, kind?.toLowerCase()].filter(Boolean).join(" · ") || undefined,
        group: KIND_GROUPS[kind ?? "none"],
      };
    }),
    ...jrwaSymbols.filter((j) => !programs.some((p) => getProgramJrwaSymbol(p) === j.symbol))
      .map((j) => ({ value: `jrwa:${j.symbol}`, label: `${j.symbol} — ${j.label}`, description: "bez programu · nieprogramowe", group: "Klasyfikacja bez programu" })),
  ];
}

export const classificationValue = (programId: string | undefined, jrwaSymbol: string | undefined) =>
  programId ? `prog:${programId}` : jrwaSymbol ? `jrwa:${jrwaSymbol}` : "";

export {
  generateNextIzrzSign,
  generateNextJrwaSign,
  formatFullJrwaSign,
  getJrwaDetails,
} from "./jrwaNumberingUtils";


