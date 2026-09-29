import type {
  OzipzAction,
  OzipzDistribution,
  OzipzJrwaCase,
} from "../../../features/ozipz/types/ozipz.types";
import type {
  ISqlDatabase,
  ActionSqlRow,
  DistributionSqlRow,
  SaveActionWithRelationsParams,
  SaveActionWithRelationsResult,
  CompanionDistributionPayload,
} from "../../types";
import { Mappers } from "../../mappers";
import type {
  IActionsRepository,
  IJrwaRepository,
  IScheduleRepository,
  IMaterialsRepository,
} from "../interfaces";
import { generateId } from "../id-generator";
import { SqliteJrwaRepository } from "./sqlite-jrwa.repository";
import { getTodayIsoDate } from "../../../features/ozipz/utils/dateUtils";
import { SqliteScheduleRepository } from "./sqlite-schedule.repository";
import { SqliteMaterialsRepository } from "./sqlite-materials.repository";
import { matchActionDistributions } from "../action-distribution-match";
import { linkedDistributionUpdates } from "../../../features/ozipz/utils/linkedDistribution";
import { actionDistributionData, type ActionDistributionItem } from "../action-distribution-data";

export class SqliteActionsRepository implements IActionsRepository {
  constructor(
    private readonly db: ISqlDatabase,
    private readonly jrwaRepo?: IJrwaRepository,
    private readonly scheduleRepo?: IScheduleRepository,
    private readonly materialsRepo?: IMaterialsRepository
  ) {}

  async getActions(): Promise<OzipzAction[]> {
    const rows = await this.db.select<ActionSqlRow[]>("SELECT * FROM ozipz_actions ORDER BY date DESC");
    return rows.map(Mappers.toAction);
  }

  async addAction(action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">): Promise<OzipzAction> {
    const id = generateId("act");
    const now = new Date().toISOString();
    const newAction: OzipzAction = { ...action, id, createdAt: now, updatedAt: now };
    await this.db.execute(
      "INSERT INTO ozipz_actions (id, title, action_type, date, facility_id, facility_name, municipality, program_id, program_name, topic, audience_group, campaign_id, campaign_name, jrwa_sign, jrwa_case_id, izrz_sign, ezd_status, status, source_info, schedule_event_id, material_id, number_of_actions, participants_count, indirect_recipients_count, materials_distributed_count, lead_educator, notes, created_at, updated_at, linked_action_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)",
      [
        newAction.id, newAction.title, newAction.actionType, newAction.date, newAction.facilityId || null,
        newAction.facilityName, newAction.municipality, newAction.programId || null, newAction.programName || null,
        newAction.topic, newAction.audienceGroup, newAction.campaignId || null, newAction.campaignName || null,
        newAction.jrwaSign || null, newAction.jrwaCaseId || null, newAction.izrzSign || null,
        newAction.ezdStatus || null, newAction.status || null, newAction.sourceInfo || null,
        newAction.scheduleEventId || null, newAction.materialId || null, newAction.numberOfActions || 1,
        newAction.participantsCount, newAction.indirectRecipientsCount || 0,
        newAction.materialsDistributedCount || 0, newAction.leadEducator, newAction.notes || null,
        newAction.createdAt, newAction.updatedAt, newAction.linkedActionId || null,
      ]
    );
    return newAction;
  }

  /**
   * Powiązanie ze sprawą musi odpowiadać znakowi działania: gdy znak zmieniono, a identyfikator sprawy
   * został stary, wiążemy działanie ze sprawą o nowym znaku albo zostawiamy je bez powiązania.
   */
  private async caseIdMatchingSign(jrwaSign: string | undefined, jrwaCaseId: string | undefined): Promise<string | undefined> {
    if (!jrwaCaseId) return jrwaCaseId;
    const sign = jrwaSign?.trim();
    if (!sign) return undefined;
    const linked = await this.db.select<Array<{ full_case_sign: string }>>(
      "SELECT full_case_sign FROM ozipz_jrwa_cases WHERE id = $1 LIMIT 1", [jrwaCaseId]
    );
    if (linked[0]?.full_case_sign?.trim().toLowerCase() === sign.toLowerCase()) return jrwaCaseId;
    const bySign = await this.db.select<Array<{ id: string }>>(
      "SELECT id FROM ozipz_jrwa_cases WHERE lower(trim(full_case_sign)) = lower($1) LIMIT 1", [sign]
    );
    return bySign[0]?.id;
  }

  async updateAction(id: string, updates: Partial<OzipzAction>): Promise<void> {
    const now = new Date().toISOString();
    const rows = await this.db.select<ActionSqlRow[]>("SELECT * FROM ozipz_actions WHERE id = $1", [id]);
    if (!rows || rows.length === 0) return;
    const current = Mappers.toAction(rows[0]);
    const merged = { ...current, ...updates, updatedAt: now };
    merged.jrwaCaseId = await this.caseIdMatchingSign(merged.jrwaSign, merged.jrwaCaseId);
    await this.db.execute(
      "UPDATE ozipz_actions SET title = $1, action_type = $2, date = $3, facility_id = $4, facility_name = $5, municipality = $6, program_id = $7, program_name = $8, topic = $9, audience_group = $10, campaign_id = $11, campaign_name = $12, jrwa_sign = $13, jrwa_case_id = $14, izrz_sign = $15, ezd_status = $16, status = $17, source_info = $18, schedule_event_id = $19, material_id = $20, number_of_actions = $21, participants_count = $22, indirect_recipients_count = $23, materials_distributed_count = $24, lead_educator = $25, notes = $26, updated_at = $27, linked_action_id = $28 WHERE id = $29",
      [
        merged.title, merged.actionType, merged.date, merged.facilityId || null, merged.facilityName,
        merged.municipality, merged.programId || null, merged.programName || null, merged.topic,
        merged.audienceGroup, merged.campaignId || null, merged.campaignName || null, merged.jrwaSign || null,
        merged.jrwaCaseId || null, merged.izrzSign || null, merged.ezdStatus || null, merged.status || null,
        merged.sourceInfo || null, merged.scheduleEventId || null, merged.materialId || null,
        merged.numberOfActions || 1, merged.participantsCount, merged.indirectRecipientsCount || 0,
        merged.materialsDistributedCount || 0, merged.leadEducator, merged.notes || null,
        merged.updatedAt, merged.linkedActionId || null, id,
      ]
    );
  }

  async deleteAction(id: string): Promise<void> {
    await this.db.execute("BEGIN TRANSACTION;");
    try {
      await this.db.execute("UPDATE ozipz_distributions SET action_id = NULL, action_title = NULL WHERE action_id = $1;", [id]);
      await this.db.execute("UPDATE ozipz_schedule SET status = 'zaplanowane', action_id = NULL WHERE action_id = $1;", [id]);
      await this.db.execute("DELETE FROM ozipz_actions WHERE id = $1;", [id]);
      await this.db.execute("COMMIT;");
    } catch (err) {
      await this.db.execute("ROLLBACK;");
      throw err;
    }
  }

  async updateActionWithRelations(
    id: string,
    updates: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    companionDistribution?: CompanionDistributionPayload
  ): Promise<void> {
    const schedule = this.scheduleRepo ?? new SqliteScheduleRepository(this.db);
    const materials = this.materialsRepo ?? new SqliteMaterialsRepository(this.db);
    const isCancelled = ["odwolane", "cancelled", "anulowane"].includes(updates.status || "");
    const nextScheduleId = isCancelled ? undefined : updates.scheduleEventId;

    await this.db.execute("BEGIN TRANSACTION;");
    try {
      const previousRows = await this.db.select<ActionSqlRow[]>(
        "SELECT * FROM ozipz_actions WHERE id = $1 LIMIT 1;", [id]
      );
      if (!previousRows.length) throw new Error("Nie znaleziono działania.");
      await this.updateAction(id, isCancelled ? { ...updates, scheduleEventId: undefined } : updates);
      await this.syncLinkedDistributions(Mappers.toAction(previousRows[0]), materials);

      if (isCancelled || "scheduleEventId" in updates) {
        if (nextScheduleId) {
          const rows = await this.db.select<Array<{ action_id: string | null }>>(
            "SELECT action_id FROM ozipz_schedule WHERE id = $1 LIMIT 1;", [nextScheduleId]
          );
          if (rows[0]?.action_id && rows[0].action_id !== id) {
            throw new Error("Zadanie harmonogramu jest już powiązane z innym działaniem.");
          }
        }
        await this.db.execute(
          "UPDATE ozipz_schedule SET status = 'zaplanowane', action_id = NULL WHERE action_id = $1 AND id IS NOT $2;",
          [id, nextScheduleId || null]
        );
        if (nextScheduleId) {
          await schedule.updateScheduleEvent(nextScheduleId, { status: "done", actionId: id });
        }
      }

      // Materiały przenoszą się wtedy do nowej dystrybucji — własne pozycje działania usuwamy.
      const ownMaterials = companionDistribution ? [] : distributionMaterials;
      if (ownMaterials !== undefined) {
        const existing = (await this.db.select<DistributionSqlRow[]>(
          "SELECT * FROM ozipz_distributions WHERE action_id = $1;", [id]
        )).map(Mappers.toDistribution);
        const desired = ownMaterials.filter((item) => item.quantity > 0);
        const { matches, removed } = matchActionDistributions(existing, desired);
        const actionRows = await this.db.select<ActionSqlRow[]>("SELECT * FROM ozipz_actions WHERE id = $1 LIMIT 1;", [id]);
        const target = actionRows.length > 0 ? Mappers.toAction(actionRows[0]) : null;

        for (const [index, distMat] of desired.entries()) {
          const data = {
            materialId: distMat.materialId || undefined,
            materialTitle: distMat.title || "Materiał oświatowy",
            materialType: distMat.type || undefined,
            facilityId: target?.facilityId,
            recipientName: target?.facilityName || "Odbiorca",
            municipality: target?.municipality,
            actionId: id,
            actionTitle: target?.title,
            quantity: distMat.quantity,
            distributionDate: target?.date || getTodayIsoDate(),
            assignedEducator: target?.leadEducator || "",
          };
          const match = matches[index];
          if (match) {
            if (Object.entries(data).some(([key, value]) => match[key as keyof OzipzDistribution] !== value)) {
              await materials.updateDistribution(match.id, data);
            }
          } else {
            await materials.addDistribution({
              ...data,
              purpose: `Przekazanie podczas działania: ${target?.title || ""}`,
            });
          }
        }
        for (const old of removed) await materials.deleteDistribution(old.id);
      }
      if (companionDistribution) {
        await this.addLinkedDistribution(id, companionDistribution, distributionMaterials ?? [], materials);
      }

      await this.db.execute("COMMIT;");
    } catch (error) {
      await this.db.execute("ROLLBACK;");
      throw error;
    }
  }

  /** Tworzy dystrybucję powiązaną z już zapisanym działaniem (materiały dopisane przy edycji). */
  private async addLinkedDistribution(
    actionId: string,
    payload: CompanionDistributionPayload,
    items: ActionDistributionItem[],
    materials: IMaterialsRepository
  ): Promise<void> {
    const actions = await this.getActions();
    const source = actions.find((action) => action.id === actionId);
    if (!source) throw new Error("Nie znaleziono działania.");
    if (actions.some((action) => action.linkedActionId === actionId)) {
      throw new Error("To działanie ma już powiązaną dystrybucję.");
    }
    const companion = await this.addAction({ ...payload, linkedActionId: actionId });
    for (const item of items.filter((entry) => entry.quantity > 0)) {
      await materials.addDistribution(actionDistributionData(item, source, companion));
    }
  }

  /** Przepisuje zmiany działania na dystrybucje zapisane razem z nim (i na ich pozycje rozdzielnika). */
  private async syncLinkedDistributions(previous: OzipzAction, materials: IMaterialsRepository): Promise<void> {
    const rows = await this.db.select<ActionSqlRow[]>("SELECT * FROM ozipz_actions WHERE id = $1 LIMIT 1;", [previous.id]);
    if (!rows.length) return;
    const next = Mappers.toAction(rows[0]);
    const linked = (await this.db.select<ActionSqlRow[]>(
      "SELECT * FROM ozipz_actions WHERE linked_action_id = $1;", [previous.id]
    )).map(Mappers.toAction);
    for (const distribution of linked) {
      const updates = linkedDistributionUpdates(previous, next, distribution);
      if (!updates) continue;
      await this.updateAction(distribution.id, updates);
      const merged = { ...distribution, ...updates };
      const items = (await this.db.select<DistributionSqlRow[]>(
        "SELECT * FROM ozipz_distributions WHERE action_id = $1;", [distribution.id]
      )).map(Mappers.toDistribution);
      for (const item of items) {
        await materials.updateDistribution(item.id, {
          facilityId: merged.facilityId,
          recipientName: merged.facilityName || item.recipientName,
          municipality: merged.municipality,
          actionTitle: merged.title,
          distributionDate: merged.date,
          assignedEducator: merged.leadEducator,
        });
      }
    }
  }

  async saveActionWithRelations(params: SaveActionWithRelationsParams): Promise<SaveActionWithRelationsResult> {
    const jrwa = this.jrwaRepo ?? new SqliteJrwaRepository(this.db);
    const schedule = this.scheduleRepo ?? new SqliteScheduleRepository(this.db);
    const materials = this.materialsRepo ?? new SqliteMaterialsRepository(this.db);
    const scheduleEventId = ["odwolane", "cancelled", "anulowane"].includes(params.action.status || "")
      ? undefined : params.action.scheduleEventId;

    await this.db.execute("BEGIN TRANSACTION;");
    try {
      if (scheduleEventId) {
        const rows = await this.db.select<Array<{ action_id: string | null }>>(
          "SELECT action_id FROM ozipz_schedule WHERE id = $1 LIMIT 1;", [scheduleEventId]
        );
        if (rows[0]?.action_id) throw new Error("Zadanie harmonogramu jest już powiązane z innym działaniem.");
      }
      let jrwaCase: OzipzJrwaCase | undefined;
      let jrwaCaseId = params.action.jrwaCaseId;

      if (params.autoCreateJrwa) {
        const existingCases = await jrwa.getJrwaCases();
        const targetSign = (params.autoCreateJrwa.fullCaseSign || "").trim().toLowerCase();
        const existing = existingCases.find(
          (c) => c.fullCaseSign && c.fullCaseSign.trim().toLowerCase() === targetSign
        );

        if (existing) {
          jrwaCase = existing;
          jrwaCaseId = existing.id;
        } else {
          jrwaCase = await jrwa.addJrwaCase({
            section: params.autoCreateJrwa.section,
            jrwaSymbol: params.autoCreateJrwa.jrwaSymbol,
            caseNumber: params.autoCreateJrwa.caseNumber,
            year: params.autoCreateJrwa.year,
            fullCaseSign: params.autoCreateJrwa.fullCaseSign,
            title: params.action.title,
            status: "w_toku",
            assignedEducator: params.action.leadEducator,
            facilityId: params.action.facilityId,
            facilityName: params.action.facilityName,
            programId: params.action.programId,
          });
          jrwaCaseId = jrwaCase.id;
        }
      }

      const action = await this.addAction({
        ...params.action,
        scheduleEventId,
        jrwaCaseId,
      });

      if (scheduleEventId) {
        await schedule.updateScheduleEvent(scheduleEventId, { status: "done", actionId: action.id });
      }

      const companionAction = params.companionDistribution
        ? await this.addAction({ ...params.companionDistribution, linkedActionId: action.id })
        : undefined;
      const distributionOwner = companionAction ?? action;

      const createdDistributions: OzipzDistribution[] = [];
      const distMaterials =
        params.distributionMaterials && params.distributionMaterials.length > 0
          ? params.distributionMaterials
          : params.distributionMaterial && params.distributionMaterial.quantity > 0
          ? [params.distributionMaterial]
          : [];

      for (const distMat of distMaterials) {
        if (distMat.quantity > 0) {
          createdDistributions.push(await materials.addDistribution(actionDistributionData(distMat, params.action, distributionOwner)));
        }
      }

      if (jrwaCase && !jrwaCase.actionId) {
        await jrwa.updateJrwaCase(jrwaCase.id, { actionId: action.id });
        jrwaCase.actionId = action.id;
      }

      await this.db.execute("COMMIT;");
      return {
        action,
        jrwaCase,
        distribution: createdDistributions[0],
        distributions: createdDistributions,
        companionAction,
      };
    } catch (error) {
      await this.db.execute("ROLLBACK;");
      throw error;
    }
  }
}
