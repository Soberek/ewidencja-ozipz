import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = path.join(__dirname, "../src/features/ozipz/data/firebase_migrated_data.json");
const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));

console.log("Przetwarzanie jrwaCases (130 spraw)...");

let fixedCasesCount = 0;
const caseSignToIdMap = new Map();

data.jrwaCases = data.jrwaCases.map((c) => {
  const decoded = decodeURIComponent(c.id);
  const match = decoded.match(/ozipz\.?([0-9.]+)\.([0-9]+)\.([0-9]{4})/i);
  if (match) {
    const symbol = match[1];
    const caseNum = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const fullCaseSign = `OZiPZ.${symbol}.${caseNum}.${year}`;

    fixedCasesCount++;
    caseSignToIdMap.set(fullCaseSign, c.id);

    return {
      ...c,
      section: "OZiPZ",
      jrwaSymbol: symbol,
      caseNumber: caseNum,
      year: year,
      fullCaseSign: fullCaseSign,
    };
  }

  // Główne sprawy programowe / rejestry
  const fullCaseSign = `OZiPZ.${c.jrwaSymbol}.${c.year || 2026}`;
  caseSignToIdMap.set(fullCaseSign, c.id);

  return {
    ...c,
    section: "OZiPZ",
    fullCaseSign: fullCaseSign,
  };
});

console.log(`Pomyślnie zaktualizowano ${fixedCasesCount} spraw indywidualnych i ${data.jrwaCases.length - fixedCasesCount} spraw programowych w jrwaCases.`);

fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
console.log("Zapisano firebase_migrated_data.json.");
