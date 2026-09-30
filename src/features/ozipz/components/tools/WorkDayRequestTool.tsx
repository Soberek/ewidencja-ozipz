import { useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, MapPin, Plus, Printer, Trash2, UserPlus, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSchedule, useStaff } from "../../store/domainHooks";
import { formatDatePl, getTodayIsoDate } from "../../utils/dateUtils";
import {
  WORK_DAY_REQUEST_DEFAULTS,
  buildWorkDayRequestHtml,
  describeWorkDay,
  validateWorkDayRequest,
  type WorkDayRequest,
  type WorkDayRequestField,
  type WorkDayRequestIssue,
} from "../../utils/workDayRequest";
import { A4PrintPreview, printPreviewFrame } from "../print/A4PrintPreview";

/** Komórka wpisywana przy pracownikach dodanych z Kadry OZiPZ. */
const OWN_UNIT = "OZiPZ";

function errorsLabel(count: number): string {
  if (count === 1) return "1 błąd";
  const lastTwo = count % 100;
  const last = count % 10;
  return `${count} ${last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "błędy" : "błędów"}`;
}

function newEmployee(unit = "", fullName = "") {
  return { id: crypto.randomUUID(), unit, fullName };
}

function FieldLabel({ htmlFor, icon, required, children }: { htmlFor?: string; icon?: ReactNode; required?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-bold">
      {icon}
      {children}
      {required && <span className="text-destructive" aria-hidden="true">*</span>}
    </label>
  );
}

function FieldIssues({ issues }: { issues: WorkDayRequestIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="space-y-0.5">
      {issues.map((issue) => (
        <li
          key={issue.message}
          className={cn("flex items-start gap-1 text-[11px]", issue.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-400")}
        >
          {issue.severity === "error" ? <XCircle className="mt-px size-3 shrink-0" /> : <AlertTriangle className="mt-px size-3 shrink-0" />}
          {issue.message}
        </li>
      ))}
    </ul>
  );
}

export function WorkDayRequestTool() {
  const { staff } = useStaff();
  const { scheduleEvents } = useSchedule();
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [request, setRequest] = useState<WorkDayRequest>(() => ({
    ...WORK_DAY_REQUEST_DEFAULTS,
    issueDate: getTodayIsoDate(),
    purpose: "",
    eventName: "",
    location: "",
    workDate: "",
    timeFrom: "",
    timeTo: "",
    employees: [],
  }));
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [showAllErrors, setShowAllErrors] = useState(false);

  const update = <K extends keyof WorkDayRequest>(key: K, value: WorkDayRequest[K]) =>
    setRequest((current) => ({ ...current, [key]: value }));
  const touch = (field: WorkDayRequestField) => setTouched((current) => new Set(current).add(field));

  const issues = useMemo(() => validateWorkDayRequest(request), [request]);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  /** Błąd pola pokazujemy po jego opuszczeniu albo po próbie druku; ostrzeżenia od razu. */
  const issuesFor = (field: WorkDayRequestField) =>
    issues.filter((issue) => issue.field === field && (issue.severity === "warning" || showAllErrors || touched.has(field)));
  const hasError = (field: WorkDayRequestField) => issuesFor(field).some((issue) => issue.severity === "error");

  const workDay = request.workDate ? describeWorkDay(request.workDate) : null;
  const html = useMemo(() => buildWorkDayRequestHtml(request), [request]);

  // Zadania z harmonogramu w dni wolne (od dziś) — tylko do podglądu przy wypełnianiu wniosku.
  // Pozycje planu miesięcznego mają datę 1. dnia miesiąca (np. 1 listopada), więc ich nie pokazujemy.
  const today = getTodayIsoDate();
  const plannedDaysOff = useMemo(
    () =>
      scheduleEvents
        .map((event) => ({ event, day: describeWorkDay(event.eventDate.slice(0, 10)) }))
        .filter(({ event, day }) => event.eventDate >= today && event.eventDate.slice(8, 10) !== "01" && day && day.kind !== "workday")
        .sort((a, b) => a.event.eventDate.localeCompare(b.event.eventDate)),
    [scheduleEvents, today]
  );

  const listedNames = new Set(request.employees.map((employee) => employee.fullName.trim().toLowerCase()));
  const staffOptions: SelectOption[] = staff
    .filter((person) => person.active && !listedNames.has(person.fullName.trim().toLowerCase()))
    .map((person) => ({ value: person.id, label: person.fullName, description: person.role || undefined }));

  const addEmployee = (unit = "", fullName = "") => update("employees", [...request.employees, newEmployee(unit, fullName)]);
  const handleStaffSelect = (id: string) => {
    const person = staff.find((item) => item.id === id);
    if (person) addEmployee(OWN_UNIT, person.fullName);
  };
  const updateEmployee = (id: string, key: "unit" | "fullName", value: string) =>
    update("employees", request.employees.map((employee) => (employee.id === id ? { ...employee, [key]: value } : employee)));
  const removeEmployee = (id: string) => update("employees", request.employees.filter((employee) => employee.id !== id));

  const handlePrint = () => {
    if (errors.length > 0) {
      setShowAllErrors(true);
      toast.error(`Wniosek ma ${errorsLabel(errors.length)} — popraw przed wydrukiem.`);
      return;
    }
    printPreviewFrame(previewRef.current);
  };

  return (
    <div className="flex flex-col items-start gap-4 lg:flex-row">
      <Card className="w-full space-y-4 p-4 lg:w-[460px] lg:shrink-0">
        <div>
          <h2 className="text-sm font-bold">Wniosek o zgodę na pracę w dniu wolnym</h2>
          <p className="text-xs text-muted-foreground">
            Do Dyrektora PSSE — praca w sobotę, niedzielę, święto lub inny dzień. Pola oznaczone <span className="text-destructive">*</span> są
            wymagane.
          </p>
        </div>

        {plannedDaysOff.length > 0 && (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Zaplanowane w dni wolne (harmonogram)
            </p>
            <ul className="max-h-36 divide-y divide-border overflow-y-auto rounded-[3px] border border-border text-[11px]">
              {plannedDaysOff.map(({ event, day }) => (
                <li key={event.id} className="flex items-baseline gap-2 px-2 py-1">
                  <span className="shrink-0 font-mono tabular-nums">{formatDatePl(event.eventDate)}</span>
                  <span className="shrink-0 text-muted-foreground">{day?.kind === "holiday" ? "święto" : day?.label}</span>
                  <span className="min-w-0 flex-1 truncate" title={event.title}>{event.title}</span>
                  {(event.programName || event.campaignName) && (
                    <span className="max-w-[40%] shrink-0 truncate text-muted-foreground" title={event.programName || event.campaignName}>
                      {event.programName || event.campaignName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="wdr-purpose" required>W związku z</FieldLabel>
          <Textarea
            id="wdr-purpose"
            value={request.purpose}
            onChange={(e) => update("purpose", e.target.value)}
            onBlur={() => touch("purpose")}
            aria-invalid={hasError("purpose")}
            rows={2}
            placeholder="np. organizacją stoiska profilaktyczno-edukacyjnego"
            className="text-xs"
          />
          <FieldIssues issues={issuesFor("purpose")} />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="wdr-event">Nazwa wydarzenia</FieldLabel>
          <Input
            id="wdr-event"
            value={request.eventName}
            onChange={(e) => update("eventName", e.target.value)}
            placeholder="np. XLV Jesienne Biegi Leśne (bez cudzysłowu)"
          />
          <FieldIssues issues={issuesFor("eventName")} />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="wdr-location" icon={<MapPin className="size-3.5 text-primary" />} required>
            Miejsce
          </FieldLabel>
          <Input
            id="wdr-location"
            value={request.location}
            onChange={(e) => update("location", e.target.value)}
            onBlur={() => touch("location")}
            aria-invalid={hasError("location")}
            placeholder="np. w Barlinku"
          />
          <FieldIssues issues={issuesFor("location")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="wdr-work-date" icon={<CalendarDays className="size-3.5 text-primary" />} required>
              Dzień pracy
            </FieldLabel>
            <DatePicker
              id="wdr-work-date"
              value={request.workDate}
              onChange={(value) => {
                update("workDate", value);
                touch("workDate");
              }}
              allowClear
              size="sm"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="wdr-issue-date" required>Data wniosku</FieldLabel>
            <DatePicker
              id="wdr-issue-date"
              value={request.issueDate}
              onChange={(value) => {
                update("issueDate", value);
                touch("issueDate");
              }}
              size="sm"
            />
          </div>
        </div>
        {workDay && (
          <Badge variant={workDay.kind === "workday" ? "warning-soft" : "primary-soft"} className="text-[11px]">
            {workDay.label}
          </Badge>
        )}
        <FieldIssues issues={[...issuesFor("workDate"), ...issuesFor("issueDate")]} />

        <div className="space-y-1.5">
          <FieldLabel icon={<Clock className="size-3.5 text-primary" />}>Godziny pracy (opcjonalnie)</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              aria-label="Od godziny"
              value={request.timeFrom}
              onChange={(e) => update("timeFrom", e.target.value)}
              onBlur={() => touch("time")}
              aria-invalid={hasError("time")}
              className="w-28"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="time"
              aria-label="Do godziny"
              value={request.timeTo}
              onChange={(e) => update("timeTo", e.target.value)}
              onBlur={() => touch("time")}
              aria-invalid={hasError("time")}
              className="w-28"
            />
          </div>
          <FieldIssues issues={issuesFor("time")} />
        </div>

        <div className="space-y-2">
          <FieldLabel icon={<Users className="size-3.5 text-primary" />} required>
            Pracownicy
          </FieldLabel>
          {request.employees.map((employee, index) => {
            const unitField = `employee:${employee.id}:unit` as const;
            const nameField = `employee:${employee.id}:fullName` as const;
            return (
              <div key={employee.id} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 shrink-0 text-right text-[11px] text-muted-foreground">{index + 1}.</span>
                  <Input
                    aria-label={`Komórka pracownika nr ${index + 1}`}
                    value={employee.unit}
                    onChange={(e) => updateEmployee(employee.id, "unit", e.target.value)}
                    onBlur={() => touch(unitField)}
                    aria-invalid={hasError(unitField)}
                    placeholder="Komórka"
                    className="w-24 shrink-0"
                  />
                  <Input
                    aria-label={`Imię i nazwisko pracownika nr ${index + 1}`}
                    value={employee.fullName}
                    onChange={(e) => updateEmployee(employee.id, "fullName", e.target.value)}
                    onBlur={() => touch(nameField)}
                    aria-invalid={hasError(nameField)}
                    placeholder="Imię i nazwisko"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeEmployee(employee.id)}
                    aria-label={`Usuń pracownika nr ${index + 1}`}
                    className="size-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="pl-5">
                  <FieldIssues issues={[...issuesFor(unitField), ...issuesFor(nameField)]} />
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2">
            {staffOptions.length > 0 && (
              <div className="min-w-0 flex-1">
                <SearchableSelect
                  value=""
                  onChange={handleStaffSelect}
                  options={staffOptions}
                  placeholder="+ Dodaj z kadry OZiPZ"
                  searchPlaceholder="Szukaj pracownika..."
                  size="sm"
                />
              </div>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => addEmployee()} className="gap-1.5">
              <UserPlus className="size-3.5" />
              Dodaj ręcznie
            </Button>
          </div>
          <FieldIssues issues={issuesFor("employees")} />
        </div>

        <details className="rounded-[3px] border border-border px-3 py-2 text-xs">
          <summary className="cursor-pointer font-bold">Nagłówek i adresat</summary>
          <div className="mt-2 space-y-2">
            <Input aria-label="Komórka nadawcy" value={request.senderUnit} onChange={(e) => update("senderUnit", e.target.value)} />
            <Input aria-label="Stacja nadawcy" value={request.senderStation} onChange={(e) => update("senderStation", e.target.value)} />
            <Input aria-label="Miejscowość" value={request.issuePlace} onChange={(e) => update("issuePlace", e.target.value)} />
            <Textarea aria-label="Adresat" value={request.recipient} onChange={(e) => update("recipient", e.target.value)} rows={2} className="text-xs" />
          </div>
        </details>

        <div
          className={cn(
            "flex items-start gap-2 rounded-[3px] border p-2.5 text-xs",
            errors.length > 0
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : warnings.length > 0
                ? "border-warning/40 bg-warning/10 text-amber-700 dark:text-amber-400"
                : "border-success/30 bg-success/10 text-success"
          )}
          role="status"
        >
          {errors.length > 0 ? (
            <XCircle className="mt-px size-3.5 shrink-0" />
          ) : warnings.length > 0 ? (
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-px size-3.5 shrink-0" />
          )}
          <div className="space-y-1">
            <p className="font-bold">
              {errors.length > 0
                ? `Do poprawy: ${errors.length}`
                : warnings.length > 0
                  ? `Wniosek kompletny, ostrzeżenia: ${warnings.length}`
                  : "Wniosek kompletny — można drukować."}
            </p>
            {showAllErrors && errors.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {errors.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Button type="button" onClick={handlePrint} className="w-full gap-1.5">
          <Printer className="size-4" />
          Drukuj wniosek
        </Button>
        {request.employees.length === 0 && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Plus className="size-3" /> Dodaj pracowników z kadry albo ręcznie (np. osoby z innych komórek).
          </p>
        )}
      </Card>

      <A4PrintPreview ref={previewRef} html={html} title="Podgląd wniosku o zgodę na pracę" />
    </div>
  );
}
