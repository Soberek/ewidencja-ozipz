import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { ISqlDatabase } from "../../../../db/types";
import { SqliteDatabaseService, initTables } from "../../../../db/sqlite-service";
import { FallbackDatabaseService } from "../../../../db/fallback-service";
import type {
  OzipzJrwaCase,
  OzipzAction,
  OzipzFacility,
  OzipzLetter,
} from "../../types/ozipz.types";
import { JrwaCaseSchema, LetterSchema } from "../../schemas/ozipz.schemas";
import {
  generateNextJrwaSign,
  generateNextIzrzSign,
  formatFullJrwaSign,
} from "../../utils/programJrwaUtils";
import {
  formatCaseLetterSign,
  parseLetterCaseSign,
  generateNextLetterJournalNumber,
} from "../../utils/letterUtils";
import {
  parseNumerIzrz,
  formatNumerIzrz,
  normalizeNumerIzrz,
  izrzSeriaForDzialanie,
  toAsciiSlug,
} from "../../utils/izrzUtils";
import {
  prepareIzrzData,
  buildIzrzDocxFileName,
} from "../../utils/izrzGenerator";
import { getActionEzdState } from "../actions/actionEzdStatus";
import { formatActionIzrzNumber } from "../../utils/registerPresentation";

function createInMemorySqlite(): ISqlDatabase {
  const rawDb = new DatabaseSync(":memory:");
  rawDb.exec("PRAGMA foreign_keys = ON;");

  const db: ISqlDatabase = {
    async select<T>(query: string, bindValues?: unknown[]): Promise<T> {
      const normalizedSql = query.replace(/\$\d+/g, "?");
      const stmt = rawDb.prepare(normalizedSql);
      const params = bindValues || [];
      const rows = (stmt.all as (...args: unknown[]) => unknown[])(...params);
      return rows as unknown as T;
    },
    async execute(query: string, bindValues?: unknown[]) {
      const params = bindValues || [];
      if (params.length === 0) {
        rawDb.exec(query);
        return { rowsAffected: 0 };
      }
      const normalizedSql = query.replace(/\$\d+/g, "?");
      const stmt = rawDb.prepare(normalizedSql);
      const result = (stmt.run as (...args: unknown[]) => {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
      })(...params);
      return {
        rowsAffected: Number(result.changes),
        lastInsertId: Number(result.lastInsertRowid),
      };
    },
  };

  return db;
}

describe("Ewidencja OZiPZ - Pełne Testy JRWA i IZRZ", () => {
  /* =========================================================================
   * 1. Numeracja Spraw per Teczka JRWA i Granice Roczne
   * ========================================================================= */
  describe("1. Numeracja Spraw per Teczka JRWA i Granice Roczne", () => {
    it("zwraca numer 1 dla zupełnie nowej, pustej teczki JRWA", () => {
      const res = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        actions: [],
        jrwaCases: [],
      });

      expect(res.caseNumber).toBe(1);
      expect(res.jrwaSymbol).toBe("966.1");
      expect(res.year).toBe(2026);
      expect(res.fullCaseSign).toBe("OZiPZ.966.1.1.2026");
    });

    it("prowadzi ściśle niezależną numerację spraw (1, 2, 3...) dla każdej teczki JRWA", () => {
      const existingCases: OzipzJrwaCase[] = [
        {
          id: "c-1",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 1,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.1.2026",
          title: "Trzymaj Formę SP 1",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-10",
          updatedAt: "2026-01-10",
        },
        {
          id: "c-2",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 2,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.2.2026",
          title: "Trzymaj Formę SP 2",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-12",
          updatedAt: "2026-01-12",
        },
        {
          id: "c-3",
          section: "OZiPZ",
          jrwaSymbol: "966.4",
          caseNumber: 1,
          year: 2026,
          fullCaseSign: "OZiPZ.966.4.1.2026",
          title: "Higiena naszą tarczą",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-15",
          updatedAt: "2026-01-15",
        },
        {
          id: "c-4",
          section: "OZiPZ",
          jrwaSymbol: "966.14",
          caseNumber: 50,
          year: 2026,
          fullCaseSign: "OZiPZ.966.14.50.2026",
          title: "Bezpieczne wakacje",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-20",
          updatedAt: "2026-01-20",
        },
      ];

      // Teczka 966.1 (były 1, 2) -> kolejny to 3
      const next966_1 = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        jrwaCases: existingCases,
      });
      expect(next966_1.caseNumber).toBe(3);
      expect(next966_1.fullCaseSign).toBe("OZiPZ.966.1.3.2026");

      // Teczka 966.4 (był 1) -> kolejny to 2
      const next966_4 = generateNextJrwaSign({
        symbol: "966.4",
        year: 2026,
        jrwaCases: existingCases,
      });
      expect(next966_4.caseNumber).toBe(2);
      expect(next966_4.fullCaseSign).toBe("OZiPZ.966.4.2.2026");

      // Teczka 966.14 (był 50) -> kolejny to 51
      const next966_14 = generateNextJrwaSign({
        symbol: "966.14",
        year: 2026,
        jrwaCases: existingCases,
      });
      expect(next966_14.caseNumber).toBe(51);
      expect(next966_14.fullCaseSign).toBe("OZiPZ.966.14.51.2026");

      // Teczka 0442 (brak spraw) -> kolejny to 1
      const next0442 = generateNextJrwaSign({
        symbol: "0442",
        year: 2026,
        jrwaCases: existingCases,
      });
      expect(next0442.caseNumber).toBe(1);
      expect(next0442.fullCaseSign).toBe("OZiPZ.0442.1.2026");
    });

    it("resetuje sekwencję numeracji wraz z nowym rokiem kalendarzowym (np. 2025 -> 2026 -> 2027)", () => {
      const casesMultiYear: OzipzJrwaCase[] = [
        {
          id: "cy-1",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 15,
          year: 2025,
          fullCaseSign: "OZiPZ.966.1.15.2025",
          title: "Sprawa z 2025",
          assignedEducator: "Edukator",
          status: "zakonczona",
          createdAt: "2025-12-01",
          updatedAt: "2025-12-01",
        },
        {
          id: "cy-2",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 5,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.5.2026",
          title: "Sprawa z 2026",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
        },
      ];

      // Dla roku 2025: kolejny to 16
      const next2025 = generateNextJrwaSign({
        symbol: "966.1",
        year: 2025,
        jrwaCases: casesMultiYear,
      });
      expect(next2025.caseNumber).toBe(16);
      expect(next2025.fullCaseSign).toBe("OZiPZ.966.1.16.2025");

      // Dla roku 2026: kolejny to 6 (nie zależy od 15 z 2025)
      const next2026 = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        jrwaCases: casesMultiYear,
      });
      expect(next2026.caseNumber).toBe(6);
      expect(next2026.fullCaseSign).toBe("OZiPZ.966.1.6.2026");

      // Dla nowego roku 2027: start od 1 (nowy spis roczny)
      const next2027 = generateNextJrwaSign({
        symbol: "966.1",
        year: 2027,
        jrwaCases: casesMultiYear,
      });
      expect(next2027.caseNumber).toBe(1);
      expect(next2027.fullCaseSign).toBe("OZiPZ.966.1.1.2027");
    });

    it("prawidłowo radzi sobie z lukami w numeracji (zwraca max + 1)", () => {
      const gappedCases: OzipzJrwaCase[] = [
        {
          id: "gap-1",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 1,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.1.2026",
          title: "Sprawa 1",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
        {
          id: "gap-2",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 4,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.4.2026",
          title: "Sprawa 4 po skasowaniu 2 i 3",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-04",
          updatedAt: "2026-01-04",
        },
        {
          id: "gap-3",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 10,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.10.2026",
          title: "Sprawa 10",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-10",
          updatedAt: "2026-01-10",
        },
      ];

      const res = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        jrwaCases: gappedCases,
      });

      // Max to 10 -> kolejny to 11
      expect(res.caseNumber).toBe(11);
      expect(res.fullCaseSign).toBe("OZiPZ.966.1.11.2026");
    });

    it("uwzględnia numery spraw obecne wyłącznie w zarejestrowanych działaniach (actions)", () => {
      const actionsOnly: Partial<OzipzAction>[] = [
        {
          id: "act-1",
          date: "2026-04-10",
          jrwaSign: "OZiPZ.966.3.7.2026",
        },
        {
          id: "act-2",
          date: "2026-05-15",
          jrwaSign: "OZiPZ.966.3.8.2026",
        },
      ];

      const res = generateNextJrwaSign({
        symbol: "966.3",
        year: 2026,
        actions: actionsOnly as OzipzAction[],
        jrwaCases: [],
      });

      expect(res.caseNumber).toBe(9);
      expect(res.fullCaseSign).toBe("OZiPZ.966.3.9.2026");
    });

    it("nie podwaja numeru gdy sprawa istnieje w jrwaCases i powiązanym action", () => {
      const existingCases: OzipzJrwaCase[] = [
        {
          id: "case-shared",
          section: "OZiPZ",
          jrwaSymbol: "966.1",
          caseNumber: 3,
          year: 2026,
          fullCaseSign: "OZiPZ.966.1.3.2026",
          title: "Wspólna sprawa",
          assignedEducator: "Edukator",
          status: "w_toku",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ];

      const existingActions: Partial<OzipzAction>[] = [
        {
          id: "act-shared",
          date: "2026-01-02",
          jrwaSign: "OZiPZ.966.1.3.2026",
          jrwaCaseId: "case-shared",
        },
      ];

      const res = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        jrwaCases: existingCases,
        actions: existingActions as OzipzAction[],
      });

      // Max to 3 -> kolejny to 4 (brak podwójnego skoku)
      expect(res.caseNumber).toBe(4);
      expect(res.fullCaseSign).toBe("OZiPZ.966.1.4.2026");
    });

    it("poprawnie parsuje znaki z prefiksem PSSE.OZiPZ., OZ. oraz inicjałami referenta", () => {
      const legacyActions: Partial<OzipzAction>[] = [
        {
          id: "a-psse",
          jrwaSign: "PSSE.OZiPZ.966.1.12.2026",
        },
        {
          id: "a-init",
          jrwaSign: "OZiPZ.966.1.15.2026.KP",
        },
        {
          id: "a-oz",
          jrwaSign: "OZ.966.1.18.2026",
        },
        {
          id: "a-spaces",
          jrwaSign: "  OZiPZ.966.1.20.2026  ",
        },
      ];

      const res = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        actions: legacyActions as OzipzAction[],
      });

        // Max to 20 -> kolejny to 21
      expect(res.caseNumber).toBe(21);
      expect(res.fullCaseSign).toBe("OZiPZ.966.1.21.2026");
    });

    it("bezpiecznie obsługuje pusty symbol JRWA (zwraca domyślny obiekt bez rzucania błędu)", () => {
      const res = generateNextJrwaSign({
        symbol: "",
        year: 2026,
      });
      expect(res.caseNumber).toBe(1);
      expect(res.jrwaSymbol).toBe("");
      expect(res.fullCaseSign).toBe("");
    });

    it("generateNextJrwaSign prawidłowo rozpoznaje numer sprawy ze znaków pism z sub-numerem (np. OZiPZ.966.1.5.1.2026)", () => {
      const actionsWithLetters: Partial<OzipzAction>[] = [
        {
          id: "act-let-1",
          date: "2026-02-10",
          jrwaSign: "OZiPZ.966.1.5.1.2026", // pismo nr 1 w sprawie nr 5
        },
      ];
      const res = generateNextJrwaSign({
        symbol: "966.1",
        year: 2026,
        actions: actionsWithLetters as OzipzAction[],
      });
      // Kolejna sprawa w teczce 966.1 powinna mieć nr 6
      expect(res.caseNumber).toBe(6);
      expect(res.fullCaseSign).toBe("OZiPZ.966.1.6.2026");
    });
  });

  /* =========================================================================
   * 2. Formatowanie Pełnego Znaku Sprawy
   * ========================================================================= */
  describe("2. Formatowanie Pełnego Znaku Sprawy", () => {
    it("formatFullJrwaSign normalizuje różne warianty zapisu do wzorcowego OZiPZ.XXX.Y.ROK", () => {
      expect(formatFullJrwaSign({ jrwaSign: "OZiPZ.966.1.5.2026" })).toBe("OZiPZ.966.1.5.2026");
      expect(formatFullJrwaSign({ jrwaSign: "OZ.966.1.5.2026" })).toBe("OZiPZ.966.1.5.2026");
      expect(formatFullJrwaSign({ jrwaSign: "PSSE.OZiPZ.966.1.5.2026" })).toBe("OZiPZ.966.1.5.2026");
      expect(formatFullJrwaSign({ jrwaSign: "PSSE.OZ.966.1.5.2026" })).toBe("OZiPZ.966.1.5.2026");
      expect(formatFullJrwaSign({ jrwaSign: "966.1.5.2026" })).toBe("OZiPZ.966.1.5.2026");
    });

    it("formatFullJrwaSign uzupełnia skrótowy symbol o numer 1 i rok z daty akcji", () => {
      expect(formatFullJrwaSign({ jrwaSign: "966.1", date: "2026-05-20" })).toBe("OZiPZ.966.1.1.2026");
      expect(formatFullJrwaSign({ jrwaSign: "0442", date: "2027-01-15" })).toBe("OZiPZ.0442.1.2027");
    });

    it("formatFullJrwaSign prawidłowo formatuje znaki z numerem sprawy ale bez roku (np. 966.1.5 oraz 0442.5)", () => {
      expect(formatFullJrwaSign({ jrwaSign: "966.1.5", date: "2026-05-20" })).toBe("OZiPZ.966.1.5.2026");
      expect(formatFullJrwaSign({ jrwaSign: "0442.5", date: "2026-05-20" })).toBe("OZiPZ.0442.5.2026");
      expect(formatFullJrwaSign({ jrwaSign: "OZiPZ.966.1.7" })).toBe(`OZiPZ.966.1.7.${new Date().getFullYear()}`);
    });

    it("formatFullJrwaSign zwraca pusty ciąg dla pustego lub niezdefiniowanego wejścia", () => {
      expect(formatFullJrwaSign({})).toBe("");
      expect(formatFullJrwaSign({ jrwaSign: "" })).toBe("");
      expect(formatFullJrwaSign({ jrwaSign: "   " })).toBe("");
    });

    it("pozwala na zdefiniowanie sekcji innej niż OZiPZ w generateNextJrwaSign", () => {
      const res = generateNextJrwaSign({
        symbol: "9020",
        year: 2026,
        section: "HDM",
      });
      expect(res.section).toBe("HDM");
      expect(res.fullCaseSign).toBe("HDM.9020.1.2026");
    });

    it("JrwaCaseSchema poprawnie waliduje prawidłowy obiekt sprawy JRWA", () => {
      const validCase = {
        id: "case-zod-1",
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 3,
        year: 2026,
        fullCaseSign: "OZiPZ.966.1.3.2026",
        title: "Warsztaty Trzymaj Formę w SP 1",
        status: "w_toku",
        assignedEducator: "Krzysztof Palpuchowski",
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-01T10:00:00Z",
      };

      const parsed = JrwaCaseSchema.safeParse(validCase);
      expect(parsed.success).toBe(true);
    });

    it("JrwaCaseSchema odrzuca sprawę bez tytułu, z ujemnym numerem lub rokiem poza zakresem", () => {
      const invalidNoTitle = {
        id: "case-zod-err",
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 1,
        year: 2026,
        fullCaseSign: "OZiPZ.966.1.1.2026",
        title: "",
        assignedEducator: "Edukator",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      };
      expect(JrwaCaseSchema.safeParse(invalidNoTitle).success).toBe(false);

      const invalidCaseNum = {
        ...invalidNoTitle,
        title: "Prawidłowy tytuł",
        caseNumber: 0,
      };
      expect(JrwaCaseSchema.safeParse(invalidCaseNum).success).toBe(false);

      const invalidYear = {
        ...invalidNoTitle,
        title: "Prawidłowy tytuł",
        year: 1999,
      };
      expect(JrwaCaseSchema.safeParse(invalidYear).success).toBe(false);
    });
  });

  /* =========================================================================
   * 2B. Znaki Pism Kancelaryjnych (Dziennik Korespondencji i Instrukcja Kancelaryjna)
   * ========================================================================= */
  describe("2B. Znaki Pism Kancelaryjnych (Dziennik Korespondencji i Instrukcja Kancelaryjna)", () => {
    it("LetterSchema poprawnie waliduje pismo wychodzące i przychodzące", () => {
      const validOutgoingLetter: OzipzLetter = {
        id: "let-out-1",
        direction: "wychodzace",
        letterNumber: "1/2026",
        letterDate: "2026-03-15",
        caseSign: "OZiPZ.966.1.5.2026",
        senderRecipient: "Szkoła Podstawowa nr 1 w Myśliborzu",
        facilityId: "fac-1",
        subject: "Pismo przewodnie w sprawie programu Trzymaj Formę",
        programId: "prog-tf",
        assignedPerson: "Jan Nowak",
        status: "wyslane",
        notes: "Wysłano pocztą tradycyjną ze zwrotnym potwierdzeniem",
        createdAt: "2026-03-15T09:00:00Z",
        updatedAt: "2026-03-15T09:00:00Z",
      };
      expect(LetterSchema.safeParse(validOutgoingLetter).success).toBe(true);

      const validIncomingLetter: OzipzLetter = {
        id: "let-in-1",
        direction: "przychodzace",
        letterNumber: "SP1/98/2026",
        letterDate: "2026-03-20",
        caseSign: "OZiPZ.966.1.5.2026",
        senderRecipient: "SP 1 Myślibórz",
        subject: "Zgłoszenie do programu edukacyjnego",
        assignedPerson: "Anna Kowalska",
        status: "odebrane",
        createdAt: "2026-03-20T10:00:00Z",
        updatedAt: "2026-03-20T10:00:00Z",
      };
      expect(LetterSchema.safeParse(validIncomingLetter).success).toBe(true);
    });

    it("LetterSchema odrzuca pismo bez numeru, daty, tematu lub ze złym kierunkiem", () => {
      const baseLetter = {
        id: "let-err-1",
        direction: "wychodzace",
        letterNumber: "1/2026",
        letterDate: "2026-03-15",
        subject: "Temat",
        createdAt: "2026-03-15",
        updatedAt: "2026-03-15",
      };

      // Brak numeru pisma
      expect(LetterSchema.safeParse({ ...baseLetter, letterNumber: "" }).success).toBe(false);
      // Brak daty
      expect(LetterSchema.safeParse({ ...baseLetter, letterDate: "" }).success).toBe(false);
      // Brak tematu
      expect(LetterSchema.safeParse({ ...baseLetter, subject: "" }).success).toBe(false);
      // Nieprawidłowy kierunek
      expect(LetterSchema.safeParse({ ...baseLetter, direction: "inny" as unknown as "wychodzace" }).success).toBe(false);
    });

    it("formatCaseLetterSign prawidłowo formatuje znak pisma w sprawie ze wskaźnikiem i inicjałami", () => {
      // Format standardowy: znak sprawy + nr pisma w sprawie (OZiPZ.966.1.5.1.2026)
      expect(
        formatCaseLetterSign({
          caseSign: "OZiPZ.966.1.5.2026",
          letterIndex: 1,
        })
      ).toBe("OZiPZ.966.1.5.1.2026");

      // Znak pisma z inicjałami referenta
      expect(
        formatCaseLetterSign({
          caseSign: "OZiPZ.966.1.5.2026",
          letterIndex: 2,
          initials: "KP",
        })
      ).toBe("OZiPZ.966.1.5.2.2026.KP");

      // Znak sprawy z samymi inicjałami (np. dekretacja sprawy na referenta)
      expect(
        formatCaseLetterSign({
          caseSign: "OZiPZ.966.1.5.2026",
          initials: "KP",
        })
      ).toBe("OZiPZ.966.1.5.2026.KP");

      // Bezpieczna obsługa pustego znaku sprawy
      expect(formatCaseLetterSign({ caseSign: "" })).toBe("");
    });

    it("parseLetterCaseSign prawidłowo dekonstruuje znak pisma i znak sprawy", () => {
      // Pełny znak pisma w sprawie
      const parsedFull = parseLetterCaseSign("OZiPZ.966.1.5.1.2026.KP");
      expect(parsedFull).toEqual({
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 5,
        letterIndex: 1,
        year: 2026,
        initials: "KP",
      });

      // Znak sprawy bez sub-numeru pisma
      const parsedCase = parseLetterCaseSign("OZiPZ.966.1.5.2026");
      expect(parsedCase).toEqual({
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 5,
        year: 2026,
        initials: undefined,
      });

      // Znak z 1-częściowym symbolem JRWA (0442)
      const parsedSingleSymbol = parseLetterCaseSign("OZiPZ.0442.2.1.2026");
      expect(parsedSingleSymbol).toEqual({
        section: "OZiPZ",
        jrwaSymbol: "0442",
        caseNumber: 2,
        letterIndex: 1,
        year: 2026,
        initials: undefined,
      });

      // Błędny ciąg tekstowy
      expect(parseLetterCaseSign("niepoprawny")).toBeNull();
      expect(parseLetterCaseSign("")).toBeNull();
    });

    it("generateNextLetterJournalNumber zarządza sekwencją dziennika korespondencji i resetem rocznym", () => {
      const letters2026 = [
        { letterNumber: "1/2026", letterDate: "2026-01-10", direction: "wychodzace" },
        { letterNumber: "2/2026", letterDate: "2026-01-15", direction: "wychodzace" },
        { letterNumber: "W/3/2026", letterDate: "2026-01-20", direction: "wychodzace" },
      ];

      // Kolejny numer w 2026: 4/2026
      expect(
        generateNextLetterJournalNumber({
          existingLetters: letters2026,
          year: 2026,
        })
      ).toBe("4/2026");

      // Z prefiksem W/ -> W/4/2026
      expect(
        generateNextLetterJournalNumber({
          existingLetters: letters2026,
          year: 2026,
          prefix: "W",
        })
      ).toBe("W/4/2026");

      // Nowy rok kalendarzowy 2027: reset do 1/2027
      expect(
        generateNextLetterJournalNumber({
          existingLetters: letters2026,
          year: 2027,
        })
      ).toBe("1/2027");

      // Obsługa luk (max + 1)
      const gappedLetters = [
        { letterNumber: "1/2026", letterDate: "2026-01-10" },
        { letterNumber: "7/2026", letterDate: "2026-01-25" },
      ];
      expect(
        generateNextLetterJournalNumber({
          existingLetters: gappedLetters,
          year: 2026,
        })
      ).toBe("8/2026");
    });
  });

  /* =========================================================================
   * 3. Numery IZRZ – Formaty, Serie, Wykrywanie i Walidacja
   * ========================================================================= */
  describe("3. Numery IZRZ – Formaty, Serie, Wykrywanie i Walidacja", () => {
    it("parseNumerIzrz prawidłowo parsuje wszystkie 3 serie: standard, wizytacja (PZ) i narada (N)", () => {
      // Seria standardowa: nr/rok
      expect(parseNumerIzrz("1/2026")).toEqual({ nr: 1, rok: 2026, seria: "standard" });
      expect(parseNumerIzrz("66/2026")).toEqual({ nr: 66, rok: 2026, seria: "standard" });
      expect(parseNumerIzrz("142/2026")).toEqual({ nr: 142, rok: 2026, seria: "standard" });

      // Seria wizytacji: PZ/nr/rok
      expect(parseNumerIzrz("PZ/1/2026")).toEqual({ nr: 1, rok: 2026, seria: "wizytacja" });
      expect(parseNumerIzrz("PZ/6/2026")).toEqual({ nr: 6, rok: 2026, seria: "wizytacja" });
      expect(parseNumerIzrz("pz/12/2026")).toEqual({ nr: 12, rok: 2026, seria: "wizytacja" });

      // Seria narad: N/nr/rok
      expect(parseNumerIzrz("N/1/2026")).toEqual({ nr: 1, rok: 2026, seria: "narada" });
      expect(parseNumerIzrz("N/5/2026")).toEqual({ nr: 5, rok: 2026, seria: "narada" });
      expect(parseNumerIzrz("n/10/2026")).toEqual({ nr: 10, rok: 2026, seria: "narada" });
    });

    it("parseNumerIzrz obsługuje lata 2-cyfrowe konwertując je do XXI wieku", () => {
      expect(parseNumerIzrz("66/26")).toEqual({ nr: 66, rok: 2026, seria: "standard" });
      expect(parseNumerIzrz("PZ/6/26")).toEqual({ nr: 6, rok: 2026, seria: "wizytacja" });
      expect(parseNumerIzrz("N/1/26")).toEqual({ nr: 1, rok: 2026, seria: "narada" });
    });

    it("parseNumerIzrz obsługuje prefiks IZRZ: lub IZRZ", () => {
      expect(parseNumerIzrz("IZRZ: 66/2026")).toEqual({ nr: 66, rok: 2026, seria: "standard" });
      expect(parseNumerIzrz("IZRZ 90/2026")).toEqual({ nr: 90, rok: 2026, seria: "standard" });
      expect(parseNumerIzrz("IZRZ: PZ/6/2026")).toEqual({ nr: 6, rok: 2026, seria: "wizytacja" });
      expect(parseNumerIzrz("IZRZ: N/3/2026")).toEqual({ nr: 3, rok: 2026, seria: "narada" });
    });

    it("parseNumerIzrz odrzuca niepoprawne formaty (zwraca null)", () => {
      expect(parseNumerIzrz("0/2026")).toBeNull();
      expect(parseNumerIzrz("-5/2026")).toBeNull();
      expect(parseNumerIzrz("XYZ/1/2026")).toBeNull();
      expect(parseNumerIzrz("66")).toBeNull();
      expect(parseNumerIzrz("tekst")).toBeNull();
      expect(parseNumerIzrz("")).toBeNull();
      expect(parseNumerIzrz(null)).toBeNull();
      expect(parseNumerIzrz(undefined)).toBeNull();
    });

    it("formatNumerIzrz poprawnie formatuje obiekt numeru IZRZ", () => {
      expect(formatNumerIzrz({ nr: 5, rok: 2026, seria: "standard" })).toBe("5/2026");
      expect(formatNumerIzrz({ nr: 6, rok: 2026, seria: "wizytacja" })).toBe("PZ/6/2026");
      expect(formatNumerIzrz({ nr: 2, rok: 2026, seria: "narada" })).toBe("N/2/2026");
    });

    it("formatNumerIzrz rzuca błąd dla niepełnych lub błędnych danych", () => {
      expect(() => formatNumerIzrz({ nr: 0, rok: 2026 })).toThrow("Niepełne dane numeru IZRZ");
      expect(() => formatNumerIzrz({ nr: -1, rok: 2026 })).toThrow("Niepełne dane numeru IZRZ");
      expect(() => formatNumerIzrz({ nr: 5, rok: 999 })).toThrow("Niepełne dane numeru IZRZ");
    });

    it("normalizeNumerIzrz czyści format i rzuca błąd gdy seria się nie zgadza", () => {
      expect(normalizeNumerIzrz("66/26")).toBe("66/2026");
      expect(normalizeNumerIzrz("pz/6/26", { seria: "wizytacja" })).toBe("PZ/6/2026");
      expect(normalizeNumerIzrz("n/1/26", { seria: "narada" })).toBe("N/1/2026");

      // Próba normalizacji wizytacji jako standard
      expect(() => normalizeNumerIzrz("PZ/6/2026", { seria: "standard" })).toThrow();
      // Błędny tekst
      expect(() => normalizeNumerIzrz("błędny")).toThrow();
    });

    it("izrzSeriaForDzialanie automatycznie klasyfikuje serię na podstawie nazwy działania", () => {
      expect(izrzSeriaForDzialanie("Wizytacja placówki wypoczynku letniego")).toBe("wizytacja");
      expect(izrzSeriaForDzialanie("Wizytacja w Szkole Podstawowej")).toBe("wizytacja");
      expect(izrzSeriaForDzialanie("Narada koordynatorów szkolnych")).toBe("narada");
      expect(izrzSeriaForDzialanie("Narada metodyczna dla nauczycieli")).toBe("narada");
      expect(izrzSeriaForDzialanie("Prelekcja o zdrowym żywieniu")).toBe("standard");
      expect(izrzSeriaForDzialanie("Warsztaty higieny rąk")).toBe("standard");
      expect(izrzSeriaForDzialanie("Stoisko profilaktyczne")).toBe("standard");
    });
  });

  /* =========================================================================
   * 4. Ciągłość i Sekwencja Numeracji IZRZ w danym Roku
   * ========================================================================= */
  describe("4. Ciągłość i Sekwencja Numeracji IZRZ w danym Roku", () => {
    it("gwarantuje globalną ciągłość numerów IZRZ dla działań w różnych teczkach JRWA", () => {
      const actionsAcrossFolders: Partial<OzipzAction>[] = [
        {
          id: "a-1",
          date: "2026-01-10",
          jrwaSign: "OZiPZ.966.1.1.2026",
          izrzSign: "1/2026",
          title: "Prelekcja TF",
        },
        {
          id: "a-2",
          date: "2026-01-15",
          jrwaSign: "OZiPZ.966.14.1.2026",
          izrzSign: "2/2026",
          title: "Pogadanka ferie",
        },
        {
          id: "a-3",
          date: "2026-01-20",
          jrwaSign: "OZiPZ.0442.1.2026",
          izrzSign: "3/2026",
          title: "Sprawozdanie MZ-11",
        },
      ];

      // Kolejne działanie w teczce 966.4 powinno otrzymać kolejny IZRZ = 4/2026
      const nextStandard = generateNextIzrzSign({
        year: 2026,
        actions: actionsAcrossFolders as OzipzAction[],
        title: "Warsztaty higieniczne",
      });
      expect(nextStandard).toBe("4/2026");
    });

    it("prowadzi niezależną numerację dla wizytacji (PZ) i narad (N)", () => {
      const mixedActions: Partial<OzipzAction>[] = [
        { id: "m1", date: "2026-01-10", izrzSign: "1/2026", title: "Prelekcja" },
        { id: "m2", date: "2026-01-12", izrzSign: "2/2026", title: "Warsztat" },
        { id: "m3", date: "2026-01-15", izrzSign: "PZ/1/2026", title: "Wizytacja SP 1" },
        { id: "m4", date: "2026-01-18", izrzSign: "PZ/2/2026", title: "Wizytacja Przedszkole" },
        { id: "m5", date: "2026-01-20", izrzSign: "N/1/2026", title: "Narada roczna" },
      ];

      // Kolejne standardowe działanie -> 3/2026
      const nextStd = generateNextIzrzSign({
        year: 2026,
        actions: mixedActions as OzipzAction[],
        title: "Zajęcia edukacyjne",
      });
      expect(nextStd).toBe("3/2026");

      // Kolejna wizytacja -> PZ/3/2026
      const nextPz = generateNextIzrzSign({
        year: 2026,
        actions: mixedActions as OzipzAction[],
        title: "Wizytacja półkolonii",
      });
      expect(nextPz).toBe("PZ/3/2026");

      // Kolejna narada -> N/2/2026
      const nextN = generateNextIzrzSign({
        year: 2026,
        actions: mixedActions as OzipzAction[],
        title: "Narada koordynatorów",
      });
      expect(nextN).toBe("N/2/2026");
    });

    it("resetuje sekwencję IZRZ w nowym roku kalendarzowym", () => {
      const actions2026: Partial<OzipzAction>[] = [
        { id: "act-26", date: "2026-12-15", izrzSign: "85/2026", title: "Prelekcja" },
        { id: "act-pz-26", date: "2026-12-16", izrzSign: "PZ/10/2026", title: "Wizytacja" },
      ];

      // W roku 2027 zaczynamy od 1/2027 i PZ/1/2027
      const nextStd2027 = generateNextIzrzSign({
        year: 2027,
        actions: actions2026 as OzipzAction[],
        title: "Noworoczna prelekcja",
      });
      expect(nextStd2027).toBe("1/2027");

      const nextPz2027 = generateNextIzrzSign({
        year: 2027,
        actions: actions2026 as OzipzAction[],
        title: "Wizytacja zimowiska",
      });
      expect(nextPz2027).toBe("PZ/1/2027");
    });

    it("formatActionIzrzNumber zwraca znak lub myślnik gdy brak", () => {
      expect(formatActionIzrzNumber({ izrzSign: "15/2026" } as OzipzAction)).toBe("15/2026");
      expect(formatActionIzrzNumber({ izrzSign: "" } as OzipzAction)).toBe("—");
      expect(formatActionIzrzNumber({} as OzipzAction)).toBe("—");
    });
  });

  /* =========================================================================
   * 5. Metryki IZRZ, Szablony, Powiązania z Działaniami i Kancelarią EZD
   * ========================================================================= */
  describe("5. Metryki IZRZ, Szablony, Powiązania z Działaniami i Kancelarią EZD", () => {
    const sampleFacility: OzipzFacility = {
      id: "fac-mysl-1",
      name: "Szkoła Podstawowa nr 1",
      type: "szkola_podstawowa",
      address: "ul. Kombatantów 1",
      city: "Myślibórz",
      postalCode: "74-300",
      municipality: "Myślibórz",
      county: "powiat myśliborski",
      leadingAuthority: "Gmina Myślibórz",
      isComplex: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    const sampleAction: OzipzAction = {
      id: "act-full-1",
      title: "Prelekcja o zdrowym żywieniu",
      actionType: "Prelekcja (warsztat)",
      date: "2026-05-14",
      facilityId: "fac-mysl-1",
      facilityName: "Szkoła Podstawowa nr 1",
      municipality: "Myślibórz",
      programId: "prog-tf",
      programName: "Trzymaj Formę!",
      topic: "zdrowe_zywienie",
      audienceGroup: "Uczniowie klasy 7a - 24",
      jrwaSign: "OZ.966.1.12.2026",
      izrzSign: "IZRZ: 12/2026",
      ezdStatus: "w_ezd",
      status: "wykonane",
      participantsCount: 24,
      indirectRecipientsCount: 40,
      materialsDistributedCount: 24,
      leadEducator: "Krzysztof Palpuchowski",
      notes: "Omówiono piramidę żywieniową.",
      createdAt: "2026-05-14",
      updatedAt: "2026-05-14",
    };

    it("prepareIzrzData generuje kompletną, spójną metrykę IZRZ", () => {
      const data = prepareIzrzData(sampleAction, sampleFacility);

      expect(data.caseNumber).toBe("OZiPZ.966.1.12.2026");
      expect(data.reportNumber).toBe("12/2026");
      expect(data.programName).toBe("Trzymaj Formę!");
      expect(data.taskType).toBe("Prelekcja (warsztat)");
      expect(data.city).toBe("Myślibórz");
      expect(data.address).toContain("ul. Kombatantów 1");
      expect(data.dateIso).toBe("2026-05-14");
      expect(data.dateFormatted).toBe("14.05.2026");
      expect(data.viewerCount).toBe(24);
      // Odbiorcy pośredni nie są częścią IZRZ — pkt 5 opisuje wyłącznie grupę docelową.
      expect(data.viewerCountDescription).toBe("Uczniowie klasy 7a - 24");
      expect(data.viewerCountDescription).not.toMatch(/pośredn/i);
      expect(data.taskDescription).toBe("Omówiono piramidę żywieniową.");
      expect(data.hasDistributionList).toBe(true);
      expect(data.leadEducator).toBe("Krzysztof Palpuchowski");
    });

    it("prepareIzrzData wstawia [PROJEKT - przed zatwierdzeniem] gdy brak izrzSign", () => {
      const draftAction = {
        ...sampleAction,
        izrzSign: undefined,
      };

      const data = prepareIzrzData(draftAction, sampleFacility);
      expect(data.reportNumber).toBe("[PROJEKT - przed zatwierdzeniem]");
    });

    it("generuje bezpieczne nazwy plików IZRZ (DOCX) bez polskich znaków diakrytycznych", () => {
      const data = prepareIzrzData(sampleAction, sampleFacility);
      const fileName = buildIzrzDocxFileName(data);

      expect(fileName).toMatch(/^IZRZ_12-2026_2026-05-14_Mysliborz_Trzymaj-Forme\.docx$/);
      // Brak znaków spoza ASCII w nazwie pliku
      expect(fileName).not.toMatch(/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/);
    });

    it("toAsciiSlug prawidłowo oczyszcza polskie znaki", () => {
      expect(toAsciiSlug("Żółw i Gęś w Myśliborzu")).toBe("Zolw-i-Ges-w-Mysliborzu");
      expect(toAsciiSlug("Trzymaj Formę! (edycja 2025/2026)")).toBe("Trzymaj-Forme-edycja-2025-2026");
    });

    it("getActionEzdState prawidłowo określa stany EZD", () => {
      // 1. Publikacja w mediach -> "publication"
      expect(getActionEzdState({ actionType: "Publikacja media" } as OzipzAction)).toBe("publication");

      // 2. Nie dotyczy / brak EZD -> "not_applicable"
      expect(getActionEzdState({ ezdStatus: "nie_dotyczy" } as OzipzAction)).toBe("not_applicable");
      expect(getActionEzdState({ ezdStatus: "brak_ezd" } as OzipzAction)).toBe("not_applicable");

      // 3. Zarejestrowane w EZD -> "registered"
      expect(getActionEzdState({ ezdStatus: "w_ezd" } as OzipzAction)).toBe("registered");
      expect(getActionEzdState({ ezdStatus: "zarejestrowana" } as OzipzAction)).toBe("registered");
      expect(getActionEzdState({ jrwaSign: "OZiPZ.966.1.1.2026" } as OzipzAction)).toBe("registered");

      // 4. Do EZD -> "pending"
      expect(getActionEzdState({ ezdStatus: "do_ezd" } as OzipzAction)).toBe("pending");
      expect(getActionEzdState({ ezdStatus: "" } as OzipzAction)).toBe("pending");

      // 5. Akcja z ezdStatus: "do_ezd" i wypełnionym jrwaSign MUSI pozostać "pending"
      expect(
        getActionEzdState({
          actionType: "Prelekcja",
          ezdStatus: "do_ezd",
          jrwaSign: "OZiPZ.966.1.1.2026",
        } as OzipzAction)
      ).toBe("pending");
    });
  });

  /* =========================================================================
   * 6. Relacyjna Baza Danych (SQLite & Fallback) – Spójność i Transakcje
   * ========================================================================= */
  describe("6. Relacyjna Baza Danych (SQLite & Fallback) – Spójność i Transakcje", () => {
    let inMemoryDb: ISqlDatabase;
    let sqliteService: SqliteDatabaseService;
    let fallbackService: FallbackDatabaseService;

    beforeEach(async () => {
      localStorage.clear();
      fallbackService = new FallbackDatabaseService();

      inMemoryDb = createInMemorySqlite();
      await initTables(inMemoryDb);
      sqliteService = new SqliteDatabaseService(inMemoryDb);
    });

    it("SQLite: saveActionWithRelations atomowo tworzy sprawę JRWA, nadaje unikalny znak i wiąże z działaniem", async () => {
      const result = await sqliteService.saveActionWithRelations({
        action: {
          title: "Warsztaty Trzymaj Formę",
          actionType: "Prelekcja",
          date: "2026-04-10",
          facilityName: "Szkoła Podstawowa nr 1",
          municipality: "Myślibórz",
          topic: "zdrowe_zywienie",
          audienceGroup: "Uczniowie",
          participantsCount: 30,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          leadEducator: "Jan Nowak",
          jrwaSign: "OZiPZ.9020.101.2026",
          izrzSign: "1/2026",
          ezdStatus: "w_ezd",
          status: "wykonane",
        },
        autoCreateJrwa: {
          section: "OZiPZ",
          jrwaSymbol: "9020",
          caseNumber: 101,
          year: 2026,
          fullCaseSign: "OZiPZ.9020.101.2026",
        },
      });

      expect(result.action).toBeDefined();
      expect(result.jrwaCase).toBeDefined();
      expect(result.jrwaCase?.fullCaseSign).toBe("OZiPZ.9020.101.2026");
      expect(result.jrwaCase?.caseNumber).toBe(101);
      expect(result.action.jrwaCaseId).toBe(result.jrwaCase?.id);
      expect(result.action.jrwaSign).toBe("OZiPZ.9020.101.2026");
      expect(result.action.izrzSign).toBe("1/2026");

      // Sprawdź w tabeli ozipz_jrwa_cases
      const casesInDb = await sqliteService.getJrwaCases();
      const foundCase = casesInDb.find((c) => c.fullCaseSign === "OZiPZ.9020.101.2026");
      expect(foundCase).toBeDefined();

      // Sprawdź w tabeli ozipz_actions
      const actionsInDb = await sqliteService.getActions();
      const foundAction = actionsInDb.find((a) => a.id === result.action.id);
      expect(foundAction).toBeDefined();
      expect(foundAction?.jrwaCaseId).toBe(result.jrwaCase?.id);
    });

    it("SQLite: wymusza unikalność znaku sprawy (UNIQUE full_case_sign)", async () => {
      const fullCaseSign = "OZiPZ.9020.999.2026";
      // Wstawienie pierwszej sprawy
      await sqliteService.addJrwaCase({
        section: "OZiPZ",
        jrwaSymbol: "9020",
        caseNumber: 999,
        year: 2026,
        fullCaseSign,
        title: "Pierwsza sprawa",
        status: "w_toku",
        assignedEducator: "Edukator",
      });

      // Próba wstawienia drugiej sprawy z tym samym fullCaseSign powinna rzucić błąd
      await expect(
        sqliteService.addJrwaCase({
          section: "OZiPZ",
          jrwaSymbol: "9020",
          caseNumber: 1000, // inny caseNumber ale ten sam fullCaseSign
          year: 2026,
          fullCaseSign,
          title: "Druga sprawa z kolizją znaku",
          status: "w_toku",
          assignedEducator: "Edukator",
        })
      ).rejects.toThrow();
    });

    it("SQLite: wymusza unikalność (section, jrwa_symbol, case_number, year)", async () => {
      await sqliteService.addJrwaCase({
        section: "OZiPZ",
        jrwaSymbol: "9020",
        caseNumber: 555,
        year: 2026,
        fullCaseSign: "OZiPZ.9020.555.2026",
        title: "Sprawa nr 555",
        status: "w_toku",
        assignedEducator: "Edukator",
      });

      // Próba wstawienia z tym samym numerem w tej samej teczce i roku
      await expect(
        sqliteService.addJrwaCase({
          section: "OZiPZ",
          jrwaSymbol: "9020",
          caseNumber: 555,
          year: 2026,
          fullCaseSign: "OZiPZ.9020.555.2026.ALTERNATYWNY",
          title: "Kolizja klucza teczki",
          status: "w_toku",
          assignedEducator: "Edukator",
        })
      ).rejects.toThrow();
    });

    it("SQLite: usunięcie sprawy JRWA odwiązuje jrwa_case_id w działaniu (ON DELETE SET NULL)", async () => {
      const res = await sqliteService.saveActionWithRelations({
        action: {
          title: "Działanie ze sprawą",
          actionType: "Prelekcja",
          date: "2026-05-01",
          facilityName: "SP 1",
          municipality: "Myślibórz",
          topic: "higiena",
          audienceGroup: "Dzieci",
          participantsCount: 20,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          leadEducator: "Edukator",
          ezdStatus: "w_ezd",
          status: "wykonane",
        },
        autoCreateJrwa: {
          section: "OZiPZ",
          jrwaSymbol: "9020",
          caseNumber: 777,
          year: 2026,
          fullCaseSign: "OZiPZ.9020.777.2026",
        },
      });

      const caseId = res.jrwaCase!.id;
      const actionId = res.action.id;

      // Usuń sprawę JRWA
      await sqliteService.deleteJrwaCase(caseId);

      // Sprawdź czy działanie nadal istnieje, a jrwaCaseId zostało wyzerowane (w domenie undefined, w SQLite NULL)
      const actions = await sqliteService.getActions();
      const updatedAction = actions.find((a) => a.id === actionId);
      expect(updatedAction).toBeDefined();
      expect(updatedAction?.jrwaCaseId).toBeUndefined();

      // Bezpośrednie sprawdzenie w SQLite potwierdza wartość NULL
      const rawRows = await inMemoryDb.select<{ jrwa_case_id: unknown }[]>(
        "SELECT jrwa_case_id FROM ozipz_actions WHERE id = $1",
        [actionId]
      );
      expect(rawRows[0].jrwa_case_id).toBeNull();
    });

    it("FallbackService: saveActionWithRelations prawidłowo obsługuje autoCreateJrwa w środowisku Web/LocalStorage", async () => {
      const res = await fallbackService.saveActionWithRelations({
        action: {
          title: "Warsztaty w Fallback",
          actionType: "Prelekcja",
          date: "2026-06-15",
          facilityName: "Przedszkole Miejskie",
          municipality: "Myślibórz",
          topic: "zdrowe_zeby",
          audienceGroup: "Dzieci (5-6 lat)",
          participantsCount: 25,
          indirectRecipientsCount: 0,
          materialsDistributedCount: 0,
          leadEducator: "Jan Nowak",
          jrwaSign: "OZiPZ.9020.888.2026",
          izrzSign: "5/2026",
          ezdStatus: "w_ezd",
          status: "wykonane",
        },
        autoCreateJrwa: {
          section: "OZiPZ",
          jrwaSymbol: "9020",
          caseNumber: 888,
          year: 2026,
          fullCaseSign: "OZiPZ.9020.888.2026",
        },
      });

      expect(res.action).toBeDefined();
      expect(res.jrwaCase).toBeDefined();
      expect(res.jrwaCase?.fullCaseSign).toBe("OZiPZ.9020.888.2026");
      expect(res.action.jrwaCaseId).toBe(res.jrwaCase?.id);

      const cases = await fallbackService.getJrwaCases();
      expect(cases.some((c) => c.fullCaseSign === "OZiPZ.9020.888.2026")).toBe(true);
    });

    it("SQLite: zapisuje i odczytuje pismo powiązane ze sprawą JRWA (caseSign)", async () => {
      const caseSign = "OZiPZ.966.1.888.2026";

      // 1. Zarejestruj sprawę JRWA
      await sqliteService.addJrwaCase({
        section: "OZiPZ",
        jrwaSymbol: "966.1",
        caseNumber: 888,
        year: 2026,
        fullCaseSign: caseSign,
        title: "Sprawa główna Trzymaj Formę",
        status: "w_toku",
        assignedEducator: "Jan Nowak",
      });

      // 2. Dodaj pismo wychodzące powiązane ze znakiem sprawy
      const letter = await sqliteService.addLetter({
        direction: "wychodzace",
        letterNumber: "1/2026",
        letterDate: "2026-03-01",
        caseSign,
        senderRecipient: "SP 1 Myślibórz",
        subject: "Pismo intencyjne",
        assignedPerson: "Jan Nowak",
        status: "wyslane",
      });

      expect(letter.id).toBeDefined();
      expect(letter.caseSign).toBe(caseSign);

      // 3. Pobierz listę pism i sprawdź powiązanie
      const letters = await sqliteService.getLetters();
      const found = letters.find((l) => l.id === letter.id);
      expect(found).toBeDefined();
      expect(found?.caseSign).toBe(caseSign);
      expect(found?.direction).toBe("wychodzace");

      // 4. Aktualizacja i usunięcie pisma
      await sqliteService.updateLetter(letter.id, { status: "odpowiedziane" });
      const updatedLetters = await sqliteService.getLetters();
      expect(updatedLetters.find((l) => l.id === letter.id)?.status).toBe("odpowiedziane");

      await sqliteService.deleteLetter(letter.id);
      const afterDelete = await sqliteService.getLetters();
      expect(afterDelete.some((l) => l.id === letter.id)).toBe(false);
    });

    it("FallbackService: zapisuje i odczytuje pismo powiązane ze sprawą JRWA w LocalStorage", async () => {
      const caseSign = "OZiPZ.966.4.1.2026";

      const letter = await fallbackService.addLetter({
        direction: "przychodzace",
        letterNumber: "SP2/44/2026",
        letterDate: "2026-04-05",
        caseSign,
        senderRecipient: "SP 2 Myślibórz",
        subject: "Zgłoszenie do konkursu higieny",
        assignedPerson: "Anna Kowalska",
        status: "nowe",
      });

      expect(letter.id).toBeDefined();
      expect(letter.caseSign).toBe(caseSign);

      const letters = await fallbackService.getLetters();
      expect(letters.some((l) => l.id === letter.id && l.caseSign === caseSign)).toBe(true);

      await fallbackService.deleteLetter(letter.id);
      const afterDelete = await fallbackService.getLetters();
      expect(afterDelete.some((l) => l.id === letter.id)).toBe(false);
    });
  });
});
