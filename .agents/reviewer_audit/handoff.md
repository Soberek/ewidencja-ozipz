# Review and Adversarial Handoff Report: Architectural Audit

**Reviewer Identity:** Independent Architectural Reviewer & Adversarial Critic  
**Working Directory:** `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz/.agents/reviewer_audit`  
**Target Document:** `docs/ARCHITECTURAL_AUDIT_REPORT.md`  
**Evaluation Standard:** `GEMINI.md`, `DATABASE_SCHEMA.md`, `ORIGINAL_REQUEST.md`  
**Date:** 2026-09-11  

---

## 1. Observation

Direct empirical observations made during independent verification:

### 1.1 Production Build Verification (`npm run build`)
- Executed `npm run build` (`tsc && vite build`) in repository root:
  - Exit code: `0`
  - Modules transformed: `3020`
  - Build time: `4.95s`
  - TypeScript errors: `0`
  - Emitted Chunks:
    - `dist/assets/vendor-excel-bcCVMg2z.js`: 939.84 kB (gzip: 271.14 kB)
    - `dist/assets/migratedData-B2nR0p61.js`: 555.13 kB (gzip: 53.77 kB)
    - `dist/assets/vendor-framework-De4L3E1G.js`: 426.67 kB (gzip: 133.17 kB)
    - `dist/assets/docxtemplater-BxiUrB9a.js`: 278.62 kB (gzip: 90.43 kB)
    - `dist/assets/ReportsSection-lnuDflkG.js`: 93.08 kB (gzip: 22.34 kB)
    - `dist/assets/ActionsSection-DjNj4HON.js`: 67.21 kB (gzip: 17.69 kB)
    - `dist/assets/ScheduleSection-D47L1r0D.js`: 42.06 kB (gzip: 10.26 kB)

### 1.2 Vitest Test Suite Verification (`npx vitest run`)
- Executed `npx vitest run`:
  - Exit code: `0`
  - Test Files: `109 passed (109)` (100%)
  - Unit Tests: `862 passed (862)` (100%)
  - Total Duration: `42.36s` (transform: 3.02s, setup: 0ms, collect: 94.73s, tests: 20.85s, environment: 37.54s)
- Executed `npx vitest run --coverage`:
  - Exit code: `1`
  - Verbatim stderr: `MISSING DEPENDENCY Cannot find dependency '@vitest/coverage-v8'`

### 1.3 Monolithic Files Inventory Verification (>350 Lines)
- Executed `find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" -exec wc -l {} + | awk '$1 >= 350 {print $1, $2}' | sort -nr`:
  - Exactly 12 files returned:
    1. `src/db/types.ts` (462 lines)
    2. `src/components/ui/autocomplete.tsx` (398 lines)
    3. `src/features/ozipz/utils/programJrwaUtils.ts` (397 lines)
    4. `src/features/ozipz/schemas/ozipz.schemas.ts` (391 lines)
    5. `src/db/client.ts` (369 lines)
    6. `src/features/ozipz/components/publications/hooks/useGovImport.ts` (368 lines)
    7. `src/components/ui/date-picker.tsx` (364 lines)
    8. `src/features/ozipz/utils/monthlyTargetsUtils.ts` (361 lines)
    9. `src/features/ozipz/components/reports/useReportsData.ts` (360 lines)
    10. `src/features/ozipz/utils/scheduleExecutionUtils.ts` (358 lines)
    11. `src/features/ozipz/utils/adnotacjaUtils.ts` (355 lines)
    12. `src/features/ozipz/components/publications/govScraper.ts` (355 lines)
  - Matches Section 2.1 of the audit report with 100% precision.
- Executed watch-list query (330–349 lines):
  - Exactly the 9 files identified in Section 2.2 (`ScheduleTableView.tsx` 343, `TodoApp.tsx` 342, `useXImport.ts` 342, `select.tsx` 342, `SchoolParticipationsTab.tsx` 341, `ScheduleSection.tsx` 339, `DictionaryDialog.tsx` 334, `ActionsSection.tsx` 334, `FacilityDialog.tsx` 333).

### 1.4 Codebase Integrity & GEMINI.md Rule Verification
- **Rule 8A (ActionEditorFooter facade / stub)**:
  - Inspected `src/features/ozipz/components/actions/editor/ActionEditorFooter.tsx:7-41`:
  - Lines 7–28 declare extensive props: `title`, `date`, `actionType`, `facilityName`, `municipality`, `programName`, `leadEducator`, `ezdStatus`, `indirectRecipientsCount`, `materialsDistributedCount`, `jrwaSign`, `izrzSign`.
  - Lines 30–41 omit all of these parameters, rendering only `totalDirectParticipants`.
  - Confirms a dummy/facade implementation in source code that fails Rule 8A.
- **Rule 7.1 (Zero Default Values)**:
  - `editorUtils.ts:30`: `leadEducator: staff[0]?.fullName || ""` (auto-selects first employee).
  - `ScheduleDialog.tsx:77`: `status: "zaplanowane"` (preselected).
  - `JrwaDialog.tsx:86`: `status: "w_toku"` (preselected).
  - `FacilityDialog.tsx:92`: `county: "powiat myśliborski"` (preselected).
- **Rule 6.1 (Hardcoded domain arrays)**:
  - `adnotacjaUtils.ts:45-226`: 182 lines containing static array `ADNOTACJA_POWODY` (25 objects).
  - `registerTypes.ts:4-11`: static array `REGISTER_TYPE_OPTIONS` (6 objects).
- **Rule 6.3 & DATABASE_SCHEMA.md Desynchronization**:
  - `sqlite-migrations.ts:12` defines 30 columns for `ozipz_schedule` with 3 foreign keys (`facility_id`, `program_id`, `action_id`).
  - `DATABASE_SCHEMA.md:231-247` defines only 13 columns for `ozipz_schedule` and completely omits `program_id`.
  - Exactly 25 foreign keys exist across SQLite tables in `sqlite-migrations.ts`, all 25 with explicit `CREATE INDEX IF NOT EXISTS idx_*`.
- **Liskov Substitution Principle (LSP)**:
  - `FallbackDatabaseService` defines `toggleScheduleStatus(id, status)` at `fallback-service.ts:82`, while `SqliteDatabaseService` and `IOzipzDatabaseService` do not declare it.
- **Race conditions in Fallback**:
  - `src/db/client.ts:107` and `client.ts:129` wrap SQLite in `serializeDatabaseService(...)`.
  - `src/db/client.ts:147` instantiates `new FallbackDatabaseService()` without serialization queue.
- **Design System Consistency**:
  - Grep confirmed exactly 10 production call sites invoking `window.confirm(...)` instead of the accessible `ConfirmDialog` component.
- **Testing Coverage of Modal Dialogs**:
  - Exactly 26 dialog files (`*Dialog.tsx`) exist in `src/features/ozipz/components/`.
  - Only 7 dialogs are referenced in DOM component tests (`ActionDialog`, `JrwaCaseDetailsDialog`, `LetterDialog`, `RegisterDialog`, `ScanDialog`, `StaffDialog`, `TemplateDialog`).
  - Exactly 19 dialogs (73.1%) have 0 test coverage.

---

## 2. Logic Chain

1. **R1: Architectural & Code Health Inspection**:
   - The report establishes clear evidence of modularity and separation of concerns while accurately diagnosing 12 violations of the 350-line rule (Rule 2A) and 2 instances of `any` in form definitions (`StaffDialog.tsx:55`, `DictionaryDialog.tsx:50`).
   - The analysis correctly identifies that while production domain models have 0 `any`, there are 9 unsafe `as unknown as` assertions and an unverified fallback in mapper `toAction`.

2. **R2: Database, Schema & State Management**:
   - The report provides a deep-dive analysis into the 25 foreign keys, WAL configuration, cascading delete semantics (`RESTRICT` for school participations vs `SET NULL` for references).
   - It uncovers a major documentation drift in `DATABASE_SCHEMA.md` where Table 7 is missing 17 columns and a foreign key.
   - It exposes the missing synchronization queue in `FallbackDatabaseService` (`src/db/client.ts:147`) and the LSP asymmetry (`toggleScheduleStatus`).
   - It correctly diagnoses state subscription anti-patterns in `useOzipzDb.ts` (full store subscription) and unmemoized dictionary filtering in `domainHooks.ts`.

3. **R3: UI/UX & Domain Workflows**:
   - The report demonstrates deep domain knowledge of PSSE OZiPZ operations (1 DZ, ODB, POŚR, MAT metrics, JRWA case indexing, EZD/IZRZ generation, 12-month targets matrix).
   - It detects the facade implementation in `ActionEditorFooter.tsx` (Rule 8A), preselected form values violating Rule 7.1, 10 rogue `window.confirm` calls, UTC timezone date conversion bugs (`new Date().toISOString().slice(0, 10)`), and fragile date parsing (`.startsWith(year)` and `.split("-")` failing on `DD.MM.YYYY`).
   - It identifies accessibility bottlenecks where 132 files use rigid pixel classes `text-[10px]` bypassing `useFontSize`.

4. **R4: Test Coverage & Code Verification**:
   - The report accurately documents test suite execution (109 files, 862 tests, 100% pass) and production build metrics (3020 modules, 0 TS errors).
   - It objectively demonstrates that `@vitest/coverage-v8` is missing from `devDependencies` and uncovers that 73.1% of dialogs (19/26) lack integration tests.
   - It articulates a concrete 4-tier testing roadmap to address these gaps.

5. **R5: Prioritized Remediation Roadmap**:
   - The roadmap is logically divided into P0/P1 (Critical/High), P2 (Medium), and P3 (Low).
   - Every single item provides exact file paths, line ranges, root-cause explanations, and concrete code replacement snippets.

---

## 3. Caveats & Adversarial Challenges

During adversarial stress-testing of the proposed solutions, two technical nuances were identified that warrant refinement:

### 3.1 Adversarial Challenge 1: JavaScript Proxy 'Thenable' Trap in Recipe 5 (`src/db/client.ts`)
- **Assumption in Report:** Recipe 5 proposes replacing 90 lines of repetitive method delegation in `OzipzDbService` with a dynamic `Proxy`:
  ```typescript
  export const OzipzDbService = new Proxy({} as IOzipzDatabaseService, {
    get(_target, propKey: string) {
      return async (...args: unknown[]) => {
        const service = (await resolveService()) as unknown as Record<string, Function>;
        ...
        return service[propKey](...args);
      };
    },
  });
  ```
- **Attack Scenario:** If `OzipzDbService` is ever evaluated in an asynchronous context (e.g., `await Promise.resolve(OzipzDbService)` or `await OzipzDbService`), the JavaScript runtime checks if the target is a "thenable" by inspecting `OzipzDbService.then`. Under the naive Proxy above, accessing `.then` returns an `async` function instead of `undefined`! The runtime treats `OzipzDbService` as a Promise, invoking `.then()`, which resolves to an error (`TypeError: Metoda then nie istnieje w IOzipzDatabaseService`) or creates an unhandled promise rejection.
- **Blast Radius:** Any async helper, test harness, or library awaiting dynamic services would crash.
- **Mitigation:** Refine Recipe 5 to explicitly guard against Promise resolution and Symbol inspection:
  ```typescript
  export const OzipzDbService = new Proxy({} as IOzipzDatabaseService, {
    get(_target, propKey: string | symbol) {
      if (propKey === "then" || typeof propKey === "symbol") {
        return undefined;
      }
      return async (...args: unknown[]) => {
        const service = (await resolveService()) as unknown as Record<string, Function>;
        if (typeof service[propKey] !== "function") {
          throw new TypeError(`Metoda ${String(propKey)} nie istnieje w IOzipzDatabaseService`);
        }
        return service[propKey](...args);
      };
    },
  });
  ```

### 3.2 Adversarial Challenge 2: Mermaid ERD Omission in `DATABASE_SCHEMA.md`
- **Observation:** In addition to Table 7 omitting 17 columns in `DATABASE_SCHEMA.md`, Section 1's Mermaid ERD (`DATABASE_SCHEMA.md:38-44`) also completely omits the relation `ozipz_programs ||--o{ ozipz_schedule : "program zadania (SET NULL)"`, despite SQLite migration line 12 declaring `FOREIGN KEY (program_id) REFERENCES ozipz_programs(id) ON DELETE SET NULL`.
- **Mitigation:** When updating `DATABASE_SCHEMA.md` under Pozycja 4, update both the Mermaid diagram and Table 7 simultaneously.

---

## 4. Conclusion & Formal Verdict

### Formal Verdict: **APPROVE**

The master architectural audit report (`docs/ARCHITECTURAL_AUDIT_REPORT.md`) represents an exemplary, thorough, and brutally honest evaluation of the codebase. It satisfies all 5 requirements (R1–R5) and all acceptance criteria set forth in `ORIGINAL_REQUEST.md`. Every empirical metric (build times, module counts, test counts, line counts) has been independently reproduced and verified without discrepancies. No integrity violations, fabricated logs, or self-certifying shortcuts were found.

The report should be formally accepted as the authoritative architectural baseline for subsequent remediation sprints.

---

## 5. Verification Method

To independently reproduce and verify this review:

1. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected:* Exit code 0, 3020 modules transformed, 0 TypeScript errors.

2. **Verify Full Vitest Suite**:
   ```bash
   npx vitest run
   ```
   *Expected:* Exit code 0, 109 test files passed, 862 tests passed.

3. **Verify Coverage Missing Dependency**:
   ```bash
   npx vitest run --coverage
   ```
   *Expected:* Exit code 1, `Cannot find dependency '@vitest/coverage-v8'`.

4. **Verify Monolithic Files (>350 Lines)**:
   ```bash
   find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" -exec wc -l {} + | awk '$1 >= 350 {print $1, $2}' | sort -nr
   ```
   *Expected:* Exactly 12 files matching Section 2.1 of the report.

5. **Verify Rogue `window.confirm` Calls**:
   ```bash
   rg "window\.confirm" src/
   ```
   *Expected:* Exactly 10 production files matching Section 5.3 of the report.
