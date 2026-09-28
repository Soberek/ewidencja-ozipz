import { migrateDatabase } from "../src/db/sqlite-migrations.ts";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const dbPath = path.join(projectRoot, "ozipz.db");
const dataPath = path.join(projectRoot, "src/features/ozipz/data/firebase_migrated_data.json");

console.log(`Inicjalizacja bazy danych SQLite w: ${dbPath}`);

const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Utwórz lub otwórz bazę
const db = new DatabaseSync(dbPath);

// Konfiguracja PRAGMA
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA synchronous = NORMAL;");

await migrateDatabase({
  async select(query, values = []) { return db.prepare(query.replace(/\$\d+/g, "?")).all(...values); },
  async execute(query, values = []) {
    if (values.length) return db.prepare(query.replace(/\$\d+/g, "?")).run(...values);
    db.exec(query);
  },
});

// Sprawdź czy baza jest już wypełniona
const progCountStmt = db.prepare("SELECT COUNT(*) as count FROM ozipz_programs");
const progCount = progCountStmt.get();

if (progCount.count === 0) {
  console.log("Ładowanie danych z firebase_migrated_data.json...");
  
  db.exec("BEGIN TRANSACTION; PRAGMA defer_foreign_keys = ON;");
  try {
    const insertFacility = db.prepare(
      "INSERT INTO ozipz_facilities (id, name, type, address, city, postal_code, municipality, county, leading_authority, default_coordinator_name, default_coordinator_phone, default_coordinator_email, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const f of rawData.facilities || []) {
      insertFacility.run(f.id, f.name, f.type, f.address, f.city, f.postalCode, f.municipality, f.county, f.leadingAuthority, f.defaultCoordinatorName || null, f.defaultCoordinatorPhone || null, f.defaultCoordinatorEmail || null, f.notes || null, f.createdAt, f.updatedAt);
    }

    const insertProgram = db.prepare(
      "INSERT INTO ozipz_programs (id, code, name, edition_year, target_audience, description, status, participating_schools_count, total_pupils_reached, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const p of rawData.programs || []) {
      insertProgram.run(p.id, p.code, p.name, p.editionYear, p.targetAudience, p.description, p.status, p.participatingSchoolsCount, p.totalPupilsReached, p.createdAt, p.updatedAt);
    }

    const insertPart = db.prepare(
      "INSERT INTO ozipz_participations (id, program_id, program_name, facility_id, facility_name, municipality, school_year, school_coordinator_name, school_coordinator_contact, classes_count, pupils_count, parents_count, has_declaration, has_final_report, evaluation_grade, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const part of rawData.participations || []) {
      insertPart.run(part.id, part.programId, part.programName, part.facilityId, part.facilityName, part.municipality, part.schoolYear, part.schoolCoordinatorName, part.schoolCoordinatorContact || null, part.classesCount, part.pupilsCount, part.parentsCount, part.hasDeclaration ? 1 : 0, part.hasFinalReport ? 1 : 0, part.evaluationGrade || null, part.notes || null, part.createdAt, part.updatedAt);
    }

    const insertMaterial = db.prepare(
      "INSERT INTO ozipz_materials (id, title, material_type, topic, publisher, target_audience, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const m of rawData.materials || []) {
      insertMaterial.run(m.id, m.title, m.materialType, m.topic, m.publisher, m.targetAudience || null, m.notes || null, m.createdAt, m.updatedAt);
    }

    const insertAction = db.prepare(
      "INSERT INTO ozipz_actions (id, title, action_type, date, facility_id, facility_name, municipality, program_id, program_name, topic, audience_group, campaign_id, campaign_name, jrwa_sign, jrwa_case_id, izrz_sign, ezd_status, status, source_info, schedule_event_id, material_id, number_of_actions, participants_count, indirect_recipients_count, materials_distributed_count, lead_educator, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const a of rawData.actions || []) {
      insertAction.run(
        a.id,
        a.title,
        a.actionType,
        a.date,
        a.facilityId || null,
        a.facilityName,
        a.municipality,
        a.programId || null,
        a.programName || null,
        a.topic,
        a.audienceGroup,
        a.campaignId || null,
        a.campaignName || null,
        a.jrwaSign || null,
        a.jrwaCaseId || null,
        a.izrzSign || null,
        a.ezdStatus || null,
        a.status || null,
        a.sourceInfo || null,
        a.scheduleEventId || null,
        a.materialId || null,
        a.numberOfActions || 1,
        a.participantsCount,
        a.indirectRecipientsCount || 0,
        a.materialsDistributedCount || 0,
        a.leadEducator,
        a.notes || null,
        a.createdAt,
        a.updatedAt
      );
    }

    const insertDist = db.prepare(
      "INSERT INTO ozipz_distributions (id, material_id, material_title, material_type, facility_id, recipient_name, municipality, quantity, distribution_date, assigned_educator, purpose, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const d of rawData.distributions || []) {
      insertDist.run(d.id, d.materialId || null, d.materialTitle, d.materialType || null, d.facilityId || null, d.recipientName, d.municipality || null, d.quantity, d.distributionDate, d.assignedEducator, d.purpose, d.notes || null, d.createdAt, d.updatedAt || null);
    }

    const insertSchedule = db.prepare(
      "INSERT INTO ozipz_schedule (id, title, event_date, end_date, category, location, facility_id, action_id, status, responsible_person, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const s of rawData.schedules || []) {
      insertSchedule.run(s.id, s.title, s.eventDate, s.endDate || null, s.category, s.location, s.facilityId || null, s.actionId || null, s.status, s.responsiblePerson, s.notes || null, s.createdAt, s.updatedAt);
    }

    const insertJrwa = db.prepare(
      "INSERT INTO ozipz_jrwa_cases (id, section, jrwa_symbol, case_number, year, referent_initials, full_case_sign, title, facility_id, facility_name, program_id, program_name, action_id, archival_category, start_date, end_date, initiating_document, status, assigned_educator, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const j of rawData.jrwaCases || []) {
      insertJrwa.run(j.id, j.section, j.jrwaSymbol, j.caseNumber, j.year, j.referentInitials || null, j.fullCaseSign, j.title, j.facilityId || null, j.facilityName || null, j.programId || null, j.programName || null, j.actionId || null, j.archivalCategory || null, j.startDate || null, j.endDate || null, j.initiatingDocument || null, j.status, j.assignedEducator, j.notes || null, j.createdAt, j.updatedAt);
    }

    const insertTemplate = db.prepare(
      "INSERT INTO ozipz_templates (id, title, topic, action_type, description_template, default_audience, suggested_materials, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const t of rawData.templates || []) {
      insertTemplate.run(t.id, t.title, t.topic, t.actionType, t.descriptionTemplate, t.defaultAudience, t.suggestedMaterials || null, t.createdAt, t.updatedAt);
    }

    const insertDict = db.prepare(
      "INSERT INTO ozipz_dictionaries (id, dict_type, code, label, description, postal_code, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const item of rawData.dictionaryItems || []) {
      insertDict.run(item.id, item.dictType, item.code, item.label, item.description || null, item.postalCode || item.postal_code || null, item.isSystem ? 1 : 0, item.createdAt, item.updatedAt);
    }

    const insertLetter = db.prepare(
      "INSERT INTO ozipz_letters (id, direction, letter_number, letter_date, case_sign, sender_recipient, facility_id, subject, program_id, assigned_person, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const l of rawData.letters || []) {
      insertLetter.run(l.id, l.direction, l.letterNumber, l.letterDate, l.caseSign || null, l.senderRecipient, l.facilityId || null, l.subject, l.programId || null, l.assignedPerson, l.status, l.notes || null, l.createdAt, l.updatedAt);
    }

    const insertScan = db.prepare(
      "INSERT INTO ozipz_scans (id, title, document_type, facility_id, facility_name, program_id, program_name, scan_date, file_size_kb, file_name, file_path, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const sc of rawData.scans || []) {
      insertScan.run(sc.id, sc.title, sc.documentType, sc.facilityId || null, sc.facilityName, sc.programId || null, sc.programName || null, sc.scanDate, sc.fileSizeKb || null, sc.fileName, sc.filePath || null, sc.notes || null, sc.createdAt);
    }

    const insertStaff = db.prepare(
      "INSERT INTO ozipz_staff (id, full_name, role, email, phone, active, specialization, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const st of rawData.staff || []) {
      insertStaff.run(st.id, st.fullName, st.role, st.email, st.phone, st.active ? 1 : 0, st.specialization || null, st.createdAt, st.updatedAt);
    }

    const insertContact = db.prepare(
      "INSERT INTO ozipz_contacts (id, facility_id, facility_name, name, position, phone, email, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const cnt of rawData.contacts || []) {
      insertContact.run(cnt.id, cnt.facilityId || null, cnt.facilityName, cnt.name, cnt.position, cnt.phone, cnt.email, cnt.notes || null, cnt.createdAt, cnt.updatedAt);
    }

    const insertPub = db.prepare(
      "INSERT INTO ozipz_publications (id, title, channel, publication_date, topic, link, reach_count, action_id, author, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const pub of rawData.publications || []) {
      insertPub.run(pub.id, pub.title, pub.channel, pub.publicationDate, pub.topic, pub.link || null, pub.reachCount || null, pub.actionId || null, pub.author, pub.notes || null, pub.createdAt, pub.updatedAt);
    }

    const insertReg = db.prepare(
      "INSERT INTO ozipz_registers (id, register_type, register_number, date, title, organizer, location, facility_id, facility_name, program_id, program_name, jrwa_sign, participants_count, target_audience, outcome, responsible_person, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const reg of rawData.registers || []) {
      insertReg.run(reg.id, reg.registerType, reg.registerNumber || null, reg.date, reg.title, reg.organizer, reg.location, reg.facilityId || null, reg.facilityName || null, reg.programId || null, reg.programName || null, reg.jrwaSign || null, reg.participantsCount, reg.targetAudience || null, reg.outcome || null, reg.responsiblePerson || null, reg.notes || null, reg.createdAt, reg.updatedAt);
    }

    db.exec("COMMIT;");
    console.log("Dane pomyślnie załadowane do bazy ozipz.db.");
  } catch (err) {
    db.exec("ROLLBACK;");
    console.error("Błąd podczas seedowania:", err);
    throw err;
  }
} else {
  console.log(`Baza ozipz.db już zawiera dane (programów: ${progCount.count}).`);
}

// Sprawdź czy checkpoint WAL może być zrobiony do pliku głównego
try {
  db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
} catch (e) {
  // Ignoruj jeśli niepotrzebne
}

db.close();
console.log("Inicjalizacja ozipz.db zakończona sukcesem.");
