import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawActions = [
  {
    "id": "JIuMlLhsBiggamNUgLiI",
    "date": "2026-09-30",
    "caseNumber": "OZiPZ.966.14.36.2026",
    "izrzNumber": null,
    "jrwa": "966.14",
    "title": "Sprawozdanie (z programu, miernik, tytoń)",
    "description": null,
    "actionType": "other",
    "actionTypeLabel": "Sprawozdanie (z programu, miernik, tytoń)",
    "campaign": null,
    "location": "Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu · Myślibórz",
    "locationId": "better-oz-location-63",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "planned",
    "statusLabel": "Planowane",
    "taskStatus": "robocze",
    "ezdRecorded": false,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Pracownicy ochrony zdrowia",
        "count": 1,
        "classes": "",
        "ageFrom": null,
        "ageTo": null
      }
    ],
    "totalRecipients": 1,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": null,
    "notes": null,
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-26T08:01:33.148Z",
    "updatedAt": "2026-08-26T08:01:33.148Z"
  },
  {
    "id": "DCLXWL5ak0mNX2PdEceD",
    "date": "2026-08-19",
    "caseNumber": "OZiPZ.966.14.35.2026",
    "izrzNumber": "90/2026",
    "jrwa": "966.14",
    "title": "Prelekcja (warsztat)",
    "description": "Przeprowadzono prelekcję dotyczącą bezpieczeństwa dzieci podczas wypoczynku letniego. Omówiono zasady bezpiecznych wakacji: bezpieczeństwo nad wodą i w górach, ochronę przed słońcem, zagrożenia komunikacyjne oraz kontakt z nieznajomymi. Przedstawiono podstawy pierwszej pomocy i znaczenie nadzoru dorosłych.",
    "actionType": "education",
    "actionTypeLabel": "Prelekcja (warsztat)",
    "campaign": "Bezpieczne Wakacje",
    "location": "SALA ZABAW ELEFUNEK · Myślibórz",
    "locationId": "better-oz-location-1",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Uczestnicy półkolonii",
        "count": 15,
        "classes": "",
        "ageFrom": null,
        "ageTo": null
      }
    ],
    "totalRecipients": 15,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": null,
    "notes": null,
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-25T10:55:03.888Z",
    "updatedAt": "2026-08-26T08:01:51.503Z"
  },
  {
    "id": "YkIG37RUOikB0ffDpnr7",
    "date": "2026-08-13",
    "caseNumber": "OZiPZ.966.14.34.2026",
    "izrzNumber": "89/2026",
    "jrwa": "966.14",
    "title": "Prelekcja (warsztat)",
    "description": "Przeprowadzono prelekcję dotyczącą bezpieczeństwa dzieci podczas wypoczynku letniegoo. Omówiono zasady bezpiecznych wakacji: bezpieczeństwo nad wodą i w górach, ochronę przed słońcem, zagrożenia komunikacyjne oraz kontakt z nieznajomymi. Przedstawiono podstawy pierwszej pomocy i znaczenie nadzoru dorosłych.",
    "actionType": "education",
    "actionTypeLabel": "Prelekcja (warsztat)",
    "campaign": null,
    "location": "Uczniowski Klub Sportowy Słońsk 66-436 Słońsk w Domu Wczasów Dziecięcych w Myśliborzu · Myślibórz",
    "locationId": "CE6ur6gjzmz2QSVHN5a8",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "robocze",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Uczestnicy kolonii",
        "count": 41,
        "classes": "",
        "ageFrom": null,
        "ageTo": null
      }
    ],
    "totalRecipients": 41,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": null,
    "notes": null,
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-25T10:51:08.277Z",
    "updatedAt": "2026-08-26T07:56:08.732Z"
  },
  {
    "id": "better-oz-1106",
    "date": "2026-08-07",
    "caseNumber": "OZiPZ.966.3.8.2026",
    "izrzNumber": "88/2026",
    "jrwa": "966.3",
    "title": "Sprawozdanie (z programu, miernik, tytoń)",
    "description": "sprawozdanie realizacji programu edukacyjnego „Zdrowe zęby mamy, marchewkę zajadamy” w powiecie myśliborskim rok szkolny 2025/2026",
    "actionType": "other",
    "actionTypeLabel": "Sprawozdanie (z programu, miernik, tytoń)",
    "campaign": null,
    "location": "Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu · Myślibórz",
    "locationId": "better-oz-location-63",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Pracownicy ochrony zdrowia",
        "count": 1,
        "classes": ""
      }
    ],
    "totalRecipients": 1,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": null,
    "notes": "Migracja Better-OZ · zadanie #1106\nAdresat: Zachodniopomorski Państwowy Wojewódzki Inspektor Sanitarny w Szczecinie\nZałączniki:\n1. Sprawozdanie koordynatora powiatowego z programu „Zdrowe zęby mamy, marchewkę zajadamy” – Rok szkolny 2025/2026\nLokalizacja źródłowa: Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu, Myślibórz\nOsoba źródłowa: Magdalena Król-Kaszak",
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-07T09:47:52.000Z",
    "updatedAt": "2026-08-21T13:31:12.312Z"
  },
  {
    "id": "better-oz-1105",
    "date": "2026-08-06",
    "caseNumber": "OZiPZ.966.14.33.2026",
    "izrzNumber": "87/2026",
    "jrwa": "966.14",
    "title": "Dystrybucja",
    "description": "Dokonano dystrybucji materiałów edukacyjnych z zakresu oświaty zdrowotnej i promocji zdrowia wśród odbiorców działania.",
    "actionType": "distribution",
    "actionTypeLabel": "Prelekcja (warsztat)",
    "campaign": "Bezpieczne Wakacje",
    "location": "Szkoła Podstawowa nr 2 im. Janusza Kusocińskiego w Myśliborzu · Myślibórz",
    "locationId": "Al66UKFuzDHCXXpnNSHM",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Uczestnicy półkolonii",
        "count": 1,
        "classes": ""
      }
    ],
    "totalRecipients": 1,
    "materials": [
      {
        "materialId": "",
        "type": "other",
        "name": "Zadanie A4 - Bezpieczne Wakacje - Znajdź zagrożenia",
        "quantity": 10
      }
    ],
    "totalMaterials": 10,
    "additionalInfo": null,
    "notes": "Migracja Better-OZ · zadanie #1105\nData wydania na pieczątce stacji to 29-01-2013, ale data rozdzielnika odręczna to 06.08.26 r. (2026-08-06).\nLokalizacja źródłowa: Szkoła Podstawowa nr 2 im. Janusza Kusocińskiego w Myśliborzu, Myślibórz\nOsoba źródłowa: Krzysztof Palpuchowski",
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-07T06:49:06.000Z",
    "updatedAt": "2026-08-25T10:33:48.083Z"
  },
  {
    "id": "better-oz-1104",
    "date": "2026-08-06",
    "caseNumber": "OZiPZ.966.14.33.2026",
    "izrzNumber": "87/2026",
    "jrwa": "966.14",
    "title": "Prelekcja (warsztat)",
    "description": "Przeprowadzono prelekcję dotyczącą bezpieczeństwa dzieci podczas wypoczynku letniego. Omówiono zasady bezpiecznych wakacji: bezpieczeństwo nad wodą i w górach, ochronę przed słońcem, zagrożenia komunikacyjne oraz kontakt z nieznajomymi. Przedstawiono podstawy pierwszej pomocy i znaczenie nadzoru dorosłych. Podczas prelekcji prowadzono dystrybucje.",
    "actionType": "education",
    "actionTypeLabel": "Prelekcja (warsztat)",
    "campaign": "Bezpieczne Wakacje",
    "location": "Szkoła Podstawowa nr 2 im. Janusza Kusocińskiego w Myśliborzu · Myślibórz",
    "locationId": "Al66UKFuzDHCXXpnNSHM",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Opiekunowie",
        "count": 3,
        "classes": ""
      },
      {
        "actionNumber": 1,
        "group": "Uczestnicy półkolonii",
        "count": 30,
        "classes": ""
      }
    ],
    "totalRecipients": 33,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": "Półkolonia Tomasz Bejuk w SP2 Myślibórz",
    "notes": "Migracja Better-OZ · zadanie #1104\nData odręczna '06.08.26' zinterpretowana jako 2026-08-06. Zaznaczona forma to prelekcja (nad słowem prelekcji widnieje '1x').\nLokalizacja źródłowa: Szkoła Podstawowa nr 2 im. Janusza Kusocińskiego w Myśliborzu, Myślibórz\nOsoba źródłowa: Krzysztof Palpuchowski",
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-07T06:47:03.000Z",
    "updatedAt": "2026-08-25T10:33:43.382Z"
  },
  {
    "id": "better-oz-1103",
    "date": "2026-08-05",
    "caseNumber": null,
    "izrzNumber": null,
    "jrwa": "966.14",
    "title": "Publikacja media (Strona)",
    "description": "Kleszcze: małe, ale groźne!",
    "actionType": "other",
    "actionTypeLabel": "Publikacja media (Strona)",
    "campaign": null,
    "location": "PSSE Myślibórz (publikacje / bez lokalizacji terenowej) · Myślibórz",
    "locationId": "better-oz-location-62",
    "responsible": "Krzysztof Palpuchowski",
    "personId": null,
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Ogół społeczeństwa",
        "count": 0,
        "classes": ""
      }
    ],
    "totalRecipients": 0,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": "Link do publikacji: https://www.gov.pl/web/psse-mysliborz/kleszcze-sa-male-ale-zagrozenie-moze-byc-duze",
    "notes": "Migracja Better-OZ · zadanie #1103\nGOV: https://www.gov.pl/web/psse-mysliborz/kleszcze-sa-male-ale-zagrozenie-moze-byc-duze\nLokalizacja źródłowa: PSSE Myślibórz (publikacje / bez lokalizacji terenowej), Myślibórz\nOsoba źródłowa: Krzysztof Palpuchowski",
    "sourceUrl": "https://www.gov.pl/web/psse-mysliborz/kleszcze-sa-male-ale-zagrozenie-moze-byc-duze",
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": null,
    "createdAt": "2026-08-05T08:22:30.000Z",
    "updatedAt": "2026-08-25T08:48:21.898Z"
  },
  {
    "id": "better-oz-1102",
    "date": "2026-08-05",
    "caseNumber": "OZiPZ.966.5.16.2026",
    "izrzNumber": null,
    "jrwa": "966.5",
    "title": "Sprawozdanie (z programu, miernik, tytoń)",
    "description": "sprawozdanie realizacji programu edukacyjnego „Porozmawiajmy o zdrowiu i nowych zagrożeniach” w powiecie myśliborskim",
    "actionType": "other",
    "actionTypeLabel": "Sprawozdanie (z programu, miernik, tytoń)",
    "campaign": null,
    "location": "Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu · Myślibórz",
    "locationId": "better-oz-location-63",
    "responsible": "Krzysztof Palpuchowski",
    "personId": null,
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Pracownicy ochrony zdrowia",
        "count": 1,
        "classes": ""
      }
    ],
    "totalRecipients": 1,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": null,
    "notes": "Migracja Better-OZ · zadanie #1102\nAdresat: Zachodniopomorski Państwowy Wojewódzki Inspektor Sanitarny w Szczecinie, ul. Spedytorska 6 lok. 7, 70-632 Szczecin\nZałączniki:\n1. Sprawozdanie koordynatora powiatowego z programu „Porozmawiajmy o zdrowiu i nowych zagrożeniach” – Rok szkolny 2025/2026\nLokalizacja źródłowa: Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu, Myślibórz\nOsoba źródłowa: Magdalena Król-Kaszak",
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": null,
    "createdAt": "2026-08-05T07:13:38.000Z",
    "updatedAt": "2026-08-18T20:54:42.436Z"
  },
  {
    "id": "better-oz-1101",
    "date": "2026-08-01",
    "caseNumber": "OZiPZ.966.14.32.2026",
    "izrzNumber": "86/2026",
    "jrwa": "966.14",
    "title": "Stoisko edukacyjno-informacyjne",
    "description": "W dniach trwania Pol’and’Rock Festival Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu zorganizowała stoisko profilaktyczno-edukacyjne, które cieszyło się dużym zainteresowaniem uczestników wydarzenia.\n\nNa stoisku prowadzono działania z zakresu promocji zdrowia i profilaktyki chorób. Odwiedzający mogli skorzystać z instruktażu prawidłowego samobadania piersi i jąder, wykonać pomiar poziomu tlenku węgla w wydychanym powietrzu oraz analizę składu masy ciała wraz z konsultacją dotyczącą zdrowego stylu życia. Uczestnicy otrzymywali również informacje na temat znaczenia aktywności fizycznej, profilaktyki zdrowotnej oraz zagrożeń związanych z używaniem substancji psychoaktywnych.\n\nDla najmłodszych przygotowano edukacyjne gry, quizy, zagadki oraz zabawy sprawnościowe, które w atrakcyjny sposób promowały zdrowe i bezpieczne zachowania.\n\nRealizacja stoiska odbyła się w ramach akcji #LAS – Letnia Akademia Sanepidu i stanowiła element działań edukacyjnych prowadzonych przez PSSE w Myśliborzu na rzecz promocji zdrowia i profilaktyki w okresie wakacyjnym.",
    "actionType": "education",
    "actionTypeLabel": "Stoisko edukacyjno-informacyjne",
    "campaign": "Bezpieczne Wakacje",
    "location": "Lotnisko Czaplinek-Broczyno · Broczyno",
    "locationId": "better-oz-location-92",
    "responsible": "Krzysztof Palpuchowski",
    "personId": "ruNg7xvEYfyGne2yw9a1",
    "contactId": null,
    "status": "done",
    "statusLabel": "Wykonane",
    "taskStatus": "dostarczone",
    "ezdRecorded": true,
    "numberOfActions": 1,
    "recipients": [
      {
        "actionNumber": 1,
        "group": "Ogół społeczeństwa",
        "count": 507,
        "classes": "",
        "ageFrom": 3,
        "ageTo": 70
      }
    ],
    "totalRecipients": 507,
    "materials": [],
    "totalMaterials": 0,
    "additionalInfo": null,
    "notes": "Migracja Better-OZ · zadanie #1101\nLokalizacja źródłowa: Lotnisko Czaplinek-Broczyno, Broczyno\nOsoba źródłowa: Krzysztof Palpuchowski",
    "sourceUrl": null,
    "letterId": null,
    "scanId": null,
    "scheduleId": null,
    "schoolYearId": "ZbrZDimLLpfZoTvcg838CsDBvW42__2026-2027",
    "createdAt": "2026-08-04T11:22:09.000Z",
    "updatedAt": "2026-08-25T10:11:03.073Z"
  }
];

// Cała reszta danych zostanie pobrana ze zrzutu użytkownika:
const fullUserJsonPath = path.join(__dirname, "../src/features/ozipz/data/raw_user_actions.json");
let allRawActions = rawActions;
if (fs.existsSync(fullUserJsonPath)) {
  try {
    allRawActions = JSON.parse(fs.readFileSync(fullUserJsonPath, "utf-8"));
  } catch (e) {
    console.warn("Could not read raw_user_actions.json, using built-in array");
  }
}

const PROGRAM_JRWA_MAP = {
  "0442": { id: "sprawozdawczosc-statystyczna", name: "Sprawozdawczość statystyczna", topic: "inne" },
  "966.1": { id: "trzymaj-forme", name: "Trzymaj Formę", topic: "zywienie_i_aktywnosc" },
  "966.2": { id: "hiv-aids", name: "Krajowy Program Zapobiegania Zakażeniom HIV i Zwalczania AIDS", topic: "inne" },
  "966.3": { id: "zdrowe-zeby", name: "Zdrowe zęby mamy, marchewkę zajadamy", topic: "zdrowe_zeby" },
  "966.4": { id: "higiena-tarcza", name: "Higiena naszą tarczą ochronną", topic: "higiena" },
  "966.5": { id: "porozmawiajmy-o-zdrowiu", name: "Porozmawiajmy o zdrowiu i nowych zagrożeniach", topic: "narkotyki" },
  "966.6": { id: "substancje-psychoaktywne", name: "Profilaktyka używania substancji psychoaktywnych", topic: "tyton" },
  "966.7": { id: "zdrowy-styl-zycia", name: "Promocja zdrowego stylu życia, aktywności fizycznej i prawidłowego odżywiania", topic: "zywienie_i_aktywnosc" },
  "966.8": { id: "choroby-zakazne", name: "Profilaktyka chorób zakaźnych", topic: "szczepienia_zakazne" },
  "966.9": { id: "choroby-nowotworowe", name: "Profilaktyka chorób nowotworowych", topic: "czerniak_uv" },
  "966.10": { id: "grzybobranie", name: "Promocja bezpiecznego grzybobrania i profilaktyka zatruć grzybami", topic: "inne" },
  "966.11": { id: "szczepienia", name: "Promocja szczepień ochronnych (Europejski Tydzień Szczepień)", topic: "szczepienia_zakazne" },
  "966.12": { id: "swiatowy-dzien-zdrowia", name: "Światowy Dzień Zdrowia", topic: "inne" },
  "966.13": { id: "antybiotyki", name: "Europejski i Światowy Dzień Wiedzy o Antybiotykach", topic: "szczepienia_zakazne" },
  "966.14": { id: "bezpieczne-wakacje", name: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)", topic: "inne" },
  "966.15": { id: "seniorzy", name: "Seniorzy (Senior w roli głównej)", topic: "inne" },
  "966.16": { id: "zdrowie-psychiczne", name: "Promocja zdrowia psychicznego (Tylko pomyśl, depresja)", topic: "zdrowie_psychiczne" },
  "966.17": { id: "czynniki-srodowiskowe", name: "Wpływ czynników środowiskowych na zdrowie (PEM, radon)", topic: "inne" },
  "966.18": { id: "mlodzi-swiadomi", name: "#MłodziŚwiadomi", topic: "inne" },
  "966.19": { id: "mlodzi-swiadomi", name: "#MłodziŚwiadomi", topic: "inne" },
  "9011.1": { id: "wspolpraca-wsse", name: "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z WSSE", topic: "inne" },
  "9011.2": { id: "wspolpraca-organy-podlegle", name: "Wymiana informacji między podmiotami w sprawach sanitarnych - współpraca z organami podległymi", topic: "inne" }
};

function mapActionType(title, rawType) {
  const t = (title || rawType || "").toLowerCase();
  if (t.includes("prelekcja") || t.includes("warsztat")) return "prelekcja";
  if (t.includes("rozmowa indywidualna") || t.includes("instruktaż") || t.includes("instruktaz")) return "rozmowa_indywidualna";
  if (t.includes("wykład") || t.includes("wyklad")) return "wyklad";
  if (t.includes("dystrybucja")) return "dystrybucja";
  if (t.includes("stoisko")) return "stoisko";
  if (t.includes("konkurs") || t.includes("quiz")) return "konkurs";
  if (t.includes("narada")) return "narada";
  if (t.includes("wizytacja")) return "wizytacja";
  if (t.includes("pismo") || t.includes("list intencyjny")) return "pismo";
  if (t.includes("facebook") || t.includes("(facebook)")) return "publikacja_fb";
  if (t.includes("portal x") || t.includes("(portal x)") || t.includes("twitter")) return "publikacja_x";
  if (t.includes("strona") || t.includes("(strona)")) return "publikacja_strona";
  if (t.includes("happening") || t.includes("przemarsz") || t.includes("event")) return "happening";
  if (t.includes("sprawozdanie") || t.includes("miernik")) return "sprawozdanie";
  if (t.includes("szkolenie")) return "szkolenie";
  return "inne";
}

function mapAudienceGroup(recipients) {
  if (!recipients || recipients.length === 0) return "ogol_spoleczenstwa";
  const g = (recipients[0].group || "").toLowerCase();
  if (g.includes("uczni") || g.includes("szkoł") || g.includes("kolonii") || g.includes("półkolonii")) return "uczniowie_sp";
  if (g.includes("przedszkol")) return "przedszkolaki";
  if (g.includes("dorosł") || g.includes("dorośli")) return "dorosli";
  if (g.includes("senior")) return "seniorzy";
  if (g.includes("opiekun") || g.includes("rodzic")) return "rodzice";
  if (g.includes("dyrektor") || g.includes("koordynator") || g.includes("ochrony zdrowia")) return "koordynatorzy";
  if (g.includes("ogół") || g.includes("społeczeństw") || g.includes("mieszkań")) return "ogol_spoleczenstwa";
  return "ogol_spoleczenstwa";
}

function mapLocation(locationStr) {
  if (!locationStr) {
    return { facilityName: "PSSE Myślibórz", municipality: "Myślibórz" };
  }
  const parts = locationStr.split(" · ");
  if (parts.length >= 2) {
    return { facilityName: parts[0].trim(), municipality: parts[1].trim() };
  }
  return { facilityName: locationStr.trim(), municipality: "Myślibórz" };
}

function formatAudienceGroupString(recipients, totalRecipients) {
  if (Array.isArray(recipients) && recipients.length > 0) {
    const parts = recipients.map((r) => {
      const name = (r.group || "Uczestnicy").trim();
      const cls = r.classes && r.classes.trim() ? ` ${r.classes.trim()}` : "";
      let age = "";
      if (r.ageFrom && r.ageTo) age = ` (${r.ageFrom}-${r.ageTo} lat)`;
      else if (r.ageFrom) age = ` (${r.ageFrom}+ lat)`;
      else if (r.ageTo) age = ` (do ${r.ageTo} lat)`;
      const count = Number(r.count) || 0;
      return `${name}${cls}${age} - ${count}`;
    });
    return parts.join(", ");
  }
  if (totalRecipients && totalRecipients > 0) {
    return `Uczestnicy - ${totalRecipients}`;
  }
  return "Ogół społeczeństwa / Odbiorcy mediów";
}

function cleanActivitiesDescription(item, progInfo, actionType) {
  if (item.description && item.description.trim().length > 0) {
    return item.description.trim();
  }

  let humanTopic = "";
  if (item.notes) {
    const miernikMatch = item.notes.match(/MIERNIK_FP:\s*[^|]+\|[^|]+\|([^|]+)\|/);
    if (miernikMatch && miernikMatch[1] && miernikMatch[1].trim()) {
      humanTopic = miernikMatch[1].trim();
    }

    const lines = item.notes.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      if (
        !l.startsWith("Migracja") &&
        !l.startsWith("EZD:") &&
        !l.startsWith("Typ:") &&
        !l.startsWith("Kategoria:") &&
        !l.startsWith("MIERNIK_FP:") &&
        !l.startsWith("Lokalizacja") &&
        !l.startsWith("Osoba") &&
        !l.startsWith("Powiązane") &&
        !l.startsWith("Nie zmieniono") &&
        !l.startsWith("Adresat:") &&
        !l.startsWith("Załączniki:")
      ) {
        if (!humanTopic || humanTopic.length < l.length) {
          humanTopic = l;
        }
      }
    }
  }

  const topicText = humanTopic || item.title || progInfo.name;

  switch (actionType) {
    case "prelekcja":
      return `W ramach programu „${progInfo.name}” przeprowadzono prelekcję i warsztaty edukacyjne dla uczestników. Tematyka: ${topicText}. Zaprezentowano materiały edukacyjne oraz omówiono zasady profilaktyki zdrowotnej.`;
    case "wyklad":
      return `W ramach programu „${progInfo.name}” przeprowadzono wykład edukacyjny: ${topicText}. Omówiono kluczowe zagadnienia dotyczące profilaktyki i ochrony zdrowia.`;
    case "rozmowa_indywidualna":
      return `Przeprowadzono indywidualne rozmowy edukacyjne oraz instruktaż profilaktyczny z uczestnikami: ${topicText}.`;
    case "dystrybucja":
      return `Dokonano dystrybucji materiałów edukacyjno-informacyjnych (ulotki, broszury, plakaty) w ramach tematyki: ${topicText}.`;
    case "stoisko":
      return `Przygotowano i prowadzono stoisko edukacyjno-profilaktyczne OZiPZ PSSE: ${topicText}. Udzielano porad zdrowotnych, prowadzono instruktaż i rozdawano materiały oświatowe.`;
    case "konkurs":
      return `Zorganizowano i przeprowadzono konkurs edukacyjny w ramach programu „${progInfo.name}”: ${topicText}. Oceniono prace i wyłoniono laureatów.`;
    case "narada":
      return `Przeprowadzono naradę roboczą / spotkanie komisji w ramach programu „${progInfo.name}”: ${topicText}.`;
    case "wizytacja":
      return `Przeprowadzono wizytację placówki oświatowej w celu monitoringu i weryfikacji przebiegu realizacji programu „${progInfo.name}”.`;
    case "pismo":
      return `Sporządzono i skierowano oficjalną korespondencję urzędową / list intencyjny w ramach programu „${progInfo.name}”: ${topicText}.`;
    case "publikacja_fb":
      return `Opublikowano post i materiały edukacyjno-graficzne na oficjalnym profilu Facebook PSSE w Myśliborzu: ${topicText}.`;
    case "publikacja_x":
      return `Opublikowano wpis edukacyjno-informacyjny w portalu X (Twitter) PSSE w Myśliborzu: ${topicText}.`;
    case "publikacja_strona":
      return `Opublikowano artykuł i materiały edukacyjne na stronie internetowej Powiatowej Stacji Sanitarno-Epidemiologicznej w Myśliborzu (gov.pl/psse-mysliborz): ${topicText}.`;
    case "sprawozdanie":
      return `Sporządzono i przekazano okresowe sprawozdanie ze wskaźników i mierników działalności oświatowo-zdrowotnej: ${topicText}.`;
    case "happening":
      return `Zorganizowano wydarzenie profilaktyczno-edukacyjne (happening / dni otwarte) dla mieszkańców i młodzieży: ${topicText}.`;
    default:
      return `Realizacja zadania oświatowo-zdrowotnego OZiPZ: ${topicText}.`;
  }
}

function extractIzrzSign(item) {
  if (item.izrzNumber && item.izrzNumber.trim()) {
    return item.izrzNumber.trim();
  }
  if (item.notes) {
    // EZD pattern
    const m1 = item.notes.match(/EZD:\s*([0-9]+\/2026|[0-9]+\/26|PZ\/[0-9]+\/26|N\/[0-9]+\/2026|dot\.\s*[0-9]+\/2026)/i);
    if (m1) return m1[1].trim();

    // MIERNIK_FP pattern (last column)
    const m2 = item.notes.match(/MIERNIK_FP:[^|\n]+\|[^|\n]+\|[^|\n]+\|[^|\n]*\|[^|\n]*\|([0-9]+\/2026|[0-9]+\/26|PZ\/[0-9]+\/26|N\/[0-9]+\/2026|dot\.\s*[0-9]+\/2026)/i);
    if (m2) return m2[1].trim();
  }
  return undefined;
}

function standardizeJrwaSign(item) {
  let raw = item.caseNumber;
  if (!raw && item.notes) {
    const m = item.notes.match(/Powiązane z:\s*([^\s\n\r,]+)/i);
    if (m) raw = m[1];
    else {
      const mEzd = item.notes.match(/EZD:\s*(OZiPZ[^\s\n\r-]+)/i);
      if (mEzd) raw = mEzd[1];
    }
  }
  if (!raw) return item.jrwa || undefined;
  raw = raw.trim();
  // Fix missing dot in OZiPZ966...
  raw = raw.replace(/^OZiPZ([0-9])/i, "OZiPZ.$1");
  raw = raw.replace(/^OZ([0-9])/i, "OZiPZ.$1");
  raw = raw.replace(/^OZ\./i, "OZiPZ.");
  return raw;
}

export function convertRawAction(item) {
  const { facilityName, municipality } = mapLocation(item.location);
  const actionType = mapActionType(item.title, item.actionTypeLabel || item.actionType);
  const audienceGroup = formatAudienceGroupString(item.recipients, Number(item.totalRecipients) || 0);

  let jrwaKey = item.jrwa || "";
  if (!jrwaKey && item.caseNumber) {
    const match = item.caseNumber.match(/966\.\d+|0442|0444|9011\.\d+/);
    if (match) jrwaKey = match[0];
  }

  let progInfo = PROGRAM_JRWA_MAP[jrwaKey] || { id: "inne", name: "Inne działania OZiPZ", topic: "inne" };
  let campaignName = item.campaign || undefined;

  // 966.14 rozróżnienie ferie / wakacje
  if (jrwaKey === "966.14") {
    const desc = ((item.title || "") + " " + (item.description || "") + " " + (item.notes || "")).toLowerCase();
    if (desc.includes("ferie") || desc.includes("zimow") || item.date < "2026-04-01") {
      progInfo = { id: "bezpieczne-ferie", name: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne ferie)", topic: "inne" };
      campaignName = campaignName || "Bezpieczne Ferie";
    } else {
      progInfo = { id: "bezpieczne-wakacje", name: "Bezpieczeństwo dzieci podczas wypoczynku letniego i zimowego (bezpieczne wakacje)", topic: "inne" };
      campaignName = campaignName || "Bezpieczne Wakacje";
    }
  }

  // 966.6 rozróżnienie tyton / narkotyki
  if (jrwaKey === "966.6") {
    const desc = ((item.description || "") + " " + (item.notes || "")).toLowerCase();
    if (desc.includes("narkot")) {
      progInfo.topic = "narkotyki";
    } else {
      progInfo.topic = "tyton";
    }
  }

  const activitiesDesc = cleanActivitiesDescription(item, progInfo, actionType);
  const izrzSign = extractIzrzSign(item);
  const jrwaSign = standardizeJrwaSign(item);

  return {
    id: item.id,
    title: item.title || "Działanie OZiPZ",
    actionType: actionType,
    date: item.date,
    facilityId: item.locationId || undefined,
    facilityName: facilityName,
    municipality: municipality,
    programId: progInfo.id,
    programName: progInfo.name,
    topic: progInfo.topic,
    audienceGroup: audienceGroup,
    campaignId: undefined,
    campaignName: campaignName,
    jrwaSign: jrwaSign,
    jrwaCaseId: item.jrwa || undefined,
    izrzSign: izrzSign,
    ezdStatus: item.ezdRecorded ? "w_ezd" : "brak_ezd",
    status: item.status === "done" ? "wykonane" : "zaplanowane",
    sourceInfo: item.sourceUrl || undefined,
    scheduleEventId: item.scheduleId || undefined,
    materialId: item.materials && item.materials[0] ? item.materials[0].materialId : undefined,
    numberOfActions: Number(item.numberOfActions) || 1,
    participantsCount: Number(item.totalRecipients) || 0,
    indirectRecipientsCount: 0,
    materialsDistributedCount: Number(item.totalMaterials) || 0,
    leadEducator: item.responsible || "Krzysztof Palpuchowski",
    notes: activitiesDesc,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}
