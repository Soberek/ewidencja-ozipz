# Handoff Report: UI/UX Architecture & Core Domain Workflow Audit (Requirement R3)

**Author:** UI and Domain Workflow Explorer (`explorer_ux`)  
**Target:** Project Orchestrator (`orchestrator_audit`)  
**Workspace:** `/Users/krzysztofpalpuchowski/Documents/GitHub/ewidencja-ozipz`  
**Date:** 2026-09-11T08:40:00+02:00  

---

## 1. Observation

Direct code observations from inspecting `src/features/ozipz/components/`, `src/features/ozipz/utils/`, `src/components/ui/`, `src/App.tsx`, and project guidelines:

### A. Core Domain Workflows (GEMINI.md Rule 8)

1. **`actions/` — ActionEditorFooter Non-Compliance (GEMINI.md Rule 8A)**:
   - `src/features/ozipz/components/actions/editor/ActionEditorFooter.tsx`:
     ```tsx
     // Lines 7-28 define rich metadata and metric props:
     export interface ActionEditorFooterProps {
       title?: string;
       date?: string;
       actionType?: string;
       facilityName?: string;
       municipality?: string;
       programName?: string;
       leadEducator?: string;
       ezdStatus?: string;
       totalDirectParticipants: number;
       indirectRecipientsCount?: number;
       materialsDistributedCount?: number;
       groupsCount?: number;
       jrwaSign?: string;
       izrzSign?: string;
       isReadOnly?: boolean;
       isSubmitting?: boolean;
       editingAction?: Partial<OzipzAction> | null;
       onCancel: () => void;
       onSaveAndAddSimilar?: () => void;
       isModal?: boolean;
     }

     // Lines 30-41 completely ignore almost all defined props:
     export function ActionEditorFooter({ totalDirectParticipants, isReadOnly = false,
       isSubmitting = false, editingAction, onCancel, onSaveAndAddSimilar }: ActionEditorFooterProps) {
       return <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-3 py-3 shadow-sm">
         <span className="text-sm text-muted-foreground">Odbiorcy: <strong className="text-foreground">{totalDirectParticipants}</strong></span>
         <div className="flex flex-wrap gap-2">
           <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>{isReadOnly ? "Powrót" : "Anuluj"}</Button>
           ...
     ```
   - Neither `ActionEditorSection.tsx` (lines 174-176) nor `ActionDialog.tsx` (lines 101-104) pass `title`, `date`, `actionType`, `facilityName`, `municipality`, `programName`, `leadEducator`, `ezdStatus`, `jrwaSign`, `izrzSign`, or metrics to `ActionEditorFooter`.
   - **Direct Conflict**: GEMINI.md Rule 8A explicitly mandates:
     > *"Dolny pasek podsumowania na żywo (ActionEditorFooter.tsx) wyświetla metadane bieżącej akcji (tytuł, data, forma, placówka, gmina, program, osoba prowadząca, status EZD, znak JRWA i IZRZ) oraz kluczowe mierniki (1 DZ, ODB, POŚR, MAT). Puste pola nie mogą renderować pustych ramek ani etykiet."*

2. **`actions/` — ActionsSection & ActionsTableView**:
   - `ActionsSection.tsx` is 335 lines (modular, <400 lines).
   - `ActionsTableView.tsx` cleanly delegates to `DataTable` and renders `EmptyState` when empty with a "Wyczyść wszystkie filtry" button.
   - `IzrzDocumentDialog.tsx` renders `IzrzSheetPreview` and allows DOCX generation via `downloadIzrzDocx`, but bypasses `ModalDialog` in favor of raw `Dialog` (lines 184-185).

3. **`schedule/` — Schedule Management & "Zero Default Values" Violation (Rule 7)**:
   - `ScheduleSection.tsx` (340 lines) seamlessly integrates Table (`ScheduleTableView`), Kanban (`ScheduleKanbanView`), and Calendar (`ScheduleCalendarView`).
   - `ScheduleDialog.tsx` lines 66-81:
     ```tsx
     defaultValues: {
       activityTypeCode: "",
       title: "",
       eventDate: new Date().toISOString().slice(0, 10),
       endDate: "",
       topic: "",
       programId: "",
       campaignId: "",
       recipientGroup: "",
       location: "",
       facilityId: "",
       status: "zaplanowane", // <-- Hardcoded default value
       annotationReasonCode: "",
       responsiblePerson: "",
       notes: "",
     }
     ```
     `status: "zaplanowane"` violates GEMINI.md Rule 7.1: *"Pola formularzy przy tworzeniu nowych rekordów ... nie mogą posiadać arbitralnie wybranych wartości początkowych. Wszystkie pola wyboru inicjalizują się pustym stringiem `""` lub wartością `null`"*. Furthermore, `ScheduleStatusNotesFields.tsx:72` has no placeholder option.
   - `AdnotacjaDialog.tsx` (lines 5, 132) and `CopyYearPlanDialog.tsx` (lines 5, 84) directly import and render raw Radix `Dialog` instead of standard `ModalDialog`.

4. **`jrwa/` — Tech-Specific Numbering & Full Case Signs (Rule 8C)**:
   - `src/features/ozipz/utils/programJrwaUtils.ts` (`generateNextJrwaSign`, lines 252-268):
     Computes `maxJrwaNum` strictly filtered by both `Number(c.year) === Number(year)` AND `c.jrwaSymbol === symbol` across both `ozipz_jrwa_cases` and `ozipz_actions`.
   - Generates full case signs adhering to the standard format `PSSE.OZiPZ.${symbol}.${nextCaseNum}.${year}` (or `OZiPZ.${symbol}.${nextCaseNum}.${year}`).
   - `JrwaDialog.tsx:86` defaults `status: "w_toku"`, another Rule 7 violation.
   - `JrwaCaseDetailsDialog.tsx` uses `ModalDialog` properly and displays linked actions (`relatedActions`).

5. **`reports/` — Duplicated Table Implementations (Violation of Rule 1A DRY)**:
   - `src/features/ozipz/components/reports/MunicipalityDetailedTab.tsx` (lines 75-100): Manually renders `<table className="w-full text-xs">`, duplicates search input (`<Input placeholder="Filtruj gminy...">`), manual filtering, and inline empty state `<tr><td colSpan={8} className="py-6 text-center text-muted-foreground italic">Brak gmin...</td></tr>` instead of `DataTable`.
   - `src/features/ozipz/components/reports/BezpieczneWakacjeTab.tsx` (lines 237-265): Manually renders `<table className="w-full text-xs">` for distributed materials with inline `<tr><td colSpan={3} className="py-4 text-center text-muted-foreground italic">Brak rozdanych materiałów...</td></tr>`.
   - `src/features/ozipz/components/reports/ProgramBreakdownTab.tsx` (lines 98-140): Manually renders `<table className="w-full text-xs">` with custom table structures instead of `DataTable`.
   - `MonthlyTargetsComplianceTab.tsx`: Generates a 12-month compliance matrix with program vs non-program breakdown, live execution comparisons, and variance calculations (`calculateMonthlyComplianceMatrix`).

---

### B. Form Validation UX & Error States

1. **Exemplary Pattern (`ActionQuickForm.tsx`)**:
   - Lines 38-52: Automatically intercepts validation errors on submit (`errors, submitCount`). If an invalid field is hidden inside a closed disclosure (`<details>`), it opens the disclosure, sets focus to the invalid control, and smoothly scrolls to it (`target.scrollIntoView({ block: "center", behavior: "smooth" })`).
   - Line 53-55: Wraps fields in `data-field-error` and renders inline `<p role="alert" className="mt-1 text-sm text-destructive">{message}</p>`.
2. **`ModalDialog` Top Banner Error**:
   - `ModalDialog.tsx` lines 136-141 render an error alert banner (`<AlertCircle .../> <span>{error}</span>`) whenever `error` is provided.
   - `ActionDialog`, `ScheduleDialog`, `FacilityDialog`, `TemplateDialog`, `MaterialDialog`, `PublicationDialog`, `StaffDialog` compile `Object.values(errors).map(e => e.message).join(", ")` and pass it to `error`, ensuring users never face silent blocking.
3. **Missing Inline Error**:
   - In `ScheduleActivityFormFields.tsx` (lines 73-80), `activityTypeCode` is marked required with `*`, but `Select` has neither `error={errors.activityTypeCode?.message}` nor an inline `<p className="text-destructive">` label.
4. **Application-Wide Loading & Error States**:
   - `App.tsx` (lines 78-109) wraps lazy routes in `Suspense` with `ViewLoadingFallback` (animated spinner) and `ErrorBoundary` with `ViewErrorFallback` (warning icon, descriptive error message, and "Spróbuj ponownie" retry button).
   - `App.tsx` (lines 141-160): Handles degraded mode (`databaseInfo?.degraded`) with a prominent top banner offering reconnection and settings backup links; locks views with an alert banner if `loadError` occurs during store initialization.
   - `DataTable.tsx` (lines 221-226): Renders skeleton loading pulse rows (`Array.from({ length: 5 }).map(...)`) when `isLoading={true}`.

---

### C. Design System Consistency

1. **`DataTable` Adoption**:
   - Extensively adopted in 16+ modules: `ActionsTableView`, `ScheduleTableView`, `JrwaCasesTable`, `FacilitiesTableView`, `ContactsTableView`, `MaterialsCatalogTab`, `MaterialsDistributionsTab`, `PublicationsTableView`, `LettersTableView`, `ScansTableView`, `StaffTableView`, `TemplatesTableView`, `DictionariesTableView`, `InformationRegisterTable`, `PublicationsRegisterTable`, `VisitationsRegisterTable`.
   - Provides density toggling (compact/normal), pagination, sorting, CSV export, and default `EmptyState`.
2. **`ConfirmDialog` vs Native `window.confirm(...)` Anti-Pattern**:
   - `src/components/ui/confirm-dialog.tsx` is a fully accessible, themed modal dialog supporting `destructive`, `warning`, and `default` variants with loading indicators.
   - **Only 1 component** (`PublicationsTableView.tsx`) uses `ConfirmDialog`.
   - **10 components** bypass the design system and call native, unstyled browser `window.confirm(...)`:
     - `src/features/ozipz/components/schedule/ScheduleKanbanView.tsx:93`
     - `src/features/ozipz/components/schedule/ScheduleCalendarView.tsx:112`
     - `src/features/ozipz/components/actions/list/ActionRowActionButtons.tsx:106`
     - `src/features/ozipz/components/actions/hooks/useActionSelection.ts:63`
     - `src/features/ozipz/components/letters/components/LettersTableColumns.tsx:102`
     - `src/features/ozipz/components/staff/components/StaffTableColumns.tsx:75`
     - `src/features/ozipz/components/templates/components/TemplatesTableColumns.tsx:93`
     - `src/features/ozipz/components/scans/components/ScansTableColumns.tsx:88`
     - `src/features/ozipz/components/reports/components/MonthlyTargetsComplianceTab.tsx:125`
     - `src/features/ozipz/components/settings/SettingsSection.tsx:115`
3. **`EmptyState` Inconsistencies**:
   - `ScheduleCalendarView.tsx` lines 29-34 uses an ad-hoc `<div className="p-8 text-center text-sm text-muted-foreground italic border rounded-[3px]">Brak zaplanowanych zadań w wybranym filtrze.</div>` instead of the standard `EmptyState` component.

---

### D. Edge-Case Handling

1. **Timezone Offset on Date Defaults**:
   - Multiple dialogs initialize default dates using `new Date().toISOString().slice(0, 10)` or `.split("T")[0]`:
     - `ScheduleDialog.tsx:69`
     - `AdnotacjaDialog.tsx:67`
     - `JrwaDialog.tsx:88`
     - `DistributionDialog.tsx:86`
     - `PublicationDialog.tsx:80`
   - In Polish timezone (UTC+1 winter, UTC+2 summer), any action created between 00:00 and 01:00 (or 02:00) will have `new Date().toISOString()` pointing to the **previous calendar day** (e.g. `2026-03-01 00:30` local time converts to `2026-02-28T23:30:00Z`, resulting in `"2026-02-28"`).
2. **Date Format Assumption vs `safeParseDate`**:
   - `src/features/ozipz/utils/monthlyTargetsUtils.ts` lines 166-168:
     ```ts
     const dateStr = a.date || "";
     if (!dateStr.startsWith(String(year))) return;
     const monthNum = Number(dateStr.slice(5, 7));
     ```
   - `src/features/ozipz/utils/scheduleExecutionUtils.ts` line 124:
     ```ts
     const parts = event.eventDate.split("-");
     if (parts.length >= 2) {
       const parsed = parseInt(parts[1], 10);
       ...
     ```
   - Both implementations bypass `safeParseDate` from `dateUtils.ts`. If an action or schedule event has a date formatted with dots (`DD.MM.YYYY`, e.g. `15.03.2026`), `dateStr.startsWith(String(year))` evaluates to `false` and `event.eventDate.split("-")` fails, silently omitting valid actions from monthly targets and schedule completion matching!
3. **Orphaned Relations (Deleted Foreign Keys)**:
   - When a referenced facility, program, or staff member is deleted (`ON DELETE SET NULL`), foreign key columns become `null`.
   - The UI handles orphaned records gracefully:
     - `ActionsTableColumns.tsx:147` renders `row.facilityName || "Placówka nieokreślona"`.
     - `IzrzDocumentDialog.tsx:88-100` falls back to raw action data (`actionData.facilityName`, `actionData.municipality`).
     - `SchoolParticipationsTab.tsx:151` falls back to `row.programName || prog?.name || "Program"`.
     - `scheduleExecutionUtils.ts:45` falls back to `event.programName || "Program profilaktyczny"`.
   - Denormalized text fields protect historic records from UI crashes.

---

### E. Accessibility & Responsive Scaling

1. **Hardcoded Pixel Font Sizes Bypassing REM Scaling**:
   - `src/features/ozipz/hooks/useFontSize.ts` modulates root font size: `document.documentElement.style.fontSize = '${clamped}%'`.
   - In Tailwind CSS, `rem`-based classes (`text-xs`, `text-sm`, `p-4`, etc.) scale proportionally.
   - However, **132+ files** across `src/features/ozipz/components/` contain hardcoded arbitrary pixel font sizes: `text-[10px]`, `text-[11px]`, `text-[9px]`, `text-[12px]`.
   - Elements styled with `text-[10px]` or `text-[11px]` use fixed CSS pixels and **do not scale** when the user increases font size to 150%, leading to unreadable text and broken visual hierarchy for low-vision users.
2. **Keyboard Navigation & Modal Trapping**:
   - `src/features/ozipz/hooks/useKeyboardShortcuts.ts` provides global keyboard shortcuts:
     - `Escape`: Closes active modal dialog.
     - `Cmd+N` / `Ctrl+N`: Opens New Action Dialog.
     - `Cmd+K` / `Ctrl+K`: Focuses global search input.
     - `1`, `2`, `3`: Switches Schedule views (Table, Kanban, Calendar) when not focused on an input.
   - `ModalDialog` relies on Radix UI (`@radix-ui/react-dialog`), which automatically handles focus trapping, tab order constraints, and focus restoration to the trigger element upon modal dismissal.
3. **TypeScript Strictness Violations (Rule 3)**:
   - `DictionaryDialog.tsx:50`: `useForm<DictionaryFormInput, any, DictionaryFormOutput>`
   - `StaffDialog.tsx:55`: `useForm<StaffFormInput, any, StaffFormOutput>`
   - Both use `any` instead of `undefined` for the TContext type parameter.

---

## 2. Logic Chain

```
[Observation: GEMINI.md Rule 8A mandates live footer with title, date, forma, placówka, gmina, program, lead educator, EZD, JRWA, IZRZ, and metrics 1 DZ, ODB, POŚR, MAT]
    │
    ▼
[Observation: ActionEditorFooter.tsx defines props but renders only <span className="...">Odbiorcy: {totalDirectParticipants}</span>]
    │
    ▼
[Deduction 1]: ActionEditorFooter is an incomplete stub that violates GEMINI.md Rule 8A, depriving users of live metadata validation while editing complex actions.
```

```
[Observation: ConfirmDialog.tsx is implemented with full accessibility, theming, and loading states]
    │
    ▼
[Observation: 10 separate components call browser-native window.confirm() for deletions and resets]
    │
    ▼
[Deduction 2]: Using native browser dialogs in a desktop Tauri app breaks visual consistency, dark mode theming, and keyboard trapping, violating DRY and the project Design System.
```

```
[Observation: dateUtils.ts provides safeParseDate() supporting ISO, DD.MM.YYYY, and DD/MM/YYYY]
    │
    ▼
[Observation: monthlyTargetsUtils.ts uses dateStr.startsWith(year) and dateStr.slice(5, 7); scheduleExecutionUtils.ts uses eventDate.split("-")]
    │
    ▼
[Deduction 3]: Non-standard or migrated dates formatted as DD.MM.YYYY are silently excluded from monthly targets reconciliation and schedule event matching.
```

```
[Observation: new Date().toISOString().slice(0, 10) converts current local time to UTC]
    │
    ▼
[Observation: ScheduleDialog, AdnotacjaDialog, JrwaDialog, DistributionDialog, PublicationDialog use this as default date]
    │
    ▼
[Deduction 4]: Polish users operating between 00:00 and 01:00 (or 02:00 in DST) will have their default form dates offset to the previous day.
```

```
[Observation: useFontSize adjusts root font-size percentage (50%-150%), scaling rem units]
    │
    ▼
[Observation: 132+ files use text-[10px], text-[11px], text-[9px] hardcoded pixel styles]
    │
    ▼
[Deduction 5]: Arbitrary pixel sizes do not scale with root rem font-size changes, impairing accessibility for visually impaired users.
```

```
[Observation: MunicipalityDetailedTab, BezpieczneWakacjeTab, ProgramBreakdownTab build custom <table> elements with manual search and custom empty rows]
    │
    ▼
[Deduction 6]: Bypassing DataTable violates Rule 1A DRY and deprives users of unified table features (pagination, density toggle, CSV export, standardized empty state).
```

---

## 3. Caveats

1. **Browser vs Tauri Desktop Runtime**: Testing and verification were conducted in a Node.js/Vite simulation environment. While `window.confirm` functions in browser and Tauri, native OS modal styling differences in production builds were evaluated based on standard Webview2 / WebKit behaviors.
2. **Third-Party Rich Text Editors**: No custom rich text editor is currently embedded; all form textareas use standard styled `<Textarea>` elements with auto-resize.
3. **No Uninvestigated Modules**: All core domain modules (`actions`, `schedule`, `jrwa`, `reports`, `registers`, `facilities`, `contacts`, `materials`, `publications`, `dictionaries`, `staff`, `templates`, `scans`, `letters`) were directly inspected.

---

## 4. Conclusion

The UI/UX architecture of Ewidencja OZiPZ demonstrates strong foundational patterns: modular components (<350-400 lines), robust table abstractions via `DataTable`, accessible modal primitives via Radix UI `ModalDialog`, and an exemplary auto-focus/auto-disclosure validation UX in `ActionQuickForm`.

However, the audit identified **eight specific architectural and UX deficiencies** requiring remediation:

| Priority | Issue | Affected Files | Impact |
|---|---|---|---|
| **P1 - High** | `ActionEditorFooter` is a stub that ignores metadata and metrics (1 DZ, ODB, POŚR, MAT) | `ActionEditorFooter.tsx`, `ActionEditorSection.tsx`, `ActionDialog.tsx` | Direct violation of GEMINI.md Rule 8A; users cannot see live action summary while filling forms |
| **P1 - High** | Native `window.confirm` anti-pattern used across 10 components instead of `ConfirmDialog` | `ScheduleKanbanView.tsx`, `ScheduleCalendarView.tsx`, `ActionRowActionButtons.tsx`, `LettersTableColumns.tsx`, `StaffTableColumns.tsx`, `TemplatesTableColumns.tsx`, `ScansTableColumns.tsx`, `MonthlyTargetsComplianceTab.tsx`, `SettingsSection.tsx`, `useActionSelection.ts` | Breaks design system, accessibility, dark mode, and desktop UX |
| **P2 - Medium** | Date parsing assumptions (`.split("-")` and `.slice(5, 7)`) bypass `safeParseDate` | `monthlyTargetsUtils.ts:166`, `scheduleExecutionUtils.ts:124` | `DD.MM.YYYY` dates silently dropped from monthly targets and schedule matching |
| **P2 - Medium** | Timezone offset bug in default dates (`new Date().toISOString().slice(0, 10)`) | `ScheduleDialog.tsx`, `AdnotacjaDialog.tsx`, `JrwaDialog.tsx`, `DistributionDialog.tsx`, `PublicationDialog.tsx` | Midnight-to-2AM date initialization records previous day's date |
| **P2 - Medium** | Ad-hoc custom `<table>` implementations violating DRY `DataTable` rule | `MunicipalityDetailedTab.tsx`, `BezpieczneWakacjeTab.tsx`, `ProgramBreakdownTab.tsx` | Code duplication; missing table presets, CSV export, and standardized `EmptyState` |
| **P2 - Medium** | GEMINI.md Rule 7 ("Zero Default Values") violations in forms | `ScheduleDialog.tsx` (`status: "zaplanowane"`), `JrwaDialog.tsx` (`status: "w_toku"`), `FacilityDialog.tsx` (`county: "powiat myśliborski"`) | Bypasses conscious user choice; risk of unintended data classification |
| **P3 - Low** | Hardcoded pixel text sizes (`text-[10px]`, `text-[11px]`) bypass `useFontSize` scaling | 132+ components across `src/features/ozipz/components/` | Text remains microscopic when font scaling is increased to 150% |
| **P3 - Low** | Loose typing (`any` in `useForm`) | `DictionaryDialog.tsx:50`, `StaffDialog.tsx:55` | Violates GEMINI.md Rule 3 strict type-safety |

---

## 5. Verification Method

### A. Automated Verification Commands
Run the full test suite and production build from the workspace root:
```bash
# 1. Verify that all 109 test files (862 tests) pass without regressions:
npm test

# 2. Verify TypeScript strict mode compilation and Vite production bundle:
npm run build
```

### B. Files and Locations for Independent Inspection
1. **ActionEditorFooter stub**: Inspect `src/features/ozipz/components/actions/editor/ActionEditorFooter.tsx` lines 30-41 vs interface lines 7-28.
2. **`window.confirm` locations**: Grep `window.confirm` across `src/` to observe the 10 unmigrated deletion dialogs.
3. **Date parsing edge-case**: Inspect `src/features/ozipz/utils/monthlyTargetsUtils.ts` lines 166-169 and test with date `"15.03.2026"`.
4. **Timezone UTC bug**: Inspect `src/features/ozipz/components/schedule/ScheduleDialog.tsx` line 69 (`eventDate: new Date().toISOString().slice(0, 10)`).
5. **Custom tables in reports**: Inspect `src/features/ozipz/components/reports/MunicipalityDetailedTab.tsx` lines 75-100.
6. **Hardcoded font sizes**: Grep `text-\[` in `src/features/ozipz/components/` to verify occurrences of non-rem pixel typography.

### C. Invalidation Conditions
This assessment would be invalidated if:
- `ActionEditorFooter` is demonstrated to render all Rule 8A metadata via a dynamic portal or external wrapper (inspection confirmed it renders directly inside the form).
- `window.confirm` is proven to have custom OS-level dark mode hooks across all supported desktop platforms (it does not; Webview2 and macOS WebKit render default browser alert modals).
- All dates across all environments are strictly guaranteed to be pre-sanitized into `YYYY-MM-DD` before reaching `monthlyTargetsUtils` (data migrations and manual entries can introduce Polish dot notation).
