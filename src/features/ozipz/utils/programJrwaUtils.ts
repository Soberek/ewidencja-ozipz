import type { OzipzProgram, OzipzDictionaryItem } from "../types/ozipz.types";
import { compareJrwa } from "./ozipzCalculations";

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

/** Opcje pola „Program lub klasyfikacja” (wartości `prog:<id>` / `jrwa:<symbol>`) — wspólne dla działania i szablonu. */
export function buildClassificationOptions(programs: OzipzProgram[], jrwaSymbols: { symbol: string; label: string }[]) {
  return [
    // Symbol JRWA odróżnia programy o podobnych nazwach i pozwala szukać po numerze teczki.
    ...programs.map((p) => {
      const symbol = getProgramJrwaSymbol(p);
      return { value: `prog:${p.id}`, label: p.name, description: symbol ? `JRWA ${symbol}` : undefined, group: "Programy" };
    }),
    ...jrwaSymbols.filter((j) => !programs.some((p) => getProgramJrwaSymbol(p) === j.symbol))
      .map((j) => ({ value: `jrwa:${j.symbol}`, label: `${j.symbol} — ${j.label}`, group: "Klasyfikacja" })),
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


