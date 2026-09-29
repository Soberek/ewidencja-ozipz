import { serializeDatabaseService, withBrowserStorageLock } from "./serialized-service";
import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import type { IOzipzDatabaseService, ISqlDatabase } from "./types";
import { SqliteDatabaseService, initTables } from "./sqlite-service";
import {
  downloadBlob,
  embedBrowserStorage,
  fallbackBackupBlob,
  restoreBrowserStorage,
  restoreEmbeddedStorage,
  validateBrowserStorage,
} from "./backup-storage";
import { HttpSqlDatabase, httpHeaders, setHttpToken } from "./http-database";
import { getTodayIsoDate } from "@/features/ozipz/utils/dateUtils";

let desktopDatabase: Database | null = null;

let activeService: IOzipzDatabaseService | null = null;
let initPromise: Promise<IOzipzDatabaseService> | null = null;

export type DatabaseMode = "tauri-sqlite" | "http-sqlite" | "browser-storage";

export interface DatabaseInfo {
  mode: DatabaseMode;
  location: string;
  degraded: boolean;
  detail: string;
}

let activeDatabaseInfo: DatabaseInfo | null = null;

export async function getDatabaseService(): Promise<IOzipzDatabaseService> {
  if (activeService) return activeService;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 1. Sprawdź środowisko okienkowe Tauri
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        let dbPath = "ozipz.db";
        try {
          const exeDbPath = await invoke<string>("get_database_path");
          if (exeDbPath) {
            dbPath = exeDbPath;
          }
        } catch (e) {
          console.warn("Używam domyślnej ścieżki ozipz.db w Tauri:", e);
        }

        const connectionString = "sqlite:" + dbPath;
        await invoke("open_local_database");
        const db = Database.get(connectionString);
        desktopDatabase = db;

        await db.execute("PRAGMA journal_mode = WAL;");
        await db.execute("PRAGMA synchronous = NORMAL;");
        await db.execute("PRAGMA foreign_keys = ON;");
        await db.execute("PRAGMA busy_timeout = 5000;");

        if (await invoke<boolean>("has_restored_database")) {
          await restoreEmbeddedStorage(db);
          await invoke("acknowledge_database_restore");
        }
        await initTables(db);
        activeService = serializeDatabaseService(new SqliteDatabaseService(db));
        activeDatabaseInfo = {
          mode: "tauri-sqlite",
          location: dbPath,
          degraded: false,
          detail: "SQLite z dziennikiem WAL i integralnością relacyjną",
        };
        return activeService;
      } catch (err) {
        throw new Error(`Nie udało się otworzyć bazy SQLite. ${String(err)}`);
      }
    }

    // 2. Sprawdź środowisko Web / serwer developerski Vite (/api/db)
    if (typeof window !== "undefined" && typeof fetch !== "undefined") {
      const res = await fetch("/api/db/status", { method: "GET", headers: httpHeaders() }).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        if (data?.ok) {
          setHttpToken(data.token);
          const httpDb = new HttpSqlDatabase();
          await initTables(httpDb);
          activeService = serializeDatabaseService(new SqliteDatabaseService(httpDb));
          activeDatabaseInfo = {
            mode: "http-sqlite",
            location: typeof data.path === "string" ? data.path : "ozipz.db",
            degraded: false,
            detail: "SQLite serwera lokalnego z dziennikiem WAL",
          };
          return activeService;
        }
      } else if (res && res.status !== 404) {
        const error = await res.json().catch(() => null);
        const detail = typeof error?.error === "string" ? error.error : "Nie udało się uzyskać dostępu do lokalnej bazy danych.";
        throw new Error(`HTTP ${res.status}: ${detail}`);
      }
    }

    // 3. Fallback do localStorage w trybie offline/statycznym
    const { FallbackDatabaseService } = await import("./fallback-service");
    // ponytail: without Web Locks, keep one tab open; SQLite is needed for multi-tab safety.
    activeService = serializeDatabaseService(new FallbackDatabaseService(), true);
    activeDatabaseInfo = {
      mode: "browser-storage",
      location: "Pamięć tej przeglądarki i profilu użytkownika",
      degraded: true,
      detail: typeof navigator.locks?.request === "function"
        ? "Tryb awaryjny bez relacyjnych transakcji SQLite"
        : "Tryb awaryjny: edytuj tylko w jednej karcie (brak Web Locks)",
    };
    return activeService;
  })().catch((error) => { initPromise = null; throw error; });

  return initPromise;
}

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  await getDatabaseService();
  return activeDatabaseInfo ?? {
    mode: "browser-storage",
    location: "Pamięć tej przeglądarki i profilu użytkownika",
    degraded: true,
    detail: "Tryb awaryjny bez relacyjnych transakcji SQLite",
  };
}

export function retryDatabaseConnection(): void {
  // A reload reinitializes both the connection and all consumers together.
  window.location.reload();
}


export async function createDatabaseBackup(): Promise<boolean> {
  const info = await getDatabaseInfo();
  const stamp = getTodayIsoDate();

  if (info.mode === "tauri-sqlite") {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const destination = await save({
      defaultPath: `ozipz-backup-${stamp}.db`,
      filters: [{ name: "Baza SQLite", extensions: ["db"] }],
    });
    if (!destination) return false;
    const db = await getDb();
    if (!db) throw new Error("Brak połączenia z bazą danych");
    await embedBrowserStorage(db);
    await invoke("backup_database", { destinationPath: destination });
  } else if (info.mode === "http-sqlite") {
    await embedBrowserStorage(new HttpSqlDatabase());
    const response = await fetch("/api/db/backup", { headers: httpHeaders() });
    if (!response.ok) throw new Error("Nie udało się utworzyć kopii bazy SQLite");
    downloadBlob(await response.blob(), `ozipz-backup-${stamp}.db`);
  } else {
    downloadBlob(await withBrowserStorageLock(fallbackBackupBlob), `ozipz-backup-${stamp}.json`);
  }

  try { localStorage.setItem("ozipz_lastBackupAt", new Date().toISOString()); } catch { /* The backup itself succeeded. */ }
  return true;
}

export async function restoreDatabaseBackup(file?: File): Promise<"reload" | "restart" | false> {
  const info = await getDatabaseInfo();

  if (info.mode === "tauri-sqlite") {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const source = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Baza SQLite", extensions: ["db"] }],
    });
    if (!source || Array.isArray(source)) return false;
    await invoke("queue_database_restore", { sourcePath: source });
    return "restart";
  }

  if (!file) throw new Error("Wybierz plik kopii zapasowej");
  if (info.mode === "http-sqlite") {
    const response = await fetch("/api/db/restore", {
      method: "POST",
      headers: { ...httpHeaders(), "Content-Type": "application/octet-stream" },
      body: await file.arrayBuffer(),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Nie udało się przywrócić kopii bazy SQLite");
    }
    await restoreEmbeddedStorage(new HttpSqlDatabase());
    return "reload";
  }

  const parsed = JSON.parse(await file.text()) as { format?: string; entries?: Record<string, string> };
  const entries = parsed.entries;
  if (parsed.format !== "ozipz-localstorage-v1" || !entries) {
    throw new Error("Wybrany plik nie jest prawidłową kopią OZiPZ");
  }
  validateBrowserStorage(entries);
  await withBrowserStorageLock(() => restoreBrowserStorage(entries));
  return "reload";
}

/** OneDrive and network shares break SQLite's WAL locking and can corrupt the database. */
export function isRiskyDatabaseLocation(location: string): boolean {
  return /onedrive|dropbox|google ?drive/i.test(location) || location.startsWith("\\\\");
}

export async function revealDatabaseFile(): Promise<void> {
  await invoke("reveal_database_file");
}

/** Copies the database into a chosen folder (or adopts an ozipz.db already there) and restarts the app. */
export async function changeDatabaseLocation(): Promise<boolean> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const directory = await open({ directory: true, multiple: false, title: "Wybierz folder bazy danych" });
  if (!directory || Array.isArray(directory)) return false;
  await invoke("set_database_location", { directory });
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
  return true;
}

export async function getDb(): Promise<Database | null> {
  await getDatabaseService();
  return desktopDatabase;
}

/**
 * Provides the active SQLite connection for small, self-contained local features.
 * It works both in the Tauri desktop shell and through Vite's local SQLite bridge.
 */
export async function getActiveSqlDatabase(): Promise<ISqlDatabase> {
  await getDatabaseService();

  if (desktopDatabase) return desktopDatabase;
  if (activeDatabaseInfo?.mode === "http-sqlite") return new HttpSqlDatabase();

  throw new Error("SQLite nie jest dostępne w tym środowisku.");
}

async function resolveService(): Promise<IOzipzDatabaseService> {
  return await getDatabaseService();
}

export const OzipzDbService: IOzipzDatabaseService = {
  async getClosedMonths() { return (await resolveService()).getClosedMonths(); },
  async setMonthClosed(monthKey, closed) { return (await resolveService()).setMonthClosed(monthKey, closed); },
  async getActions() { return (await resolveService()).getActions(); },
  async addAction(a) { return (await resolveService()).addAction(a); },
  async updateAction(id, u) { return (await resolveService()).updateAction(id, u); },
  async updateActionWithRelations(id, u, dists, companion) {
    return (await resolveService()).updateActionWithRelations(id, u, dists, companion);
  },
  async deleteAction(id) { return (await resolveService()).deleteAction(id); },
  async saveActionWithRelations(p) { return (await resolveService()).saveActionWithRelations(p); },

  async getPrograms() { return (await resolveService()).getPrograms(); },
  async addProgram(p) { return (await resolveService()).addProgram(p); },
  async updateProgram(id, u) { return (await resolveService()).updateProgram(id, u); },
  async deleteProgram(id) { return (await resolveService()).deleteProgram(id); },

  async getParticipations() { return (await resolveService()).getParticipations(); },
  async addParticipation(p) { return (await resolveService()).addParticipation(p); },
  async updateParticipation(id, u) { return (await resolveService()).updateParticipation(id, u); },
  async deleteParticipation(id) { return (await resolveService()).deleteParticipation(id); },

  async getMaterials() { return (await resolveService()).getMaterials(); },
  async addMaterial(m) { return (await resolveService()).addMaterial(m); },
  async updateMaterial(id, u) { return (await resolveService()).updateMaterial(id, u); },
  async deleteMaterial(id) { return (await resolveService()).deleteMaterial(id); },

  async getDistributions() { return (await resolveService()).getDistributions(); },
  async addDistribution(d) { return (await resolveService()).addDistribution(d); },
  async updateDistribution(id, u) { return (await resolveService()).updateDistribution(id, u); },
  async deleteDistribution(id) { return (await resolveService()).deleteDistribution(id); },

  async getScheduleEvents() { return (await resolveService()).getScheduleEvents(); },
  async addScheduleEvent(e) { return (await resolveService()).addScheduleEvent(e); },
  async updateScheduleEvent(id, u) { return (await resolveService()).updateScheduleEvent(id, u); },
  async deleteScheduleEvent(id) { return (await resolveService()).deleteScheduleEvent(id); },

  async getJrwaCases() { return (await resolveService()).getJrwaCases(); },
  async addJrwaCase(c) { return (await resolveService()).addJrwaCase(c); },
  async updateJrwaCase(id, u) { return (await resolveService()).updateJrwaCase(id, u); },
  async deleteJrwaCase(id) { return (await resolveService()).deleteJrwaCase(id); },

  async getPublications() { return (await resolveService()).getPublications(); },
  async addPublication(p) { return (await resolveService()).addPublication(p); },
  async updatePublication(id, u) { return (await resolveService()).updatePublication(id, u); },
  async deletePublication(id) { return (await resolveService()).deletePublication(id); },

  async getFacilities() { return (await resolveService()).getFacilities(); },
  async addFacility(f) { return (await resolveService()).addFacility(f); },
  async updateFacility(id, u) { return (await resolveService()).updateFacility(id, u); },
  async deleteFacility(id) { return (await resolveService()).deleteFacility(id); },
  async batchUpsertFacilities(f) { return (await resolveService()).batchUpsertFacilities(f); },

  async getDictionaryItems() { return (await resolveService()).getDictionaryItems(); },
  async addDictionaryItem(d) { return (await resolveService()).addDictionaryItem(d); },
  async updateDictionaryItem(id, u) { return (await resolveService()).updateDictionaryItem(id, u); },
  async deleteDictionaryItem(id) { return (await resolveService()).deleteDictionaryItem(id); },

  async getLetters() { return (await resolveService()).getLetters(); },
  async addLetter(l) { return (await resolveService()).addLetter(l); },
  async updateLetter(id, u) { return (await resolveService()).updateLetter(id, u); },
  async deleteLetter(id) { return (await resolveService()).deleteLetter(id); },

  async getScans() { return (await resolveService()).getScans(); },
  async addScan(s) { return (await resolveService()).addScan(s); },
  async deleteScan(id) { return (await resolveService()).deleteScan(id); },

  async getTemplates() { return (await resolveService()).getTemplates(); },
  async addTemplate(t) { return (await resolveService()).addTemplate(t); },
  async updateTemplate(id, u) { return (await resolveService()).updateTemplate(id, u); },
  async deleteTemplate(id) { return (await resolveService()).deleteTemplate(id); },

  async getStaff() { return (await resolveService()).getStaff(); },
  async addStaff(s) { return (await resolveService()).addStaff(s); },
  async updateStaff(id, u) { return (await resolveService()).updateStaff(id, u); },
  async deleteStaff(id) { return (await resolveService()).deleteStaff(id); },

  async getContacts() { return (await resolveService()).getContacts(); },
  async addContact(c) { return (await resolveService()).addContact(c); },
  async updateContact(id, u) { return (await resolveService()).updateContact(id, u); },
  async deleteContact(id) { return (await resolveService()).deleteContact(id); },

  async getRegisters() { return (await resolveService()).getRegisters(); },
  async addRegister(r) { return (await resolveService()).addRegister(r); },
  async updateRegister(id, u) { return (await resolveService()).updateRegister(id, u); },
  async deleteRegister(id) { return (await resolveService()).deleteRegister(id); },

  async getFacilityActivitySummary(facId) { return (await resolveService()).getFacilityActivitySummary(facId); },
  async getMonthlyTargets(year) { return (await resolveService()).getMonthlyTargets(year); },
  async saveMonthlyTargets(year, targets) { return (await resolveService()).saveMonthlyTargets(year, targets); },
};
