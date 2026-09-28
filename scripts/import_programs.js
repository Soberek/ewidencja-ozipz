import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawPrograms = [
  {
    "id": "sprawozdawczosc-statystyczna",
    "name": "Sprawozdawczość statystyczna",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "0442",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "trzymaj-forme",
    "name": "Trzymaj Formę",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [
      "Szkoła podstawowa"
    ],
    "jrwa": "966.1",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "hiv-aids",
    "name": "Krajowy Program Zapobiegania Zakażeniom HIV i Zwalczania AIDS",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [
      "Liceum",
      "Technikum",
      "Szkoła branżowa"
    ],
    "jrwa": "966.2",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "zdrowe-zeby",
    "name": "Zdrowe zęby mamy, marchewkę zajadamy",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [
      "Przedszkole",
      "Żłobek",
      "Oddział przedszkolny"
    ],
    "jrwa": "966.3",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "higiena-tarcza",
    "name": "Higiena naszą tarczą ochronną",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [
      "Szkoła podstawowa",
      "Szkoła podstawowa specjalna"
    ],
    "jrwa": "966.4",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "porozmawiajmy-o-zdrowiu",
    "name": "Porozmawiajmy o zdrowiu i nowych zagrożeniach",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [
      "Szkoła podstawowa"
    ],
    "jrwa": "966.5",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "substancje-psychoaktywne",
    "name": "Profilaktyka używania substancji psychoaktywnych (NSP, nikotyna i światowe dni związane z nikotyną, alkohol)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.6",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "zdrowy-styl-zycia",
    "name": "Promocja zdrowego stylu życia, aktywności fizycznej i prawidłowego odżywiania (#mojaszkołazdrowaszkoła, Dni otwarte PIS, FitSchool)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.7",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "choroby-zakazne",
    "name": "Profilaktyka chorób zakaźnych (Podstępne WZW, Jesień bez infekcji, borelioza, KZM, grypa, covid, HPV)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.8",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "choroby-nowotworowe",
    "name": "Profilaktyka chorób nowotworowych (Znamię! znam je?, Bądź swoją bohaterką)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.9",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "grzybobranie",
    "name": "Promocja bezpiecznego grzybobrania i profilaktyka zatruć grzybami",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.10",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "szczepienia",
    "name": "Promocja szczepień ochronnych (Europejski Tydzień Szczepień)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.11",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "swiatowy-dzien-zdrowia",
    "name": "Światowy Dzień Zdrowia",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.12",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "antybiotyki",
    "name": "Europejski i Światowy Dzień Wiedzy o Antybiotykach",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.13",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "bezpieczne-ferie",
    "name": "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne ferie)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.14",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:16:17.916Z",
    "updatedAt": "2026-08-09T11:16:17.916Z"
  },
  {
    "id": "bezpieczne-wakacje",
    "name": "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.14",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:16:17.916Z",
    "updatedAt": "2026-08-09T11:16:17.916Z"
  },
  {
    "id": "seniorzy",
    "name": "Seniorzy (Senior w roli głównej)",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.15",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "zdrowie-psychiczne",
    "name": "Promocja zdrowia psychicznego (Tylko pomyśl, depresja)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.16",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "czynniki-srodowiskowe",
    "name": "Wpływ czynników środowiskowych na zdrowie (PEM, radon)",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.17",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "mlodzi-swiadomi",
    "name": "#MłodziŚwiadomi",
    "description": null,
    "programType": "programowy",
    "programTypeLabel": "PROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "966.18",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "wspolpraca-wsse",
    "name": "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z WSSE",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "9011.1",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  },
  {
    "id": "wspolpraca-organy-podlegle",
    "name": "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z organami podległymi",
    "description": null,
    "programType": "nieprogramowy",
    "programTypeLabel": "NIEPROGRAMOWE",
    "schoolTypes": [],
    "jrwa": "9011.2",
    "deletedAt": null,
    "createdAt": "2026-08-09T11:11:14.464Z",
    "updatedAt": "2026-08-09T11:11:14.464Z"
  }
];

const CODE_MAP = {
  "sprawozdawczosc-statystyczna": "STAT",
  "trzymaj-forme": "TRZYMAJ-FORME",
  "hiv-aids": "HIV-AIDS",
  "zdrowe-zeby": "ZDROW-ZEBY",
  "higiena-tarcza": "HIGIENA-TARCZA",
  "porozmawiajmy-o-zdrowiu": "POROZMAWIAJMY",
  "substancje-psychoaktywne": "PSYCHOAKTYWNE",
  "zdrowy-styl-zycia": "ZDROWY-STYL",
  "choroby-zakazne": "ZAKAZNE",
  "choroby-nowotworowe": "NOWOTWOROWE",
  "grzybobranie": "GRZYBY",
  "szczepienia": "SZCZEPIENIA",
  "swiatowy-dzien-zdrowia": "DZIEN-ZDROWIA",
  "antybiotyki": "ANTYBIOTYKI",
  "bezpieczne-ferie": "BEZPIECZ-FERIE",
  "bezpieczne-wakacje": "BEZP-WAKACJE",
  "seniorzy": "SENIORZY",
  "zdrowie-psychiczne": "PSYCHICZNE",
  "czynniki-srodowiskowe": "SRODOWISKOWE",
  "mlodzi-swiadomi": "MLODZI-SWIADOMI",
  "wspolpraca-wsse": "WSSE",
  "wspolpraca-organy-podlegle": "PODLEGLE"
};

const convertedPrograms = rawPrograms.map((p) => {
  let targetAudience = "Dzieci i młodzież";
  if (p.schoolTypes && p.schoolTypes.length > 0) {
    targetAudience = p.schoolTypes.join(", ");
  } else if (p.id === "seniorzy") {
    targetAudience = "Seniorzy / dorośli";
  } else if (p.id === "mlodzi-swiadomi") {
    targetAudience = "Młodzież szkół ponadpodstawowych";
  } else if (p.programType === "nieprogramowy") {
    targetAudience = "Społeczność lokalna / ogół ludności";
  }

  const code = CODE_MAP[p.id] || p.id.toUpperCase();

  return {
    id: p.id,
    code: code,
    name: p.name,
    editionYear: "2025/2026",
    targetAudience: targetAudience,
    description: `Program edukacyjny OZiPZ na rok 2026 (JRWA ${p.jrwa}). Typ: ${p.programTypeLabel || p.programType}`,
    status: "aktywny",
    participatingSchoolsCount: 0,
    totalPupilsReached: 0,
    createdAt: p.createdAt || "2026-01-01T08:00:00.000Z",
    updatedAt: p.updatedAt || "2026-08-28T08:00:00.000Z"
  };
});

const jsonPath = path.join(__dirname, "../src/features/ozipz/data/firebase_migrated_data.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
data.programs = convertedPrograms;

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");
console.log(`Pomyślnie zmigrowano ${convertedPrograms.length} programów profilaktycznych do firebase_migrated_data.json!`);
