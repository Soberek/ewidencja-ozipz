import type { OzipzScheduleEvent } from "../../../features/ozipz/types/ozipz.types";
import type { ISqlDatabase, ScheduleSqlRow } from "../../types";
import { Mappers } from "../../mappers";
import type { IScheduleRepository } from "../interfaces";
import { generateId } from "../id-generator";

export class SqliteScheduleRepository implements IScheduleRepository {
  constructor(private readonly db: ISqlDatabase) {}

  async getScheduleEvents(): Promise<OzipzScheduleEvent[]> {
    const rows = await this.db.select<ScheduleSqlRow[]>("SELECT * FROM ozipz_schedule ORDER BY event_date ASC");
    return rows.map(Mappers.toSchedule);
  }

  async addScheduleEvent(event: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">): Promise<OzipzScheduleEvent> {
    const id = generateId("sch");
    const now = new Date().toISOString();
    const newEvent: OzipzScheduleEvent = { ...event, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_schedule (id, title, activity_type_code, activity_type_name, event_date, end_date, category, topic, program_id, program_name, campaign_id, campaign_name, recipient_group, location, facility_id, action_id, status, annotation_reason_code, annotation_reason_label, annotation_text, responsible_person, month, month_name, year, planned_count, completed_count, manually_completed, jrwa, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)",
      [
        newEvent.id, newEvent.title, newEvent.activityTypeCode || null, newEvent.activityTypeName || null,
        newEvent.eventDate, newEvent.endDate || null, newEvent.category || null, newEvent.topic || null,
        newEvent.programId || null, newEvent.programName || null, newEvent.campaignId || null,
        newEvent.campaignName || null, newEvent.recipientGroup || null, newEvent.location,
        newEvent.facilityId || null, newEvent.actionId || null, newEvent.status,
        newEvent.annotationReasonCode || null, newEvent.annotationReasonLabel || null, newEvent.annotationText || null,
        newEvent.responsiblePerson, newEvent.month || null, newEvent.monthName || null,
        newEvent.year || null, newEvent.plannedCount ?? 1, newEvent.completedCount ?? 0,
        newEvent.manuallyCompleted ? 1 : 0, newEvent.jrwa || null,
        newEvent.notes || null, newEvent.createdAt, newEvent.updatedAt,
      ]
    );
    return newEvent;
  }

  async updateScheduleEvent(id: string, updates: Partial<OzipzScheduleEvent>): Promise<void> {
    const now = new Date().toISOString();
    const rows = await this.db.select<ScheduleSqlRow[]>("SELECT * FROM ozipz_schedule WHERE id = $1", [id]);
    if (!rows || rows.length === 0) return;
    const current = Mappers.toSchedule(rows[0]);
    const merged = { ...current, ...updates, updatedAt: now };
    await this.db.execute(
      "UPDATE ozipz_schedule SET title = $1, activity_type_code = $2, activity_type_name = $3, event_date = $4, end_date = $5, category = $6, topic = $7, program_id = $8, program_name = $9, campaign_id = $10, campaign_name = $11, recipient_group = $12, location = $13, facility_id = $14, action_id = $15, status = $16, annotation_reason_code = $17, annotation_reason_label = $18, annotation_text = $19, responsible_person = $20, month = $21, month_name = $22, year = $23, planned_count = $24, completed_count = $25, manually_completed = $26, jrwa = $27, notes = $28, updated_at = $29 WHERE id = $30",
      [
        merged.title, merged.activityTypeCode || null, merged.activityTypeName || null,
        merged.eventDate, merged.endDate || null, merged.category || null, merged.topic || null,
        merged.programId || null, merged.programName || null, merged.campaignId || null,
        merged.campaignName || null, merged.recipientGroup || null, merged.location,
        merged.facilityId || null, merged.actionId || null, merged.status,
        merged.annotationReasonCode || null, merged.annotationReasonLabel || null, merged.annotationText || null,
        merged.responsiblePerson, merged.month || null, merged.monthName || null,
        merged.year || null, merged.plannedCount ?? 1, merged.completedCount ?? 0,
        merged.manuallyCompleted ? 1 : 0, merged.jrwa || null,
        merged.notes || null, merged.updatedAt, id,
      ]
    );
  }

  async deleteScheduleEvent(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ozipz_schedule WHERE id = $1", [id]);
  }
}
