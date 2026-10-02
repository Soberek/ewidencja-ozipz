import type { OzipzJrwaCase, OzipzAction } from "../../../features/ozipz/types/ozipz.types";
import type { IJrwaRepository } from "../interfaces";
import { generateId } from "../id-generator";
import { assertNoClosedActionReference, loadFromStorage, saveToStorage, withStorageRollback } from "./storage";

function assertUniqueCase(list: OzipzJrwaCase[], candidate: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">, id?: string): void {
  if (list.some((item) => item.id !== id && (
    item.fullCaseSign === candidate.fullCaseSign ||
    (item.section === candidate.section && item.jrwaSymbol === candidate.jrwaSymbol && item.caseNumber === candidate.caseNumber && item.year === candidate.year)
  ))) {
    throw new Error("Taki znak sprawy lub numer sprawy już istnieje.");
  }
}

export class FallbackJrwaRepository implements IJrwaRepository {
  async getJrwaCases(): Promise<OzipzJrwaCase[]> {
    return loadFromStorage<OzipzJrwaCase[]>("jrwaCases", []);
  }

  async addJrwaCase(item: Omit<OzipzJrwaCase, "id" | "createdAt" | "updatedAt">): Promise<OzipzJrwaCase> {
    const list = await this.getJrwaCases();
    assertUniqueCase(list, item);
    const id = generateId("jrwa");
    const now = new Date().toISOString();
    const created: OzipzJrwaCase = { ...item, id, createdAt: now, updatedAt: now };
    saveToStorage("jrwaCases", [created, ...list]);
    return created;
  }

  async updateJrwaCase(id: string, updates: Partial<OzipzJrwaCase>): Promise<void> {
    const list = await this.getJrwaCases();
    const current = list.find((item) => item.id === id);
    if (!current) return;
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([key, value]) =>
      value !== undefined && key !== "id" && key !== "createdAt" && key !== "updatedAt"
    ));
    const updated = { ...current, ...cleanUpdates };
    if (updated.fullCaseSign !== current.fullCaseSign || updated.section !== current.section ||
        updated.jrwaSymbol !== current.jrwaSymbol || updated.caseNumber !== current.caseNumber || updated.year !== current.year) {
      assertUniqueCase(list, updated, id);
    }
    const now = new Date().toISOString();
    saveToStorage("jrwaCases", list.map((j) => (j.id === id ? { ...j, ...cleanUpdates, updatedAt: now } : j)));
  }

  async deleteJrwaCase(id: string): Promise<void> {
    assertNoClosedActionReference("jrwaCaseId", id);
    return withStorageRollback(["jrwaCases", "actions"], async () => {
      const list = await this.getJrwaCases();
      saveToStorage("jrwaCases", list.filter((j) => j.id !== id));
      const actions = loadFromStorage<OzipzAction[]>("actions", []);
      saveToStorage("actions", actions.map((a) => (a.jrwaCaseId === id ? { ...a, jrwaCaseId: undefined } : a)));
    });
  }
}
