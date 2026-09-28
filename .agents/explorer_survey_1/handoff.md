# Handoff Report: Store & Database Services Architecture Survey

## 1. Observation

### Current Baseline Metrics
Running `wc -l` on the target files produced the exact line counts:
- `src/features/ozipz/store/useOzipzDbStore.ts`: **955 lines** (Monolith: GEMINI.md Rule 2A violation, target <350-400 lines)
- `src/db/sqlite-service.ts`: **1184 lines** (Monolith: GEMINI.md Rule 2A violation, target <350-400 lines)
- `src/db/fallback-service.ts`: **582 lines** (Monolith: GEMINI.md Rule 2A violation, target <350-400 lines)
- `src/db/types.ts`: **451 lines**
- `src/db/client.ts`: **205 lines**
- `src/db/mappers.ts`: **415 lines**

### Baseline Test Suite & Compiler Verification
1. `npx vitest run src/db`:
   - 4 test files: `src/db/mappers.test.ts` (16 tests), `src/db/fallback-service.test.ts` (10 tests), `src/db/relational.test.ts` (7 tests), `src/db/sqlite-service.test.ts` (5 tests).
   - Result: **38 passed (38)** in 2.25s.
2. `npx vitest run src/features/ozipz/store`:
   - 3 test files: `src/features/ozipz/store/useUIStore.test.ts` (3 tests), `src/features/ozipz/store/useModalStore.test.ts` (3 tests), `src/features/ozipz/store/useOzipzDbStore.test.ts` (3 tests).
   - Result: **9 passed (9)** in 4.80s.
3. Full test suite `npm test` (`vitest run`):
   - **77 test files passed**, **599 tests passed (100% pass rate)** in 51.91s.
4. TypeScript strict compiler check `npm run typecheck` (`tsc --noEmit`):
   - Exited with **0 errors**.

### Anatomy of `src/features/ozipz/store/useOzipzDbStore.ts` (955 lines)
- **Lines 32–131 (100 lines)**: `OzipzDbState` interface definition. Contains 19 state fields and 42 CRUD/batch action function signatures.
- **Lines 133–220 (88 lines)**: Store initialization, default dataset loading (`MIGRATED_FIREBASE_DATA`), and `loadAll()` fetching 17 collections in parallel via `Promise.all([OzipzDbService.getActions(), ...])`.
- **Lines 222–295 (74 lines)**: Działania (Actions) operations: `addAction`, `updateAction`, `updateActionWithRelations` (handles material distribution linking), `deleteAction` (cascades unlinking of `distributions`, `scheduleEvents`, `jrwaCases`, `publications`), and `saveActionWithRelations` (complex multi-table atomic creation).
- **Lines 335–379 (45 lines)**: Programy & Zgłoszenia (Programs & Participations) operations: `addProgram`, `updateProgram`, `deleteProgram` (cascades unlinking to `actions`, `scheduleEvents`, `jrwaCases`, `letters`, `scans`, `registers`, and deletes `participations`), `addParticipation`, `updateParticipation`, `deleteParticipation`.
- **Lines 380–418 (39 lines)**: Materiały & Rozdzielniki (Materials & Distributions): `addMaterial`, `updateMaterial`, `deleteMaterial` (unlinks from `actions` and `distributions`), `addDistribution`, `updateDistribution`, `deleteDistribution`.
- **Lines 420–446 (27 lines)**: Harmonogram (Schedule): `addScheduleEvent`, `updateScheduleEvent`, `deleteScheduleEvent` (unlinks `scheduleEventId` from `actions`), `toggleScheduleStatus`.
- **Lines 447–466 (20 lines)**: JRWA: `addJrwaCase`, `updateJrwaCase`, `deleteJrwaCase` (unlinks `jrwaCaseId` from `actions`).
- **Lines 468–511 (44 lines)**: Placówki (Facilities): `addFacility`, `updateFacility`, `deleteFacility` (unlinks `facilityId` from `actions`, `distributions`, `scheduleEvents`, `jrwaCases`, `letters`, `scans`, `contacts`, `registers`, deletes `participations`, and unlinks `parentFacilityId`), `batchUpsertFacilities`, `getFacilityActivitySummary`.
- **Lines 513–534 (22 lines)**: Słowniki (Dictionaries): `addDictionaryItem`, `updateDictionaryItem`, `deleteDictionaryItem` (guards `isSystem`).
- **Lines 536–675 (140 lines)**: CRUD for Pisma (`letters`), Skany (`scans`), Publikacje (`publications`), Kadra (`staff`), Kontakty (`contacts`), Rejestry (`registers`, `saveRegisterMappings`), Szablony (`templates`).
- **Lines 676–685 (10 lines)**: `clearAndReseedDefaults()` and automatic window initialization `if (typeof window !== "undefined") { useOzipzDbStore.getState().loadAll(); }`.
- **Lines 687–956 (270 lines)**: 16 Granular Domain Hooks:
  - `useActions()`
  - `usePrograms()`
  - `useMaterials()`
  - `useSchedule()`
  - `useFacilities()`
  - `useJrwa()`
  - `useDictionaries()`
  - `useStaff()`
  - `useContacts()`
  - `useLetters()`
  - `useScans()`
  - `useRegisters()`
  - `useTemplates()`
  - `usePublications()`
  - `useRelationalSelectors()`
  - `useMonthlyTargets(year?: number)`

### Anatomy of `src/db/sqlite-service.ts` (1184 lines)
- **Lines 55–817 (763 lines)**: `SqliteDatabaseService` class implementing `IOzipzDatabaseService` (59 methods).
  - Actions & Relations (lines 58–226): `getActions`, `addAction`, `updateAction`, `deleteAction`, `saveActionWithRelations` (SQLite multi-statement transaction with `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`).
  - Programs & Participations (lines 228–283)
  - Materials & Distributions (lines 284–339)
  - Schedule (lines 340–420)
  - JRWA Cases (lines 421–447)
  - Publications (lines 449–475)
  - Facilities (lines 477–520): including `batchUpsertFacilities` transaction
  - Dictionaries (lines 521–548)
  - Letters (lines 549–575)
  - Scans (lines 577–594)
  - Templates (lines 595–622)
  - Staff (lines 623–650)
  - Contacts (lines 651–678)
  - Registers (lines 679–705)
  - Overview View Query (lines 707–734): queries `v_ozipz_facility_overview`
  - Monthly Targets (lines 735–788): transactional UPSERT across 12 months with `ON CONFLICT(year, month) DO UPDATE SET`
  - Database Reset (lines 790–816): `clearAndReseedDefaults`
- **Lines 819–1045 (227 lines)**: `initTables(db: ISqlDatabase)`: executes schema DDL (17 tables, 1 view, 22 indexes) and migration patches.
- **Lines 1047–1184 (138 lines)**: `seedInitialData(db: ISqlDatabase)`: seeds migrated data if tables are empty.

### Anatomy of `src/db/fallback-service.ts` (582 lines)
- **Lines 35–53 (19 lines)**: `loadFromStorage<T>`, `saveToStorage<T>`, and `generateId`.
- **Lines 55–582 (528 lines)**: `FallbackDatabaseService` class implementing `IOzipzDatabaseService` with in-memory / `localStorage` operations and explicit relational nullification cascading on entity deletions.

### Anatomy of `src/db/types.ts` (451 lines)
- Database row definitions: `ActionSqlRow`, `ProgramSqlRow`, `ParticipationSqlRow`, `MaterialSqlRow`, `DistributionSqlRow`, `ScheduleSqlRow`, `JrwaSqlRow`, `PublicationSqlRow`, `FacilitySqlRow`, `DictionarySqlRow`, `FacilityOverviewSqlRow`, `LetterSqlRow`, `ScanSqlRow`, `TemplateSqlRow`, `StaffSqlRow`, `ContactSqlRow`, `RegisterSqlRow`, `MonthlyTargetSqlRow`.
- Service interfaces: `ISqlQueryResult`, `ISqlDatabase`, `SaveActionWithRelationsParams`, `SaveActionWithRelationsResult`, and `IOzipzDatabaseService` (59 methods).

---

## 2. Logic Chain

### A. Zustand Store Slice Decomposition Rationale
1. **Observation**: `useOzipzDbStore.ts` violates the GEMINI.md 350-400 line rule (955 lines) because it combines state, 42 CRUD operations across 17 entities with cascading logic, and 16 React hooks in a single file.
2. **Constraint**: Existing consumers import either `useOzipzDbStore` or granular hooks like `useActions`, `useFacilities`, `usePrograms`, etc. directly from `src/features/ozipz/store/useOzipzDbStore`. Breaking these imports would require touching 38+ consumer files across the application.
3. **Zustand Slice Pattern**: In Zustand, a slice creator `StateCreator<OzipzDbState, [], [], SliceInterface>` has access to `set` and `get` typed against the unified `OzipzDbState`. This enables cross-entity cascade logic (such as unlinking foreign keys in `deleteAction` or atomic creation in `saveActionWithRelations`) to remain expressive and type-safe without circular dependencies.
4. **Decomposition Blueprint**:
   Create directory: `src/features/ozipz/store/slices/`:
   - `src/features/ozipz/store/slices/types.ts` (~80 lines): slice creator type helper and slice interfaces.
   - `src/features/ozipz/store/slices/actions.slice.ts` (~95 lines): `actions: OzipzAction[]`, `addAction`, `updateAction`, `updateActionWithRelations`, `deleteAction`, `saveActionWithRelations`.
   - `src/features/ozipz/store/slices/programs.slice.ts` (~75 lines): `programs`, `participations`, `addProgram`, `updateProgram`, `deleteProgram`, `addParticipation`, `updateParticipation`, `deleteParticipation`.
   - `src/features/ozipz/store/slices/facilities.slice.ts` (~70 lines): `facilities`, `addFacility`, `updateFacility`, `deleteFacility`, `batchUpsertFacilities`, `getFacilityActivitySummary`.
   - `src/features/ozipz/store/slices/schedule.slice.ts` (~50 lines): `scheduleEvents`, `addScheduleEvent`, `updateScheduleEvent`, `deleteScheduleEvent`, `toggleScheduleStatus`.
   - `src/features/ozipz/store/slices/materials.slice.ts` (~65 lines): `materials`, `distributions`, `addMaterial`, `updateMaterial`, `deleteMaterial`, `addDistribution`, `updateDistribution`, `deleteDistribution`.
   - `src/features/ozipz/store/slices/jrwa.slice.ts` (~45 lines): `jrwaCases`, `addJrwaCase`, `updateJrwaCase`, `deleteJrwaCase`.
   - `src/features/ozipz/store/slices/dictionaries.slice.ts` (~60 lines): `dictionaryItems`, `addDictionaryItem`, `updateDictionaryItem`, `deleteDictionaryItem`, `saveRegisterMappings`.
   - `src/features/ozipz/store/slices/letters.slice.ts` (~40 lines): `letters`, `addLetter`, `updateLetter`, `deleteLetter`.
   - `src/features/ozipz/store/slices/scans.slice.ts` (~30 lines): `scans`, `addScan`, `deleteScan`.
   - `src/features/ozipz/store/slices/staff.slice.ts` (~40 lines): `staff`, `addStaff`, `updateStaff`, `deleteStaff`.
   - `src/features/ozipz/store/slices/contacts.slice.ts` (~40 lines): `contacts`, `addContact`, `updateContact`, `deleteContact`.
   - `src/features/ozipz/store/slices/registers.slice.ts` (~40 lines): `registers`, `addRegister`, `updateRegister`, `deleteRegister`.
   - `src/features/ozipz/store/slices/templates.slice.ts` (~40 lines): `templates`, `addTemplate`, `updateTemplate`, `deleteTemplate`.
   - `src/features/ozipz/store/slices/publications.slice.ts` (~40 lines): `publications`, `addPublication`, `updatePublication`, `deletePublication`.
   - `src/features/ozipz/store/slices/core.slice.ts` (~90 lines): `monthlyTargets`, `isLoading`, `isInitialized`, `loadAll`, `saveMonthlyTargets`, `clearAndReseedDefaults`.
   - `src/features/ozipz/store/domainHooks.ts` (~260 lines): all 16 granular domain hooks (`useActions`, `usePrograms`, `useMaterials`, `useSchedule`, etc.).
   - `src/features/ozipz/store/useOzipzDbStore.ts` (~100 lines): merges all slices into `create<OzipzDbState>()`, executes window auto-load, and re-exports `OzipzDbState` and all domain hooks from `domainHooks.ts`.

### B. Database Service Repository Pattern Rationale
1. **Observation**: `sqlite-service.ts` is 1184 lines and `fallback-service.ts` is 582 lines. Both files contain SQL queries or localStorage operations for 17 different database entities plus complex transactions, schema DDL, and data seeding.
2. **Interface Segregation**: `IOzipzDatabaseService` contains 59 methods. We can decompose this into cohesive domain repository interfaces in `src/db/repositories/interfaces.ts`:
   - `IActionsRepository` (5 methods)
   - `IProgramsRepository` (8 methods)
   - `IMaterialsRepository` (8 methods)
   - `IScheduleRepository` (4 methods)
   - `IJrwaRepository` (4 methods)
   - `IFacilitiesRepository` (6 methods)
   - `IDictionariesRepository` (4 methods)
   - `IStaffContactsRepository` (8 methods)
   - `IRegistryRepository` (12 methods: letters, scans, publications, registers, templates)
   - `IMonthlyTargetsRepository` (2 methods)
   - `IOzipzDatabaseService` simply extends all 10 domain interfaces plus `clearAndReseedDefaults()`.
3. **Decomposition of SQLite Service**:
   - `src/db/sqlite-schema.ts` (~230 lines): extracted `initTables` function.
   - `src/db/sqlite-seed.ts` (~140 lines): extracted `seedInitialData` function.
   - Domain repositories under `src/db/repositories/sqlite/`:
     - `sqlite-actions.repository.ts` (~160 lines): actions queries + `saveActionWithRelations` transaction
     - `sqlite-programs.repository.ts` (~95 lines): programs & participations queries
     - `sqlite-materials.repository.ts` (~95 lines): materials & distributions queries
     - `sqlite-schedule.repository.ts` (~75 lines): schedule events
     - `sqlite-jrwa.repository.ts` (~65 lines): jrwa cases
     - `sqlite-facilities.repository.ts` (~100 lines): facilities queries, `batchUpsertFacilities`, and `getFacilityActivitySummary` (via `v_ozipz_facility_overview`)
     - `sqlite-dictionaries.repository.ts` (~60 lines): dictionary items
     - `sqlite-staff-contacts.repository.ts` (~110 lines): staff & contacts
     - `sqlite-registry.repository.ts` (~180 lines): letters, scans, publications, registers, templates
     - `sqlite-monthly-targets.repository.ts` (~75 lines): monthly targets queries & UPSERT transaction
   - `src/db/sqlite-service.ts` (~150 lines): `SqliteDatabaseService` instantiates domain repositories and delegates all calls to them. Re-exports `initTables` and `seedInitialData` for 100% backward compatibility with `src/db/client.ts`.
4. **Decomposition of Fallback Service**:
   - `src/db/repositories/fallback/storage.ts` (~35 lines): `loadFromStorage`, `saveToStorage`, `generateId`.
   - Domain repositories under `src/db/repositories/fallback/`:
     - `fallback-actions.repository.ts` (~110 lines)
     - `fallback-programs.repository.ts` (~80 lines)
     - `fallback-materials.repository.ts` (~70 lines)
     - `fallback-schedule.repository.ts` (~50 lines)
     - `fallback-jrwa.repository.ts` (~50 lines)
     - `fallback-facilities.repository.ts` (~80 lines)
     - `fallback-dictionaries.repository.ts` (~60 lines)
     - `fallback-staff-contacts.repository.ts` (~70 lines)
     - `fallback-registry.repository.ts` (~120 lines)
     - `fallback-monthly-targets.repository.ts` (~50 lines)
   - `src/db/fallback-service.ts` (~150 lines): `FallbackDatabaseService` instantiates fallback repositories and delegates all calls.
5. **Outcome**: All resulting files are strictly between 30 and 230 lines, well below the 350-400 line threshold. Zero changes needed to `src/db/client.ts` or any consumers.

---

## 3. Caveats

1. **Transaction Boundaries**: In `SqliteDatabaseService`, `saveActionWithRelations` requires cross-entity actions, JRWA, and distributions inside a single SQLite transaction (`BEGIN TRANSACTION ... COMMIT`). The `SqliteActionsRepository` must have access to execute transactional queries and invoke helpers or shared DB instance.
2. **Circular Types in Zustand Slices**: All slices must import `OzipzDbState` from a shared `types.ts` to prevent circular imports between slices and the main store.
3. **No Code Written Yet**: As an explorer in a read-only investigation turn, no source files under `src/` were modified. Only `.agents/explorer_survey_1/` artifacts were written.

---

## 4. Conclusion

1. **Feasibility**: The decomposition of `useOzipzDbStore.ts` into 15 domain slices + 1 domain hooks file, and the decomposition of `sqlite-service.ts` / `fallback-service.ts` into 10 domain repositories + schema/seed modules is fully feasible, clean, and 100% backward-compatible.
2. **Compliance**:
   - Every decomposed file will be under 230 lines, fully satisfying GEMINI.md Rule 2A (<350-400 lines).
   - Zero `any` types will be introduced.
   - All 59 methods of `IOzipzDatabaseService` remain identical in signature.
   - All 16 domain hooks exported from `useOzipzDbStore.ts` retain identical signatures and return values.
3. **Baseline Confidence**: Baseline test verification confirms 599 passing tests and zero TypeScript errors.

---

## 5. Verification Method

To independently verify the survey findings and ensure zero regressions during future implementation:

1. **Verify database unit tests**:
   ```bash
   npx vitest run src/db
   ```
   Expect: 4 test files, 38 passing tests.

2. **Verify store and hook unit tests**:
   ```bash
   npx vitest run src/features/ozipz/store
   ```
   Expect: 3 test files, 9 passing tests.

3. **Verify TypeScript compilation**:
   ```bash
   npm run typecheck
   ```
   Expect: 0 errors.

4. **Verify full test suite**:
   ```bash
   npm test
   ```
   Expect: 77 test files, 599 passing tests.

5. **Verify file line counts**:
   ```bash
   wc -l src/features/ozipz/store/useOzipzDbStore.ts src/db/sqlite-service.ts src/db/fallback-service.ts
   ```
