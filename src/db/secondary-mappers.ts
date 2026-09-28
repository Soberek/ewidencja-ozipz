import {
  LetterSchema,
  ScanSchema,
  TemplateSchema,
  StaffSchema,
  ContactSchema,
  RegisterItemSchema,
  MonthlyTargetSchema,
  type OzipzLetter,
  type OzipzScan,
  type OzipzTemplate,
  type OzipzStaff,
  type OzipzContact,
  type OzipzRegisterItem,
  type OzipzMonthlyTarget,
} from "../features/ozipz/types/ozipz.types";
import type {
  LetterSqlRow,
  ScanSqlRow,
  TemplateSqlRow,
  StaffSqlRow,
  ContactSqlRow,
  RegisterSqlRow,
  MonthlyTargetSqlRow,
} from "./types";

export const SecondaryMappers = {
  toLetter(row: LetterSqlRow): OzipzLetter {
    const raw = {
      id: row.id,
      direction: row.direction as "wychodzace" | "przychodzace",
      letterNumber: row.letter_number,
      letterDate: row.letter_date,
      caseSign: row.case_sign || undefined,
      senderRecipient: row.sender_recipient || "",
      facilityId: row.facility_id || undefined,
      subject: row.subject || "",
      programId: row.program_id || undefined,
      assignedPerson: row.assigned_person || "",
      status: row.status || "nowe",
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return LetterSchema.parse(raw);
  },

  toScan(row: ScanSqlRow): OzipzScan {
    const raw = {
      id: row.id,
      title: row.title || "",
      documentType: row.document_type || "inny",
      facilityId: row.facility_id || undefined,
      facilityName: row.facility_name || "",
      programId: row.program_id || undefined,
      programName: row.program_name || undefined,
      scanDate: row.scan_date,
      fileSizeKb: row.file_size_kb != null ? Number(row.file_size_kb) : undefined,
      fileName: row.file_name || "",
      filePath: row.file_path || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    };
    return ScanSchema.parse(raw);
  },

  toTemplate(row: TemplateSqlRow): OzipzTemplate {
    const raw = {
      id: row.id,
      title: row.title || "",
      topic: row.topic || "inne",
      actionType: row.action_type || "prelekcja",
      descriptionTemplate: row.description_template || "",
      defaultAudience: row.default_audience ?? "uczniowie_sp",
      suggestedMaterials: row.suggested_materials || undefined,
      actionDefaults: row.action_defaults
        ? (() => {
            try {
              return JSON.parse(row.action_defaults);
            } catch {
              return undefined;
            }
          })()
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return TemplateSchema.parse(raw);
  },

  toStaff(row: StaffSqlRow): OzipzStaff {
    const raw = {
      id: row.id,
      fullName: row.full_name || "",
      role: row.role || "",
      email: row.email || "",
      phone: row.phone || "",
      active: Boolean(row.active),
      specialization: row.specialization || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return StaffSchema.parse(raw);
  },

  toContact(row: ContactSqlRow): OzipzContact {
    const raw = {
      id: row.id,
      name: row.name || "",
      position: row.position || "",
      facilityId: row.facility_id || undefined,
      facilityName: row.facility_name || "Placówka",
      municipality: row.municipality || undefined,
      phone: row.phone || "",
      email: row.email || "",
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return ContactSchema.parse(raw);
  },

  toRegister(row: RegisterSqlRow): OzipzRegisterItem {
    const raw = {
      id: row.id,
      registerType: row.register_type || "szkolenia",
      registerNumber: row.register_number || undefined,
      date: row.date,
      title: row.title || "",
      organizer: row.organizer || "",
      location: row.location || "",
      facilityId: row.facility_id || undefined,
      facilityName: row.facility_name || undefined,
      programId: row.program_id || undefined,
      programName: row.program_name || undefined,
      jrwaSign: row.jrwa_sign || undefined,
      participantsCount: Number(row.participants_count) || 0,
      targetAudience: row.target_audience || undefined,
      outcome: row.outcome || undefined,
      responsiblePerson: row.responsible_person || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return RegisterItemSchema.parse(raw);
  },

  toMonthlyTarget(row: MonthlyTargetSqlRow): OzipzMonthlyTarget {
    const raw = {
      id: row.id,
      year: Number(row.year),
      month: Number(row.month),
      programActions: Number(row.program_actions) || 0,
      programRecipients: Number(row.program_recipients) || 0,
      otherActions: Number(row.other_actions) || 0,
      otherRecipients: Number(row.other_recipients) || 0,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return MonthlyTargetSchema.parse(raw);
  },
};
