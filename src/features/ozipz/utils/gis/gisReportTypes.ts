import type { GisCategory, OzipzAction } from "../../types/ozipz.types";

/** Obszary sprawozdania GIS (bez technicznej wartości "brak") */
export type GisReportCategoryId = Exclude<GisCategory, "brak">;

export type GisProgramType = "programowe" | "nieprogramowe";

export type GisFormCategory =
  | "wizytacja"
  | "szkolenie"
  | "konkurs"
  | "prelekcja"
  | "event"
  | "publikacja-strona"
  | "social-media"
  | "dystrybucja"
  | "other";

/** Pola 1–20 formularza „Sprawozdanie – art. 6” (pkt 7–9 uzupełniane ręcznie) */
export interface GisReportData {
  powiat: string;
  interwencje: string[];
  grupyOdbiorcow: string[];
  zidentyfikowanePodmioty: string[];
  zidentyfikowaneMiejscaDystrybucji: string[];
  /** Pomocnicze (nie ma go w formularzu GIS): łączna liczba działań w grupie */
  liczbaDzialan: number;
  liczbaOdbiorcow: number;
  liczbaPodmiotow: number;
  liczbaWizytacji: number;
  liczbaSzkolen: number;
  liczbaOdbiorcowSzkolen: number;
  liczbaKonkursow: number;
  liczbaUczestnikowKonkursow: number;
  liczbaPrelekcji: number;
  liczbaOdbiorcowPrelekcji: number;
  liczbaEventow: number;
  liczbaPostowSocialMedia: number;
  liczbaObserwatorowSocialMedia: number;
  liczbaPublikacjiStrona: number;
  liczbaMiejscDystrybucjiMateria: number;
}

export type GisReportMatrix = Record<GisReportCategoryId, Record<GisProgramType, GisReportData>>;

export type GisUnclassifiedReason = "brak-symbolu" | "brak-kategorii" | "poza-sprawozdaniem";

export interface GisUnclassifiedAction {
  action: OzipzAction;
  symbol: string | null;
  reason: GisUnclassifiedReason;
}

export interface GisCategorizationStats {
  totalActions: number;
  totalRecipients: number;
  categorizedActions: number;
  categorizedRecipients: number;
  uncategorizedActions: number;
  uncategorizedRecipients: number;
  categorizedPercentage: number;
  unclassified: GisUnclassifiedAction[];
}

export interface GisReportResult {
  reports: GisReportMatrix;
  stats: GisCategorizationStats;
}
