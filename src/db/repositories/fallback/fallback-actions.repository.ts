import type { OzipzAction, OzipzDistribution, OzipzJrwaCase, OzipzScheduleEvent, OzipzPublication } from "../../../features/ozipz/types/ozipz.types";
import type { IActionsRepository, IJrwaRepository, IScheduleRepository, IMaterialsRepository } from "../interfaces";
import type { CompanionDistributionPayload, SaveActionWithRelationsParams, SaveActionWithRelationsResult } from "../../types";
import { generateId } from "../id-generator";
import { loadFromStorage, saveToStorage, withStorageRollback } from "./storage";
import { FallbackJrwaRepository } from "./fallback-jrwa.repository";
import { FallbackScheduleRepository } from "./fallback-schedule.repository";
import { FallbackMaterialsRepository } from "./fallback-materials.repository";
import { getTodayIsoDate, getStoredClosedMonths, isMonthClosed } from "../../../features/ozipz/utils/dateUtils";
import { matchActionDistributions } from "../action-distribution-match";
import { isActionCancelled } from "../../../features/ozipz/utils/calculators/actionMetrics";
import { linkedDistributionUpdates } from "../../../features/ozipz/utils/linkedDistribution";
import { actionDistributionData, type ActionDistributionItem } from "../action-distribution-data";

function assertMonthOpen(date: string): void {
  if (isMonthClosed(date, getStoredClosedMonths())) throw new Error("Miesiąc jest zamknięty.");
}

// ponytail: localStorage has no multi-key transaction; use SQLite for crash-safe writes.
async function withActionStorageRollback<T>(operation: () => Promise<T>): Promise<T> {
  return withStorageRollback(["actions", "jrwaCases", "schedules", "distributions", "publications"], operation);
}

export class FallbackActionsRepository implements IActionsRepository {
  constructor(
    private readonly jrwaRepo?: IJrwaRepository,
    private readonly scheduleRepo?: IScheduleRepository,
    private readonly materialsRepo?: IMaterialsRepository
  ) {}

  async getActions(): Promise<OzipzAction[]> {
    return loadFromStorage<OzipzAction[]>("actions", []);
  }

  async addAction(action: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">): Promise<OzipzAction> {
    assertMonthOpen(action.date);
    const list = await this.getActions();
    const id = generateId("act");
    const now = new Date().toISOString();
    const created: OzipzAction = { ...action, id, createdAt: now, updatedAt: now };
    saveToStorage("actions", [created, ...list]);
    return created;
  }

  async updateAction(id: string, updates: Partial<OzipzAction>): Promise<void> {
    const list = await this.getActions();
    const current = list.find((action) => action.id === id);
    if (current) {
      assertMonthOpen(current.date);
      assertMonthOpen(updates.date ?? current.date);
    }
    const now = new Date().toISOString();
    saveToStorage("actions", list.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: now } : a)));
  }

  async deleteAction(id: string): Promise<void> {
    return withActionStorageRollback(async () => {
      const list = await this.getActions();
      const current = list.find((action) => action.id === id);
      if (current) assertMonthOpen(current.date);
      saveToStorage("actions", list.filter((a) => a.id !== id)
        .map((a) => (a.linkedActionId === id ? { ...a, linkedActionId: undefined } : a)));
      const dists = loadFromStorage<OzipzDistribution[]>("distributions", []);
      saveToStorage("distributions", dists.map((d) => d.actionId === id ? { ...d, actionId: undefined, actionTitle: undefined } : d));
      const schs = loadFromStorage<OzipzScheduleEvent[]>("schedules", []);
      saveToStorage("schedules", schs.map((s) => (s.actionId === id ? { ...s, actionId: undefined, status: "zaplanowane" } : s)));
      const jrwa = loadFromStorage<OzipzJrwaCase[]>("jrwaCases", []);
      saveToStorage("jrwaCases", jrwa.map((j) => (j.actionId === id ? { ...j, actionId: undefined } : j)));
      const pubs = loadFromStorage<OzipzPublication[]>("publications", []);
      saveToStorage("publications", pubs.map((p) => (p.actionId === id ? { ...p, actionId: undefined } : p)));
    });
  }

  async updateActionWithRelations(
    id: string,
    updates: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    companionDistribution?: CompanionDistributionPayload
  ): Promise<void> {
    return withActionStorageRollback(async () => {
      const schedule = this.scheduleRepo ?? new FallbackScheduleRepository();
      const materials = this.materialsRepo ?? new FallbackMaterialsRepository();
      const isCancelled = isActionCancelled(updates.status);
      const nextScheduleId = isCancelled ? undefined : updates.scheduleEventId;
      const previous = (await this.getActions()).find((action) => action.id === id);
      if (!previous) throw new Error("Nie znaleziono działania.");
      await this.updateAction(id, isCancelled ? { ...updates, scheduleEventId: undefined } : updates);
      await this.syncLinkedDistributions(previous, materials);

      if (isCancelled || "scheduleEventId" in updates) {
        const schedules = await schedule.getScheduleEvents();
        const next = nextScheduleId ? schedules.find((s) => s.id === nextScheduleId) : undefined;
        if (nextScheduleId && !next) throw new Error("Nie znaleziono zadania harmonogramu.");
        if (next?.actionId && next.actionId !== id) throw new Error("Zadanie harmonogramu jest już powiązane z innym działaniem.");
        for (const linked of schedules.filter((s) => s.actionId === id && s.id !== nextScheduleId)) {
          await schedule.updateScheduleEvent(linked.id, { status: "zaplanowane", actionId: undefined });
        }
        if (nextScheduleId) await schedule.updateScheduleEvent(nextScheduleId, { status: "done", actionId: id });
      }

      // Materiały przenoszą się wtedy do nowej dystrybucji — własne pozycje działania usuwamy.
      const ownMaterials = companionDistribution ? [] : distributionMaterials;
      if (ownMaterials !== undefined) {
        const dists = loadFromStorage<OzipzDistribution[]>("distributions", []);
        const existing = dists.filter((d) => d.actionId === id);
        const desired = ownMaterials.filter((item) => item.quantity > 0);
        const { matches, removed } = matchActionDistributions(existing, desired);
        const target = (await this.getActions()).find((a) => a.id === id);
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
    });
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
    const actions = await this.getActions();
    const next = actions.find((action) => action.id === previous.id);
    if (!next) return;
    for (const distribution of actions.filter((action) => action.linkedActionId === previous.id)) {
      const updates = linkedDistributionUpdates(previous, next, distribution);
      if (!updates) continue;
      await this.updateAction(distribution.id, updates);
      const merged = { ...distribution, ...updates };
      const items = loadFromStorage<OzipzDistribution[]>("distributions", [])
        .filter((item) => item.actionId === distribution.id);
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
    return withActionStorageRollback(async () => {
      assertMonthOpen(params.action.date);
      const jrwa = this.jrwaRepo ?? new FallbackJrwaRepository();
      const schedule = this.scheduleRepo ?? new FallbackScheduleRepository();
      const materials = this.materialsRepo ?? new FallbackMaterialsRepository();
      const scheduleEventId = isActionCancelled(params.action.status)
        ? undefined : params.action.scheduleEventId;

      if (scheduleEventId && (await schedule.getScheduleEvents()).some((event) => event.id === scheduleEventId && event.actionId)) {
        throw new Error("Zadanie harmonogramu jest już powiązane z innym działaniem.");
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

      const action = await this.addAction({ ...params.action, scheduleEventId, jrwaCaseId });

      if (jrwaCase && !jrwaCase.actionId) {
        await jrwa.updateJrwaCase(jrwaCase.id, { actionId: action.id });
        jrwaCase.actionId = action.id;
      }

      if (scheduleEventId) {
        await schedule.updateScheduleEvent(scheduleEventId, { status: "done", actionId: action.id });
      }

      const companionAction = params.companionDistribution
        ? await this.addAction({ ...params.companionDistribution, linkedActionId: action.id })
        : undefined;
      const distributionOwner = companionAction ?? action;

      const createdDistributions: OzipzDistribution[] = [];
      const distMaterials = params.distributionMaterials && params.distributionMaterials.length > 0
        ? params.distributionMaterials
        : params.distributionMaterial && params.distributionMaterial.quantity > 0
        ? [params.distributionMaterial]
        : [];

      for (const distMat of distMaterials) {
        if (distMat.quantity > 0) {
          createdDistributions.push(await materials.addDistribution(actionDistributionData(distMat, params.action, distributionOwner)));
        }
      }

      return { action, jrwaCase, distribution: createdDistributions[0], distributions: createdDistributions, companionAction };
    });
  }
}
