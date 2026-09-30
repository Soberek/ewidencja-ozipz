import type { ISqlDatabase } from "./types";

export const SCHEMA_VERSION = 11;

/** Dzień w formacie ISO (RRRR-MM-DD, opcjonalnie z czasem) — na nim opiera się blokada zamkniętych miesięcy. */
const isoDay = (column: string) => `${column} GLOB '[0-9][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]*'`;
/** Predykat dla UPDATE na ozipz_actions: pomija działania z zamkniętych miesięcy (zachowują stan historyczny). */
const openMonth = (table = "ozipz_actions") => `NOT EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key = substr(${table}.date, 1, 7))`;
/** Nazwa gminy bez prefiksu „Gmina” – tak przechowują ją placówki, kontakty i działania. */
const bareMunicipality = (expr: string) => `CASE WHEN lower(substr(${expr}, 1, 6)) = 'gmina ' THEN trim(substr(${expr}, 7)) ELSE trim(${expr}) END`;
const closedActionLinked = (column: string) =>
  `EXISTS (SELECT 1 FROM ozipz_actions a JOIN ozipz_closed_months m ON m.month_key = substr(a.date, 1, 7) WHERE a.${column} = OLD.id)`;
const CLOSED_LINK_MESSAGE = "Nie można usunąć: rekord jest powiązany z działaniem z zamkniętego miesiąca.";

/** „telefon / e-mail” kontaktu — ten sam zapis, który formularz zgłoszenia zapisuje w school_coordinator_contact. */
const coordinatorContactLine = (row: string) => {
  const phone = `trim(COALESCE(${row}.phone, ''))`;
  const email = `trim(COALESCE(${row}.email, ''))`;
  return `NULLIF(${phone} || CASE WHEN ${phone} <> '' AND ${email} <> '' THEN ' / ' ELSE '' END || ${email}, '')`;
};

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS ozipz_facilities (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, education_types TEXT CHECK (json_valid(education_types)), address TEXT NOT NULL, city TEXT NOT NULL, postal_code TEXT NOT NULL, municipality TEXT NOT NULL, county TEXT NOT NULL, leading_authority TEXT NOT NULL, is_complex INTEGER NOT NULL DEFAULT 0 CHECK (is_complex IN (0, 1)), parent_facility_id TEXT CHECK (parent_facility_id <> id), email TEXT, phone TEXT, default_coordinator_name TEXT, default_coordinator_phone TEXT, default_coordinator_email TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (parent_facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_programs (id TEXT PRIMARY KEY NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, edition_year TEXT NOT NULL, jrwa_symbol TEXT CHECK (jrwa_symbol <> ''), target_audience TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'aktywny', participating_schools_count INTEGER NOT NULL DEFAULT 0 CHECK (participating_schools_count >= 0), total_pupils_reached INTEGER NOT NULL DEFAULT 0 CHECK (total_pupils_reached >= 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(code, edition_year)) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_participations (id TEXT PRIMARY KEY NOT NULL, program_id TEXT NOT NULL, program_name TEXT NOT NULL, facility_id TEXT NOT NULL, facility_name TEXT NOT NULL, municipality TEXT NOT NULL, school_year TEXT NOT NULL, school_coordinator_name TEXT NOT NULL, school_coordinator_contact TEXT, school_coordinator_contact_id TEXT, classes_count INTEGER NOT NULL DEFAULT 0 CHECK (classes_count >= 0), pupils_count INTEGER NOT NULL DEFAULT 0 CHECK (pupils_count >= 0), parents_count INTEGER NOT NULL DEFAULT 0 CHECK (parents_count >= 0), has_declaration INTEGER NOT NULL DEFAULT 1 CHECK (has_declaration IN (0, 1)), has_final_report INTEGER NOT NULL DEFAULT 0 CHECK (has_final_report IN (0, 1)), evaluation_grade TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE RESTRICT, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE RESTRICT, FOREIGN KEY (school_coordinator_contact_id) REFERENCES ozipz_contacts(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_materials (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, material_type TEXT NOT NULL, topic TEXT NOT NULL, publisher TEXT NOT NULL, target_audience TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_actions (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, action_type TEXT NOT NULL, date TEXT NOT NULL CHECK (${isoDay("date")}), facility_id TEXT, facility_name TEXT NOT NULL, municipality TEXT NOT NULL, program_id TEXT, program_name TEXT, topic TEXT NOT NULL, audience_group TEXT NOT NULL, campaign_id TEXT, campaign_name TEXT, jrwa_sign TEXT, jrwa_case_id TEXT, izrz_sign TEXT, ezd_status TEXT, status TEXT, source_info TEXT, schedule_event_id TEXT, linked_action_id TEXT CHECK (linked_action_id <> id), material_id TEXT, number_of_actions INTEGER NOT NULL DEFAULT 1 CHECK (number_of_actions >= 1), participants_count INTEGER NOT NULL DEFAULT 0 CHECK (participants_count >= 0), indirect_recipients_count INTEGER NOT NULL DEFAULT 0 CHECK (indirect_recipients_count >= 0), materials_distributed_count INTEGER NOT NULL DEFAULT 0 CHECK (materials_distributed_count >= 0), lead_educator TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL, FOREIGN KEY (material_id) REFERENCES ozipz_materials(id) ON DELETE SET NULL, FOREIGN KEY (schedule_event_id) REFERENCES ozipz_schedule(id) ON DELETE SET NULL, FOREIGN KEY (jrwa_case_id) REFERENCES ozipz_jrwa_cases(id) ON DELETE SET NULL, FOREIGN KEY (linked_action_id) REFERENCES ozipz_actions(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_distributions (id TEXT PRIMARY KEY NOT NULL, material_id TEXT, material_title TEXT NOT NULL, material_type TEXT, facility_id TEXT, recipient_name TEXT NOT NULL, municipality TEXT, action_id TEXT, action_title TEXT, quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1), distribution_date TEXT NOT NULL CHECK (${isoDay("distribution_date")}), assigned_educator TEXT NOT NULL, purpose TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (material_id) REFERENCES ozipz_materials(id) ON DELETE SET NULL, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (action_id) REFERENCES ozipz_actions(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_schedule (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, activity_type_code TEXT, activity_type_name TEXT, event_date TEXT NOT NULL CHECK (${isoDay("event_date")}), end_date TEXT CHECK (${isoDay("end_date")}), category TEXT, topic TEXT, program_id TEXT, program_name TEXT, campaign_id TEXT, campaign_name TEXT, recipient_group TEXT, location TEXT NOT NULL, facility_id TEXT, action_id TEXT, status TEXT NOT NULL DEFAULT 'zaplanowane', annotation_reason_code TEXT, annotation_reason_label TEXT, annotation_text TEXT, responsible_person TEXT NOT NULL, month INTEGER CHECK (month BETWEEN 1 AND 12), month_name TEXT, year INTEGER CHECK (year >= 1), planned_count INTEGER DEFAULT 1 CHECK (planned_count >= 0), completed_count INTEGER DEFAULT 0 CHECK (completed_count >= 0), manually_completed INTEGER DEFAULT 0 CHECK (manually_completed IN (0, 1)), jrwa TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CHECK (end_date >= event_date), FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL, FOREIGN KEY (action_id) REFERENCES ozipz_actions(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_jrwa_cases (id TEXT PRIMARY KEY NOT NULL, section TEXT NOT NULL DEFAULT 'OZiPZ', jrwa_symbol TEXT NOT NULL, case_number INTEGER NOT NULL CHECK (case_number >= 1), year INTEGER NOT NULL CHECK (year >= 1), referent_initials TEXT, full_case_sign TEXT NOT NULL, title TEXT NOT NULL, facility_id TEXT, facility_name TEXT, program_id TEXT, program_name TEXT, action_id TEXT, archival_category TEXT, start_date TEXT CHECK (${isoDay("start_date")}), end_date TEXT CHECK (${isoDay("end_date")}), initiating_document TEXT, status TEXT NOT NULL DEFAULT 'w_toku', assigned_educator TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, CHECK (end_date >= start_date), UNIQUE(section, jrwa_symbol, case_number, year), UNIQUE(full_case_sign), FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL, FOREIGN KEY (action_id) REFERENCES ozipz_actions(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_publications (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, channel TEXT NOT NULL, publication_date TEXT NOT NULL CHECK (${isoDay("publication_date")}), topic TEXT NOT NULL, link TEXT, reach_count INTEGER CHECK (reach_count >= 0), action_id TEXT, author TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (action_id) REFERENCES ozipz_actions(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_dictionaries (id TEXT PRIMARY KEY NOT NULL, dict_type TEXT NOT NULL, code TEXT NOT NULL, label TEXT NOT NULL, description TEXT, postal_code TEXT, kind TEXT CHECK (kind IN ('PROGRAMOWE', 'NIEPROGRAMOWE')), gis_category TEXT CHECK (gis_category IN ('uzaleznienia', 'szczepienia', 'otylosc', 'sti', 'inne', 'brak')), is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(dict_type, code)) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_letters (id TEXT PRIMARY KEY NOT NULL, direction TEXT NOT NULL CHECK (direction IN ('wychodzace', 'przychodzace')), letter_number TEXT NOT NULL, letter_date TEXT NOT NULL CHECK (${isoDay("letter_date")}), case_sign TEXT, sender_recipient TEXT NOT NULL, facility_id TEXT, subject TEXT NOT NULL, program_id TEXT, assigned_person TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'nowe', notes TEXT, response_due_date TEXT CHECK (${isoDay("response_due_date")}), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_scans (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, document_type TEXT NOT NULL, facility_id TEXT, facility_name TEXT NOT NULL, program_id TEXT, program_name TEXT, scan_date TEXT NOT NULL CHECK (${isoDay("scan_date")}), file_size_kb INTEGER CHECK (file_size_kb >= 0), file_name TEXT NOT NULL, file_path TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_templates (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, topic TEXT NOT NULL, action_type TEXT NOT NULL, description_template TEXT NOT NULL, default_audience TEXT NOT NULL, suggested_materials TEXT, action_defaults TEXT CHECK (json_valid(action_defaults)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_staff (id TEXT PRIMARY KEY NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL, email TEXT, phone TEXT, active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)), specialization TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_contacts (id TEXT PRIMARY KEY NOT NULL, facility_id TEXT, facility_name TEXT NOT NULL, municipality TEXT, name TEXT NOT NULL, position TEXT NOT NULL, phone TEXT, email TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_registers (id TEXT PRIMARY KEY NOT NULL, register_type TEXT NOT NULL, register_number TEXT, date TEXT NOT NULL CHECK (${isoDay("date")}), title TEXT NOT NULL, organizer TEXT NOT NULL, location TEXT NOT NULL, facility_id TEXT, facility_name TEXT, program_id TEXT, program_name TEXT, jrwa_sign TEXT, participants_count INTEGER NOT NULL DEFAULT 0 CHECK (participants_count >= 0), target_audience TEXT, outcome TEXT, responsible_person TEXT, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (facility_id) REFERENCES ozipz_facilities(id) ON DELETE SET NULL, FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_monthly_targets (id TEXT PRIMARY KEY NOT NULL, year INTEGER NOT NULL CHECK (year >= 1), month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12), program_actions INTEGER NOT NULL DEFAULT 0 CHECK (program_actions >= 0), program_recipients INTEGER NOT NULL DEFAULT 0 CHECK (program_recipients >= 0), other_actions INTEGER NOT NULL DEFAULT 0 CHECK (other_actions >= 0), other_recipients INTEGER NOT NULL DEFAULT 0 CHECK (other_recipients >= 0), notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(year, month)) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_closed_months (month_key TEXT PRIMARY KEY NOT NULL CHECK (month_key GLOB '[0-9][0-9][0-9][0-9]-0[1-9]' OR month_key GLOB '[0-9][0-9][0-9][0-9]-1[0-2]'), closed_at TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS ozipz_change_log (id INTEGER PRIMARY KEY, changed_at TEXT NOT NULL, actor TEXT, table_name TEXT NOT NULL, row_id TEXT NOT NULL, operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')), old_data TEXT CHECK (json_valid(old_data)), new_data TEXT CHECK (json_valid(new_data)), restored_at TEXT) STRICT;
CREATE VIEW IF NOT EXISTS v_ozipz_facility_overview AS SELECT f.id as facility_id, f.name as facility_name, (SELECT COUNT(*) FROM ozipz_participations p WHERE p.facility_id = f.id) as programs_count, (SELECT COUNT(*) FROM ozipz_actions a WHERE a.facility_id = f.id) as actions_count, COALESCE((SELECT SUM(participants_count) FROM ozipz_actions a WHERE a.facility_id = f.id), 0) as total_pupils_reached, COALESCE((SELECT SUM(quantity) FROM ozipz_distributions d WHERE d.facility_id = f.id), 0) as total_materials_received, (SELECT MAX(date) FROM ozipz_actions a WHERE a.facility_id = f.id) as last_action_date FROM ozipz_facilities f;
CREATE INDEX IF NOT EXISTS idx_actions_facility ON ozipz_actions(facility_id);
CREATE INDEX IF NOT EXISTS idx_actions_program ON ozipz_actions(program_id);
CREATE INDEX IF NOT EXISTS idx_actions_date ON ozipz_actions(date);
CREATE INDEX IF NOT EXISTS idx_actions_municipality ON ozipz_actions(municipality);
CREATE INDEX IF NOT EXISTS idx_actions_status ON ozipz_actions(status);
CREATE UNIQUE INDEX IF NOT EXISTS ux_actions_schedule_event ON ozipz_actions(schedule_event_id) WHERE schedule_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_jrwa_case ON ozipz_actions(jrwa_case_id);
CREATE INDEX IF NOT EXISTS idx_actions_material ON ozipz_actions(material_id);
CREATE INDEX IF NOT EXISTS idx_actions_linked ON ozipz_actions(linked_action_id);
CREATE INDEX IF NOT EXISTS idx_participations_facility ON ozipz_participations(facility_id);
CREATE INDEX IF NOT EXISTS idx_participations_year ON ozipz_participations(school_year);
CREATE INDEX IF NOT EXISTS idx_participations_coordinator ON ozipz_participations(school_coordinator_contact_id);
CREATE INDEX IF NOT EXISTS idx_distributions_material ON ozipz_distributions(material_id);
CREATE INDEX IF NOT EXISTS idx_distributions_facility ON ozipz_distributions(facility_id);
CREATE INDEX IF NOT EXISTS idx_distributions_action ON ozipz_distributions(action_id);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON ozipz_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_schedule_facility ON ozipz_schedule(facility_id);
CREATE INDEX IF NOT EXISTS idx_schedule_program ON ozipz_schedule(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_schedule_action ON ozipz_schedule(action_id) WHERE action_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedule_date ON ozipz_schedule(event_date);
CREATE INDEX IF NOT EXISTS idx_schedule_status ON ozipz_schedule(status);
CREATE INDEX IF NOT EXISTS idx_jrwa_cases_facility ON ozipz_jrwa_cases(facility_id);
CREATE INDEX IF NOT EXISTS idx_jrwa_cases_program ON ozipz_jrwa_cases(program_id);
CREATE INDEX IF NOT EXISTS idx_jrwa_cases_action ON ozipz_jrwa_cases(action_id);
CREATE INDEX IF NOT EXISTS idx_contacts_facility ON ozipz_contacts(facility_id);
CREATE INDEX IF NOT EXISTS idx_contacts_municipality ON ozipz_contacts(municipality);
CREATE INDEX IF NOT EXISTS idx_facilities_parent ON ozipz_facilities(parent_facility_id);
CREATE INDEX IF NOT EXISTS idx_facilities_municipality ON ozipz_facilities(municipality);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON ozipz_facilities(type);
CREATE INDEX IF NOT EXISTS idx_letters_facility ON ozipz_letters(facility_id);
CREATE INDEX IF NOT EXISTS idx_letters_program ON ozipz_letters(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_letters_outgoing_number ON ozipz_letters(letter_number) WHERE direction = 'wychodzace';
CREATE INDEX IF NOT EXISTS idx_scans_facility ON ozipz_scans(facility_id);
CREATE INDEX IF NOT EXISTS idx_scans_program ON ozipz_scans(program_id);
CREATE INDEX IF NOT EXISTS idx_registers_facility ON ozipz_registers(facility_id);
CREATE INDEX IF NOT EXISTS idx_registers_program ON ozipz_registers(program_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_registers_number ON ozipz_registers(register_type, register_number) WHERE register_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_publications_action ON ozipz_publications(action_id);
CREATE INDEX IF NOT EXISTS idx_change_log_changed_at ON ozipz_change_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_change_log_row ON ozipz_change_log(table_name, row_id);
CREATE TRIGGER IF NOT EXISTS guard_actions_schedule_link_insert BEFORE INSERT ON ozipz_actions WHEN NEW.schedule_event_id IS NOT NULL AND EXISTS (SELECT 1 FROM ozipz_schedule WHERE id = NEW.schedule_event_id AND action_id IS NOT NULL AND action_id <> NEW.id) BEGIN SELECT RAISE(ABORT, 'Zadanie harmonogramu jest już powiązane z innym działaniem.'); END;
CREATE TRIGGER IF NOT EXISTS guard_actions_schedule_link_update BEFORE UPDATE OF schedule_event_id ON ozipz_actions WHEN NEW.schedule_event_id IS NOT NULL AND NEW.schedule_event_id IS NOT OLD.schedule_event_id AND EXISTS (SELECT 1 FROM ozipz_schedule WHERE id = NEW.schedule_event_id AND action_id IS NOT NULL AND action_id <> NEW.id) BEGIN SELECT RAISE(ABORT, 'Zadanie harmonogramu jest już powiązane z innym działaniem.'); END;
CREATE TRIGGER IF NOT EXISTS guard_schedule_action_link_insert BEFORE INSERT ON ozipz_schedule WHEN NEW.action_id IS NOT NULL AND EXISTS (SELECT 1 FROM ozipz_actions WHERE id = NEW.action_id AND schedule_event_id IS NOT NULL AND schedule_event_id <> NEW.id) BEGIN SELECT RAISE(ABORT, 'Działanie jest już powiązane z innym zadaniem harmonogramu.'); END;
CREATE TRIGGER IF NOT EXISTS guard_schedule_action_link_update BEFORE UPDATE OF action_id ON ozipz_schedule WHEN NEW.action_id IS NOT NULL AND NEW.action_id IS NOT OLD.action_id AND EXISTS (SELECT 1 FROM ozipz_actions WHERE id = NEW.action_id AND schedule_event_id IS NOT NULL AND schedule_event_id <> NEW.id) BEGIN SELECT RAISE(ABORT, 'Działanie jest już powiązane z innym zadaniem harmonogramu.'); END;
CREATE TRIGGER IF NOT EXISTS guard_jrwa_origin_insert BEFORE INSERT ON ozipz_jrwa_cases WHEN NEW.action_id IS NOT NULL AND EXISTS (SELECT 1 FROM ozipz_actions WHERE id = NEW.action_id AND jrwa_case_id IS NOT NULL AND jrwa_case_id <> NEW.id) BEGIN SELECT RAISE(ABORT, 'Działanie jest przypisane do innej sprawy JRWA.'); END;
CREATE TRIGGER IF NOT EXISTS guard_jrwa_origin_update BEFORE UPDATE OF action_id ON ozipz_jrwa_cases WHEN NEW.action_id IS NOT NULL AND NEW.action_id IS NOT OLD.action_id AND EXISTS (SELECT 1 FROM ozipz_actions WHERE id = NEW.action_id AND jrwa_case_id IS NOT NULL AND jrwa_case_id <> NEW.id) BEGIN SELECT RAISE(ABORT, 'Działanie jest przypisane do innej sprawy JRWA.'); END;
CREATE TRIGGER IF NOT EXISTS detach_jrwa_origin AFTER UPDATE OF jrwa_case_id ON ozipz_actions WHEN NEW.jrwa_case_id IS NOT NULL AND NEW.jrwa_case_id IS NOT OLD.jrwa_case_id BEGIN UPDATE ozipz_jrwa_cases SET action_id = NULL WHERE action_id = NEW.id AND id <> NEW.jrwa_case_id; END;
CREATE TRIGGER IF NOT EXISTS sync_ozipz_jrwa_cases_sign AFTER UPDATE OF full_case_sign ON ozipz_jrwa_cases WHEN OLD.full_case_sign IS NOT NEW.full_case_sign BEGIN UPDATE ozipz_actions SET jrwa_sign = NEW.full_case_sign WHERE (jrwa_case_id = NEW.id OR jrwa_sign = OLD.full_case_sign) AND ${openMonth()}; UPDATE ozipz_registers SET jrwa_sign = NEW.full_case_sign WHERE jrwa_sign = OLD.full_case_sign; UPDATE ozipz_letters SET case_sign = NEW.full_case_sign WHERE case_sign = OLD.full_case_sign; END;
CREATE TRIGGER IF NOT EXISTS sync_ozipz_staff_names AFTER UPDATE OF full_name ON ozipz_staff WHEN OLD.full_name IS NOT NEW.full_name BEGIN UPDATE ozipz_actions SET lead_educator = NEW.full_name WHERE lead_educator = OLD.full_name AND ${openMonth()}; UPDATE ozipz_distributions SET assigned_educator = NEW.full_name WHERE assigned_educator = OLD.full_name; UPDATE ozipz_schedule SET responsible_person = NEW.full_name WHERE responsible_person = OLD.full_name; UPDATE ozipz_jrwa_cases SET assigned_educator = NEW.full_name WHERE assigned_educator = OLD.full_name; UPDATE ozipz_letters SET assigned_person = NEW.full_name WHERE assigned_person = OLD.full_name; UPDATE ozipz_publications SET author = NEW.full_name WHERE author = OLD.full_name; UPDATE ozipz_registers SET responsible_person = NEW.full_name WHERE responsible_person = OLD.full_name; END;
CREATE TRIGGER IF NOT EXISTS sync_ozipz_contacts_coordinator_details AFTER UPDATE OF phone, email ON ozipz_contacts WHEN OLD.phone IS NOT NEW.phone OR OLD.email IS NOT NEW.email BEGIN UPDATE ozipz_participations SET school_coordinator_contact = ${coordinatorContactLine("NEW")} WHERE school_coordinator_contact_id = NEW.id; END;
CREATE TRIGGER IF NOT EXISTS sync_ozipz_dictionaries_labels AFTER UPDATE OF label ON ozipz_dictionaries WHEN OLD.label IS NOT NEW.label BEGIN UPDATE ozipz_actions SET action_type = NEW.label WHERE NEW.dict_type = 'activityType' AND action_type = OLD.label AND ${openMonth()}; UPDATE ozipz_templates SET action_type = NEW.label WHERE NEW.dict_type = 'activityType' AND action_type = OLD.label; UPDATE ozipz_schedule SET activity_type_name = NEW.label WHERE NEW.dict_type = 'activityType' AND activity_type_code = NEW.code; UPDATE ozipz_actions SET campaign_name = CASE WHEN campaign_name = OLD.label THEN NEW.label ELSE campaign_name END, campaign_id = CASE WHEN campaign_id = OLD.label THEN NEW.label ELSE campaign_id END WHERE NEW.dict_type = 'campaign' AND (campaign_name = OLD.label OR campaign_id = OLD.label) AND ${openMonth()}; UPDATE ozipz_schedule SET campaign_name = CASE WHEN campaign_name = OLD.label THEN NEW.label ELSE campaign_name END, campaign_id = CASE WHEN campaign_id = OLD.label THEN NEW.label ELSE campaign_id END WHERE NEW.dict_type = 'campaign' AND (campaign_name = OLD.label OR campaign_id = OLD.label); UPDATE ozipz_contacts SET position = NEW.label WHERE NEW.dict_type = 'contactPosition' AND position = OLD.label; UPDATE ozipz_staff SET role = NEW.label WHERE NEW.dict_type = 'staffRole' AND role = OLD.label; UPDATE ozipz_schedule SET annotation_reason_label = NEW.label WHERE NEW.dict_type = 'annotationReason' AND annotation_reason_code = NEW.code; UPDATE ozipz_schedule SET recipient_group = NEW.label WHERE NEW.dict_type = 'recipientGroup' AND recipient_group = OLD.label; UPDATE ozipz_materials SET target_audience = NEW.label WHERE NEW.dict_type = 'recipientGroup' AND target_audience = OLD.label; UPDATE ozipz_scans SET document_type = NEW.label WHERE NEW.dict_type = 'documentType' AND document_type = OLD.label; UPDATE ozipz_facilities SET municipality = ${bareMunicipality("NEW.label")} WHERE NEW.dict_type = 'municipality' AND municipality = ${bareMunicipality("OLD.label")}; UPDATE ozipz_contacts SET municipality = ${bareMunicipality("NEW.label")} WHERE NEW.dict_type = 'municipality' AND municipality = ${bareMunicipality("OLD.label")}; UPDATE ozipz_actions SET municipality = ${bareMunicipality("NEW.label")} WHERE NEW.dict_type = 'municipality' AND municipality = ${bareMunicipality("OLD.label")} AND ${openMonth()}; UPDATE ozipz_distributions SET municipality = ${bareMunicipality("NEW.label")} WHERE NEW.dict_type = 'municipality' AND municipality = ${bareMunicipality("OLD.label")}; END;
CREATE TRIGGER IF NOT EXISTS guard_ozipz_dictionaries_jrwa_code BEFORE UPDATE OF code ON ozipz_dictionaries WHEN NEW.dict_type = 'jrwaSymbol' AND OLD.code IS NOT NEW.code AND EXISTS (SELECT 1 FROM ozipz_jrwa_cases WHERE jrwa_symbol = OLD.code) BEGIN SELECT RAISE(ABORT, 'Symbol JRWA ma założone sprawy – nie można zmienić jego kodu. Dodaj nowy symbol w słowniku.'); END;
CREATE TRIGGER IF NOT EXISTS sync_ozipz_dictionaries_codes AFTER UPDATE OF code ON ozipz_dictionaries WHEN OLD.code IS NOT NEW.code BEGIN UPDATE ozipz_actions SET action_type = NEW.code WHERE NEW.dict_type = 'activityType' AND action_type = OLD.code AND ${openMonth()}; UPDATE ozipz_templates SET action_type = NEW.code WHERE NEW.dict_type = 'activityType' AND action_type = OLD.code; UPDATE ozipz_schedule SET activity_type_code = NEW.code WHERE NEW.dict_type = 'activityType' AND activity_type_code = OLD.code; UPDATE ozipz_actions SET campaign_id = NEW.code WHERE NEW.dict_type = 'campaign' AND campaign_id = OLD.code AND ${openMonth()}; UPDATE ozipz_schedule SET campaign_id = NEW.code WHERE NEW.dict_type = 'campaign' AND campaign_id = OLD.code; UPDATE ozipz_materials SET material_type = NEW.code WHERE NEW.dict_type = 'materialType' AND material_type = OLD.code; UPDATE ozipz_facilities SET type = NEW.code WHERE NEW.dict_type = 'locationType' AND type = OLD.code; UPDATE ozipz_staff SET role = NEW.code WHERE NEW.dict_type = 'staffRole' AND role = OLD.code; UPDATE ozipz_contacts SET position = NEW.code WHERE NEW.dict_type = 'contactPosition' AND position = OLD.code; UPDATE ozipz_schedule SET annotation_reason_code = NEW.code WHERE NEW.dict_type = 'annotationReason' AND annotation_reason_code = OLD.code; UPDATE ozipz_schedule SET recipient_group = NEW.code WHERE NEW.dict_type = 'recipientGroup' AND recipient_group = OLD.code; UPDATE ozipz_scans SET document_type = NEW.code WHERE NEW.dict_type = 'documentType' AND document_type = OLD.code; UPDATE ozipz_programs SET jrwa_symbol = NEW.code WHERE NEW.dict_type = 'jrwaSymbol' AND jrwa_symbol = OLD.code; UPDATE ozipz_schedule SET jrwa = NEW.code WHERE NEW.dict_type = 'jrwaSymbol' AND jrwa = OLD.code; END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_insert BEFORE INSERT ON ozipz_actions WHEN EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key = substr(NEW.date, 1, 7)) BEGIN SELECT RAISE(ABORT, 'Miesiąc jest zamknięty.'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_update BEFORE UPDATE ON ozipz_actions WHEN EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key IN (substr(OLD.date, 1, 7), substr(NEW.date, 1, 7))) BEGIN SELECT RAISE(ABORT, 'Miesiąc jest zamknięty.'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_delete BEFORE DELETE ON ozipz_actions WHEN EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key = substr(OLD.date, 1, 7)) BEGIN SELECT RAISE(ABORT, 'Miesiąc jest zamknięty.'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_facility_delete BEFORE DELETE ON ozipz_facilities WHEN ${closedActionLinked("facility_id")} BEGIN SELECT RAISE(ABORT, '${CLOSED_LINK_MESSAGE}'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_program_delete BEFORE DELETE ON ozipz_programs WHEN ${closedActionLinked("program_id")} BEGIN SELECT RAISE(ABORT, '${CLOSED_LINK_MESSAGE}'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_material_delete BEFORE DELETE ON ozipz_materials WHEN ${closedActionLinked("material_id")} BEGIN SELECT RAISE(ABORT, '${CLOSED_LINK_MESSAGE}'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_schedule_delete BEFORE DELETE ON ozipz_schedule WHEN ${closedActionLinked("schedule_event_id")} BEGIN SELECT RAISE(ABORT, '${CLOSED_LINK_MESSAGE}'); END;
CREATE TRIGGER IF NOT EXISTS protect_closed_month_jrwa_delete BEFORE DELETE ON ozipz_jrwa_cases WHEN ${closedActionLinked("jrwa_case_id")} BEGIN SELECT RAISE(ABORT, '${CLOSED_LINK_MESSAGE}'); END;
`;

/** Obiekty z wcześniejszych wersji, których nie odtwarzamy jako „własnych” indeksów użytkownika. */
const RETIRED_OBJECTS = new Set([
  "idx_dictionaries_type", "idx_dictionaries_type_code", "idx_jrwa_cases_sign", "idx_participations_program",
  "idx_monthly_targets_year", "idx_actions_schedule_event", "idx_schedule_action",
]);

/**
 * Wyrażenia używane przy kopiowaniu starych wierszy do nowej tabeli. Normalizują wyłącznie zapisy
 * równoważne znaczeniowo: pusty tekst → NULL, brak licznika → 0, brak daty zmiany → data utworzenia.
 */
const COPY_EXPRESSIONS: Record<string, Record<string, string>> = {
  ozipz_facilities: {
    is_complex: "COALESCE(is_complex, 0)",
    // Stary zapis „a, b” (lista po przecinku) → tablica JSON, tak jak czytał go dotychczasowy mapper.
    education_types: `CASE WHEN education_types IS NULL OR trim(education_types) = '' THEN NULL WHEN json_valid(education_types) THEN education_types ELSE (SELECT json_group_array(trim(value)) FROM json_each('["' || replace(replace(replace(education_types, '\\', '\\\\'), '"', '\\"'), ',', '","') || '"]') WHERE trim(value) <> '') END`,
  },
  ozipz_programs: { jrwa_symbol: "NULLIF(jrwa_symbol, '')" },
  ozipz_actions: {
    indirect_recipients_count: "COALESCE(indirect_recipients_count, 0)",
    materials_distributed_count: "COALESCE(materials_distributed_count, 0)",
  },
  ozipz_distributions: { updated_at: "COALESCE(updated_at, created_at)" },
  ozipz_scans: { updated_at: "COALESCE(updated_at, created_at)" },
  ozipz_dictionaries: { kind: "NULLIF(kind, '')", gis_category: "NULLIF(gis_category, '')" },
  ozipz_templates: { action_defaults: "NULLIF(action_defaults, '')" },
  ozipz_staff: { email: "NULLIF(email, '')", phone: "NULLIF(phone, '')" },
  ozipz_contacts: { email: "NULLIF(email, '')", phone: "NULLIF(phone, '')" },
};

/** One schema for new installations and upgrades. No legacy row is discarded or guessed. */
export async function migrateDatabase(db: ISqlDatabase): Promise<{ migrated: boolean; backupPath?: string }> {
  const version = await db.select<Array<{ user_version: number }>>("PRAGMA user_version;");
  if (version[0]?.user_version > SCHEMA_VERSION) {
    throw new Error("Baza pochodzi z nowszej wersji aplikacji. Zaktualizuj aplikację.");
  }

  const existing = await db.select<Array<{ name: string; type: string; sql: string | null }>>(
    "SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'"
  );
  const statements = SCHEMA_SQL.trim().split(";\n").map((sql) => sql.replace(/;$/, ""));
  const tables = statements.filter((sql) => sql.startsWith("CREATE TABLE"));
  const normalize = (sql: string) => sql.replace(/IF NOT EXISTS /g, "").replace(/"/g, "").replace(/\s+/g, " ").trim();
  const matches = tables.every((ddl) => {
    const name = ddl.match(/^CREATE TABLE IF NOT EXISTS (\w+)/)![1];
    return existing.some((entry) => entry.name === name && entry.sql && normalize(entry.sql) === normalize(ddl));
  });
  const generated = synchronizationSql();
  const requiredTriggers = [...generated, ...statements].filter((sql) => sql.startsWith("CREATE TRIGGER"))
    .map((sql) => sql.match(/IF NOT EXISTS (\w+)/)![1]);
  if (version[0]?.user_version === SCHEMA_VERSION && matches && requiredTriggers.every((name) => existing.some((entry) => entry.type === "trigger" && entry.name === name))) {
    return { migrated: false };
  }
  let backupPath: string | undefined;
  if (existing.some((entry) => entry.type === "table")) {
    const files = await db.select<Array<{ name: string; file: string }>>("PRAGMA database_list");
    const file = files.find((entry) => entry.name === "main")?.file;
    if (file) {
      backupPath = `${file}.before-migration-${SCHEMA_VERSION}-${Date.now()}.db`;
      await db.execute("VACUUM INTO $1", [backupPath]);
    }
  }

  const auxiliary = statements.filter((sql) => !sql.startsWith("CREATE TABLE"));
  const lockTriggers = auxiliary.filter((sql) => sql.startsWith("CREATE TRIGGER IF NOT EXISTS protect_closed_month_"));
  const batch = ["PRAGMA foreign_keys = OFF", "BEGIN IMMEDIATE"];
  // Views and triggers must be removed before table replacement to avoid broken references
  // (e.g. triggers on dependent tables referencing parent tables being dropped/recreated).
  for (const view of existing.filter((entry) => entry.type === "view")) {
    batch.push(`DROP VIEW IF EXISTS "${view.name.replace(/"/g, '""')}"`);
  }
  for (const trigger of existing.filter((entry) => entry.type === "trigger")) {
    batch.push(`DROP TRIGGER IF EXISTS "${trigger.name.replace(/"/g, '""')}"`);
  }
  for (const ddl of tables) {
    const name = ddl.match(/^CREATE TABLE IF NOT EXISTS (\w+)/)![1];
    if (!existing.some((entry) => entry.type === "table" && entry.name === name)) {
      batch.push(ddl);
      continue;
    }
    const columns = await db.select<Array<{ name: string }>>(`PRAGMA table_info(${name})`);
    // Failing loudly is safer than silently losing columns introduced by another version.
    for (const { name: column } of columns) {
      if (!new RegExp(`\\b${column} (?:TEXT|INTEGER)\\b`).test(ddl)) {
        throw new Error(`Nieznana kolumna ${name}.${column}. Migracja przerwana bez zmiany danych.`);
      }
    }
    const quote = (column: string) => `"${column.replace(/"/g, '""')}"`;
    const quoted = columns.map(({ name: column }) => quote(column)).join(", ");
    const values = columns.map(({ name: column }) => COPY_EXPRESSIONS[name]?.[column] ?? quote(column)).join(", ");
    batch.push(ddl.replace(`IF NOT EXISTS ${name}`, `${name}_migrating`));
    batch.push(`INSERT INTO ${name}_migrating (${quoted}) SELECT ${values} FROM ${name}`);
    batch.push(`DROP TABLE ${name}`);
    batch.push(`ALTER TABLE ${name}_migrating RENAME TO ${name}`);
  }
  // v6: jednowierszowa tabela-flaga zastąpiona przez ozipz_meta.
  if (existing.some((entry) => entry.type === "table" && entry.name === "ozipz_closed_months_import")) {
    batch.push("INSERT OR IGNORE INTO ozipz_meta (key, value) SELECT 'closed_months_imported', '1' FROM ozipz_closed_months_import LIMIT 1");
    batch.push("DROP TABLE ozipz_closed_months_import");
  }
  batch.push(...auxiliary.filter((sql) => !lockTriggers.includes(sql)));
  const canonicalNames = new Set(auxiliary.map((sql) => sql.match(/IF NOT EXISTS (\w+)/)?.[1]));
  const generatedNames = new Set(
    generated
      .filter((sql) => sql.startsWith("CREATE TRIGGER"))
      .map((sql) => sql.match(/IF NOT EXISTS (\w+)/)?.[1])
      .filter(Boolean)
  );
  for (const entry of existing) {
    if (
      entry.sql &&
      ["index", "trigger", "view"].includes(entry.type) &&
      !canonicalNames.has(entry.name) &&
      !generatedNames.has(entry.name) &&
      !RETIRED_OBJECTS.has(entry.name) &&
      // Triggery historii zmian odtwarza change-log.ts według aktualnych kolumn.
      !entry.name.startsWith("audit_") &&
      // Stare wersje nazywały synchronizację tak samo jak obecne triggery generowane.
      !entry.name.startsWith("sync_ozipz_")
    ) {
      if (entry.type === "index") {
        batch.push(entry.sql.replace(/^CREATE (UNIQUE )?INDEX /, "CREATE $1INDEX IF NOT EXISTS "));
      } else if (entry.type === "trigger") {
        batch.push(entry.sql.replace(/^CREATE TRIGGER /, "CREATE TRIGGER IF NOT EXISTS "));
      } else {
        batch.push(entry.sql);
      }
    }
  }
  // v5: kontakt sekretariatu dostaje własne kolumny; porządki przed synchronizacją nazw, by gminy trafiły do powiązań.
  if ((version[0]?.user_version ?? 0) < 5 && existing.some((entry) => entry.type === "table" && entry.name === "ozipz_facilities")) {
    const rows = await db.select<LegacyFacilityRow[]>(
      "SELECT id, municipality, notes, education_types, default_coordinator_name, default_coordinator_phone, default_coordinator_email FROM ozipz_facilities"
    );
    batch.push(...rows.map(facilityCleanupSql).filter((sql): sql is string => sql !== null));
  }
  batch.push(...generated);
  batch.push(...lockTriggers);
  // CHECK provides an SQL-level assertion inside the same batch and transaction.
  batch.push("CREATE TEMP TABLE migration_integrity_guard (violations INTEGER CHECK(violations = 0))");
  batch.push("INSERT INTO migration_integrity_guard SELECT COUNT(*) FROM pragma_foreign_key_check");
  batch.push("DROP TABLE migration_integrity_guard");
  batch.push(`PRAGMA user_version = ${SCHEMA_VERSION}`, "COMMIT", "PRAGMA foreign_keys = ON");
  try {
    await db.execute(batch.join(";\n") + ";");
  } catch (error) {
    try { await db.execute("ROLLBACK;"); } catch { /* BEGIN itself may have failed. */ }
    throw new Error(`Nie udało się zaktualizować bazy. Dane nie zostały usunięte. ${String(error)}`);
  } finally {
    await db.execute("PRAGMA foreign_keys = ON;");
  }
  return { migrated: true, backupPath };
}

/**
 * Kopie „<baza>.before-migration-<wersja>-<znacznik>.db” do usunięcia: zostaje najnowsza kopia każdej wersji.
 * Ta sama reguła działa w powłoce Tauri (src-tauri/src/lib.rs).
 */
export function staleMigrationBackups(fileNames: string[], databaseFileName: string): string[] {
  const pattern = new RegExp(`^${databaseFileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.before-migration-(\\d+)-(\\d+)\\.db$`);
  const newest = new Map<string, { name: string; stamp: number }>();
  const stale: string[] = [];
  for (const name of fileNames) {
    const match = name.match(pattern);
    if (!match) continue;
    const current = newest.get(match[1]);
    const candidate = { name, stamp: Number(match[2]) };
    if (!current) newest.set(match[1], candidate);
    else if (candidate.stamp > current.stamp) { stale.push(current.name); newest.set(match[1], candidate); }
    else stale.push(name);
  }
  return stale;
}

const MONTH_NAMES = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const monthOf = (date: string) => `CAST(substr(${date}, 6, 2) AS INTEGER)`;
const yearOf = (date: string) => `CAST(substr(${date}, 1, 4) AS INTEGER)`;
const monthNameOf = (date: string) => `CASE ${monthOf(date)} ${MONTH_NAMES.map((name, index) => `WHEN ${index + 1} THEN '${name}'`).join(" ")} END`;

/**
 * Kopie nazw i pól wyliczanych: jednorazowe wyrównanie (UPDATE) oraz triggery, które utrzymują je dalej.
 * Działania z zamkniętych miesięcy zachowują stan z chwili zamknięcia.
 */
function synchronizationSql(): string[] {
  const statements: string[] = [];
  const lockedDate: Record<string, string> = { ozipz_actions: "date" };
  const relations = [
    { parent: "ozipz_facilities", key: "facility_id", fields: [["name", "facility_name"], ["municipality", "municipality"]], tables: ["ozipz_participations", "ozipz_actions", "ozipz_jrwa_cases", "ozipz_scans", "ozipz_contacts", "ozipz_registers"] },
    { parent: "ozipz_programs", key: "program_id", fields: [["name", "program_name"]], tables: ["ozipz_participations", "ozipz_actions", "ozipz_schedule", "ozipz_jrwa_cases", "ozipz_scans", "ozipz_registers"] },
    { parent: "ozipz_materials", key: "material_id", fields: [["title", "material_title"], ["material_type", "material_type"]], tables: ["ozipz_distributions"] },
    { parent: "ozipz_actions", key: "action_id", fields: [["title", "action_title"]], tables: ["ozipz_distributions"] },
    { parent: "ozipz_contacts", key: "school_coordinator_contact_id", fields: [["name", "school_coordinator_name"]], tables: ["ozipz_participations"] },
  ];
  for (const relation of relations) {
    for (const table of relation.tables) {
      const ddl = SCHEMA_SQL.split("\n").find((line) => line.startsWith(`CREATE TABLE IF NOT EXISTS ${table} (`))!;
      const fields = relation.fields.filter(([, target]) => ddl.includes(`${target} TEXT`));
      const assignments = fields.map(([source, target]) => `${target} = (SELECT ${source} FROM ${relation.parent} WHERE id = ${table}.${relation.key})`).join(", ");
      const open = lockedDate[table] ? ` AND ${openMonth(table)}` : "";
      const predicate = `${relation.key} IS NOT NULL AND EXISTS (SELECT 1 FROM ${relation.parent} WHERE id = ${table}.${relation.key})`;
      statements.push(`UPDATE ${table} SET ${assignments} WHERE ${predicate}${open}`);
      for (const event of ["INSERT", `UPDATE OF ${relation.key}, ${fields.map(([, target]) => target).join(", ")}`]) {
        const suffix = event === "INSERT" ? "insert" : "update";
        statements.push(`CREATE TRIGGER IF NOT EXISTS sync_${table}_${relation.key}_${suffix} AFTER ${event} ON ${table} WHEN NEW.${relation.key} IS NOT NULL BEGIN UPDATE ${table} SET ${assignments} WHERE id = NEW.id AND ${predicate}; END`);
      }
      // UPDATE OF odpala się dla każdej kolumny wymienionej w SET, także bez zmiany wartości — stąd warunek WHEN.
      const changed = fields.map(([source]) => `OLD.${source} IS NOT NEW.${source}`).join(" OR ");
      statements.push(`CREATE TRIGGER IF NOT EXISTS sync_${relation.parent}_${table} AFTER UPDATE OF ${fields.map(([source]) => source).join(", ")} ON ${relation.parent} WHEN ${changed} BEGIN UPDATE ${table} SET ${fields.map(([source, target]) => `${target} = NEW.${source}`).join(", ")} WHERE ${relation.key} = NEW.id${open}; END`);
    }
  }
  const derived = `month = ${monthOf("NEW.event_date")}, year = ${yearOf("NEW.event_date")}, month_name = ${monthNameOf("NEW.event_date")}`;
  statements.push(`UPDATE ozipz_schedule SET month = ${monthOf("event_date")}, year = ${yearOf("event_date")}, month_name = ${monthNameOf("event_date")}`);
  statements.push(`CREATE TRIGGER IF NOT EXISTS derive_schedule_month_insert AFTER INSERT ON ozipz_schedule BEGIN UPDATE ozipz_schedule SET ${derived} WHERE id = NEW.id; END`);
  statements.push(`CREATE TRIGGER IF NOT EXISTS derive_schedule_month_update AFTER UPDATE OF event_date, month, year, month_name ON ozipz_schedule WHEN NEW.month IS NOT ${monthOf("NEW.event_date")} OR NEW.year IS NOT ${yearOf("NEW.event_date")} OR NEW.month_name IS NOT ${monthNameOf("NEW.event_date")} BEGIN UPDATE ozipz_schedule SET ${derived} WHERE id = NEW.id; END`);
  return statements;
}

interface LegacyFacilityRow {
  id: string;
  municipality: string;
  notes: string | null;
  education_types: string | null;
  default_coordinator_name: string | null;
  default_coordinator_phone: string | null;
  default_coordinator_email: string | null;
}

export interface LegacyFacilityContact {
  municipality: string;
  notes?: string;
  email?: string;
  phone?: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
  coordinatorEmail?: string;
  hasEducationTypes: boolean;
}

const IMPORT_MARKERS = new Set(["placówka oświatowa z rejestru edu-report-v3"]);

/**
 * Porządkuje placówkę zapisaną przed v5: kontakt bez nazwiska koordynatora jest kontaktem sekretariatu,
 * prefiks „Gmina” znika z nazwy gminy, a z uwag usuwane są wyłącznie wpisy dublujące inne pola.
 */
export function cleanLegacyFacilityContact(input: LegacyFacilityContact): LegacyFacilityContact {
  const out: LegacyFacilityContact = { ...input, municipality: input.municipality.trim().replace(/^gmina\s+/i, "") };
  if (!out.coordinatorName?.trim()) {
    out.email = out.email || out.coordinatorEmail || undefined;
    out.phone = out.phone || out.coordinatorPhone || undefined;
    out.coordinatorEmail = undefined;
    out.coordinatorPhone = undefined;
  }
  const kept: string[] = [];
  for (const segment of (out.notes || "").split(" | ").map((part) => part.trim()).filter(Boolean)) {
    const [, label, value = ""] = segment.match(/^(Typy kształcenia|E-mail|Telefon):\s*(.*)$/) || [];
    const same = (a?: string) => Boolean(a) && a!.replace(/\s+/g, "").toLowerCase() === value.replace(/\s+/g, "").toLowerCase();
    if (IMPORT_MARKERS.has(segment.toLowerCase())) continue;
    if (label === "Typy kształcenia" && out.hasEducationTypes) continue;
    if (label === "E-mail" && (same(out.email) || same(out.coordinatorEmail))) continue;
    if (label === "E-mail" && !out.email) { out.email = value; continue; }
    if (label === "Telefon" && (same(out.phone) || same(out.coordinatorPhone))) continue;
    if (label === "Telefon" && !out.phone) { out.phone = value; continue; }
    kept.push(segment);
  }
  out.notes = kept.length ? kept.join(" | ") : undefined;
  return out;
}

function facilityCleanupSql(row: LegacyFacilityRow): string | null {
  let hasEducationTypes = false;
  try { hasEducationTypes = (JSON.parse(row.education_types || "[]") as unknown[]).length > 0; } catch { /* zostaw uwagi */ }
  const before: LegacyFacilityContact = {
    municipality: row.municipality,
    notes: row.notes || undefined,
    coordinatorName: row.default_coordinator_name || undefined,
    coordinatorPhone: row.default_coordinator_phone || undefined,
    coordinatorEmail: row.default_coordinator_email || undefined,
    hasEducationTypes,
  };
  const after = cleanLegacyFacilityContact(before);
  const literal = (value?: string) => (value ? `'${value.replace(/'/g, "''")}'` : "NULL");
  const changes = [
    after.municipality !== before.municipality && `municipality = ${literal(after.municipality)}`,
    after.notes !== before.notes && `notes = ${literal(after.notes)}`,
    after.email && `email = ${literal(after.email)}`,
    after.phone && `phone = ${literal(after.phone)}`,
    after.coordinatorPhone !== before.coordinatorPhone && `default_coordinator_phone = ${literal(after.coordinatorPhone)}`,
    after.coordinatorEmail !== before.coordinatorEmail && `default_coordinator_email = ${literal(after.coordinatorEmail)}`,
  ].filter(Boolean);
  return changes.length ? `UPDATE ozipz_facilities SET ${changes.join(", ")} WHERE id = ${literal(row.id)}` : null;
}
