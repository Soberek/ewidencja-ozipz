# Handoff Report: Challenger M2-1 — Adversarial Empirical Verification of SQLite Repository Pattern

## 1. Observation

### Target Verification Scope
The mission was to adversarially challenge Worker M2's implementation of the SQLite repository pattern (R2), specifically verifying multi-table transactions (`saveActionWithRelations`, `batchUpsertFacilities`, `saveMonthlyTargets`), running tests with a real SQLite engine, and reporting an empirical verdict.

### Empirical Test Suite Execution
An adversarial test suite was authored and co-located at `src/db/sqlite-transactions.adversarial.test.ts` (533 lines) using Node.js built-in `node:sqlite` (`DatabaseSync(":memory:")`) with active `PRAGMA foreign_keys = ON;`.

Execution of `npx vitest run src/db/sqlite-transactions.adversarial.test.ts`:
```
 ✓ src/db/sqlite-transactions.adversarial.test.ts (9 tests) 547ms

 Test Files  1 passed (1)
      Tests  9 passed (9)
```

Execution of all database tests via `npx vitest run src/db`:
```
 ✓ src/db/sqlite-transactions.adversarial.test.ts (9 tests) 547ms
 ✓ src/db/mappers.test.ts (16 tests) 13ms
 ✓ src/db/sqlite-service.test.ts (5 tests) 5ms
 ✓ src/db/fallback-service.test.ts (10 tests) 15ms
 ✓ src/db/relational.test.ts (7 tests) 16ms
 ✓ src/db/fallback-adversarial.test.ts (18 tests) 42ms

 Test Files  6 passed (6)
      Tests  65 passed (65)
```

### Multi-Table Transaction Findings
1. **`saveActionWithRelations` (`src/db/repositories/sqlite/sqlite-actions.repository.ts:82-162`)**:
   - **Commit Atomicity**: Atomically creates Action, auto-creates JRWA Case with two-way binding (`action.jrwaCaseId = jrwaCase.id` and `jrwaCase.actionId = action.id`), transitions Schedule Event (`status = 'done'`, `actionId = action.id`), and inserts distributed materials with `actionId` and `actionTitle`.
   - **Failure Rollback**: In `sqlite-transactions.adversarial.test.ts` line 147, when distribution creation was forced to fail (`FATAL_DISTRIBUTION_ERROR`), the `catch` block on line 158 executed `ROLLBACK;`. Directly querying SQLite via `SELECT * FROM ozipz_jrwa_cases` and `SELECT * FROM ozipz_actions` confirmed **zero leaked records**, and the schedule event remained in `'zaplanowane'` status with `action_id = NULL`.
   - **Constraint Rollback**: In line 214, when JRWA Case triggered a UNIQUE constraint violation (`full_case_sign`), SQLite rolled back and zero orphan actions were created.

2. **`batchUpsertFacilities` (`src/db/repositories/sqlite/sqlite-facilities.repository.ts:41-56`)**:
   - **Atomic Upsert**: Inserts new facilities and updates existing facilities using `INSERT OR REPLACE INTO ozipz_facilities`.
   - **Failure Rollback**: In line 316, when the second facility in a batch failed with a simulated DB failure, the `catch` block on line 51 executed `ROLLBACK;`. Querying SQLite confirmed that none of the batch items (including the first facility) were committed.

3. **`saveMonthlyTargets` (`src/db/repositories/sqlite/sqlite-monthly-targets.repository.ts:20-53`)**:
   - **Atomic 12-Month Matrix**: Persists all 12 months in a single transaction using `INSERT INTO ozipz_monthly_targets (...) ON CONFLICT(year, month) DO UPDATE SET ...`.
   - **Idempotency**: Repeated execution with modified targets updates existing rows in place without creating duplicates (verified exactly 12 rows per year).
   - **Failure Rollback**: In line 454, when an error was injected at month 5, the transaction rolled back months 1..4 cleanly.

### Critical Empirical Finding: Seed Data Foreign Key Mismatch
- **File**: `src/db/sqlite-seed.ts` (lines 33-45) and `src/features/ozipz/data/firebase_migrated_data.json`
- **Error Observed**:
  ```
  Błąd seedowania bazy OZiPZ: Error: FOREIGN KEY constraint failed
      at Object.execute (sqlite-transactions.adversarial.test.ts:38:27)
      at seedInitialData (sqlite-seed.ts:34:18)
      at initTables (sqlite-schema.ts:142:3)
  {
    code: 'ERR_SQLITE_ERROR',
    errcode: 787,
    errstr: 'constraint failed'
  }
  ```
- **Cause**: In `src/db/sqlite-schema.ts` line 15, `ozipz_actions` declares `FOREIGN KEY (jrwa_case_id) REFERENCES ozipz_jrwa_cases(id) ON DELETE SET NULL`. In `firebase_migrated_data.json`, actions contain values like `"966.6"`, `"966.7"`, `"966.4"` for `jrwaCaseId` (classification symbols rather than UUID/row IDs of `ozipz_jrwa_cases`). When `seedInitialData` executes with `PRAGMA foreign_keys = ON;`, SQLite aborts the insert and `sqlite-seed.ts` executes `ROLLBACK;`, leaving the database empty if called on a fresh database.

---

## 2. Logic Chain

1. **Transaction Correctness**:
   - `saveActionWithRelations`, `batchUpsertFacilities`, and `saveMonthlyTargets` in `src/db/repositories/sqlite/` each wrap their operations in explicit `BEGIN TRANSACTION;` and `COMMIT;` blocks, guarded by `try...catch` that issues `ROLLBACK;` and rethrows errors.
   - Tested against genuine SQLite transactions in memory, all three operations demonstrated strict atomicity: all-or-nothing persistence, bidirectional foreign key links, and zero state corruption on failure.

2. **Interface Contract & Decomposition**:
   - `SqliteDatabaseService` delegates all 59 database methods to 10 domain repositories without altering the public contract of `IOzipzDatabaseService`.
   - Peer dependencies in `SqliteActionsRepository` are injected via constructor interfaces (`IJrwaRepository`, `IScheduleRepository`, `IMaterialsRepository`), adhering to DIP and ISP.

3. **Line Budget & Code Quality**:
   - Line counts for all 27 files in `src/db/` were measured via `wc -l`; all files range between 6 and 171 lines, strictly within the < 350-400 line budget (GEMINI.md Rule 2A).
   - `grep_search` across `src/db/` confirmed zero `any` types (GEMINI.md Rule 3).

4. **Seed Foreign Key Severity Assessment**:
   - The bug in `sqlite-seed.ts` affects bulk data seeding when `PRAGMA foreign_keys = ON;` is active, because legacy migrated JSON actions store symbols in `jrwaCaseId` instead of relational IDs.
   - This bug is an existing data-mapping discrepancy, not a structural defect in the repository pattern. The repository pattern itself and all transactional methods function with complete integrity.

---

## 3. Caveats

1. **In-Memory SQLite Environment**:
   - Tests were executed using Node.js built-in `node:sqlite` (`DatabaseSync(":memory:")`), which implements the standard SQLite C library engine. Multi-process disk lock contention under Tauri Desktop file I/O was not directly measured, though WAL mode pragmas are defined.
2. **Review-Only Constraint**:
   - In accordance with the Review-Only constraint, the `sqlite-seed.ts` foreign key mapping was not modified by this challenger. It is reported below as an actionable advisory for the orchestrator.

---

## 4. Conclusion

**Verdict: APPROVE** (Repository Pattern & Multi-Table Transactions Verified).

Worker M2's implementation of the Database Service Repository Pattern (R2) is **APPROVED**:
- `saveActionWithRelations` maintains 100% transactional atomicity and two-way relational integrity.
- `batchUpsertFacilities` provides atomic bulk upsert with guaranteed rollback on failure.
- `saveMonthlyTargets` provides atomic 12-month upsert with zero row duplication.
- All 27 repository files strictly comply with GEMINI.md line budgets (<175 lines) and type-safety rules (zero `any`).
- 65/65 unit and adversarial database tests pass.

### Advisory Finding for Orchestrator
- **Finding**: In `src/db/sqlite-seed.ts`, `seedInitialData` encounters `FOREIGN KEY constraint failed` when inserting migrated actions under `PRAGMA foreign_keys = ON;`.
- **Recommended Remediation**: In `src/db/sqlite-seed.ts` line 35, sanitize `a.jrwaCaseId` by checking if it exists in the seeded `ozipz_jrwa_cases` set, or set it to `null` during initial seed if it is a classification symbol rather than a case row ID, or temporarily defer foreign keys (`PRAGMA defer_foreign_keys = ON;` with valid references).

---

## 5. Verification Method

To independently verify this verdict:

1. **Run SQLite Transaction Adversarial Tests**:
   ```bash
   npx vitest run src/db/sqlite-transactions.adversarial.test.ts
   ```
   *Expected Output*: 9 passed tests across all 4 transaction test suites in ~500-800ms.

2. **Run Full Database Test Suite**:
   ```bash
   npx vitest run src/db
   ```
   *Expected Output*: 6 passed test files, 65 passed tests.

3. **Verify Line Budgets**:
   ```bash
   wc -l src/db/sqlite-service.ts src/db/fallback-service.ts src/db/sqlite-schema.ts src/db/sqlite-seed.ts src/db/repositories/interfaces.ts src/db/repositories/sqlite/*.ts src/db/repositories/fallback/*.ts
   ```
   *Expected Output*: All files strictly < 175 lines.
