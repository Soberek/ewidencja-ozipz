import { invoke } from "@tauri-apps/api/core";

/** Kto trzyma bazę otwartą na innym komputerze lub w innym oknie. */
export interface DatabaseLockHolder {
  user: string;
  host: string;
  pid: number;
  since: number;
  heartbeat: number;
}

export class DatabaseLockedError extends Error {
  constructor(readonly holder: DatabaseLockHolder) {
    super(`Baza jest otwarta przez ${holder.user} na komputerze ${holder.host}. Równoczesna praca na jednej bazie może ją uszkodzić.`);
    this.name = "DatabaseLockedError";
  }
}

/** Kto jest autorem zmian w tej sesji (użytkownik systemu i komputer) — trafia do historii zmian. */
export async function sessionActor(): Promise<string> {
  const actor = await invoke<unknown>("get_session_actor").catch(() => null);
  return typeof actor === "string" && actor.trim() ? actor : "użytkownik aplikacji";
}
/** Zajmuje bazę mimo blokady innego komputera (np. po jego awarii) i otwiera ją od nowa. */
export async function forceDatabaseTakeover(): Promise<void> {
  await invoke("acquire_database_lock", { force: true });
  window.location.reload();
}

/** Zwraca osobę, która przejęła bazę w trakcie pracy tego okna. */
export async function getDatabaseTakeover(): Promise<DatabaseLockHolder | null> {
  const { getDatabaseInfo } = await import("./client");
  if ((await getDatabaseInfo()).mode !== "tauri-sqlite") return null;
  return invoke<DatabaseLockHolder | null>("database_lock_status");
}
