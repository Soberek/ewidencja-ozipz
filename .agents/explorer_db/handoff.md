# R2 Deep Audit: Database, Schema, Mappers, and State Management

## 1. Observation

### 1.1 SQLite Schema vs DATABASE_SCHEMA.md (Rule 6)
- **Table Count**:
  - `DATABASE_SCHEMA.md` Section 3 title states `Specyfikacja Tabel SQLite (17 Tabel Relacyjnych)` (updated on 2026-09-09 to include `ozipz_monthly_targets`).
  - `GEMINI.md` Rule 6.5 states `Kompletna specyfikacja 16 tabel SQLite... znajduje się w pliku DATABASE_SCHEMA.md`.
  - In `src/db/sqlite-migrations.ts` (lines 6–22) and `src/db/sqlite-service.ts` (lines 137–141), exactly **17 tables** are defined and managed: `ozipz_facilities`, `ozipz_programs`, `ozipz_actions`, `ozipz_participations`, `ozipz_materials`, `ozipz_distributions`, `ozipz_schedule`, `ozipz_jrwa_cases`, `ozipz_publications`, `ozipz_dictionaries`, `ozipz_letters`, `ozipz_scans`, `ozipz_templates`, `ozipz_staff`, `ozipz_contacts`, `ozipz_registers`, `ozipz_monthly_targets`.
- **Table Column Discrepancies**:
  - `ozipz_schedule` (`src/db/sqlite-migrations.ts:12` vs `DATABASE_SCHEMA.md:231-247`):
    - `DATABASE_SCHEMA.md` Table 7 only specifies 13 columns: `id`, `title`, `event_date`, `end_date`, `category`, `location`, `facility_id`, `action_id`, `status`, `responsible_person`, `notes`, `created_at`, `updated_at`.
    - Executable `SCHEMA_SQL` in `src/db/sqlite-migrations.ts:12` contains **30 columns**, adding 17 columns: `activity_type_code`, `activity_type_name`, `topic`, `program_id`, `program_name`, `campaign_id`, `campaign_name`, `recipient_group`, `annotation_reason_code`, `annotation_reason_label`, `month`, `month_name`, `year`, `planned_count`, `completed_count`, `manually_completed`, `jrwa`.
    - Furthermore, `SCHEMA_SQL:12` specifies `FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL`, which is missing from Table 7 in `DATABASE_SCHEMA.md`.
  - `ozipz_facilities` (`src/db/sqlite-migrations.ts:6` vs `DATABASE_SCHEMA.md:94-114`):
    - `SCHEMA_SQL` defines `education_types TEXT`, mapped to `educationTypes: string[]` in `src/db/types.ts:209` and parsed as JSON/CSV in `src/db/mappers.ts:241-251`.
    - `DATABASE_SCHEMA.md` Table 1 omits `education_types` completely.
  - `ozipz_dictionaries` (`src/db/sqlite-migrations.ts:15` vs `DATABASE_SCHEMA.md:279-291`):
    - `SCHEMA_SQL` contains `postal_code TEXT`.
    - `DATABASE_SCHEMA.md` Table 9 omits `postal_code`.
  - `ozipz_contacts` (`src/db/sqlite-migrations.ts:20` vs `DATABASE_SCHEMA.md:309-322`):
    - `SCHEMA_SQL` contains `municipality TEXT`.
    - `DATABASE_SCHEMA.md` Table 11 omits `municipality`.
  - `ozipz_templates` (`src/db/sqlite-migrations.ts:18` vs `DATABASE_SCHEMA.md:389-400`):
    - `SCHEMA_SQL` contains `action_defaults TEXT` (stores JSON for title/leadEducator/campaignId).
    - `DATABASE_SCHEMA.md` Table 15 omits `action_defaults`.
  - `ozipz_scans` (`src/db/sqlite-migrations.ts:17` vs `DATABASE_SCHEMA.md:370-386`):
    - `SCHEMA_SQL` contains `updated_at TEXT`.
    - `DATABASE_SCHEMA.md` Table 14 states `(rekord append-only)` and omits `updated_at`.
- **Foreign Keys and Cascading Rules**:
  - `DATABASE_SCHEMA.md:9` notes: `Obowiązuje 25 kluczy obcych. Udział placówki jest unikalny dla (program_id, facility_id, school_year). Placówki ani programu z udziałami nie można usunąć (RESTRICT)...`
  - In `src/db/sqlite-migrations.ts`, exactly 25 foreign keys exist across the 17 tables:
    1. `ozipz_facilities(parent_facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    2. `ozipz_participations(program_id)` -> `ozipz_programs(id) ON DELETE RESTRICT`
    3. `ozipz_participations(facility_id)` -> `ozipz_facilities(id) ON DELETE RESTRICT`
    4. `ozipz_actions(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    5. `ozipz_actions(program_id)` -> `ozipz_programs(id) ON DELETE SET NULL`
    6. `ozipz_actions(material_id)` -> `ozipz_materials(id) ON DELETE SET NULL`
    7. `ozipz_actions(schedule_event_id)` -> `ozipz_schedule(id) ON DELETE SET NULL`
    8. `ozipz_actions(jrwa_case_id)` -> `ozipz_jrwa_cases(id) ON DELETE SET NULL`
    9. `ozipz_distributions(material_id)` -> `ozipz_materials(id) ON DELETE SET NULL`
    10. `ozipz_distributions(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    11. `ozipz_distributions(action_id)` -> `ozipz_actions(id) ON DELETE SET NULL`
    12. `ozipz_schedule(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    13. `ozipz_schedule(program_id)` -> `ozipz_programs(id) ON DELETE SET NULL`
    14. `ozipz_schedule(action_id)` -> `ozipz_actions(id) ON DELETE SET NULL`
    15. `ozipz_jrwa_cases(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    16. `ozipz_jrwa_cases(program_id)` -> `ozipz_programs(id) ON DELETE SET NULL`
    17. `ozipz_jrwa_cases(action_id)` -> `ozipz_actions(id) ON DELETE SET NULL`
    18. `ozipz_letters(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    19. `ozipz_letters(program_id)` -> `ozipz_programs(id) ON DELETE SET NULL`
    20. `ozipz_scans(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    21. `ozipz_scans(program_id)` -> `ozipz_programs(id) ON DELETE SET NULL`
    22. `ozipz_contacts(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    23. `ozipz_registers(facility_id)` -> `ozipz_facilities(id) ON DELETE SET NULL`
    24. `ozipz_registers(program_id)` -> `ozipz_programs(id) ON DELETE SET NULL`
    25. `ozipz_publications(action_id)` -> `ozipz_actions(id) ON DELETE SET NULL`
  - In contrast, `GEMINI.md` Rule 6.3 states: `FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE CASCADE dla relacji podrzędnych`. However, `sqlite-migrations.ts` uses `RESTRICT` for participations and `SET NULL` for actions/schedules/jrwa/letters/scans/registers to avoid accidental deletion of historical records.
- **Indexes**:
  - In `src/db/sqlite-migrations.ts:24-62`, every single one of the 25 foreign key columns has an index (`idx_*`). In addition, indexes are placed on frequently queried filter fields (`date`, `municipality`, `status`, `type`, `dict_type, code`, `year`).
  - View `v_ozipz_facility_overview` is defined in `src/db/sqlite-migrations.ts:23`.
- **PRAGMAs**:
  - `PRAGMA foreign_keys = ON;` is enforced in `src/db/sqlite-schema.ts:8`, `src/db/sqlite-migrations.ts:134,141`, `src/db/client.ts:99`, and `src/db/vite-sqlite-plugin.ts:41`.
  - `PRAGMA journal_mode = WAL;` is enforced across Tauri, dev server, and migration runners.

---

### 1.2 Dual-Mode Database Architecture (SQLite vs Fallback)
- **Interface Contract**: Both `SqliteDatabaseService` (`src/db/sqlite-service.ts:24`) and `FallbackDatabaseService` (`src/db/fallback-service.ts:21`) implement `IOzipzDatabaseService` (`src/db/types.ts:370-462`).
- **Liskov Substitution Principle (LSP) Asymmetry**:
  - `FallbackDatabaseService` declares:
    `toggleScheduleStatus(id: string, currentStatus: string): Promise<void>` (`src/db/fallback-service.ts:82`).
  - Neither `IOzipzDatabaseService` nor `SqliteDatabaseService` defines `toggleScheduleStatus`.
  - `src/db/repositories/interfaces.ts:64` marks it optional: `toggleScheduleStatus?(id: string, currentStatus: string): Promise<void>`.
  - In `src/features/ozipz/store/slices/schedule.slice.ts:32-36`, `toggleScheduleStatus` calls `get().updateScheduleEvent(id, { status: nextStatus })`, making `FallbackDatabaseService.toggleScheduleStatus` dead code on the service.
- **Concurrency & Serialization**:
  - `src/db/client.ts:107` and `src/db/client.ts:129` wrap SQLite service instances with `serializeDatabaseService` to serialize async execution queues.
  - `src/db/client.ts:147` instantiates `FallbackDatabaseService` directly (`activeService = new FallbackDatabaseService();`), **without `serializeDatabaseService`**.
  - In `FallbackDatabaseService`, asynchronous repository methods perform:
    `const list = await this.getFacilities();` ... `saveToStorage("facilities", updatedList);`.
    Under concurrent calls in browser mode, interleaved read-modify-write cycles cause race conditions and lost updates.
- **Constraint Enforcement Discrepancies**:
  - `FallbackProgramsRepository` (`src/db/repositories/fallback/fallback-programs.repository.ts:86-90`) enforces `assertUniqueParticipation` for `(programId, facilityId, schoolYear)`.
  - `FallbackJrwaRepository` (`src/db/repositories/fallback/fallback-jrwa.repository.ts:12-18`) does **NOT** enforce `UNIQUE(full_case_sign)` or `UNIQUE(section, jrwa_symbol, case_number, year)`.
  - `FallbackDictionariesRepository` (`src/db/repositories/fallback/fallback-dictionaries.repository.ts:32-38`) does **NOT** enforce `UNIQUE(dict_type, code)`.
  - In SQLite mode, violations trigger `SQLITE_CONSTRAINT_UNIQUE`; in Fallback mode, duplicate rows are silently saved.
- **Reseed Behavior**:
  - In `SqliteDatabaseService:136-153`, `clearAndReseedDefaults()` performs a transaction deleting all 17 tables and runs `await seedInitialData(this.db)`.
  - In `FallbackDatabaseService:134-138`, `clearAndReseedDefaults()` deletes all `ozipz_*` localStorage keys, relying on lazy loading on subsequent reads.

---

### 1.3 Mappers Integrity & Data Conversions
- **SafeParse vs Parse Inconsistency**:
  - `Mappers.toAction` (`src/db/mappers.ts:71-76`):
    ```typescript
    const result = ActionSchema.safeParse(raw);
    if (!result.success) {
      console.warn(`[Mappers.toAction] Ostrzeżenie walidacji wiersza akcji ${row.id}:`, result.error.format());
      return raw as OzipzAction;
    }
    return result.data;
    ```
    `toAction` guards against corrupted legacy rows by using `safeParse`.
  - Every other mapper (`toProgram`, `toParticipation`, `toMaterial`, `toDistribution`, `toSchedule`, `toJrwa`, `toPublication`, `toFacility`, `toDictionary`, `SecondaryMappers.toLetter`, `toScan`, `toTemplate`, `toStaff`, `toContact`, `toRegister`, `toMonthlyTarget`) calls `.parse(raw)` directly (`src/db/mappers.ts:94, 118, 133, 155, 191, 219, 237, 273, 288` and `src/db/secondary-mappers.ts:45, 64, 88, 103, 120, 145, 161`). A single unvalidated or unexpected DB value crashes the entire query with an uncaught `ZodError`.
- **Boolean Handling**:
  - SQLite represents booleans as `INTEGER (0/1)`.
  - Mappers convert `Boolean(row.has_declaration)`, `Boolean(row.is_complex)`, `Boolean(row.is_system)`, `Boolean(row.active)`, `Boolean(row.manually_completed)`.
  - SQLite schema CHECK constraints (`CHECK (is_complex IS NULL OR is_complex IN (0, 1))`) guarantee validity.
- **Complex Field Conversions**:
  - `education_types` in `toFacility` (`src/db/mappers.ts:241-251`): robustly parses JSON array, falling back to comma-separated string if JSON parsing fails.
  - `action_defaults` in `toTemplate` (`src/db/secondary-mappers.ts:76-84`): safely parses JSON object or returns `undefined`.
- **Null & Default Coercions in `Mappers.toAction`**:
  - `row.indirect_recipients_count` (`NULL` in DB) is coerced to `0` (`src/db/mappers.ts:64`).
  - `row.materials_distributed_count` (`NULL` in DB) is coerced to `0` (`src/db/mappers.ts:65`).
  - `row.ezd_status` (`NULL` in DB) is coerced to `"w_ezd"` (`src/db/mappers.ts:57`). Note that `DATABASE_SCHEMA.md` Table 3 defines canonical EZD values as `brak_ezd`, `zarejestrowane`, `zakonczone`. Coercing to `"w_ezd"` introduces an unstandardized value.
  - `row.status` (`NULL` in DB) is coerced to `"wykonane"` (`src/db/mappers.ts:58`).
- **Domain Model -> SQL Row Mapping**:
  - Repositories manually unpack properties into SQL parameter arrays (`$1, $2...`) rather than utilizing centralized `fromAction`, `fromFacility`, etc. functions in `mappers.ts`.

---

### 1.4 "Zero Default Values" Audit (Rule 7)
- **Form Default Values Violation**:
  - In `src/features/ozipz/components/actions/editor/editorUtils.ts:30`:
    ```typescript
    export function getDefaultActionFormValues(
      _activityTypeDict: OzipzDictionaryItem[] = [],
      staff: OzipzStaff[] = []
    ): ActionFormInput {
      return {
        ...
        leadEducator: staff[0]?.fullName || "", // VIOLATION of GEMINI.md Rule 7.1
        ...
      };
    }
    ```
    When creating a new educational action, `leadEducator` is automatically pre-filled with the first staff member from the database (`staff[0]?.fullName`), rather than requiring the user to explicitly select an educator from `-- Wybierz osobę prowadzącą --`.
  - In `src/features/ozipz/components/facilities/FacilityDialog.tsx:92`:
    `county: "powiat myśliborski"` is hardcoded as default value.
- **Select Placeholders**:
  - Forms across the application consistently implement explicit empty placeholders:
    - Facility type: `placeholder="-- Wybierz typ placówki ze słownika --"` (`FacilityAddressFields.tsx:54`)
    - Municipality: `placeholder="-- Wybierz gminę --"` (`FacilityAddressFields.tsx:69`)
    - Material type: `placeholder="-- Wybierz typ materiału --"` (`MaterialDialog.tsx:208`)
    - Program: `placeholder="-- Wybierz program profilaktyczny --"` (`ParticipationProgramFacilityFields.tsx:88`)
    - Document type: `placeholder="-- Wybierz typ dokumentu --"` (`ScanDialog.tsx:225`)
    - Register category: `placeholder="-- Wybierz kategorię rejestru --"` (`RegisterFormFields.tsx:62`)
- **Schema Validation Laxity (`ozipz.schemas.ts`)**:
  - Several fields marked `NOT NULL` in `DATABASE_SCHEMA.md` have lax Zod schemas with `.optional().default("")` instead of `.min(1, "Wybór jest wymagany")`:
    - `ActionSchema.topic`: `z.string().optional().default("")` (`ozipz.schemas.ts:46`)
    - `ProgramSchema.targetAudience`: `z.string().optional().default("")` (`ozipz.schemas.ts:75`)
    - `ProgramSchema.description`: `z.string().optional().default("")` (`ozipz.schemas.ts:76`)
    - `MaterialSchema.publisher`: `z.string().optional().default("")` (`ozipz.schemas.ts:112`)
    - `DistributionSchema.assignedEducator`: `z.string().optional().default("")` (`ozipz.schemas.ts:132`)
    - `DistributionSchema.purpose`: `z.string().optional().default("")` (`ozipz.schemas.ts:133`)
    - `ScheduleEventSchema.location`: `z.string().optional().default("")` (`ozipz.schemas.ts:154`)
    - `ScheduleEventSchema.responsiblePerson`: `z.string().optional().default("")` (`ozipz.schemas.ts:160`)
    - `StaffSchema.role`: `z.string().optional().default("")` (`ozipz.schemas.ts:288`)
    - `ContactSchema.position`: `z.string().optional().default("")` (`ozipz.schemas.ts:238`)
- **Hardcoded Domain Values Violation (Rule 6.1)**:
  - `REGISTER_TYPE_OPTIONS` is hardcoded as a static array in `src/features/ozipz/components/registers/registerTypes.ts:4-11` instead of dynamically querying `ozipz_dictionaries`.
- **TypeScript `any` Violations (Rule 3)**:
  - `src/features/ozipz/components/staff/StaffDialog.tsx:55`:
    `useForm<StaffFormInput, any, StaffFormOutput>`
  - `src/features/ozipz/components/dictionaries/DictionaryDialog.tsx:50`:
    `useForm<DictionaryFormInput, any, DictionaryFormOutput>`

---

### 1.5 State Management & Zustand Hygiene (Rule 2B)
- **Whole-Store Subscription Anti-Pattern**:
  - In `src/features/ozipz/hooks/useOzipzDb.ts:7-8`:
    ```typescript
    export function useOzipzDb() {
      const store = useOzipzDbStore();
    ```
    Calling `useOzipzDbStore()` without a selector causes any consuming component to subscribe to the entire Zustand state object.
  - Consumers including `ActionsSection.tsx:58`, `RegistersSection.tsx`, `DashboardCurrentMonthPlanCard.tsx`, and `OzipzModalRoot.tsx` re-render whenever ANY part of the store updates (e.g. creating a scan re-renders `ActionsSection`).
- **Unmemoized Allocations in `domainHooks.ts`**:
  - In `src/features/ozipz/store/domainHooks.ts:125-154` (`useDictionaries`):
    The hook executes `dictionaryItems.filter(...)` for 10 distinct categories on every render without `useMemo`. Every call creates 10 new array references, breaking child component memoization (`React.memo`).
- **Dead Dictionary Selector**:
  - `src/features/ozipz/hooks/useOzipzDb.ts:69-72` retains a memoized selector filtering for `dictType === "topic" || dictType === "tematyki"`, despite `topic` having been deprecated and removed in database migration 1.
- **Slice Immutability & Pessimistic Updates**:
  - All slices (`actions.slice.ts`, `facilities.slice.ts`, `programs.slice.ts`, etc.) maintain strict immutability.
  - Database calls are awaited before calling `set()`, guaranteeing that failed database transactions do not leave stale optimistic updates in memory.
  - Slices `facilities.slice.ts:20-27` and `programs.slice.ts:21-28` proactively propagate facility/program name updates to all 7 referencing stores via `resolveReferenceNames`.

---

## 2. Logic Chain

1. **Schema Integrity**:
   - Because `DATABASE_SCHEMA.md` was not kept in sync with schema improvements in `src/db/sqlite-migrations.ts`, developers and operators reading `DATABASE_SCHEMA.md` Table 7 (`ozipz_schedule`) would conclude the table has only 13 columns, whereas SQLite requires 30 columns to support monthly targets, campaigns, activity type codes, and annotations.
   - Because all 25 foreign key columns have corresponding indexes (`idx_*`) in `sqlite-migrations.ts`, SQLite queries joining on foreign keys avoid full table scans.
2. **Dual-Mode Substitution**:
   - Because `FallbackDatabaseService` exposes `toggleScheduleStatus` while `SqliteDatabaseService` does not, substituting one for the other directly violates LSP, though the store slice abstracts this by calling `updateScheduleEvent`.
   - Because `FallbackDatabaseService` is not wrapped with `serializeDatabaseService`, concurrent operations execute asynchronously in browser environments, leading to lost updates when `loadFromStorage` and `saveToStorage` race.
   - Because `FallbackJrwaRepository` and `FallbackDictionariesRepository` omit unique constraint validation, data created in browser storage can become corrupted with duplicate identifiers that will fail migration when imported into native SQLite.
3. **Mappers & Type Safety**:
   - Because `toAction` uses `safeParse` but all other mappers use `.parse()`, any malformed row in `ozipz_programs`, `ozipz_facilities`, or `ozipz_schedule` causes a hard crash of the entire data view instead of a graceful warning.
   - Because `Mappers.toAction` defaults missing `ezd_status` to `"w_ezd"`, actions created without EZD status receive a value outside the three canonical statuses specified in `DATABASE_SCHEMA.md` (`brak_ezd`, `zarejestrowane`, `zakonczone`).
4. **Zero Default Values**:
   - Because `getDefaultActionFormValues` sets `leadEducator: staff[0]?.fullName || ""`, the system violates Rule 7.1 by automatically attributing actions to the first alphabetical employee unless manually changed by the user.
   - Because `ozipz.schemas.ts` allows empty strings via `.optional().default("")` on fields that are `NOT NULL` in SQLite, form validation permits submitting empty strings which satisfy the DB constraint syntactically but violate domain validation.
   - Because `useForm<..., any, ...>` is used in `StaffDialog.tsx` and `DictionaryDialog.tsx`, compile-time type safety is bypassed in those components.
5. **State Management**:
   - Because `useOzipzDb()` subscribes to the entire store without selector filtering, high-frequency updates or actions modifications cause cascade re-renders in unrelated components (`RegistersSection`, `DashboardCurrentMonthPlanCard`).
   - Because `useDictionaries()` creates fresh array references on every execution, components relying on reference equality re-render unnecessarily.

---

## 3. Caveats
- No direct database writes were performed during this audit (pure read-only investigation).
- Production SQLite databases migrated from older versions were not inspected; validation is based on `src/db/sqlite-migrations.ts` (`SCHEMA_VERSION = 1`).
- The browser storage fallback was evaluated via code inspection and `src/db/fallback-adversarial.test.ts`, rather than live manual user browser testing.

---

## 4. Conclusion

The SQLite database layer is robust, featuring 25 fully indexed foreign keys, atomic WAL configuration, PRAGMA foreign key enforcement, and automated name synchronization triggers. However, the audit revealed **6 critical architectural issues** requiring remediation:

1. **Documentation Desynchronization (High)**: `DATABASE_SCHEMA.md` is out of date: Table 7 (`ozipz_schedule`) is missing 17 columns and 1 foreign key; Tables 1, 9, 11, 14, 15 omit columns present in SQLite.
2. **Zero Default Values Violation (High)**: `editorUtils.ts:30` pre-fills `leadEducator` with `staff[0]?.fullName`, violating GEMINI.md Rule 7.1.
3. **State Subscription Granularity & Perf Bottleneck (High)**: `useOzipzDb()` subscribes to the entire store without selectors, causing cascade re-renders across views; `useDictionaries()` allocates 10 unmemoized arrays on every render.
4. **Mapper Error Boundary Inconsistency (Medium)**: Only `toAction` uses `safeParse`; all other 16 entity mappers use `.parse()`, risking unhandled application crashes on malformed rows.
5. **Fallback Service Gaps (Medium)**: `FallbackDatabaseService` lacks `serializeDatabaseService` queueing, lacks uniqueness assertions on JRWA and dictionaries, and has an asymmetrical method `toggleScheduleStatus`.
6. **Strict Typing Violations (Low)**: Explicit `any` in `StaffDialog.tsx:55` and `DictionaryDialog.tsx:50`; static `REGISTER_TYPE_OPTIONS` array in `registerTypes.ts` instead of dynamic dictionaries.

---

## 5. Verification Method

### 5.1 Automated Test Execution & Build Verification
Executed on 2026-09-11:
1. `npm test -- --run`
   - **Result**: 109 test files passed, 862 tests passed, 0 failed (Duration: 45.09s).
2. `npm run build` (`tsc && vite build`)
   - **Result**: Success, 0 TypeScript compile errors, 3020 modules transformed, production build generated in 4.77s.

### 5.2 Targeted Inspections & Proof Matrix
1. Inspect `src/features/ozipz/components/actions/editor/editorUtils.ts:30` to verify `leadEducator: staff[0]?.fullName || ""`.
2. Inspect `src/db/sqlite-migrations.ts:12` vs `DATABASE_SCHEMA.md:231-247` to confirm the 17 missing columns in `ozipz_schedule`.
3. Inspect `src/features/ozipz/hooks/useOzipzDb.ts:7-8` to confirm selectorless `useOzipzDbStore()` call.
4. Inspect `src/features/ozipz/store/domainHooks.ts:125-154` to confirm unmemoized `dictionaryItems.filter(...)` calls.
5. Inspect `src/db/client.ts:147` vs `src/db/client.ts:107` to confirm absence of `serializeDatabaseService` wrapping on fallback service.
6. Inspect `src/features/ozipz/components/staff/StaffDialog.tsx:55` and `src/features/ozipz/components/dictionaries/DictionaryDialog.tsx:50` to confirm `any` type usage.
