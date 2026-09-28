export type ImportSourceId = "gov" | "x";

/** Publikacja odczytana ze źródła zewnętrznego (strona gov.pl albo profil X). */
export interface ScrapedPublication {
  /** Stabilny klucz wiersza (link kanoniczny albo x:<id>). */
  key: string;
  source: ImportSourceId;
  date: string; // YYYY-MM-DD
  title: string;
  /** Pełna treść wpisu (X) – porównywana z ewidencją obok tytułu. */
  text?: string;
  url: string;
  /** Adres docelowy po przekierowaniach (gov.pl). */
  finalUrl: string;
  /** Wpis prowadzi do innej jednostki (np. GIS, WSSE) – nie jest własną publikacją PSSE. */
  external: boolean;
  /** Nie udało się sprawdzić przekierowania – status "własny" jest niepewny. */
  unverified?: boolean;
  programId?: string;
  programName?: string;
  topic: string;
  suggestedJrwa?: string;
}
