import type { OzipzAction, OzipzJrwaCase, OzipzProgram } from "../types/ozipz.types";
import { KNOWN_JRWA_CATALOG } from "./programJrwaCatalog";
import { izrzSeriaForDzialanie, parseNumerIzrz, formatNumerIzrz } from "./izrzUtils";
import { JRWA_DEFAULT_SECTION } from "../constants";

/**
 * Automatyczne generowanie kolejnego globalnego numeru IZRZ w danym roku
 * (ciągłość numeracji 1, 2, 3, 4... dla każdego działania bez względu na symbol JRWA)
 */
export function generateNextIzrzSign(params: {
  year: number;
  actions?: OzipzAction[];
  actionType?: string;
  title?: string;
}): string {
  const { year, actions = [], actionType, title } = params;
  const seria = izrzSeriaForDzialanie(title || actionType);

  let maxNum = 0;

  actions.forEach((a) => {
    if (!a.izrzSign) return;
    const parsed = parseNumerIzrz(a.izrzSign);
    if (parsed) {
      if (parsed.rok === year && parsed.seria === seria) {
        if (parsed.nr > maxNum) maxNum = parsed.nr;
      }
    } else {
      // Fallback regex parsing (np. "90/2026", "IZRZ: 90/2026")
      const m = a.izrzSign.match(/(\d+)\s*\/\s*(\d{2,4})/);
      if (m) {
        const nr = parseInt(m[1], 10);
        const r = m[2].length === 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
        if (r === year && nr > maxNum) {
          maxNum = nr;
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  return formatNumerIzrz({ nr: nextNum, rok: year, seria });
}

/**
 * Automatyczne generowanie kolejnego znaku sprawy JRWA (w ramach teczki/symbolu)
 * oraz kolejnego globalnego numeru IZRZ (ciągłość 1, 2, 3, 4...) w danym roku
 */
export function generateNextJrwaSign(params: {
  symbol: string;
  year: number;
  section?: string;
  actions?: OzipzAction[];
  jrwaCases?: OzipzJrwaCase[];
  actionType?: string;
  title?: string;
}): { fullCaseSign: string; caseNumber: number; izrzSign: string; section: string; jrwaSymbol: string; year: number } {
  const { symbol, year, actions = [], jrwaCases = [], actionType, title } = params;
  const section = params.section || JRWA_DEFAULT_SECTION;

  if (!symbol) {
    return {
      section,
      jrwaSymbol: "",
      caseNumber: 1,
      year,
      fullCaseSign: "",
      izrzSign: generateNextIzrzSign({ year, actions, actionType, title }),
    };
  }

  let maxJrwaNum = 0;
  const escapedSymbol = symbol.replace(/\./g, "\\.");
  const signRegex = new RegExp(
    `^(?:(?:PSSE\\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\\.)?${escapedSymbol}\\.(\\d+)(?:\\.\\d+)?\\.${year}(?:\\.[A-Za-z0-9]+)?$`,
    "i"
  );

  // 1. Sprawdź w zarejestrowanych sprawach JRWA dla tego konkretnego symbolu (teczki) i roku
  jrwaCases.forEach((c) => {
    if (Number(c.year) === Number(year) && (c.jrwaSymbol === symbol || (!c.jrwaSymbol && c.fullCaseSign?.includes(symbol)))) {
      if (c.fullCaseSign && c.fullCaseSign.trim().length > 0) {
        const match = c.fullCaseSign.trim().match(signRegex);
        if (match && match[1]) {
          const n = Number(match[1]);
          if (Number.isFinite(n) && n > 0 && n !== year && n < 1000 && n > maxJrwaNum) {
            maxJrwaNum = n;
          }
        }
        // Jeżeli c.fullCaseSign jest obecny, NIGDY nie przechodź do c.caseNumber
        return;
      }
      const n = Number(c.caseNumber);
      if (Number.isFinite(n) && n > 0 && n !== year && n < 1000 && n > maxJrwaNum) {
        maxJrwaNum = n;
      }
    }
  });

  // 2. Sprawdź w istniejących akcjach dla tego konkretnego symbolu (teczki) i roku
  actions.forEach((a) => {
    if (a.jrwaSign && a.jrwaSign.trim().length > 0) {
      const match = a.jrwaSign.trim().match(signRegex);
      if (match && match[1]) {
        const num = Number(match[1]);
        if (Number.isFinite(num) && num > 0 && num !== year && num < 1000 && num > maxJrwaNum) {
          maxJrwaNum = num;
        }
      }
    }
  });

  const nextCaseNumber = maxJrwaNum + 1;
  const fullCaseSign = `${section}.${symbol}.${nextCaseNumber}.${year}`;

  // 3. IZRZ to globalna ciągłość numerów 1, 2, 3, 4... dla każdego działania w danym roku
  const izrzSign = generateNextIzrzSign({ year, actions, actionType, title });

  return {
    section,
    jrwaSymbol: symbol,
    caseNumber: nextCaseNumber,
    year,
    fullCaseSign,
    izrzSign,
  };
}

/**
 * Formatuje pełny urzędowy znak sprawy (np. OZiPZ.966.5.2.2026)
 * Gwarantuje prefiks OZiPZ, symbol JRWA, numer sprawy i rok
 */
export function formatFullJrwaSign(action: Partial<OzipzAction>): string {
  const year =
    action.date && !isNaN(new Date(action.date).getTime())
      ? new Date(action.date).getFullYear()
      : new Date().getFullYear();
  let raw = (action.jrwaSign || "").trim();

  if (!raw) {
    return "";
  }

  // Usunięcie prefiksu PSSE. jeśli występuje (np. PSSE.OZiPZ.966.5.2.2026 -> OZiPZ.966.5.2.2026)
  raw = raw.replace(/^PSSE\./i, "");

  // Normalizacja OZ. -> OZiPZ.
  if (/^OZ\./i.test(raw)) {
    raw = "OZiPZ." + raw.replace(/^OZ\./i, "");
  }

  const body = raw.replace(/^OZiPZ\./i, "");

  // Sprawdź czy body zawiera już 4-cyfrowy rok na końcu
  const hasYear = /\.(\d{4})(?:\.[A-Za-z0-9]+)?$/.test(body);
  if (hasYear) {
    // Sprawdź czy nie jest to atrapa folderu bez numeru sprawy (np. 966.8.2026 lub 0442.2026)
    const dummyFolderMatch = body.match(/^([0-9]+\.[0-9]+|[0-9]{4})\.(\d{4})$/);
    if (dummyFolderMatch) {
      return `OZiPZ.${dummyFolderMatch[1]}.1.${dummyFolderMatch[2]}`;
    }
    return `OZiPZ.${body}`;
  }

  // Rozpoznaj czy podano już numer sprawy (np. 966.1.5 lub 0442.5) czy tylko sam symbol (966.1 lub 0442)
  const caseMatch = body.match(/^(\d+\.\d+|\d{4})\.(\d+)$/);
  if (caseMatch) {
    const sym = caseMatch[1];
    const caseNum = caseMatch[2];
    return `OZiPZ.${sym}.${caseNum}.${year}`;
  }

  return `OZiPZ.${body}.1.${year}`;
}

/**
 * Zwraca szczegółowe dane symbolu JRWA: symbol, pełną nazwę teczki oraz tematykę/opis
 */
export function getJrwaDetails(
  rawSymbolOrText?: string,
  programs?: OzipzProgram[]
): {
  symbol: string;
  label: string;
  description: string;
} | null {
  if (!rawSymbolOrText) return null;

  // Wyciągnij symbol (np. "966.14" z "JRWA 966.14", "(JRWA 966.14)", "OZiPZ.966.14.1.2026")
  let cleanSymbol = "";
  const match = rawSymbolOrText.match(/966\.[0-9]+|9011\.[0-9]+|0442/);
  if (match) {
    cleanSymbol = match[0];
  } else {
    cleanSymbol = rawSymbolOrText.replace(/[^0-9.]/g, "").trim();
  }

  if (!cleanSymbol) return null;

  // 1. Sprawdź w programach
  if (programs && programs.length > 0) {
    const matchedProgram = programs.find((p) => {
      const pSym = p.jrwaSymbol ? p.jrwaSymbol.replace(/[^0-9.]/g, "") : "";
      return pSym === cleanSymbol;
    });
    if (matchedProgram) {
      const foundInCatalog = KNOWN_JRWA_CATALOG.find((k) => k.symbol === cleanSymbol);
      return {
        symbol: cleanSymbol,
        label: matchedProgram.name,
        description:
          matchedProgram.description ||
          foundInCatalog?.description ||
          matchedProgram.name,
      };
    }
  }

  // 2. Sprawdź w katalogu JRWA
  const found = KNOWN_JRWA_CATALOG.find((k) => k.symbol === cleanSymbol);
  if (found) {
    return {
      symbol: found.symbol,
      label: found.label,
      description: found.description || found.label,
    };
  }

  return {
    symbol: cleanSymbol,
    label: `Teczka JRWA ${cleanSymbol}`,
    description: `Sprawa z jednolitego rzeczowego wykazu akt (${cleanSymbol})`,
  };
}
