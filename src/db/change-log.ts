import type { ISqlDatabase } from "./types";

/**
 * Historia zmian i kosz: triggery SQLite zapisują każdą zmianę wiersza w ozipz_change_log.
 * Działa niezależnie od repozytoriów, więc obejmuje też kaskady i synchronizację nazw.
 */

export type ChangeOperation = "INSERT" | "UPDATE" | "DELETE";
export type ChangeRecord = Record<string, unknown>;

export interface ChangeLogEntry {
  id: number;
  changedAt: string;
  actor: string | null;
  tableName: string;
  rowId: string;
  operation: ChangeOperation;
  oldData: ChangeRecord | null;
  newData: ChangeRecord | null;
  restoredAt: string | null;
}

export interface ChangeLogFilter {
  tableName?: string;
  operation?: ChangeOperation;
  /** Tylko wpisy, których nie przywrócono (kosz). */
  onlyRestorable?: boolean;
  limit?: number;
}

interface ChangeLogRow {
  id: number;
  changed_at: string;
  actor: string | null;
  table_name: string;
  row_id: string;
  operation: ChangeOperation;
  old_data: string | null;
  new_data: string | null;
  restored_at: string | null;
}

const LOG_TABLE = "ozipz_change_log";
const EXCLUDED_TABLES = new Set([LOG_TABLE, "ozipz_meta"]);
const ACTOR_KEY = "current_actor";
/** Zmiany zapisane w odstępie tych milisekund traktujemy jako jedną operację (np. usunięcie z kaskadą). */
export const RESTORE_GROUP_WINDOW_MS = 2000;
/** SQLite ogranicza liczbę argumentów funkcji, więc duże obiekty JSON budujemy porcjami. */
const PAIRS_PER_CALL = 30;
const DEFAULT_RETENTION_DAYS = 730;

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;
const sqlString = (value: string) => `'${value.replace(/'/g, "''")}'`;

/** Wyrażenie JSON z pełną zawartością wiersza, np. dla prefiksu NEW lub OLD. */
export function rowJsonExpression(columns: string[], prefix: string): string {
  const pairs = columns.map((column) => [sqlString(column), `${prefix}.${quote(column)}`]);
  let expression = `json_object(${pairs.slice(0, PAIRS_PER_CALL).flat().join(", ")})`;
  for (let start = PAIRS_PER_CALL; start < pairs.length; start += PAIRS_PER_CALL) {
    const chunk = pairs.slice(start, start + PAIRS_PER_CALL).map(([key, value]) => `'$.' || ${key}, ${value}`);
    expression = `json_insert(${expression}, ${chunk.join(", ")})`;
  }
  return expression;
}

interface AuditedTable {
  name: string;
  columns: string[];
  primaryKey: string;
}

async function auditedTables(db: ISqlDatabase): Promise<AuditedTable[]> {
  const tables = await db.select<Array<{ name?: unknown }>>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'ozipz\\_%' ESCAPE '\\' ORDER BY name"
  );
  const result: AuditedTable[] = [];
  for (const { name } of Array.isArray(tables) ? tables : []) {
    if (typeof name !== "string" || EXCLUDED_TABLES.has(name) || !/^\w+$/.test(name)) continue;
    const info = await db.select<Array<{ name?: unknown; pk?: unknown }>>(`PRAGMA table_info(${quote(name)})`);
    const columns = (Array.isArray(info) ? info : []).filter((column): column is { name: string; pk: number } => typeof column.name === "string");
    const primaryKey = columns.find((column) => column.pk === 1)?.name;
    if (!primaryKey || columns.length === 0) continue;
    result.push({ name, columns: columns.map((column) => column.name), primaryKey });
  }
  return result;
}

function auditTriggerSql({ name, columns, primaryKey }: AuditedTable): string[] {
  const now = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
  const actor = `(SELECT value FROM ozipz_meta WHERE key = ${sqlString(ACTOR_KEY)})`;
  const insertLog = (operation: ChangeOperation, rowId: string, oldData: string, newData: string) =>
    `INSERT INTO ${LOG_TABLE} (changed_at, actor, table_name, row_id, operation, old_data, new_data) VALUES (${now}, ${actor}, ${sqlString(name)}, CAST(${rowId} AS TEXT), '${operation}', ${oldData}, ${newData});`;
  const oldJson = rowJsonExpression(columns, "OLD");
  const newJson = rowJsonExpression(columns, "NEW");
  const pk = quote(primaryKey);
  return [
    `CREATE TRIGGER audit_${name}_insert AFTER INSERT ON ${name} BEGIN ${insertLog("INSERT", `NEW.${pk}`, "NULL", newJson)} END`,
    `CREATE TRIGGER audit_${name}_update AFTER UPDATE ON ${name} WHEN ${oldJson} IS NOT ${newJson} BEGIN ${insertLog("UPDATE", `NEW.${pk}`, oldJson, newJson)} END`,
    `CREATE TRIGGER audit_${name}_delete AFTER DELETE ON ${name} BEGIN ${insertLog("DELETE", `OLD.${pk}`, oldJson, "NULL")} END`,
  ];
}

/** Usuwa triggery historii (przed migracją i porządkami startowymi, których nie chcemy rejestrować). */
export async function dropAuditTriggers(db: ISqlDatabase): Promise<void> {
  const triggers = await db.select<Array<{ name?: unknown }>>(
    "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'audit\\_%' ESCAPE '\\'"
  );
  for (const { name } of Array.isArray(triggers) ? triggers : []) {
    if (typeof name === "string") await db.execute(`DROP TRIGGER IF EXISTS ${quote(name)}`);
  }
}

/** Tworzy triggery historii dla wszystkich tabel danych według ich bieżących kolumn. */
export async function installAuditTriggers(db: ISqlDatabase): Promise<void> {
  await dropAuditTriggers(db);
  const logExists = await db.select<Array<{ name?: unknown }>>(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${LOG_TABLE}'`);
  if (!Array.isArray(logExists) || logExists.length === 0 || logExists[0]?.name !== LOG_TABLE) return;
  for (const table of await auditedTables(db)) {
    for (const sql of auditTriggerSql(table)) await db.execute(sql);
  }
}

/** Kto wprowadza zmiany w tej sesji — trafia do kolumny actor. */
export async function setAuditActor(db: ISqlDatabase, actor: string): Promise<void> {
  await db.execute("INSERT OR REPLACE INTO ozipz_meta (key, value) VALUES ($1, $2)", [ACTOR_KEY, actor.trim() || "nieznany"]);
}

export async function pruneChangeLog(db: ISqlDatabase, retentionDays = DEFAULT_RETENTION_DAYS): Promise<void> {
  await db.execute(`DELETE FROM ${LOG_TABLE} WHERE changed_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', $1)`, [`-${retentionDays} days`]);
}

function parseRecord(value: string | null): ChangeRecord | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as ChangeRecord : null;
  } catch {
    return null;
  }
}

function toEntry(row: ChangeLogRow): ChangeLogEntry {
  return {
    id: row.id,
    changedAt: row.changed_at,
    actor: row.actor,
    tableName: row.table_name,
    rowId: row.row_id,
    operation: row.operation,
    oldData: parseRecord(row.old_data),
    newData: parseRecord(row.new_data),
    restoredAt: row.restored_at,
  };
}

export async function listChangeLog(db: ISqlDatabase, filter: ChangeLogFilter = {}): Promise<ChangeLogEntry[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filter.tableName) { params.push(filter.tableName); conditions.push(`table_name = $${params.length}`); }
  if (filter.operation) { params.push(filter.operation); conditions.push(`operation = $${params.length}`); }
  if (filter.onlyRestorable) conditions.push("restored_at IS NULL");
  params.push(Math.min(Math.max(filter.limit ?? 500, 1), 5000));
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await db.select<ChangeLogRow[]>(`SELECT * FROM ${LOG_TABLE} ${where} ORDER BY id DESC LIMIT $${params.length}`, params);
  return rows.map(toEntry);
}

/** Historia jednego rekordu, od najnowszej zmiany. */
export async function listRecordHistory(db: ISqlDatabase, tableName: string, rowId: string): Promise<ChangeLogEntry[]> {
  const rows = await db.select<ChangeLogRow[]>(
    `SELECT * FROM ${LOG_TABLE} WHERE table_name = $1 AND row_id = $2 ORDER BY id DESC`,
    [tableName, rowId]
  );
  return rows.map(toEntry);
}

async function getEntry(db: ISqlDatabase, id: number): Promise<ChangeLogEntry> {
  const rows = await db.select<ChangeLogRow[]>(`SELECT * FROM ${LOG_TABLE} WHERE id = $1`, [id]);
  if (rows.length === 0) throw new Error("Nie znaleziono wpisu historii.");
  return toEntry(rows[0]);
}

/** Wpisy cofane razem z usunięciem: to samo okno czasu i ta sama osoba (usunięcie z kaskadą, odpięcie relacji). */
export async function getRestoreGroup(db: ISqlDatabase, id: number): Promise<ChangeLogEntry[]> {
  const entry = await getEntry(db, id);
  if (entry.operation !== "DELETE") return [entry];
  const center = Date.parse(entry.changedAt);
  const from = new Date(center - RESTORE_GROUP_WINDOW_MS).toISOString();
  const to = new Date(center + RESTORE_GROUP_WINDOW_MS).toISOString();
  const rows = await db.select<ChangeLogRow[]>(
    `SELECT * FROM ${LOG_TABLE} WHERE changed_at BETWEEN $1 AND $2 AND operation IN ('DELETE', 'UPDATE') AND restored_at IS NULL AND actor IS $3 ORDER BY id DESC`,
    [from, to, entry.actor]
  );
  const entries = rows.map(toEntry);
  // Zmiany UPDATE należą do usunięcia tylko wtedy, gdy powstały w tej samej instrukcji (np. ON DELETE SET NULL).
  const deleteMoments = new Set(entries.filter((item) => item.operation === "DELETE").map((item) => item.changedAt));
  return entries.filter((item) => item.operation === "DELETE" || deleteMoments.has(item.changedAt));
}

async function currentColumns(db: ISqlDatabase, tableName: string): Promise<{ columns: string[]; primaryKey: string }> {
  if (!/^ozipz_\w+$/.test(tableName) || EXCLUDED_TABLES.has(tableName)) throw new Error("Nieobsługiwana tabela historii.");
  const info = await db.select<Array<{ name: string; pk: number }>>(`PRAGMA table_info(${quote(tableName)})`);
  const primaryKey = info.find((column) => column.pk === 1)?.name;
  if (!primaryKey) throw new Error(`Tabela ${tableName} nie istnieje w tej wersji bazy.`);
  return { columns: info.map((column) => column.name), primaryKey };
}

async function currentRowJson(db: ISqlDatabase, tableName: string, columns: string[], primaryKey: string, rowId: string): Promise<string | null> {
  const rows = await db.select<Array<{ data: string }>>(
    `SELECT ${rowJsonExpression(columns, "t")} AS data FROM ${quote(tableName)} t WHERE CAST(t.${quote(primaryKey)} AS TEXT) = $1`,
    [rowId]
  );
  return rows[0]?.data ?? null;
}

function sameRecord(left: string | null, right: ChangeRecord | null, columns: string[]): boolean {
  const current = parseRecord(left);
  if (!current || !right) return false;
  return columns.every((column) => !(column in right) || current[column] === right[column]);
}

async function undoEntry(db: ISqlDatabase, entry: ChangeLogEntry, force: boolean): Promise<boolean> {
  const { columns, primaryKey } = await currentColumns(db, entry.tableName);
  const existing = await currentRowJson(db, entry.tableName, columns, primaryKey, entry.rowId);
  const data = entry.oldData;
  if (!data) return false;
  const restorable = columns.filter((column) => column in data);

  if (entry.operation === "DELETE") {
    if (existing !== null) {
      if (force) throw new Error("Ten rekord już istnieje — nie trzeba go przywracać.");
      return false;
    }
    const placeholders = restorable.map((_, index) => `$${index + 1}`).join(", ");
    await db.execute(
      `INSERT INTO ${quote(entry.tableName)} (${restorable.map(quote).join(", ")}) VALUES (${placeholders})`,
      restorable.map((column) => data[column])
    );
    return true;
  }

  if (entry.operation === "UPDATE") {
    if (existing === null) {
      if (force) throw new Error("Rekord został później usunięty — najpierw przywróć go z kosza.");
      return false;
    }
    // W grupie cofamy tylko te zmiany, których nikt później nie nadpisał.
    if (!force && !sameRecord(existing, entry.newData, columns)) return false;
    const assignments = restorable.filter((column) => column !== primaryKey);
    if (assignments.length === 0) return false;
    await db.execute(
      `UPDATE ${quote(entry.tableName)} SET ${assignments.map((column, index) => `${quote(column)} = $${index + 1}`).join(", ")} WHERE CAST(${quote(primaryKey)} AS TEXT) = $${assignments.length + 1}`,
      [...assignments.map((column) => data[column]), entry.rowId]
    );
    return true;
  }

  throw new Error("Dodania rekordu nie cofa się z historii — usuń rekord w module.");
}

/**
 * Cofa wpis historii: przywraca usunięty rekord (razem z rekordami usuniętymi w tej samej operacji)
 * albo przywraca poprzednią wersję zmienionego rekordu. Zwraca liczbę odtworzonych wierszy.
 */
export async function restoreChange(db: ISqlDatabase, id: number): Promise<number> {
  const entry = await getEntry(db, id);
  if (entry.restoredAt) throw new Error("Ten wpis został już przywrócony.");
  const group = entry.operation === "DELETE" ? await getRestoreGroup(db, id) : [entry];
  const restoredAt = new Date().toISOString();
  let restored = 0;

  await db.execute("BEGIN IMMEDIATE;");
  try {
    // Kolejność relacji sprawdzamy dopiero przy COMMIT, bo kaskady zapisują dzieci i rodziców w dowolnej kolejności.
    await db.execute("PRAGMA defer_foreign_keys = ON;");
    for (const item of group) {
      const isSelected = item.id === entry.id;
      if (await undoEntry(db, item, isSelected)) restored += 1;
      await db.execute(`UPDATE ${LOG_TABLE} SET restored_at = $1 WHERE id = $2`, [restoredAt, item.id]);
    }
    await db.execute("COMMIT;");
  } catch (error) {
    await db.execute("ROLLBACK;").catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    if (/FOREIGN KEY/i.test(message)) {
      throw new Error("Nie można przywrócić: rekord wskazuje na usunięty rekord nadrzędny. Najpierw przywróć rekord nadrzędny.");
    }
    throw error instanceof Error ? error : new Error(message);
  }
  return restored;
}
