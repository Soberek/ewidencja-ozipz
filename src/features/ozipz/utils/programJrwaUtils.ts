import type { OzipzProgram, OzipzDictionaryItem } from "../types/ozipz.types";
import { compareJrwa } from "./ozipzCalculations";

import { KNOWN_JRWA_CATALOG, type KnownJrwaItem } from "./programJrwaCatalog";
export { KNOWN_JRWA_CATALOG, type KnownJrwaItem };

/**
 * Automatyczne określenie symbolu JRWA dla danego programu lub działania
 */
export function getProgramJrwaSymbol(
  program: OzipzProgram | undefined | null,
  title?: string,
  actionType?: string
): string {
  if (program) {
    // 1. Najwyższy priorytet: jawnie przypisany symbol JRWA z bazy programu
    if (program.jrwaSymbol && program.jrwaSymbol.trim()) {
      return program.jrwaSymbol.trim();
    }

    // 2. Sprawdź czy opis programu zawiera jawny zapis "(JRWA 966.XX)" lub "(JRWA 0442)"
    if (program.description) {
      const match = program.description.match(/JRWA\s*([0-9.]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const pId = (program.id || "").toLowerCase();
    const pName = (program.name || "").toLowerCase();

    // 3. Sprawozdawczość i korespondencja
    if (pId.includes("sprawozdawczosc") || pName.includes("sprawozdawczość") || pName.includes("sprawozdawczosc") || pId === "stat") {
      return "0442";
    }

    // 4. Mapowanie na podstawie ID lub kodu programu (zgodnie z bazą edu-report)
    if (pId.includes("trzymaj-forme") || pName.includes("trzymaj formę") || pName.includes("trzymaj forme")) {
      return "966.1";
    }
    if (pId.includes("hiv") || pName.includes("hiv") || pName.includes("aids")) {
      return "966.2";
    }
    if (pId.includes("zdrowe-zeby") || pName.includes("zęby") || pName.includes("zeby") || pName.includes("marchewk")) {
      return "966.3";
    }
    if (pId.includes("higiena-tarcza") || pName.includes("higiena naszą tarczą") || pName.includes("higiena nasza tarcza")) {
      return "966.4";
    }
    if (pId.includes("porozmawiajmy") || pName.includes("porozmawiajmy o zdrowiu")) {
      return "966.5";
    }
    if (pId.includes("substancje") || pName.includes("substancji psychoaktywnych") || pName.includes("nikotyn") || pName.includes("alkohol")) {
      return "966.6";
    }
    if (pId.includes("zdrowy-styl-zycia") || pName.includes("zdrowego stylu życia") || pName.includes("zdrowego stylu zycia") || pName.includes("fitschool") || pName.includes("mojaszkołazdrowaszkoła")) {
      return "966.7";
    }
    if (pId.includes("choroby-zakazne") || pName.includes("chorób zakaźnych") || pName.includes("chorob zakaznych") || pName.includes("wzw") || pName.includes("borelioz") || pName.includes("grypa")) {
      return "966.8";
    }
    if (pId.includes("nowotwor") || pName.includes("nowotwor") || pName.includes("znamię") || pName.includes("znamie") || pName.includes("bohaterk")) {
      return "966.9";
    }
    if (pId.includes("grzybobranie") || pName.includes("grzyb")) {
      return "966.10";
    }
    if (pId.includes("szczepienia") || pName.includes("szczepień") || pName.includes("szczepien")) {
      return "966.11";
    }
    if (pId.includes("swiatowy-dzien-zdrowia") || pName.includes("światowy dzień zdrowia") || pName.includes("swiatowy dzien zdrowia")) {
      return "966.12";
    }
    if (pId.includes("antybiotyki") || pName.includes("antybiotyk")) {
      return "966.13";
    }
    if (pId.includes("bezpieczne-wakacje") || pId.includes("bezpieczne-ferie") || pName.includes("wypoczynk") || pName.includes("wakacj") || pName.includes("ferie")) {
      return "966.14";
    }
    if (pId.includes("seniorzy") || pName.includes("senior")) {
      return "966.15";
    }
    if (pId.includes("zdrowie-psychiczne") || pName.includes("psychiczne") || pName.includes("depresj")) {
      return "966.16";
    }
    if (pId.includes("czynniki-srodowiskowe") || pName.includes("środowisk") || pName.includes("srodowisk") || pName.includes("radon") || pName.includes("pem")) {
      return "966.17";
    }
    if (pId.includes("mlodzi-swiadomi") || pName.includes("młodziświadomi") || pName.includes("mlodziswiadomi")) {
      return "966.18";
    }
    if (pId.includes("wsse") || pName.includes("wsse")) {
      return "9011.1";
    }
    if (pId.includes("podlegle") || pName.includes("organami podległymi")) {
      return "9011.2";
    }
  }

  // 3. Sprawdź tytuł i słowa kluczowe
  if (title) {
    const tLower = title.toLowerCase();
    if (tLower.includes("wakacj") || tLower.includes("ferie") || tLower.includes("wypoczynek") || tLower.includes("koloni") || tLower.includes("półkoloni")) {
      return "966.14";
    }
    if (tLower.includes("trzymaj form")) return "966.1";
    if (tLower.includes("hiv") || tLower.includes("aids")) return "966.2";
    if (tLower.includes("zęby") || tLower.includes("zeby") || tLower.includes("marchewk")) return "966.3";
    if (tLower.includes("higien") || tLower.includes("tarcza")) return "966.4";
    if (tLower.includes("nowych zagrożeni") || tLower.includes("porozmawiajmy")) return "966.5";
    if (tLower.includes("nikotyn") || tLower.includes("papieros") || tLower.includes("alkohol") || tLower.includes("dopalacz") || tLower.includes("psychoaktywn")) return "966.6";
    if (tLower.includes("fitschool") || tLower.includes("aktywności fizyczn") || tLower.includes("odżywiani")) return "966.7";
    if (tLower.includes("zakaźn") || tLower.includes("wzw") || tLower.includes("borelioz") || tLower.includes("kzm") || tLower.includes("grypa") || tLower.includes("covid") || tLower.includes("hpv")) return "966.8";
    if (tLower.includes("nowotwor") || tLower.includes("znamię") || tLower.includes("rak") || tLower.includes("bohaterk")) return "966.9";
    if (tLower.includes("grzyb")) return "966.10";
    if (tLower.includes("szczepien") || tLower.includes("szczepionk")) return "966.11";
    if (tLower.includes("dzień zdrowia")) return "966.12";
    if (tLower.includes("dzień wiedzy o antybiotyk") || tLower.includes("antybiotyk")) return "966.13";
    if (tLower.includes("senior")) return "966.15";
    if (tLower.includes("psychiczn") || tLower.includes("depresj") || tLower.includes("pomyśl")) return "966.16";
    if (tLower.includes("środowisk") || tLower.includes("radon") || tLower.includes("pem")) return "966.17";
    if (tLower.includes("młodziświadomi") || tLower.includes("mlodziswiadomi")) return "966.18";
    if (tLower.includes("sprawozdan") || tLower.includes("statystyk") || tLower.includes("miernik")) return "0442";
  }

  // 4. Mapowanie na podstawie formy działania
  if (actionType) {
    const aLower = actionType.toLowerCase();
    if (aLower.includes("konkurs") || aLower.includes("quiz") || aLower.includes("olimpiad")) return "966.2";
    if (aLower.includes("stoisko") || aLower.includes("wystawa") || aLower.includes("piknik")) return "966.3";
    if (aLower.includes("dystrybucja") || aLower.includes("rozdzielnik") || aLower.includes("ulotk")) return "966.4";
    if (aLower.includes("szkolenie") || aLower.includes("narada")) return "9011.1";
    if (aLower.includes("pismo") || aLower.includes("list") || aLower.includes("sprawozdanie")) return "0442";
  }

  return "966.1";
}

/**
 * Pobiera pełną listę symboli JRWA ze słowników i katalogu programów
 */
export function getAllJrwaSymbols(
  programs: OzipzProgram[] = [],
  dictionaryItems: OzipzDictionaryItem[] = []
): { symbol: string; label: string }[] {
  const symbolMap = new Map<string, string>();
  const INVALID_CODES = new Set(["070", "9010"]);

  // 1. Dodaj symbole z katalogu wzorcowego
  KNOWN_JRWA_CATALOG.forEach((item) => {
    if (!INVALID_CODES.has(item.symbol)) {
      symbolMap.set(item.symbol, item.label);
    }
  });

  // 2. Dodaj symbole ze słowników bazy
  dictionaryItems
    .filter((d) => d.dictType === "jrwaSymbol" && !INVALID_CODES.has(d.code) && !d.id.startsWith("dict-jrw-"))
    .forEach((d) => {
      const cleanLabel = (d.label || "").replace(new RegExp(`^${d.code}\\s*[-–:]?\\s*`), "");
      symbolMap.set(d.code, cleanLabel || d.description || d.code);
    });

  // 3. Dodaj symbole wyekstrahowane z programów
  programs.forEach((p) => {
    const sym = getProgramJrwaSymbol(p);
    if (sym && !INVALID_CODES.has(sym) && !symbolMap.has(sym)) {
      symbolMap.set(sym, p.name);
    }
  });

  return Array.from(symbolMap.entries())
    .map(([symbol, label]) => ({ symbol, label }))
    .sort((a, b) => compareJrwa(a.symbol, b.symbol));
}

export {
  generateNextIzrzSign,
  generateNextJrwaSign,
  formatFullJrwaSign,
  getJrwaDetails,
} from "./jrwaNumberingUtils";


