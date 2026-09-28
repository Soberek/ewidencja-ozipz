import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertRawAction } from './import_actions_lib.js';
import { actionsPart1 } from './dataset_part1.js';
import { actionsPart2 } from './dataset_part2.js';
import { actionsPart3 } from './dataset_part3.js';
import { actionsPart4 } from './dataset_part4.js';
import { actionsPart5 } from './dataset_part5.js';
import { actionsPart6 } from './dataset_part6.js';
import { actionsPart7 } from './dataset_part7.js';
import { actionsPart8 } from './dataset_part8.js';
import { actionsPart9 } from './dataset_part9.js';
import { actionsPart10 } from './dataset_part10.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allRaw = [
  ...actionsPart1,
  ...actionsPart2,
  ...actionsPart3,
  ...actionsPart4,
  ...actionsPart5,
  ...actionsPart6,
  ...actionsPart7,
  ...actionsPart8,
  ...actionsPart9,
  ...actionsPart10,
];

// Deduplicate by ID
const mapById = new Map();
for (const item of allRaw) {
  mapById.set(item.id, item);
}

const uniqueRaw = Array.from(mapById.values());
console.log(`Załadowano surowych unikalnych działań: ${uniqueRaw.length}`);

// Convert each raw action
const convertedActions = uniqueRaw.map(convertRawAction);

// Sort chronologically by date descending
convertedActions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

console.log(`Przekonwertowano pomyślnie ${convertedActions.length} działań.`);
console.log('Przykładowe pierwsze 2 działania:', JSON.stringify(convertedActions.slice(0, 2), null, 2));

// Update firebase_migrated_data.json
const jsonPath = path.resolve(__dirname, '../src/features/ozipz/data/firebase_migrated_data.json');
const currentData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

currentData.actions = convertedActions;
fs.writeFileSync(jsonPath, JSON.stringify(currentData, null, 2), 'utf8');
console.log(`Zaktualizowano ${jsonPath} z ${convertedActions.length} działaniami.`);
