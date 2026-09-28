import type { ActionCardPreset } from "./editor.types";

export const RECIPIENT_SUGGESTIONS = [
  "Uczniowie kl. 7",
  "Uczniowie kl. 8",
  "Uczniowie kl. 1-3",
  "Uczniowie kl. 4-6",
  "Uczniowie szkół ponadpodstawowych",
  "Opiekunowie / Nauczyciele",
  "Przedszkolaki",
  "Wychowawcy przedszkolni",
  "Rodzice / Opiekunowie prawni",
  "Koordynatorzy szkolni programów",
  "Seniorzy",
  "Mieszkańcy / Dorośli",
  "Kadra medyczna / Pielęgniarki",
];

export const ACTION_CARD_PRESETS: ActionCardPreset[] = [
  {
    id: "preset-sp-1grp",
    badge: "Szkoła Podstawowa",
    title: "1 Grupa: Kl. 7 (13-14 lat: 20 os.) + Opiekun (1)",
    subtitle: "Prelekcja edukacyjna z prezentacją multimedialną",
    actionType: "Prelekcja (warsztat)",
    titlePrefix: "Prelekcja w szkole z prezentacją multimedialną",
    jrwaSymbol: "966.1",
    activitiesTemplate: "Prelekcja edukacyjna z wykorzystaniem prezentacji multimedialnej, dyskusja z uczniami oraz quiz podsumowujący wiedzę.",
    audienceGroups: [
      {
        id: "grp-1",
        name: "Grupa 1 (Klasa 7A)",
        items: [
          { id: "i-1", name: "Uczniowie kl. 7", count: 20, ageFrom: 13, ageTo: 14 },
          { id: "i-2", name: "Opiekunowie", count: 1, ageFrom: null, ageTo: null },
        ],
      },
    ],
  },
  {
    id: "preset-sp-2grp",
    badge: "Szkoła Podstawowa (Cykl)",
    title: "2 Grupy: Kl. 7A (21) + Kl. 7B (23) = 44 os.",
    subtitle: "Cykl prelekcji edukacyjnych w szkole podstawowej",
    actionType: "Prelekcja (warsztat)",
    titlePrefix: "Cykl prelekcji edukacyjnych w szkole podstawowej",
    jrwaSymbol: "966.1",
    activitiesTemplate: "Cykl prelekcji edukacyjnych dla klas 7 z prezentacją multimedialną i warsztatami.",
    audienceGroups: [
      {
        id: "grp-1",
        name: "Grupa 1 (Klasa 7A)",
        items: [
          { id: "i-1", name: "Uczniowie kl. 7", count: 20, ageFrom: 13, ageTo: 14 },
          { id: "i-2", name: "Opiekunowie", count: 1, ageFrom: null, ageTo: null },
        ],
      },
      {
        id: "grp-2",
        name: "Grupa 2 (Klasa 7B)",
        items: [
          { id: "i-3", name: "Uczniowie kl. 7", count: 22, ageFrom: 13, ageTo: 14 },
          { id: "i-4", name: "Opiekunowie", count: 1, ageFrom: null, ageTo: null },
        ],
      },
    ],
  },
  {
    id: "preset-festyn",
    badge: "Festyn / Stoisko",
    title: "Stoisko / Festyn (100 os.)",
    subtitle: "Stoisko profilaktyczno-informacyjne OZiPZ PSSE",
    actionType: "Stoisko edukacyjno-informacyjne",
    titlePrefix: "Stoisko edukacyjno-informacyjne OZiPZ",
    jrwaSymbol: "966.3",
    materialsDistributedCount: 50,
    activitiesTemplate: "Stoisko profilaktyczno-informacyjne OZiPZ PSSE, pomiary ciśnienia, poradnictwo zdrowotne i dystrybucja materiałów oświatowych.",
    audienceGroups: [
      {
        id: "grp-1",
        name: "Grupa 1 (Mieszkańcy i Seniorzy)",
        items: [
          { id: "i-1", name: "Mieszkańcy / Dorośli", count: 80, ageFrom: 18, ageTo: 59 },
          { id: "i-2", name: "Seniorzy", count: 20, ageFrom: 60, ageTo: null },
        ],
      },
    ],
  },
  {
    id: "preset-konkurs",
    badge: "Konkurs Powiatowy",
    title: "Konkurs: Uczniowie 13-15 lat (30) + Opiekunowie (3)",
    subtitle: "Etap powiatowy konkursu wiedzy o zdrowiu",
    actionType: "Konkurs (quiz)",
    titlePrefix: "Konkurs powiatowy wiedzy o zdrowiu",
    jrwaSymbol: "966.2",
    activitiesTemplate: "Przeprowadzenie etapu powiatowego konkursu wiedzy o zdrowiu pod patronatem PPIS w Myśliborzu, ocena prac i wręczenie dyplomów.",
    audienceGroups: [
      {
        id: "grp-1",
        name: "Grupa 1 (Uczestnicy konkursu)",
        items: [
          { id: "i-1", name: "Uczniowie kl. 7-8", count: 30, ageFrom: 13, ageTo: 15 },
          { id: "i-2", name: "Opiekunowie / Nauczyciele", count: 3, ageFrom: null, ageTo: null },
        ],
      },
    ],
  },
];
