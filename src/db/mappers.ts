import { parseRow } from "./parse-row";
import {
  ActionSchema,
  ProgramSchema,
  SchoolParticipationSchema,
  MaterialSchema,
  DistributionSchema,
  ScheduleEventSchema,
  JrwaCaseSchema,
  PublicationSchema,
  FacilitySchema,
  DictionaryItemSchema,
  GisCategorySchema,
  type OzipzAction,
  type OzipzProgram,
  type OzipzSchoolParticipation,
  type OzipzMaterial,
  type OzipzDistribution,
  type OzipzScheduleEvent,
  type OzipzJrwaCase,
  type OzipzPublication,
  type OzipzFacility,
  type OzipzDictionaryItem,
} from "../features/ozipz/types/ozipz.types";
import type {
  ActionSqlRow,
  ProgramSqlRow,
  ParticipationSqlRow,
  MaterialSqlRow,
  DistributionSqlRow,
  ScheduleSqlRow,
  JrwaSqlRow,
  PublicationSqlRow,
  FacilitySqlRow,
  DictionarySqlRow,
} from "./types";
import { normalizeActionType } from "../features/ozipz/components/actions/editor/editorUtils";
import { SecondaryMappers } from "./secondary-mappers";

export const Mappers = {
  toAction(row: ActionSqlRow): OzipzAction {
    const raw = {
      id: row.id,
      title: row.title,
      actionType: normalizeActionType(row.action_type),
      date: row.date,
      facilityId: row.facility_id || undefined,
      facilityName: row.facility_name,
      municipality: row.municipality,
      programId: row.program_id || undefined,
      programName: row.program_name || undefined,
      topic: row.topic,
      audienceGroup: row.audience_group,
      campaignId: row.campaign_id || undefined,
      campaignName: row.campaign_name || undefined,
      jrwaSign: row.jrwa_sign || undefined,
      jrwaCaseId: row.jrwa_case_id || undefined,
      izrzSign: row.izrz_sign || undefined,
      ezdStatus: row.ezd_status || "w_ezd",
      status: row.status || "wykonane",
      sourceInfo: row.source_info || undefined,
      scheduleEventId: row.schedule_event_id || undefined,
      linkedActionId: row.linked_action_id || undefined,
      materialId: row.material_id || undefined,
      numberOfActions: row.number_of_actions != null ? Number(row.number_of_actions) : 1,
      participantsCount: Number(row.participants_count) || 0,
      indirectRecipientsCount: row.indirect_recipients_count != null ? Number(row.indirect_recipients_count) : 0,
      materialsDistributedCount: row.materials_distributed_count != null ? Number(row.materials_distributed_count) : 0,
      leadEducator: row.lead_educator,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    const result = ActionSchema.safeParse(raw);
    if (!result.success) {
      console.warn(`[Mappers.toAction] Ostrzeżenie walidacji wiersza akcji ${row.id}:`, result.error.format());
      return raw as OzipzAction;
    }
    return result.data;
  },

  toProgram(row: ProgramSqlRow): OzipzProgram {
    const raw = {
      id: row.id,
      code: row.code,
      name: row.name,
      editionYear: row.edition_year,
      jrwaSymbol: row.jrwa_symbol || "",
      targetAudience: row.target_audience || "",
      description: row.description || "",
      status: row.status || "aktywny",
      participatingSchoolsCount: row.participating_schools_count != null ? Number(row.participating_schools_count) : 0,
      totalPupilsReached: row.total_pupils_reached != null ? Number(row.total_pupils_reached) : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(ProgramSchema, raw, "Program");
  },

  toParticipation(row: ParticipationSqlRow): OzipzSchoolParticipation {
    const raw = {
      id: row.id,
      programId: row.program_id,
      programName: row.program_name,
      facilityId: row.facility_id,
      facilityName: row.facility_name,
      municipality: row.municipality,
      schoolYear: row.school_year,
      schoolCoordinatorName: row.school_coordinator_name,
      schoolCoordinatorContact: row.school_coordinator_contact || undefined,
      schoolCoordinatorContactId: row.school_coordinator_contact_id || undefined,
      secondCoordinatorName: row.second_coordinator_name || undefined,
      secondCoordinatorContact: row.second_coordinator_contact || undefined,
      secondCoordinatorContactId: row.second_coordinator_contact_id || undefined,
      pupilsCount: Number(row.pupils_count) || 0,
      hasDeclaration: Boolean(row.has_declaration),
      hasFinalReport: Boolean(row.has_final_report),
      evaluationGrade: row.evaluation_grade || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(SchoolParticipationSchema, raw, "SchoolParticipation");
  },

  toMaterial(row: MaterialSqlRow): OzipzMaterial {
    const raw = {
      id: row.id,
      title: row.title,
      materialType: row.material_type,
      topic: row.topic,
      publisher: row.publisher,
      targetAudience: row.target_audience || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(MaterialSchema, raw, "Material");
  },

  toDistribution(row: DistributionSqlRow): OzipzDistribution {
    const raw = {
      id: row.id,
      materialId: row.material_id || undefined,
      materialTitle: row.material_title,
      materialType: row.material_type || undefined,
      facilityId: row.facility_id || undefined,
      recipientName: row.recipient_name,
      municipality: row.municipality || undefined,
      actionId: row.action_id || undefined,
      actionTitle: row.action_title || undefined,
      quantity: Number(row.quantity) || 1,
      distributionDate: row.distribution_date,
      assignedEducator: row.assigned_educator,
      purpose: row.purpose,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined,
    };
    return parseRow(DistributionSchema, raw, "Distribution");
  },

  toSchedule(row: ScheduleSqlRow): OzipzScheduleEvent {
    const raw = {
      id: row.id,
      title: row.title,
      activityTypeCode: row.activity_type_code || undefined,
      activityTypeName: row.activity_type_name || undefined,
      eventDate: row.event_date,
      endDate: row.end_date || undefined,
      category: row.category || undefined,
      topic: row.topic || undefined,
      programId: row.program_id || undefined,
      programName: row.program_name || undefined,
      campaignId: row.campaign_id || undefined,
      campaignName: row.campaign_name || undefined,
      recipientGroup: row.recipient_group || undefined,
      location: row.location || "",
      facilityId: row.facility_id || undefined,
      actionId: row.action_id || undefined,
      status: row.status,
      annotationReasonCode: row.annotation_reason_code || undefined,
      annotationReasonLabel: row.annotation_reason_label || undefined,
      annotationText: row.annotation_text || undefined,
      responsiblePerson: row.responsible_person || "",
      month: row.month != null ? Number(row.month) : undefined,
      monthName: row.month_name || undefined,
      year: row.year != null ? Number(row.year) : undefined,
      plannedCount: row.planned_count != null ? Number(row.planned_count) : 1,
      completedCount: row.completed_count != null ? Number(row.completed_count) : 0,
      manuallyCompleted: Boolean(row.manually_completed),
      jrwa: row.jrwa || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(ScheduleEventSchema, raw, "ScheduleEvent");
  },

  toJrwa(row: JrwaSqlRow): OzipzJrwaCase {
    const raw = {
      id: row.id,
      section: row.section,
      jrwaSymbol: row.jrwa_symbol,
      caseNumber: Number(row.case_number),
      year: Number(row.year),
      referentInitials: row.referent_initials || undefined,
      fullCaseSign: row.full_case_sign,
      title: row.title,
      facilityId: row.facility_id || undefined,
      facilityName: row.facility_name || undefined,
      programId: row.program_id || undefined,
      programName: row.program_name || undefined,
      actionId: row.action_id || undefined,
      archivalCategory: row.archival_category || undefined,
      startDate: row.start_date || undefined,
      endDate: row.end_date || undefined,
      initiatingDocument: row.initiating_document || undefined,
      status: row.status,
      assignedEducator: row.assigned_educator,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(JrwaCaseSchema, raw, "JrwaCase");
  },

  toPublication(row: PublicationSqlRow): OzipzPublication {
    const raw = {
      id: row.id,
      title: row.title,
      channel: row.channel,
      publicationDate: row.publication_date,
      topic: row.topic,
      link: row.link || undefined,
      reachCount: row.reach_count != null ? Number(row.reach_count) : undefined,
      actionId: row.action_id || undefined,
      author: row.author,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(PublicationSchema, raw, "Publication");
  },

  toFacility(row: FacilitySqlRow): OzipzFacility {
    let educationTypes: string[] = [];
    if (row.education_types) {
      try {
        const parsed = JSON.parse(row.education_types);
        if (Array.isArray(parsed)) {
          educationTypes = parsed.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
        }
      } catch {
        educationTypes = row.education_types.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    const raw = {
      id: row.id,
      name: row.name,
      type: row.type,
      educationTypes,
      address: row.address,
      city: row.city,
      postalCode: row.postal_code,
      municipality: row.municipality,
      county: row.county,
      leadingAuthority: row.leading_authority,
      isComplex: Boolean(row.is_complex),
      parentFacilityId: row.parent_facility_id || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      defaultCoordinatorName: row.default_coordinator_name || undefined,
      defaultCoordinatorPhone: row.default_coordinator_phone || undefined,
      defaultCoordinatorEmail: row.default_coordinator_email || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(FacilitySchema, raw, "Facility");
  },

  toDictionary(row: DictionarySqlRow): OzipzDictionaryItem {
    const raw = {
      id: row.id,
      dictType: row.dict_type,
      code: row.code,
      label: row.label,
      description: row.description || undefined,
      postalCode: row.postal_code || undefined,
      kind: (row.kind === "PROGRAMOWE" || row.kind === "NIEPROGRAMOWE") ? row.kind : undefined,
      gisCategory: GisCategorySchema.safeParse(row.gis_category).data,
      isSystem: Boolean(row.is_system),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return parseRow(DictionaryItemSchema, raw, "DictionaryItem");
  },

  ...SecondaryMappers,
};
