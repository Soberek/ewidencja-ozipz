import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const projectRoot = "/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz";
const dbPath = path.join(projectRoot, "ozipz.db");
const jsonPath = path.join(projectRoot, "src/features/ozipz/data/firebase_migrated_data.json");
const csvPath = "/Users/krzysztofpalpuchowski/.gemini/antigravity/brain/e863f871-a590-4e8c-aa1f-a93080bbcb7f/scratch/user_input.csv";

const isDryRun = process.argv.includes("--dry-run");

console.log(`=== MIGRACJA ZADAŃ DO 81/2026 (${isDryRun ? "DRY-RUN" : "ZAPIS DO BAZY"}) ===`);

const db = new DatabaseSync(dbPath);
const rawJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
const facilities = db.prepare("SELECT id, name, municipality, address, postal_code, city FROM ozipz_facilities").all();
const programs = db.prepare("SELECT id, code, name, jrwa_symbol FROM ozipz_programs").all();

function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(current);
      if (row.some((c) => c.trim().length > 0)) lines.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    if (row.some((c) => c.trim().length > 0)) lines.push(row);
  }
  return lines;
}

const rawCsv = fs.readFileSync(csvPath, "utf-8");
const dataRows = parseCSV(rawCsv).slice(1).filter((r) => r.slice(0, 12).some((c) => c && c.trim() && c.trim() !== "0"));

console.log(`Odczytano ${dataRows.length} wierszy danych z CSV.`);
if (dataRows.length !== 240) {
  throw new Error(`Oczekiwano dokładnie 240 wierszy danych, a odczytano: ${dataRows.length}`);
}

function parseDate(dStr) {
  if (!dStr) return null;
  const parts = dStr.trim().split("-");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
}

function normalizeActionType(val) {
  if (!val) return "Działanie edukacyjne";
  const t = val.trim();
  const lower = t.toLowerCase();
  const mapping = {
    "dystrybucja": "Dystrybucja",
    "prelekcja (warsztat)": "Prelekcja (warsztat)",
    "prelekcja": "Prelekcja (warsztat)",
    "warsztat": "Prelekcja (warsztat)",
    "publikacja media (portal x)": "Publikacja media (Portal X)",
    "publikacja media (facebook)": "Publikacja media (Facebook)",
    "publikacja media (strona)": "Publikacja media (Strona)",
    "pismo (list intencyjny)": "Pismo (list intencyjny)",
    "pismo": "Pismo (list intencyjny)",
    "wykład": "Wykład",
    "sprawozdanie (z programu, miernik, tytoń)": "Sprawozdanie (z programu, miernik, tytoń)",
    "sprawozdanie": "Sprawozdanie (z programu, miernik, tytoń)",
    "rozmowa indywidualna (instruktaż)": "Rozmowa indywidualna (instruktaż)",
    "rozmowa indywidualna": "Rozmowa indywidualna (instruktaż)",
    "konkurs (quiz)": "Konkurs (quiz)",
    "konkurs": "Konkurs (quiz)",
    "wizytacja": "Wizytacja",
    "stoisko edukacyjno-informacyjne": "Stoisko edukacyjno-informacyjne",
    "stoisko": "Stoisko edukacyjno-informacyjne",
    "happening (przemarsz, gra, event)": "Happening (przemarsz, gra, event)",
    "happening": "Happening (przemarsz, gra, event)",
    "narada": "Narada",
  };
  return mapping[lower] || t;
}

function isPublicationActionType(actionType) {
  if (!actionType) return false;
  const lower = actionType.trim().toLowerCase();
  return (
    lower.includes("publikacja") ||
    lower.includes("portal x") ||
    lower.includes("facebook") ||
    lower.includes("twitter") ||
    lower.includes("strona") ||
    lower.includes("social")
  );
}

function matchFacility(locStr) {
  if (!locStr || !locStr.trim()) return null;
  const s = locStr.toLowerCase();

  if (s.includes("smolnica 21") || (s.includes("szkoła podstawowa") && s.includes("smolnic"))) {
    return facilities.find((f) => f.id === "loc-56");
  }
  if (s.includes("smolnica 51") || (s.includes("młodzieżowy ośrodek socjoterapii") && s.includes("smolnic"))) {
    return facilities.find((f) => f.id === "loc-87");
  }
  if (s.includes("lipowa 18a") || (s.includes("podstawowa nr 3") && s.includes("myślibor"))) {
    return facilities.find((f) => f.id === "loc-38");
  }
  if (s.includes("słowackiego 21") || (s.includes("podstawowa nr 3") && s.includes("dębn"))) {
    return facilities.find((f) => f.id === "loc-25");
  }
  if (s.includes("piłsudskiego 18") || (s.includes("podstawowa nr 2") && s.includes("myślibor"))) {
    return facilities.find((f) => f.id === "loc-21");
  }
  if (s.includes("podstawowa nr 2") && s.includes("dębn")) {
    return facilities.find((f) => f.id === "loc-24");
  }
  if (s.includes("podstawowa nr 4") && s.includes("barlink")) {
    return facilities.find((f) => f.id === "loc-37");
  }
  if (s.includes("kierzkow") || s.includes("kierzków")) {
    return facilities.find((f) => f.id === "loc-46");
  }
  if (s.includes("dębnowski ośrodek kultury") || s.includes("dok") || s.includes("daszyńskiego 20")) {
    return facilities.find((f) => f.id === "loc-64");
  }
  if (s.includes("sarbinow") || s.includes("sarbinowo")) {
    return facilities.find((f) => f.id === "loc-20");
  }
  if (s.includes("nawrock")) {
    return facilities.find((f) => f.id === "loc-48");
  }
  if (s.includes("golenic")) {
    return facilities.find((f) => f.id === "loc-54");
  }
  if (s.includes("elefunek")) {
    return facilities.find((f) => f.id === "loc-1") || facilities.find((f) => f.id === "loc-74");
  }
  if (s.includes("terapii zajęciowej") || s.includes("wtz") || s.includes("chojeńska 6a")) {
    return facilities.find((f) => f.id === "loc-65");
  }
  if (s.includes("bratek")) {
    return facilities.find((f) => f.id === "loc-61");
  }
  if (s.includes("misia uszatka") || s.includes("spokojna 12")) {
    return facilities.find((f) => f.id === "loc-50");
  }
  if (s.includes("porazińskiej") && (s.includes("kombatantów 3") || s.includes("leśna 10") || s.includes("przedszkole miejskie nr 1"))) {
    return facilities.find((f) => f.id === "loc-60");
  }
  if (s.includes("nowogródek") || s.includes("szkolna 4")) {
    return facilities.find((f) => f.id === "loc-58");
  }
  if (s.includes("mostkow")) {
    return facilities.find((f) => f.id === "loc-23");
  }
  if (s.includes("marcinkowskiego 10") && s.includes("socjoterapii")) {
    return facilities.find((f) => f.id === "loc-59");
  }
  if (s.includes("marcinkowskiego 10") && (s.includes("dom wczasów") || s.includes("dwd"))) {
    return facilities.find((f) => f.id === "loc-83");
  }
  if (s.includes("karsk")) {
    return facilities.find((f) => f.id === "loc-57");
  }
  if (s.includes("zielona dolinka")) {
    return facilities.find((f) => f.id === "loc-11");
  }
  if (s.includes("strzelecka 51") || s.includes("zsipo") || s.includes("darius")) {
    return facilities.find((f) => f.id === "loc-6");
  }
  if (s.includes("cychr")) {
    return facilities.find((f) => f.id === "loc-36");
  }
  if (s.includes("różańsko 87") || (s.includes("różańsk") && s.includes("szkoła"))) {
    return facilities.find((f) => f.id === "loc-53");
  }
  if (s.includes("różańsko 31") || s.includes("boisko sportowe w różańsku")) {
    return facilities.find((f) => f.id === "loc-86");
  }
  if (s.includes("ogrodowa 9") || s.includes("przychodnia im. jana pawła")) {
    return facilities.find((f) => f.id === "loc-66");
  }
  if (s.includes("medycyna") && s.includes("armii polskiej 14")) {
    return facilities.find((f) => f.id === "loc-67");
  }
  if (s.includes("za bramką 8") || s.includes("noblistów")) {
    return facilities.find((f) => f.id === "loc-9");
  }
  if (s.includes("konopka") || s.includes("armii krajowej 13")) {
    return facilities.find((f) => f.id === "loc-69");
  }
  if (s.includes("kościelna 15") || s.includes("zoz przychodnia rodzinna")) {
    return facilities.find((f) => f.id === "loc-70");
  }
  if (s.includes("winnicki")) {
    return facilities.find((f) => f.id === "loc-71");
  }
  if (s.includes("medyk")) {
    return facilities.find((f) => f.id === "loc-72");
  }
  if (s.includes("przychodnia lekarzy rodzinnych") || (s.includes("lekarzy rodzinnych") && s.includes("dębno"))) {
    return facilities.find((f) => f.id === "loc-73");
  }
  if (s.includes("frankiewicz")) {
    return facilities.find((f) => f.id === "loc-88");
  }
  if (s.includes("centrum zdrowia ii")) {
    return facilities.find((f) => f.id === "loc-75");
  }
  if (s.includes("ocean") || s.includes("salezjańska 1")) {
    return facilities.find((f) => f.id === "loc-76");
  }
  if (s.includes("zachodnia 4") || (s.includes("zespół szkół nr 1") && s.includes("dębn"))) {
    return facilities.find((f) => f.id === "loc-2");
  }
  if (s.includes("boleszkowic")) {
    return facilities.find((f) => f.id === "loc-78");
  }
  if (s.includes("montessori")) {
    return facilities.find((f) => f.id === "loc-19");
  }
  if (s.includes("kolegiata") || s.includes("andersa 22")) {
    return facilities.find((f) => f.id === "loc-80");
  }
  if (s.includes("osadnik") || s.includes("11 listopada 1")) {
    return facilities.find((f) => f.id === "loc-81");
  }
  if (s.includes("czaple") || s.includes("grzymirad") || s.includes("obóz harcerski")) {
    return facilities.find((f) => f.id === "loc-84");
  }
  if (s.includes("bright english") || s.includes("ratuszowa 29a")) {
    return facilities.find((f) => f.id === "loc-85");
  }
  if (s.includes("radosna") || s.includes("szosowa 3")) {
    return facilities.find((f) => f.id === "loc-28");
  }
  if (s.includes("północna 15") || s.includes("stacja sanitarno-epidemiologiczna")) {
    return facilities.find((f) => f.id === "loc-63");
  }

  return facilities.find((f) => s.includes(f.name.toLowerCase()));
}

function matchProgram(pName, monthStr, jrwaProp, jrwaCase) {
  const p = (pName || "").trim().toLowerCase();
  const m = parseInt(monthStr, 10) || 0;

  if (p.includes("wypoczynku") || p.includes("ferie") || p.includes("wakacje")) {
    if (m >= 5) {
      return programs.find((pr) => pr.id === "bezpieczne-wakacje");
    } else {
      return programs.find((pr) => pr.id === "bezpieczne-ferie");
    }
  }
  if (p.includes("trzymaj form")) return programs.find((pr) => pr.id === "trzymaj-forme");
  if (p.includes("hiv") || p.includes("aids")) return programs.find((pr) => pr.id === "hiv-aids");
  if (p.includes("marchewk") || p.includes("zęby")) return programs.find((pr) => pr.id === "zdrowe-zeby");
  if (p.includes("tarczą ochronną") || p.includes("higiena naszą")) return programs.find((pr) => pr.id === "higiena-tarcza");
  if (p.includes("porozmawiajmy o zdrowiu")) return programs.find((pr) => pr.id === "porozmawiajmy-o-zdrowiu");
  if (p.includes("substancji psychoaktywnych") || p.includes("nikotyn") || p.includes("alkohol")) return programs.find((pr) => pr.id === "substancje-psychoaktywne");
  if (p.includes("zdrowego stylu życia") || p.includes("aktywności fizycznej")) return programs.find((pr) => pr.id === "zdrowy-styl-zycia");
  if (p.includes("chorób zakaźnych") || p.includes("wzw") || p.includes("borelioza")) return programs.find((pr) => pr.id === "choroby-zakazne");
  if (p.includes("nowotworowych") || p.includes("znamię")) return programs.find((pr) => pr.id === "choroby-nowotworowe");
  if (p.includes("szczepień") || p.includes("tydzień szczepień")) return programs.find((pr) => pr.id === "szczepienia");
  if (p.includes("dzień zdrowia")) return programs.find((pr) => pr.id === "swiatowy-dzien-zdrowia");
  if (p.includes("senior")) return programs.find((pr) => pr.id === "seniorzy");
  if (p.includes("psychiczn")) return programs.find((pr) => pr.id === "zdrowie-psychiczne");
  if (p.includes("czynników środowiskowych") || p.includes("radon") || p.includes("pem")) return programs.find((pr) => pr.id === "czynniki-srodowiskowe");
  if (p.includes("młodziświadomi") || p.includes("mlodzi")) return programs.find((pr) => pr.id === "mlodzi-swiadomi");
  if (p.includes("statystyczna") || p.includes("0442")) return programs.find((pr) => pr.id === "sprawozdawczosc-statystyczna");
  if (p.includes("organami podległymi") || p.includes("podlegle") || p.includes("9011.2")) return programs.find((pr) => pr.id === "wspolpraca-organy-podlegle");
  if (p.includes("wsse") || p.includes("9011.1")) return programs.find((pr) => pr.id === "wspolpraca-wsse");

  // Fallback by JRWA symbol
  const cleanJrwa = (jrwaProp || "").replace(/[^\d.]/g, "") || (jrwaCase || "").replace(/[^\d.]/g, "");
  if (cleanJrwa.startsWith("966.14")) return m >= 5 ? programs.find((pr) => pr.id === "bezpieczne-wakacje") : programs.find((pr) => pr.id === "bezpieczne-ferie");
  if (cleanJrwa.startsWith("966.1")) return programs.find((pr) => pr.id === "trzymaj-forme");
  if (cleanJrwa.startsWith("966.2")) return programs.find((pr) => pr.id === "hiv-aids");
  if (cleanJrwa.startsWith("966.3")) return programs.find((pr) => pr.id === "zdrowe-zeby");
  if (cleanJrwa.startsWith("966.4")) return programs.find((pr) => pr.id === "higiena-tarcza");
  if (cleanJrwa.startsWith("966.5")) return programs.find((pr) => pr.id === "porozmawiajmy-o-zdrowiu");
  if (cleanJrwa.startsWith("966.6")) return programs.find((pr) => pr.id === "substancje-psychoaktywne");
  if (cleanJrwa.startsWith("966.7")) return programs.find((pr) => pr.id === "zdrowy-styl-zycia");
  if (cleanJrwa.startsWith("966.8")) return programs.find((pr) => pr.id === "choroby-zakazne");
  if (cleanJrwa.startsWith("966.9")) return programs.find((pr) => pr.id === "choroby-nowotworowe");
  if (cleanJrwa.startsWith("966.11")) return programs.find((pr) => pr.id === "szczepienia");
  if (cleanJrwa.startsWith("966.12")) return programs.find((pr) => pr.id === "swiatowy-dzien-zdrowia");
  if (cleanJrwa.startsWith("966.15")) return programs.find((pr) => pr.id === "seniorzy");
  if (cleanJrwa.startsWith("966.16")) return programs.find((pr) => pr.id === "zdrowie-psychiczne");
  if (cleanJrwa.startsWith("966.17")) return programs.find((pr) => pr.id === "czynniki-srodowiskowe");
  if (cleanJrwa.startsWith("966.18")) return programs.find((pr) => pr.id === "mlodzi-swiadomi");

  return null;
}

function resolveTopic(cat, progName, postTitle) {
  const c = (cat || "").trim().toUpperCase();
  if (c === "ZAPOBIEGANIE OTYŁOŚCI") return "Zapobieganie otyłości i zdrowy styl życia";
  if (c === "PROFILAKTYKA UZALEŻNIEŃ") return "Profilaktyka uzależnień (tytoń, alkohol, NSP)";
  if (c === "SZCZEPIENIA") return "Szczepienia ochronne";
  if (c === "STI (INFEKCJE PRZENOSZONE DROGĄ PŁCIOWĄ)") return "Profilaktyka HIV/AIDS i STI";

  const p = (progName || "").toLowerCase();
  if (p.includes("wypoczynku") || p.includes("ferie") || p.includes("wakacje")) return "Bezpieczny wypoczynek dzieci i młodzieży";
  if (p.includes("higiena")) return "Higiena osobista i profilaktyka zakażeń";
  if (p.includes("zęby") || p.includes("marchewk")) return "Higiena jamy ustnej i zdrowe żywienie";
  if (p.includes("nowotworow") || p.includes("znamię")) return "Profilaktyka chorób nowotworowych";
  if (p.includes("środowisk")) return "Czynniki środowiskowe (PEM, radon)";
  if (p.includes("statystyczna")) return "Sprawozdawczość statystyczna";
  if (p.includes("podległ")) return "Współpraca sanitarna i wymiana informacji";
  if (p.includes("zdrowia")) return "Światowy Dzień Zdrowia";
  if (p.includes("senior")) return "Zdrowie seniorów";
  if (p.includes("psychiczn")) return "Zdrowie psychiczne";

  return "Promocja zdrowia i oświata zdrowotna";
}

function extractJrwa(r1, r16, programJrwa) {
  const c1 = (r1 || "").trim();
  const c16 = (r16 || "").trim();

  let sign = null;
  let caseId = null;

  if (c1 && c1 !== "0") {
    sign = c1;
  } else if (c16 && c16 !== "0" && !c16.includes("ADR")) {
    sign = c16;
  } else if (programJrwa) {
    sign = programJrwa;
  }

  if (sign) {
    const m = sign.match(/(?:OZiPZ\.)?(\d+(?:\.\d+)?)/i);
    if (m) {
      caseId = m[1];
    } else {
      caseId = programJrwa || null;
    }
  } else if (programJrwa) {
    caseId = programJrwa;
    sign = programJrwa;
  }

  return { sign, caseId };
}

// Przygotuj zmapowane obiekty
const mappedActions = [];

for (let i = 0; i < dataRows.length; i++) {
  const r = dataRows[i];
  const id = `better-oz-${851 + i}`;

  const rawIzrz = (r[0] || "").trim();
  const rawJrwaCase = (r[1] || "").trim();
  const rawProgName = (r[2] || "").trim();
  const rawActionType = (r[3] || "").trim();
  const rawNumActions = (r[4] || "").trim();
  const rawParticipants = (r[5] || "").trim();
  const rawDate = (r[6] || "").trim();
  const rawRemarks = (r[7] || "").trim();
  const rawResponsible = (r[8] || "").trim();
  const rawLocation = (r[9] || "").trim();
  const rawTitle = (r[10] || "").trim();
  const rawAudience = (r[11] || "").trim();
  const rawScope = (r[12] || "").trim();
  const rawProgCat = (r[14] || "").trim();
  const rawMonth = (r[15] || "").trim();
  const rawJrwaProp = (r[16] || "").trim();
  const rawEzd = (r[17] || "").trim();

  const date = parseDate(rawDate);
  const actionType = normalizeActionType(rawActionType);
  const numberOfActions = Math.max(1, parseInt(rawNumActions, 10) || 1);
  const participantsCount = Math.max(0, parseInt(rawParticipants, 10) || 0);
  const leadEducator = rawResponsible || "Krzysztof Palpuchowski";

  const existingSql = db.prepare("SELECT created_at, updated_at FROM ozipz_actions WHERE id = ?").get(id);
  const materialsDistributedCount = (id === "better-oz-1092" || id === "better-oz-1105") ? 10 : 0;
  const createdAt = existingSql ? existingSql.created_at : `${date}T08:00:00.000Z`;
  const updatedAt = new Date().toISOString();

  let facilityId = null;
  let facilityName = "PSSE Myślibórz (media / publikacja internetowa)";
  let municipality = "Myślibórz";

  if (rawLocation) {
    const matchedFac = matchFacility(rawLocation);
    if (!matchedFac) {
      throw new Error(`Nie udało się dopasować placówki dla wiersza ${i + 1}: ${rawLocation}`);
    }
    facilityId = matchedFac.id;
    facilityName = matchedFac.name;
    municipality = matchedFac.municipality;
  }

  const matchedProg = matchProgram(rawProgName, rawMonth, rawJrwaProp, rawJrwaCase);
  if (!matchedProg) {
    throw new Error(`Nie udało się dopasować programu dla wiersza ${i + 1}: ${rawProgName}`);
  }
  const programId = matchedProg.id;
  const programName = matchedProg.name;

  let campaignName = null;
  if (programId === "bezpieczne-ferie") campaignName = "Bezpieczne Ferie";
  else if (programId === "bezpieczne-wakacje") campaignName = "Bezpieczne Wakacje";
  else if (rawTitle.toLowerCase().includes("migawka")) campaignName = "Konkurs Migawka";

  const { sign: jrwaSign, caseId: jrwaCaseId } = extractJrwa(rawJrwaCase, rawJrwaProp, matchedProg.jrwa_symbol);
  const izrzSign = rawIzrz && rawIzrz !== "0" ? rawIzrz : null;
  const sourceInfo = rawEzd && rawEzd.trim() ? rawEzd.trim() : null;

  let ezdStatus = "w_ezd";
  if (isPublicationActionType(actionType) && !izrzSign && (!jrwaSign || !jrwaSign.startsWith("OZiPZ"))) {
    ezdStatus = "nie_dotyczy";
  }

  let title = rawTitle;
  if (!title) {
    title = actionType;
  }

  let audienceGroup = rawAudience && rawAudience !== "-" ? rawAudience : "";
  if (!audienceGroup) {
    if (isPublicationActionType(actionType)) {
      audienceGroup = "Społeczność lokalna / internauci";
    } else if (facilityName.toLowerCase().includes("przedszkol") || facilityName.toLowerCase().includes("żłobek")) {
      audienceGroup = "Dzieci w wieku przedszkolnym";
    } else if (
      facilityName.toLowerCase().includes("szkoła") ||
      facilityName.toLowerCase().includes("zespół szkół") ||
      facilityName.toLowerCase().includes("liceum") ||
      facilityName.toLowerCase().includes("socjoterapii")
    ) {
      audienceGroup = "Dzieci i młodzież szkolna";
    } else if (
      facilityName.toLowerCase().includes("przychodnia") ||
      facilityName.toLowerCase().includes("apteka") ||
      facilityName.toLowerCase().includes("zoz") ||
      facilityName.toLowerCase().includes("centrum zdrowia")
    ) {
      audienceGroup = "Pacjenci / personel medyczny";
    } else {
      audienceGroup = "Mieszkańcy powiatu / społeczność lokalna";
    }
  }

  const topic = resolveTopic(rawProgCat, rawProgName, rawTitle);

  let notes = null;
  if (rawScope && rawRemarks && rawScope !== rawRemarks && rawRemarks !== "0") {
    notes = `${rawScope}\n\nUwagi: ${rawRemarks}`;
  } else if (rawScope) {
    notes = rawScope;
  } else if (rawRemarks && rawRemarks !== "0") {
    notes = rawRemarks;
  }

  // Utwórz rekord działania

  mappedActions.push({
    id,
    title,
    actionType,
    date,
    facilityId,
    facilityName,
    municipality,
    programId,
    programName,
    topic,
    audienceGroup,
    campaignId: null,
    campaignName,
    jrwaSign,
    jrwaCaseId,
    izrzSign,
    ezdStatus,
    status: "wykonane",
    sourceInfo,
    scheduleEventId: null,
    materialId: null,
    numberOfActions,
    participantsCount,
    indirectRecipientsCount: 0,
    materialsDistributedCount,
    leadEducator,
    notes,
    createdAt,
    updatedAt,
  });
}

console.log(`Pomyślnie zmapowano wszystkie ${mappedActions.length} akcji.`);
console.log("Próbka zmapowanego rekordu #1 (better-oz-851):", mappedActions[0]);
console.log("Próbka zmapowanego rekordu #2 (better-oz-852):", mappedActions[1]);
console.log("Próbka zmapowanego rekordu #240 (better-oz-1090):", mappedActions[mappedActions.length - 1]);

if (!isDryRun) {
  console.log("Rozpoczynanie transakcji w bazie SQLite (ozipz.db)...");
  db.exec("BEGIN TRANSACTION;");
  try {
    const updateStmt = db.prepare(`
      INSERT INTO ozipz_actions (
        id, title, action_type, date, facility_id, facility_name, municipality,
        program_id, program_name, topic, audience_group, campaign_id, campaign_name,
        jrwa_sign, jrwa_case_id, izrz_sign, ezd_status, status, source_info,
        schedule_event_id, material_id, number_of_actions, participants_count,
        indirect_recipients_count, materials_distributed_count, lead_educator, notes,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        action_type = excluded.action_type,
        date = excluded.date,
        facility_id = excluded.facility_id,
        facility_name = excluded.facility_name,
        municipality = excluded.municipality,
        program_id = excluded.program_id,
        program_name = excluded.program_name,
        topic = excluded.topic,
        audience_group = excluded.audience_group,
        campaign_id = excluded.campaign_id,
        campaign_name = excluded.campaign_name,
        jrwa_sign = excluded.jrwa_sign,
        jrwa_case_id = excluded.jrwa_case_id,
        izrz_sign = excluded.izrz_sign,
        ezd_status = excluded.ezd_status,
        status = excluded.status,
        source_info = excluded.source_info,
        schedule_event_id = excluded.schedule_event_id,
        material_id = excluded.material_id,
        number_of_actions = excluded.number_of_actions,
        participants_count = excluded.participants_count,
        indirect_recipients_count = excluded.indirect_recipients_count,
        materials_distributed_count = excluded.materials_distributed_count,
        lead_educator = excluded.lead_educator,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `);

    for (const a of mappedActions) {
      updateStmt.run(
        a.id,
        a.title,
        a.actionType,
        a.date,
        a.facilityId,
        a.facilityName,
        a.municipality,
        a.programId,
        a.programName,
        a.topic,
        a.audienceGroup,
        a.campaignId,
        a.campaignName,
        a.jrwaSign,
        a.jrwaCaseId,
        a.izrzSign,
        a.ezdStatus,
        a.status,
        a.sourceInfo,
        a.scheduleEventId,
        a.materialId,
        a.numberOfActions,
        a.participantsCount,
        a.indirectRecipientsCount,
        a.materialsDistributedCount,
        a.leadEducator,
        a.notes,
        a.createdAt,
        a.updatedAt
      );
    }

    // Aktualizacja ozipz_schedule: uzupełnij month, month_name, year jeśli brak
    const monthsPL = [
      "", "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
      "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
    ];

    const schedules = db.prepare("SELECT id, event_date, month, year FROM ozipz_schedule").all();
    const updateSchedStmt = db.prepare(`
      UPDATE ozipz_schedule
      SET month = ?, month_name = ?, year = ?
      WHERE id = ?
    `);

    let schedUpdated = 0;
    for (const s of schedules) {
      if (s.event_date) {
        const m = parseInt(s.event_date.slice(5, 7), 10);
        const y = parseInt(s.event_date.slice(0, 4), 10);
        const mName = monthsPL[m] || "";
        updateSchedStmt.run(m, mName, y, s.id);
        schedUpdated++;
      }
    }
    console.log(`Zaktualizowano ${schedUpdated} zadań harmonogramu o month/year/month_name.`);

    db.exec("COMMIT;");
    console.log("Transakcja w SQLite zakończona sukcesem!");
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("Błąd transakcji SQLite:", err);
    throw err;
  }

  // Aktualizacja snapshotu JSON: src/features/ozipz/data/firebase_migrated_data.json
  console.log("Aktualizowanie pliku JSON firebase_migrated_data.json...");
  const mappedMap = new Map(mappedActions.map((a) => [a.id, a]));

  const updatedJsonActions = rawJson.actions.map((existingAction) => {
    if (mappedMap.has(existingAction.id)) {
      const m = mappedMap.get(existingAction.id);
      return {
        id: m.id,
        title: m.title,
        actionType: m.actionType,
        date: m.date,
        facilityId: m.facilityId,
        facilityName: m.facilityName,
        municipality: m.municipality,
        programId: m.programId,
        programName: m.programName,
        topic: m.topic,
        audienceGroup: m.audienceGroup,
        campaignId: m.campaignId,
        campaignName: m.campaignName,
        jrwaSign: m.jrwaSign,
        jrwaCaseId: m.jrwaCaseId,
        izrzSign: m.izrzSign,
        ezdStatus: m.ezdStatus,
        status: m.status,
        sourceInfo: m.sourceInfo,
        scheduleEventId: m.scheduleEventId,
        materialId: m.materialId,
        numberOfActions: m.numberOfActions,
        participantsCount: m.participantsCount,
        indirectRecipientsCount: m.indirectRecipientsCount,
        materialsDistributedCount: m.materialsDistributedCount,
        leadEducator: m.leadEducator,
        notes: m.notes,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    }
    return existingAction;
  });

  const monthsPL = [
    "", "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
  ];
  const updatedJsonSchedules = (rawJson.schedules || []).map((s) => {
    if (s.eventDate) {
      const m = parseInt(s.eventDate.slice(5, 7), 10);
      const y = parseInt(s.eventDate.slice(0, 4), 10);
      return {
        ...s,
        month: m,
        monthName: monthsPL[m] || "",
        year: y,
      };
    }
    return s;
  });

  rawJson.actions = updatedJsonActions;
  rawJson.schedules = updatedJsonSchedules;

  fs.writeFileSync(jsonPath, JSON.stringify(rawJson, null, 2), "utf-8");
  console.log(`Pomyślnie zaktualizowano ${jsonPath}`);
}
console.log("=== ZAKOŃCZONO POMYŚLNIE ===");
