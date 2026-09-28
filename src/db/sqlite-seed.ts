import type { ISqlDatabase } from "./types";
import { UPSERT_FACILITY_SQL, facilitySqlParams } from "./repositories/sqlite/sqlite-facilities.repository";
import { JRWA_DEFAULT_SECTION } from "../features/ozipz/constants";

export async function seedInitialData(db: ISqlDatabase): Promise<void> {
  const existingFacilities = await db.select<{ count: number }[]>("SELECT count(*) as count FROM ozipz_facilities");
  if (existingFacilities[0]?.count === 0) {
    const { MIGRATED_FIREBASE_DATA } = await import("../features/ozipz/data/migratedData");
    try {
      await db.execute("BEGIN TRANSACTION;");
      await db.execute("PRAGMA defer_foreign_keys = ON;");
      for (const f of MIGRATED_FIREBASE_DATA.facilities) {
        await db.execute(UPSERT_FACILITY_SQL, facilitySqlParams(f));
      }
      for (const p of MIGRATED_FIREBASE_DATA.programs) {
        await db.execute(
          "INSERT INTO ozipz_programs (id, code, name, edition_year, jrwa_symbol, target_audience, description, status, participating_schools_count, total_pupils_reached, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
          [p.id, p.code, p.name, p.editionYear, p.jrwaSymbol || null, p.targetAudience, p.description, p.status, p.participatingSchoolsCount, p.totalPupilsReached, p.createdAt, p.updatedAt]
        );
      }
      for (const part of MIGRATED_FIREBASE_DATA.participations) {
        await db.execute(
          "INSERT INTO ozipz_participations (id, program_id, program_name, facility_id, facility_name, municipality, school_year, school_coordinator_name, school_coordinator_contact, classes_count, pupils_count, parents_count, has_declaration, has_final_report, evaluation_grade, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
          [part.id, part.programId, part.programName, part.facilityId, part.facilityName, part.municipality, part.schoolYear, part.schoolCoordinatorName, part.schoolCoordinatorContact || null, part.classesCount, part.pupilsCount, part.parentsCount, part.hasDeclaration ? 1 : 0, part.hasFinalReport ? 1 : 0, part.evaluationGrade || null, part.notes || null, part.createdAt, part.updatedAt]
        );
      }
      for (const m of MIGRATED_FIREBASE_DATA.materials) {
        await db.execute(
          "INSERT INTO ozipz_materials (id, title, material_type, topic, publisher, target_audience, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [m.id, m.title, m.materialType, m.topic, m.publisher, m.targetAudience || null, m.notes || null, m.createdAt, m.updatedAt]
        );
      }
      for (const a of MIGRATED_FIREBASE_DATA.actions) {
        await db.execute(
          "INSERT INTO ozipz_actions (id, title, action_type, date, facility_id, facility_name, municipality, program_id, program_name, topic, audience_group, campaign_id, campaign_name, jrwa_sign, jrwa_case_id, izrz_sign, ezd_status, status, source_info, schedule_event_id, material_id, number_of_actions, participants_count, indirect_recipients_count, materials_distributed_count, lead_educator, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)",
          [
            a.id, a.title, a.actionType, a.date, a.facilityId || null, a.facilityName, a.municipality,
            a.programId || null, a.programName || null, a.topic, a.audienceGroup, a.campaignId || null,
            a.campaignName || null, a.jrwaSign || null, a.jrwaCaseId || null, a.izrzSign || null,
            a.ezdStatus || null, a.status || null, a.sourceInfo || null, a.scheduleEventId || null,
            a.materialId || null, a.numberOfActions || 1, a.participantsCount, a.indirectRecipientsCount || 0,
            a.materialsDistributedCount || 0, a.leadEducator, a.notes || null, a.createdAt, a.updatedAt,
          ]
        );
      }
      for (const d of MIGRATED_FIREBASE_DATA.distributions) {
        await db.execute(
          "INSERT INTO ozipz_distributions (id, material_id, material_title, material_type, facility_id, recipient_name, municipality, action_id, action_title, quantity, distribution_date, assigned_educator, purpose, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
          [d.id, d.materialId || null, d.materialTitle, d.materialType || null, d.facilityId || null, d.recipientName, d.municipality || null, d.actionId || null, d.actionTitle || null, d.quantity, d.distributionDate, d.assignedEducator, d.purpose, d.notes || null, d.createdAt, d.updatedAt || d.createdAt]
        );
      }
      for (const s of MIGRATED_FIREBASE_DATA.schedules) {
        await db.execute(
          "INSERT INTO ozipz_schedule (id, title, activity_type_code, activity_type_name, event_date, end_date, category, topic, program_id, program_name, campaign_id, campaign_name, recipient_group, location, facility_id, action_id, status, annotation_reason_code, annotation_reason_label, responsible_person, month, month_name, year, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)",
          [s.id, s.title, s.activityTypeCode || null, s.activityTypeName || null, s.eventDate, s.endDate || null, s.category || null, s.topic || null, s.programId || null, s.programName || null, s.campaignId || null, s.campaignName || null, s.recipientGroup || null, s.location, s.facilityId || null, s.actionId || null, s.status, s.annotationReasonCode || null, s.annotationReasonLabel || null, s.responsiblePerson, s.month || null, s.monthName || null, s.year || null, s.notes || null, s.createdAt, s.updatedAt]
        );
      }
      for (const j of MIGRATED_FIREBASE_DATA.jrwaCases) {
        await db.execute(
          "INSERT INTO ozipz_jrwa_cases (id, section, jrwa_symbol, case_number, year, referent_initials, full_case_sign, title, facility_id, facility_name, program_id, program_name, action_id, archival_category, start_date, end_date, initiating_document, status, assigned_educator, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)",
          [j.id, j.section, j.jrwaSymbol, j.caseNumber, j.year, j.referentInitials || null, j.fullCaseSign, j.title, j.facilityId || null, j.facilityName || null, j.programId || null, j.programName || null, j.actionId || null, j.archivalCategory || null, j.startDate || null, j.endDate || null, j.initiatingDocument || null, j.status, j.assignedEducator, j.notes || null, j.createdAt, j.updatedAt]
        );
      }
      for (const t of MIGRATED_FIREBASE_DATA.templates) {
        await db.execute(
          "INSERT INTO ozipz_templates (id, title, topic, action_type, description_template, default_audience, suggested_materials, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [t.id, t.title, t.topic, t.actionType, t.descriptionTemplate, t.defaultAudience, t.suggestedMaterials || null, t.createdAt, t.updatedAt]
        );
      }
      for (const item of MIGRATED_FIREBASE_DATA.dictionaryItems) {
        await db.execute(
          "INSERT OR REPLACE INTO ozipz_dictionaries (id, dict_type, code, label, description, postal_code, kind, gis_category, is_system, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
          [item.id, item.dictType, item.code, item.label, item.description || null, item.postalCode || null, item.kind || null, item.gisCategory || null, item.isSystem ? 1 : 0, item.createdAt, item.updatedAt]
        );
      }
      for (const l of MIGRATED_FIREBASE_DATA.letters) {
        await db.execute(
          "INSERT INTO ozipz_letters (id, direction, letter_number, letter_date, case_sign, sender_recipient, facility_id, subject, program_id, assigned_person, status, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
          [l.id, l.direction, l.letterNumber, l.letterDate, l.caseSign || null, l.senderRecipient, l.facilityId || null, l.subject, l.programId || null, l.assignedPerson, l.status, l.notes || null, l.createdAt, l.updatedAt]
        );
      }
      for (const sc of MIGRATED_FIREBASE_DATA.scans) {
        await db.execute(
          "INSERT INTO ozipz_scans (id, title, document_type, facility_id, facility_name, program_id, program_name, scan_date, file_size_kb, file_name, file_path, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
          [sc.id, sc.title, sc.documentType, sc.facilityId || null, sc.facilityName, sc.programId || null, sc.programName || null, sc.scanDate, sc.fileSizeKb || null, sc.fileName, sc.filePath || null, sc.notes || null, sc.createdAt, sc.createdAt]
        );
      }
      for (const st of MIGRATED_FIREBASE_DATA.staff) {
        await db.execute(
          "INSERT INTO ozipz_staff (id, full_name, role, email, phone, active, specialization, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [st.id, st.fullName, st.role, st.email || null, st.phone || null, st.active ? 1 : 0, st.specialization || null, st.createdAt, st.updatedAt]
        );
      }
      for (const cnt of MIGRATED_FIREBASE_DATA.contacts) {
        await db.execute(
          "INSERT INTO ozipz_contacts (id, facility_id, facility_name, municipality, name, position, phone, email, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
          [cnt.id, cnt.facilityId || null, cnt.facilityName, cnt.municipality || null, cnt.name, cnt.position, cnt.phone || null, cnt.email || null, cnt.notes || null, cnt.createdAt, cnt.updatedAt]
        );
      }
      for (const pub of MIGRATED_FIREBASE_DATA.publications) {
        await db.execute(
          "INSERT INTO ozipz_publications (id, title, channel, publication_date, topic, link, reach_count, action_id, author, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
          [pub.id, pub.title, pub.channel, pub.publicationDate, pub.topic, pub.link || null, pub.reachCount || null, pub.actionId || null, pub.author, pub.notes || null, pub.createdAt, pub.updatedAt]
        );
      }
      for (const reg of MIGRATED_FIREBASE_DATA.registers) {
        await db.execute(
          "INSERT INTO ozipz_registers (id, register_type, register_number, date, title, organizer, location, facility_id, facility_name, program_id, program_name, jrwa_sign, participants_count, target_audience, outcome, responsible_person, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)",
          [reg.id, reg.registerType, reg.registerNumber || null, reg.date, reg.title, reg.organizer, reg.location, reg.facilityId || null, reg.facilityName || null, reg.programId || null, reg.programName || null, reg.jrwaSign || null, reg.participantsCount, reg.targetAudience || null, reg.outcome || null, reg.responsiblePerson || null, reg.notes || null, reg.createdAt, reg.updatedAt]
        );
      }
      await db.execute("COMMIT;");
    } catch (err) {
      await db.execute("ROLLBACK;");
      throw err;
    }
    // Dane importowane z Firebase zawierały atrapy teczek — czyścimy je zaraz po zasianiu.
    await cleanupPoisonedJrwaCases(db);
  }
}

/**
 * Idempotentne czyszczenie bazy z atrap teczek (dummy folders bez numeru sprawy)
 * oraz naprawa i re-numeracja "zatrutych" spraw z zawyżonymi numerami (np. > 100).
 */
export async function cleanupPoisonedJrwaCases(db: ISqlDatabase): Promise<void> {
  const allCases = await db.select<Array<{
    id: string;
    section: string;
    jrwa_symbol: string;
    case_number: number;
    year: number;
    full_case_sign: string;
    created_at: string;
  }>>("SELECT id, section, jrwa_symbol, case_number, year, full_case_sign, created_at FROM ozipz_jrwa_cases;");

  if (!allCases || allCases.length === 0) return;
  const lockedCaseIds = new Set((await db.select<Array<{ id: string }>>(
    "SELECT DISTINCT j.id FROM ozipz_jrwa_cases j JOIN ozipz_actions a ON (a.jrwa_case_id = j.id OR a.jrwa_sign = j.full_case_sign) JOIN ozipz_closed_months m ON m.month_key = substr(a.date, 1, 7)"
  )).map((row) => row.id));

  const genericDummyRegex = /^(?:(?:PSSE\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\.)?(?:966(?:\.[0-9]+)?|9011(?:\.[0-9]+)?|0442|\d{4})\.(\d{4})$/i;
  const dummyCaseIds: string[] = [];

  for (const c of allCases) {
    if (lockedCaseIds.has(c.id)) continue;
    const sign = (c.full_case_sign || "").trim();
    const escapedSym = (c.jrwa_symbol || "").replace(/\./g, "\\.");
    const dummyRegex = new RegExp(`^(?:(?:PSSE\\.)?(?:OZiPZ|OZ|[A-Za-z0-9_-]+)\\.)?${escapedSym}\\.${c.year}(?:\\.[A-Za-z0-9]+)?$`, "i");

    if (
      (escapedSym && dummyRegex.test(sign)) ||
      genericDummyRegex.test(sign) ||
      c.case_number === c.year
    ) {
      dummyCaseIds.push(c.id);
    }
  }

  if (dummyCaseIds.length > 0) {
    await db.execute("BEGIN TRANSACTION;");
    try {
      for (const dummyId of dummyCaseIds) {
        await db.execute("UPDATE ozipz_actions SET jrwa_case_id = NULL WHERE jrwa_case_id = $1;", [dummyId]);
        await db.execute("DELETE FROM ozipz_jrwa_cases WHERE id = $1;", [dummyId]);
      }
      await db.execute("COMMIT;");
    } catch (err) {
      await db.execute("ROLLBACK;");
      throw err;
    }
  }

  // Pobierz sprawy po usunięciu atrap
  const remainingCases = await db.select<Array<{
    id: string;
    section: string;
    jrwa_symbol: string;
    case_number: number;
    year: number;
    full_case_sign: string;
    created_at: string;
  }>>("SELECT id, section, jrwa_symbol, case_number, year, full_case_sign, created_at FROM ozipz_jrwa_cases ORDER BY year ASC, jrwa_symbol ASC, case_number ASC, created_at ASC;");

  // Pogrupuj według (section, jrwa_symbol, year)
  const groups = new Map<string, typeof remainingCases>();
  for (const c of remainingCases) {
    const key = `${c.section || JRWA_DEFAULT_SECTION}::${c.jrwa_symbol}::${c.year}`;
    const list = groups.get(key) || [];
    list.push(c);
    groups.set(key, list);
  }

  const now = new Date().toISOString();
  for (const [, casesInGroup] of groups) {
    const hasPoisoned = casesInGroup.some((c) => c.case_number > 100);
    if (!hasPoisoned) continue;

    const normalCases = casesInGroup.filter((c) => c.case_number <= 100);
    const poisonedCases = casesInGroup.filter((c) => c.case_number > 100 && !lockedCaseIds.has(c.id));
    if (poisonedCases.length === 0) continue;

    let nextNum = normalCases.reduce((max, c) => (c.case_number > max ? c.case_number : max), 0) + 1;

    await db.execute("BEGIN TRANSACTION;");
    try {
      for (const pc of poisonedCases) {
        const sec = pc.section || JRWA_DEFAULT_SECTION;
        const newSign = `${sec}.${pc.jrwa_symbol}.${nextNum}.${pc.year}`;
        // Trigger sync_ozipz_jrwa_cases_sign przenosi nową sygnaturę do działań, rejestrów i pism.

        await db.execute(
          "UPDATE ozipz_jrwa_cases SET case_number = $1, full_case_sign = $2, updated_at = $3 WHERE id = $4;",
          [nextNum, newSign, now, pc.id]
        );


        nextNum++;
      }
      await db.execute("COMMIT;");
    } catch (err) {
      await db.execute("ROLLBACK;");
      throw err;
    }
  }
}
