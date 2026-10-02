import { invoke } from "@tauri-apps/api/core";
import { withBrowserStorageLock } from "./serialized-service";
import {
  downloadBlob,
  embedBrowserStorage,
  fallbackBackupBlob,
  restoreBrowserStorage,
  restoreEmbeddedStorage,
  validateBrowserStorage,
} from "./backup-storage";
import { HttpSqlDatabase, httpHeaders } from "./http-database";
import { getTodayIsoDate } from "@/features/ozipz/utils/dateUtils";
import { getDatabaseInfo, getDb } from "./client";

export interface AutoBackupInfo {
  name: string;
  path: string;
  date: string;
  sizeBytes: number;
}

export interface AutoBackupStatus {
  folder: string | null;
  backups: AutoBackupInfo[];
  lastError: string | null;
}

export async function getAutoBackups(): Promise<AutoBackupStatus> {
  return invoke<AutoBackupStatus>("get_auto_backups");
}

export async function createAutoBackupNow(): Promise<void> {
  await invoke("create_auto_backup_now");
}

export async function openAutoBackupFolder(): Promise<void> {
  await invoke("open_auto_backup_folder");
}

/** Przygotowuje przywrócenie kopii automatycznej; podmiana nastąpi po ponownym uruchomieniu. */
export async function restoreAutoBackup(path: string): Promise<void> {
  await invoke("queue_database_restore", { sourcePath: path });
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
      body: file,
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
