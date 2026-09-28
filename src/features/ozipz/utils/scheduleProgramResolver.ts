import type { OzipzScheduleEvent, OzipzProgram } from "../types/ozipz.types";
import { KNOWN_JRWA_CATALOG } from "./programJrwaCatalog";
import { getActiveJrwaKindMap, getActiveJrwaNamesMap } from "./calculators/jrwaClassification";

/**
 * Rozpoznaje i wyznacza pełną nazwę programu profilaktycznego oraz symbol JRWA
 * dla zadania harmonogramu na podstawie programId, programName, symbolu JRWA lub treści zadania.
 */
export function resolveScheduleProgram(
  event: OzipzScheduleEvent,
  programs?: OzipzProgram[]
): {
  name: string;
  symbol?: string;
  isProgrammatic: boolean;
} {
  // 1. Jeśli event ma jawnie podany programId
  if (event.programId && event.programId !== "inne" && event.programId !== "brak") {
    if (programs && programs.length > 0) {
      const prog = programs.find((p) => p.id === event.programId);
      if (prog) {
        return {
          name: prog.name,
          symbol: prog.jrwaSymbol || event.jrwa,
          isProgrammatic: true,
        };
      }
    }
    return {
      name: event.programName || "Program profilaktyczny",
      symbol: event.jrwa,
      isProgrammatic: true,
    };
  }

  // 2. Jeśli event ma jawnie programName
  if (event.programName && event.programName.trim()) {
    return {
      name: event.programName.trim(),
      symbol: event.jrwa,
      isProgrammatic: true,
    };
  }

  // 3. Sprawdź symbol JRWA
  if (event.jrwa && event.jrwa.trim()) {
    const cleanSymbol = event.jrwa.replace(/[^0-9.]/g, "").trim();
    if (programs && programs.length > 0) {
      const match = programs.find(
        (p) => p.jrwaSymbol && p.jrwaSymbol.replace(/[^0-9.]/g, "").trim() === cleanSymbol
      );
      if (match) {
        return {
          name: match.name,
          symbol: event.jrwa,
          isProgrammatic: true,
        };
      }
    }

    const catalogEntry = KNOWN_JRWA_CATALOG.find((k) => k.symbol === cleanSymbol);
    if (catalogEntry) {
      return {
        name: catalogEntry.label,
        symbol: event.jrwa,
        isProgrammatic: cleanSymbol.startsWith("966"),
      };
    }

    const kindMap = getActiveJrwaKindMap();
    if (kindMap.has(cleanSymbol)) {
      const namesMap = getActiveJrwaNamesMap();
      return {
        name: namesMap.get(cleanSymbol) || event.category || "Interwencja OZiPZ",
        symbol: event.jrwa,
        isProgrammatic: true,
      };
    }
  }

  // 4. Dopasowanie po słowach kluczowych w tytule
  const titleLower = (event.title || "").toLowerCase();
  if (programs && programs.length > 0) {
    for (const p of programs) {
      if (p.name && titleLower.includes(p.name.toLowerCase())) {
        return {
          name: p.name,
          symbol: p.jrwaSymbol || event.jrwa,
          isProgrammatic: true,
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
