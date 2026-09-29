/**
 * Fikstura testowa: historyczny snapshot Firebase edu-report-v3. Nie trafia do buildu aplikacji.
 */
import type {
  OzipzFacility,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzAction,
  OzipzMaterial,
  OzipzDistribution,
  OzipzScheduleEvent,
  OzipzJrwaCase,
  OzipzTemplate,
  OzipzDictionaryItem,
  OzipzStaff,
  OzipzContact,
  OzipzPublication,
  OzipzLetter,
  OzipzScan,
  OzipzRegisterItem,
} from "../../features/ozipz/types/ozipz.types";
import { ADNOTACJA_POWODY } from "./annotationReasonsSeed";
import { KNOWN_JRWA_CATALOG, getProgramJrwaSymbol } from "../../features/ozipz/utils/programJrwaUtils";
import rawData from "./firebase_migrated_data.json";
import { cleanLegacyFacilityContact } from "../../db/sqlite-migrations";

export interface MigratedDataStructure {
  facilities: OzipzFacility[];
  programs: OzipzProgram[];
  participations: OzipzSchoolParticipation[];
  actions: OzipzAction[];
  materials: OzipzMaterial[];
  distributions: OzipzDistribution[];
  schedules: OzipzScheduleEvent[];
  jrwaCases: OzipzJrwaCase[];
  templates: OzipzTemplate[];
  dictionaryItems: OzipzDictionaryItem[];
  staff: OzipzStaff[];
  contacts: OzipzContact[];
  publications: OzipzPublication[];
  letters: OzipzLetter[];
  scans: OzipzScan[];
  registers: OzipzRegisterItem[];
}

const parsedRaw = rawData as unknown as MigratedDataStructure;

const existingDictKeys = new Set(parsedRaw.dictionaryItems.map((d) => `${d.dictType}:${d.code}`));

const missingAnnotationItems: OzipzDictionaryItem[] = ADNOTACJA_POWODY.filter(
  (p) => !existingDictKeys.has(`annotationReason:${p.kod}`)
).map((p) => ({
  id: `dict_ann_${p.kod}`,
  dictType: "annotationReason",
  code: p.kod,
  label: p.tytul,
  description: p.opis,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

const initialMunicipalities = [
  { code: "mysliborz", label: "Myślibórz", postalCode: "74-300", desc: "Gmina miejsko-wiejska Myślibórz (kod: 74-300)" },
  { code: "barlinek", label: "Barlinek", postalCode: "74-320", desc: "Gmina miejsko-wiejska Barlinek (kod: 74-320)" },
  { code: "debno", label: "Dębno", postalCode: "74-400", desc: "Gmina miejsko-wiejska Dębno (kod: 74-400)" },
  { code: "nowogrodek_pomorski", label: "Nowogródek Pomorski", postalCode: "74-304", desc: "Gmina wiejska Nowogródek Pomorski (kod: 74-304)" },
  { code: "boleszkowice", label: "Boleszkowice", postalCode: "74-404", desc: "Gmina wiejska Boleszkowice (kod: 74-404)" },
];

const missingMunicipalities: OzipzDictionaryItem[] = initialMunicipalities.filter(
  (m) => !existingDictKeys.has(`municipality:${m.code}`)
).map((m) => ({
  id: `dict_muni_${m.code}`,
  dictType: "municipality",
  code: m.code,
  label: m.label,
  description: m.desc,
  postalCode: m.postalCode,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

const initialRoles = [
  { code: "kierownik", label: "Kierownik Sekcji OZiPZ", desc: "Kierownik sekcji oświaty zdrowotnej" },
  { code: "starszy_asystent", label: "Starszy Asystent OZiPZ", desc: "Samodzielna realizacja i ewaluacja programów" },
  { code: "asystent", label: "Asystent OZiPZ", desc: "Prowadzenie prelekcji i rejestrów" },
  { code: "mlodszy_asystent", label: "Młodszy Asystent OZiPZ", desc: "Działania wspierające i dystrybucja" },
  { code: "koordynator", label: "Koordynator Programów Edukacyjnych", desc: "Koordynacja programów profilaktycznych" },
  { code: "referent", label: "Referent OZiPZ", desc: "Sprawy kancelaryjne i administracyjne" },
];

const missingRoles: OzipzDictionaryItem[] = initialRoles.filter(
  (r) => !existingDictKeys.has(`staffRole:${r.code}`)
).map((r) => ({
  id: `dict_role_${r.code}`,
  dictType: "staffRole",
  code: r.code,
  label: r.label,
  description: r.desc,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

const initialPositions = [
  { code: "dyrektor", label: "Dyrektor Szkoły / Placówki", desc: "Kierownictwo jednostki oświatowej" },
  { code: "wicedyrektor", label: "Wicedyrektor", desc: "Zastępca dyrektora" },
  { code: "koordynator_szkolny", label: "Szkolny Koordynator Programu", desc: "Nauczyciel koordynujący realizację programu" },
  { code: "pedagog", label: "Pedagog Szkolny", desc: "Specjalista ds. pedagogicznych" },
  { code: "psycholog", label: "Psycholog Szkolny", desc: "Wsparcie psychologiczno-pedagogiczne" },
  { code: "pielegniarka", label: "Pielęgniarka Środowiska Nauczania", desc: "Opieka zdrowotna w placówce" },
  { code: "nauczyciel_biologii", label: "Nauczyciel Biologii / Przyrody", desc: "Kadra przedmiotowa" },
  { code: "wychowawca", label: "Wychowawca Klasy", desc: "Opiekun oddziału szkolnego" },
  { code: "sekretariat", label: "Sekretariat / Kancelaria", desc: "Obsługa korespondencji" },
];

const missingPositions: OzipzDictionaryItem[] = initialPositions.filter(
  (p) => !existingDictKeys.has(`contactPosition:${p.code}`)
).map((p) => ({
  id: `dict_pos_${p.code}`,
  dictType: "contactPosition",
  code: p.code,
  label: p.label,
  description: p.desc,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

const initialDocTypes = [
  { code: "deklaracja", label: "Deklaracja uczestnictwa w programie", desc: "Zgłoszenie placówki na rok szkolny" },
  { code: "sprawozdanie", label: "Sprawozdanie końcowe z programu", desc: "Raport merytoryczno-liczbowy szkoły" },
  { code: "pismo", label: "Pismo przewodnie / Wychodzące", desc: "Oficjalna korespondencja urzędowa" },
  { code: "protokol", label: "Protokół z narady / szkolenia", desc: "Podsumowanie ustaleń ze spotkania" },
  { code: "fotografia", label: "Dokumentacja fotograficzna", desc: "Zdjęcia z przebiegu akcji i stoisk" },
  { code: "rozdzielnik", label: "Rozdzielnik materiałów oświatowych", desc: "Potwierdzenie odbioru materiałów" },
  { code: "inny", label: "Inny dokument urzędowy", desc: "Pozostałe skany i załączniki" },
];

const missingDocTypes: OzipzDictionaryItem[] = initialDocTypes.filter(
  (d) => !existingDictKeys.has(`documentType:${d.code}`)
).map((d) => ({
  id: `dict_doc_${d.code}`,
  dictType: "documentType",
  code: d.code,
  label: d.label,
  description: d.desc,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

// Symbole JRWA ze słownika jednolitego rzeczowego wykazu akt (oficjalny katalog PSSE OZiPZ)
const canonicalJrwaSymbols: OzipzDictionaryItem[] = KNOWN_JRWA_CATALOG.map((j) => ({
  id: `dict_jrwa_${j.symbol.replace(/\./g, "_")}`,
  dictType: "jrwaSymbol",
  code: j.symbol,
  label: j.label,
  description: j.description || `Symbol JRWA ${j.symbol} w wykazie akt OZiPZ`,
  kind: j.kind,
  gisCategory: j.gisCategory,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));

// Dodatkowe standardowe programy profilaktyczne OZiPZ jeśli nie ma ich w snapshot
const additionalOfficialPrograms: OzipzProgram[] = [
  {
    id: "czyste-powietrze",
    code: "CZYSTE-POWIETRZE",
    name: "Czyste Powietrze Wokół Nas",
    editionYear: "2025/2026",
    jrwaSymbol: "966.3",
    targetAudience: "Przedszkola i oddziały przedszkolne (dzieci 5-6 letnie)",
    description: "Program edukacji antytytoniowej dla dzieci przedszkolnych i ich rodziców (JRWA 966.3)",
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bieg-po-zdrowie",
    code: "BIEG-PO-ZDROWIE",
    name: "Bieg po zdrowie",
    editionYear: "2025/2026",
    jrwaSymbol: "966.3",
    targetAudience: "Szkoły Podstawowe (uczniowie klas IV)",
    description: "Nowoczesny program antytytoniowy dla uczniów klas IV szkół podstawowych (JRWA 966.3)",
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "znajdz-rozwiazanie",
    code: "ZNAJDZ-ROZWIAZANIE",
    name: "Znajdź właściwe rozwiązanie",
    editionYear: "2025/2026",
    jrwaSymbol: "966.3",
    targetAudience: "Szkoły Podstawowe (uczniowie klas VII-VIII)",
    description: "Program profilaktyki palenia tytoniu dla starszych klas szkoły podstawowej (JRWA 966.3)",
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "podstepne-wzw",
    code: "PODSTEPNE-WZW",
    name: "Podstępne WZW",
    editionYear: "2025/2026",
    jrwaSymbol: "966.9",
    targetAudience: "Szkoły Ponadpodstawowe",
    description: "Ogólnopolski program edukacyjny poświęcony profilaktyce WZW B i C (JRWA 966.9)",
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "wybierz-zycie",
    code: "WYBIERZ-ZYCIE",
    name: "Wybierz Życie – Pierwszy Krok",
    editionYear: "2025/2026",
    jrwaSymbol: "966.5",
    targetAudience: "Szkoły Ponadpodstawowe (uczniowie i rodzice)",
    description: "Program profilaktyki raka szyjki macicy i zakażeń wirusem HPV (JRWA 966.5)",
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "znamie-znam-je",
    code: "ZNAMIE",
    name: "Znamię! Znam je?",
    editionYear: "2025/2026",
    jrwaSymbol: "966.5",
    targetAudience: "Szkoły Ponadpodstawowe",
    description: "Program profilaktyki czerniaka i ochrony przed promieniowaniem UV (JRWA 966.5)",
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const existingProgramIds = new Set(parsedRaw.programs.map((p) => p.id));

// Zapewnij obecność symbolu JRWA we wszystkich programach profilaktycznych
const normalizedPrograms: OzipzProgram[] = [
  ...parsedRaw.programs.map((p) => {
    const symbol = p.jrwaSymbol || getProgramJrwaSymbol(p);
    return {
      ...p,
      jrwaSymbol: symbol,
      editionYear: p.editionYear || "2025/2026",
    };
  }),
  ...additionalOfficialPrograms.filter((p) => !existingProgramIds.has(p.id)),
];

// Snapshot pochodzi sprzed schematu v5 — porządkujemy go tą samą regułą co migracja bazy.
const normalizedFacilities: OzipzFacility[] = parsedRaw.facilities.map((f) => {
  const cleaned = cleanLegacyFacilityContact({
    municipality: f.municipality,
    notes: f.notes,
    email: f.email,
    phone: f.phone,
    coordinatorName: f.defaultCoordinatorName,
    coordinatorPhone: f.defaultCoordinatorPhone,
    coordinatorEmail: f.defaultCoordinatorEmail,
    hasEducationTypes: Boolean(f.educationTypes?.length),
  });
  return {
    ...f,
    municipality: cleaned.municipality,
    notes: cleaned.notes,
    email: cleaned.email,
    phone: cleaned.phone,
    defaultCoordinatorPhone: cleaned.coordinatorPhone,
    defaultCoordinatorEmail: cleaned.coordinatorEmail,
  };
});

export const MIGRATED_FIREBASE_DATA: MigratedDataStructure = {
  ...parsedRaw,
  facilities: normalizedFacilities,
  programs: normalizedPrograms,
  dictionaryItems: [
    ...parsedRaw.dictionaryItems.filter(
      (d) => d.dictType !== "topic" && d.dictType !== "tematyki" && d.dictType !== "jrwaSymbol"
    ),
    ...missingAnnotationItems,
    ...missingMunicipalities,
    ...missingRoles,
    ...missingPositions,
    ...missingDocTypes,
    ...canonicalJrwaSymbols,
  ],
};
