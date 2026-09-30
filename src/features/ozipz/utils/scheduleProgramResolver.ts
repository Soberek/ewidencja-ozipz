import type { OzipzScheduleEvent, OzipzProgram } from "../types/ozipz.types";
import { getActiveJrwaKindMap, getActiveJrwaNamesMap } from "./calculators/jrwaClassification";

type JrwaKindMap = ReadonlyMap<string, "PROGRAMOWE" | "NIEPROGRAMOWE">;

const cleanSymbol = (value?: string) => (value || "").replace(/[^0-9.]/g, "").replace(/^\.+|\.+$/g, "");

/**
 * Symbol JRWA zadania: pole `jrwa`, a gdy go brak — symbol ze słownika zapisany w kategorii
 * lub tytule (zadania z importu mają np. kategorię „JRWA 966.14”).
 */
function findEventJrwaSymbol(event: OzipzScheduleEvent, kindMap: JrwaKindMap): string | undefined {
  const explicit = cleanSymbol(event.jrwa);
  if (explicit) return explicit;
  const known = [...kindMap.keys()].sort((a, b) => b.length - a.length);
  for (const text of [event.category, event.title]) {
    if (!text) continue;
    const found = known.find((sym) => new RegExp(`(?:^|[^0-9.])${sym.replace(/\./g, "\\.")}(?![0-9])`).test(text));
    if (found) return found;
  }
  return undefined;
}

/** Czytelny opis programu zadania: „Nazwa (JRWA 966.14)”. */
export function scheduleProgramLabel(event: OzipzScheduleEvent, programs?: OzipzProgram[]): string {
  const { name, symbol } = resolveScheduleProgram(event, programs);
  if (!name && !symbol) return "—";
  return symbol && !name.includes(symbol) ? `${name} (JRWA ${symbol})` : name;
}

/**
 * Rozpoznaje i wyznacza pełną nazwę programu profilaktycznego oraz symbol JRWA
 * dla zadania harmonogramu na podstawie programId, programName, symbolu JRWA lub treści zadania.
 * Programowość rozstrzyga rodzaj symbolu w słowniku JRWA — tak samo jak dla działań.
 */
export function resolveScheduleProgram(
  event: OzipzScheduleEvent,
  programs?: OzipzProgram[]
): {
  name: string;
  symbol?: string;
  isProgrammatic: boolean;
} {
  const kindMap = getActiveJrwaKindMap();
  const kindOf = (symbol: string | undefined, fallback: boolean) => {
    const kind = symbol ? kindMap.get(cleanSymbol(symbol)) : undefined;
    return kind ? kind === "PROGRAMOWE" : fallback;
  };
  const eventSymbol = findEventJrwaSymbol(event, kindMap);

  // 1. Jeśli event ma jawnie podany programId
  if (event.programId && event.programId !== "inne" && event.programId !== "brak") {
    const prog = programs?.find((p) => p.id === event.programId);
    const symbol = prog?.jrwaSymbol || eventSymbol;
    return {
      name: prog?.name || event.programName || "Program profilaktyczny",
      symbol,
      isProgrammatic: kindOf(symbol, true),
    };
  }

  // 2. Jeśli event ma jawnie programName
  if (event.programName && event.programName.trim()) {
    return {
      name: event.programName.trim(),
      symbol: eventSymbol,
      isProgrammatic: kindOf(eventSymbol, true),
    };
  }

  // 3. Symbol JRWA – nazwa z programu lub ze słownika, rodzaj ze słownika
  if (eventSymbol) {
    // Jeden program pod symbolem – jego nazwa; kilka (np. ferie i wakacje) – nazwa teczki ze słownika.
    const matches = programs?.filter((p) => cleanSymbol(p.jrwaSymbol) === eventSymbol) ?? [];
    const match = matches.length === 1 ? matches[0] : undefined;
    const name = match?.name || getActiveJrwaNamesMap().get(eventSymbol) || matches[0]?.name;
    if (name || kindMap.has(eventSymbol)) {
      return {
        name: name || event.category || "Interwencja OZiPZ",
        symbol: event.jrwa || eventSymbol,
        isProgrammatic: kindOf(eventSymbol, matches.length > 0),
      };
    }
  }

  // 4. Dopasowanie po słowach kluczowych w tytule
  const titleLower = (event.title || "").toLowerCase();
  if (programs && programs.length > 0) {
    for (const p of programs) {
      if (p.name && titleLower.includes(p.name.toLowerCase())) {
        const symbol = p.jrwaSymbol || eventSymbol;
        return {
          name: p.name,
          symbol,
          isProgrammatic: kindOf(symbol, true),
        };
      }
    }
  }

  // 5. Fallback
  if (event.category && event.category.trim()) {
    return {
      name: event.category.trim(),
      symbol: event.jrwa,
      isProgrammatic: false,
    };
  }

  return {
    name: event.topic || "Zadanie bieżące / Akcja ogólna",
    symbol: event.jrwa,
    isProgrammatic: false,
  };
}
