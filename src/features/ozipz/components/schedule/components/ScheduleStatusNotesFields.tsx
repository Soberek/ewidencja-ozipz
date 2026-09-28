import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OzipzStaff, OzipzDictionaryItem } from "../../../types/ozipz.types";
import type { ScheduleFormInput } from "../ScheduleDialog";

interface ScheduleStatusNotesFieldsProps {
  register: UseFormRegister<ScheduleFormInput>;
  errors: FieldErrors<ScheduleFormInput>;
  selectedStatus: string;
  staff: OzipzStaff[];
  annotationReasons: OzipzDictionaryItem[];
  currentResponsiblePerson: string;
  onResponsiblePersonChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  currentAnnotationReasonCode: string;
  onAnnotationReasonChange: (value: string) => void;
}

const statusOptions: SelectOption[] = [
  { value: "zaplanowane", label: "Zaplanowane", badge: "Plan", badgeVariant: "secondary" },
  { value: "w_toku", label: "W trakcie realizacji", badge: "W toku", badgeVariant: "warning" },
  { value: "wykonane", label: "Wykonane", badge: "Wykonane", badgeVariant: "success" },
  { value: "odroczone", label: "Odroczone", badge: "Odroczone", badgeVariant: "destructive" },
  { value: "odwolane", label: "Odwołane", badge: "Odwołane", badgeVariant: "destructive" },
];

export function ScheduleStatusNotesFields({
  register,
  errors,
  selectedStatus,
  staff,
  annotationReasons,
  currentResponsiblePerson,
  onResponsiblePersonChange,
  onStatusChange,
  currentAnnotationReasonCode,
  onAnnotationReasonChange,
}: ScheduleStatusNotesFieldsProps) {
  const isPostponed = ["postponed", "odroczone", "odwolane"].includes(selectedStatus);
  const staffOptions: SelectOption[] = useMemo(() => staff.map((person) => ({
    value: person.fullName,
    label: person.fullName,
    description: person.role,
    icon: User,
  })), [staff]);
  const reasonOptions: SelectOption[] = useMemo(() => annotationReasons.map((reason) => ({
    value: reason.code,
    label: reason.label,
  })), [annotationReasons]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          id="schedule-status"
          label="Status zadania"
          required
          value={selectedStatus}
          onChange={onStatusChange}
          options={statusOptions}
          searchable={false}
          error={errors.status?.message as string}
        />
        <Select
          id="schedule-responsible-person"
          label="Osoba odpowiedzialna"
          required
          value={currentResponsiblePerson}
          onChange={onResponsiblePersonChange}
          options={staffOptions}
          placeholder="Wybierz pracownika"
          searchPlaceholder="Szukaj pracownika..."
          error={errors.responsiblePerson?.message as string}
        />
      </div>

      {isPostponed && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
          <Select
            id="schedule-annotation-reason"
            label="Powód odroczenia lub odwołania"
            required
            value={currentAnnotationReasonCode}
            onChange={onAnnotationReasonChange}
            options={reasonOptions}
            placeholder="Wybierz powód"
            searchPlaceholder="Szukaj powodu..."
            error={errors.annotationReasonCode?.message as string}
          />
          <p className="mt-2 text-xs text-muted-foreground">Zmiana terminu lub odwołanie zadania wymaga uzasadnienia.</p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="schedule-notes" className="block text-xs font-semibold text-foreground">Uwagi</label>
        <Textarea
          id="schedule-notes"
          {...register("notes")}
          rows={3}
          placeholder="Dodatkowe informacje o zadaniu"
        />
      </div>
    </div>
  );
}
