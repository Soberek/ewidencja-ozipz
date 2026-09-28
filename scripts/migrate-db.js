import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { migrateDatabase, SCHEMA_VERSION } from "../src/db/sqlite-migrations.ts";

const databasePath = path.resolve(process.argv[2] || "ozipz.db");
const database = new DatabaseSync(databasePath);
try {
  const migration = await migrateDatabase({
    async select(query, values = []) { return database.prepare(query.replace(/\$\d+/g, "?")).all(...values); },
    async execute(query, values = []) {
      if (values.length) return database.prepare(query.replace(/\$\d+/g, "?")).run(...values);
      database.exec(query);
    },
  });
  const integrity = database.prepare("PRAGMA integrity_check").all();
  const violations = database.prepare("PRAGMA foreign_key_check").all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== "ok" || violations.length) throw new Error("Kontrola bazy nie powiodła się");
  console.log(`Baza ma schemat ${SCHEMA_VERSION}. Integralność i powiązania: OK.`);
  console.log(migration.migrated ? "Migracja wykonana." : "Schemat był już aktualny; nie wykonano ponownej migracji.");
  if (migration.backupPath) console.log(`Kopia sprzed migracji: ${migration.backupPath}`);
} finally { database.close(); }
