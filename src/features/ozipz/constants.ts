/** Symbol komórki organizacyjnej w znakach spraw JRWA (np. OZiPZ.9012.1.2026). */
export const JRWA_DEFAULT_SECTION = "OZiPZ";

export interface DictionaryCategoryDef {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeClass: string;
}

export const DICTIONARY_CATEGORIES_CONFIG: Record<string, DictionaryCategoryDef> = {
  activityType: {
    key: "activityType",
    label: "Formy Działań",
    shortLabel: "Działania",
    description: "Typy i formy aktywności edukacyjno-profilaktycznych (np. prelekcja, warsztat, stoisko, narada)",
    iconName: "Activity",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  recipientGroup: {
    key: "recipientGroup",
    label: "Grupy Odbiorców",
    shortLabel: "Odbiorcy",
    description: "Grupy docelowe i kategorie uczestników (np. przedszkolaki, uczniowie SP, kadra pedagogiczna)",
    iconName: "Users",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  locationType: {
    key: "locationType",
    label: "Typy Lokalizacji",
    shortLabel: "Lokalizacje",
    description: "Kategorie placówek i miejsc realizacji działań (np. przedszkole, szkoła, urząd, zakład pracy)",
    iconName: "Building2",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  materialType: {
    key: "materialType",
    label: "Typy Materiałów",
    shortLabel: "Materiały",
    description: "Rodzaje materiałów oświatowych (np. ulotka, plakat, broszura, mini poradnik, gadżet)",
    iconName: "Package",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  campaign: {
    key: "campaign",
    label: "Akcje Profilaktyczne",
    shortLabel: "Akcje",
    description: "Akcje sezonowe, akcje cykliczne, dni zdrowia i przedsięwzięcia profilaktyczne (np. Bezpieczne Wakacje, Bezpieczne Ferie, Światowy Dzień Zdrowia)",
    iconName: "Sparkles",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  annotationReason: {
    key: "annotationReason",
    label: "Powody Adnotacji i Odroczeń",
    shortLabel: "Powody odroczeń",
    description: "Uzasadnienia przesunięć, odroczeń lub zmian w realizacji planu pracy",
    iconName: "AlertCircle",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  jrwaSymbol: {
    key: "jrwaSymbol",
    label: "Symbole JRWA",
    shortLabel: "JRWA",
    description: "Symbole jednolitego rzeczowego wykazu akt dla spraw i dokumentacji OZiPZ (np. 0442, 9011.1-9011.2, 966.1-966.18)",
    iconName: "Bookmark",
    badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  },
  municipality: {
    key: "municipality",
    label: "Gminy Powiatu",
    shortLabel: "Gminy",
    description: "Słownik jednostek administracyjnych / gmin powiatu myśliborskiego i ościennych",
    iconName: "MapPin",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  staffRole: {
    key: "staffRole",
    label: "Stanowiska Pracowników",
    shortLabel: "Stanowiska OZiPZ",
    description: "Stanowiska służbowe i role pracownicze w Sekcji OZiPZ PSSE",
    iconName: "Briefcase",
    badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  contactPosition: {
    key: "contactPosition",
    label: "Stanowiska Koordynatorów / Kontaktów",
    shortLabel: "Koordynatorzy",
    description: "Funkcje i stanowiska koordynatorów szkolnych oraz osób kontaktowych w placówkach",
    iconName: "UserCheck",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  documentType: {
    key: "documentType",
    label: "Typy Dokumentów i Skanów",
    shortLabel: "Typy dokumentów",
    description: "Kategorie skanowanych pism, deklaracji, sprawozdań i protokołów",
    iconName: "FileText",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
};

/** Miejsce i odbiorcy wpisywani automatycznie dla publikacji w mediach, które nie mają placówki. */
export const PUBLICATION_DEFAULTS = {
  facilityName: "PSSE Myślibórz (media / publikacja internetowa)",
  municipality: "Myślibórz",
  audienceGroup: "Społeczność lokalna / Internauci",
} as const;

export interface JrwaClassDefinition {
  code: string;
  category: string;
  title: string;
  description: string;
}

export const JRWA_CLASSES_DEFINITIONS: JrwaClassDefinition[] = [
  {
    code: "0442",
    category: "B-5",
    title: "Sprawozdawczość Statystyczna",
    description: "Miesięczne, półroczne i roczne sprawozdania przesyłane do WSSE i GIS.",
  },
  {
    code: "9010",
    category: "B-5",
    title: "Organizowanie Działań Edukacyjnych",
    description: "Koordynacja, planowanie i organizacja lokalnych przedsięwzięć prozdrowotnych.",
  },
  {
    code: "9011",
    category: "B-5",
    title: "Programy Profilaktyczne GIS/MZ",
    description: "Realizacja ogólnopolskich i wojewódzkich programów profilaktycznych w placówkach.",
  },
  {
    code: "9013",
    category: "B-5",
    title: "Konkursy i Olimpiady Wiedzy",
    description: "Rejestry, regulaminy, protokoły komisji konkursowych i nagradzanie laureatów.",
  },
  {
    code: "9020",
    category: "B-5",
    title: "Dystrybucja Materiałów Edukacyjnych",
    description: "Gospodarka materiałowa, ewidencja ulotek, broszur, plakatów oraz protokoły przekazania.",
  },
];

export { ADNOTACJA_POWODY } from "./utils/adnotacjaUtils";
export {
  TYPY_KSZTALCENIA,
  CANONICAL_EDUCATION_TYPES,
  EDUCATION_TYPE_PRESETS,
  type EducationTypePreset,
} from "./utils/educationTypesUtils";
export { IZRZ_SERIE } from "./utils/izrzUtils";
export { PISMA_ORG_DEFAULTS } from "./utils/letterUtils";
