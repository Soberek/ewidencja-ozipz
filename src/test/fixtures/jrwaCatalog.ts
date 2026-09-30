import type { OzipzDictionaryItem } from "../../features/ozipz/types/ozipz.types";
import type { GisCategory } from "../../features/ozipz/schemas/ozipzCoreSchemas";

export interface KnownJrwaItem {
  symbol: string;
  label: string;
  description?: string;
  kind?: "PROGRAMOWE" | "NIEPROGRAMOWE";
  /** Domyślny obszar kwartalnego sprawozdania GIS (edytowalny w Słownikach) */
  gisCategory?: GisCategory;
}

/**
 * Przykładowy słownik JRWA do testów (aplikacja czyta symbole wyłącznie z bazy)
 */
export const KNOWN_JRWA_CATALOG: KnownJrwaItem[] = [
  { symbol: "0442", label: "Sprawozdawczość Statystyczna", description: "Miesięczne, półroczne i roczne sprawozdania przesyłane do WSSE i GIS", kind: "NIEPROGRAMOWE", gisCategory: "brak" },
  { symbol: "9011.1", label: "Wymiana Informacji - Współpraca z WSSE", description: "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z WSSE", kind: "NIEPROGRAMOWE", gisCategory: "brak" },
  { symbol: "9011.2", label: "Wymiana Informacji - Organy Podległe", description: "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z organami podległymi", kind: "NIEPROGRAMOWE", gisCategory: "brak" },
  { symbol: "966.1", label: "Trzymaj Formę", description: "Program edukacyjny Trzymaj Formę", kind: "PROGRAMOWE", gisCategory: "otylosc" },
  { symbol: "966.2", label: "Krajowy Program Zapobiegania HIV i Zwalczania AIDS", description: "Krajowy Program Zapobiegania Zakażeniom HIV i Zwalczania AIDS", kind: "PROGRAMOWE", gisCategory: "sti" },
  { symbol: "966.3", label: "Zdrowe Zęby Mamy, Marchewkę Zajadamy", description: "Program edukacyjny Zdrowe zęby mamy, marchewkę zajadamy", kind: "PROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.4", label: "Higiena Naszą Tarczą Ochronną", description: "Program edukacyjny Higiena naszą tarczą ochronną", kind: "PROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.5", label: "Porozmawiajmy o Zdrowiu i Nowych Zagrożeniach", description: "Program edukacyjny Porozmawiajmy o zdrowiu i nowych zagrożeniach", kind: "PROGRAMOWE", gisCategory: "uzaleznienia" },
  { symbol: "966.6", label: "Profilaktyka Używania Substancji Psychoaktywnych", description: "NSP, nikotyna, światowe dni związane z nikotyną, alkohol", kind: "NIEPROGRAMOWE", gisCategory: "uzaleznienia" },
  { symbol: "966.7", label: "Promocja Zdrowego Stylu Życia, Aktywności i Odżywiania", description: "#mojaszkołazdrowaszkoła, Dni otwarte PIS, FitSchool", kind: "NIEPROGRAMOWE", gisCategory: "otylosc" },
  { symbol: "966.8", label: "Profilaktyka Chorób Zakaźnych", description: "Podstępne WZW, Jesień bez infekcji, borelioza, KZM, grypa, covid, HPV", kind: "NIEPROGRAMOWE", gisCategory: "szczepienia" },
  { symbol: "966.9", label: "Profilaktyka Chorób Nowotworowych", description: "Znamię! znam je?, Bądź swoją bohaterką, profilaktyka onkologiczna", kind: "NIEPROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.10", label: "Promocja Bezpiecznego Grzybobrania", description: "Promocja bezpiecznego grzybobrania i profilaktyka zatruć grzybami", kind: "NIEPROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.11", label: "Promocja Szczepień Ochronnych", description: "Europejski Tydzień Szczepień, edukacja o szczepieniach ochronnych", kind: "NIEPROGRAMOWE", gisCategory: "szczepienia" },
  { symbol: "966.12", label: "Światowy Dzień Zdrowia", description: "Obchody Światowego Dnia Zdrowia", kind: "NIEPROGRAMOWE", gisCategory: "otylosc" },
  { symbol: "966.13", label: "Europejski i Światowy Dzień Wiedzy o Antybiotykach", description: "Europejski i Światowy Dzień Wiedzy o Antybiotykach", kind: "NIEPROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.14", label: "Bezpieczne Wakacje i Bezpieczne Ferie", description: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego", kind: "NIEPROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.15", label: "Seniorzy (Senior w Roli Głównej)", description: "Program edukacyjny Senior w roli głównej", kind: "PROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.16", label: "Promocja Zdrowia Psychicznego", description: "Tylko pomyśl, profilaktyka depresji", kind: "NIEPROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.17", label: "Wpływ Czynników Środowiskowych na Zdrowie", description: "PEM, radon, jakość środowiska", kind: "NIEPROGRAMOWE", gisCategory: "inne" },
  { symbol: "966.18", label: "#MłodziŚwiadomi", description: "Program profilaktyczny #MłodziŚwiadomi", kind: "PROGRAMOWE", gisCategory: "sti" },
];

/** Słownik JRWA w postaci wierszy `ozipz_dictionaries` – tak, jak aplikacja wczytuje go z bazy. */
export const JRWA_DICTIONARY_FIXTURE: OzipzDictionaryItem[] = KNOWN_JRWA_CATALOG.map((d) => ({
  id: `dict_jrwa_${d.symbol.replace(/\./g, "_")}`,
  dictType: "jrwaSymbol",
  code: d.symbol,
  label: d.label,
  description: d.description || `Symbol JRWA ${d.symbol} w wykazie akt OZiPZ`,
  kind: d.kind,
  gisCategory: d.gisCategory,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));
