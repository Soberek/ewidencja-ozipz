export interface ISqlQueryResult {
  rowsAffected?: number;
  lastInsertId?: number;
}

export interface ISqlDatabase {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<ISqlQueryResult | unknown>;
}

export interface ActionSqlRow {
  id: string;
  title: string;
  action_type: string;
  date: string;
  facility_id: string | null;
  facility_name: string;
  municipality: string;
  program_id: string | null;
  program_name: string | null;
  topic: string;
  audience_group: string;
  campaign_id?: string | null;
  campaign_name?: string | null;
  jrwa_sign?: string | null;
  jrwa_case_id?: string | null;
  izrz_sign?: string | null;
  ezd_status?: string | null;
  status?: string | null;
  source_info?: string | null;
  schedule_event_id?: string | null;
  linked_action_id?: string | null;
  material_id?: string | null;
  number_of_actions?: number | null;
  participants_count: number;
  indirect_recipients_count: number | null;
  materials_distributed_count: number | null;
  lead_educator: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramSqlRow {
  id: string;
  code: string;
  name: string;
  edition_year: string;
  jrwa_symbol?: string | null;
  target_audience: string;
  description: string;
  status: string;
  participating_schools_count: number;
  total_pupils_reached: number;
  created_at: string;
  updated_at: string;
}

export interface ParticipationSqlRow {
  id: string;
  program_id: string;
  program_name: string;
  facility_id: string;
  facility_name: string;
  municipality: string;
  school_year: string;
  school_coordinator_name: string;
  school_coordinator_contact: string | null;
  school_coordinator_contact_id: string | null;
  second_coordinator_name: string | null;
  second_coordinator_contact: string | null;
  second_coordinator_contact_id: string | null;
  pupils_count: number;
  has_declaration: number;
  has_final_report: number;
  evaluation_grade: string | null;
  notes: string | null;
  /** Ścieżka względem folderu bazy, np. „Zgłoszenia/2026-2027/…pdf”. Brak w bazach sprzed v13. */
  application_file?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialSqlRow {
  id: string;
  title: string;
  material_type: string;
  topic: string;
  publisher: string;
  target_audience: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DistributionSqlRow {
  id: string;
  material_id: string | null;
  material_title: string;
  material_type: string | null;
  facility_id: string | null;
  recipient_name: string;
  municipality: string | null;
  action_id?: string | null;
  action_title?: string | null;
  quantity: number;
  distribution_date: string;
  assigned_educator: string;
  purpose: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ScheduleSqlRow {
  id: string;
  title: string;
  activity_type_code?: string | null;
  activity_type_name?: string | null;
  event_date: string;
  end_date: string | null;
  category?: string | null;
  topic?: string | null;
  program_id?: string | null;
  program_name?: string | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  recipient_group?: string | null;
  location: string;
  facility_id: string | null;
  action_id: string | null;
  status: string;
  annotation_reason_code?: string | null;
  annotation_reason_label?: string | null;
  annotation_text?: string | null;
  responsible_person: string;
  month?: number | null;
  month_name?: string | null;
  year?: number | null;
  planned_count?: number | null;
  completed_count?: number | null;
  manually_completed?: number | null;
  jrwa?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JrwaSqlRow {
  id: string;
  section: string;
  jrwa_symbol: string;
  case_number: number;
  year: number;
  referent_initials: string | null;
  full_case_sign: string;
  title: string;
  facility_id: string | null;
  facility_name: string | null;
  program_id: string | null;
  program_name: string | null;
  action_id: string | null;
  archival_category: string | null;
  start_date: string | null;
  end_date: string | null;
  initiating_document: string | null;
  status: string;
  assigned_educator: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicationSqlRow {
  id: string;
  title: string;
  channel: string;
  publication_date: string;
  topic: string;
  link: string | null;
  reach_count: number | null;
  action_id: string | null;
  author: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilitySqlRow {
  id: string;
  name: string;
  type: string;
  education_types?: string | null;
  address: string;
  city: string;
  postal_code: string;
  municipality: string;
  county: string;
  leading_authority: string;
  is_complex?: number | null;
  parent_facility_id?: string | null;
  email?: string | null;
  phone?: string | null;
  default_coordinator_name: string | null;
  default_coordinator_phone: string | null;
  default_coordinator_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DictionarySqlRow {
  id: string;
  dict_type: string;
  code: string;
  label: string;
  description: string | null;
  postal_code?: string | null;
  kind?: string | null;
  gis_category?: string | null;
  is_system: number;
  created_at: string;
  updated_at: string;
}

export interface FacilityOverviewSqlRow {
  facility_id: string;
  facility_name: string;
  programs_count: number;
  actions_count: number;
  total_pupils_reached: number;
  total_materials_received: number;
  last_action_date: string | null;
}

export interface LetterSqlRow {
  id: string;
  direction: string;
  letter_number: string;
  letter_date: string;
  case_sign: string | null;
  sender_recipient: string;
  facility_id: string | null;
  subject: string;
  program_id: string | null;
  assigned_person: string;
  status: string;
  notes: string | null;
  response_due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScanSqlRow {
  id: string;
  title: string;
  document_type: string;
  facility_id: string | null;
  facility_name: string;
  program_id: string | null;
  program_name: string | null;
  scan_date: string;
  file_size_kb: number | null;
  file_name: string;
  file_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface TemplateSqlRow {
  action_defaults?: string | null;
  id: string;
  title: string;
  topic: string;
  action_type: string;
  description_template: string;
  default_audience: string;
  suggested_materials: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffSqlRow {
  id: string;
  full_name: string;
  role: string;
  email: string | null;
  phone: string | null;
  active: number;
  specialization: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSqlRow {
  id: string;
  facility_id: string | null;
  facility_name: string;
  municipality?: string | null;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegisterSqlRow {
  id: string;
  register_type: string;
  register_number: string | null;
  date: string;
  title: string;
  organizer: string;
  location: string;
  facility_id: string | null;
  facility_name: string | null;
  program_id: string | null;
  program_name: string | null;
  jrwa_sign: string | null;
  participants_count: number;
  target_audience: string | null;
  outcome: string | null;
  responsible_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyTargetSqlRow {
  id: string;
  year: number;
  month: number;
  program_actions: number;
  program_recipients: number;
  other_actions: number;
  other_recipients: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
