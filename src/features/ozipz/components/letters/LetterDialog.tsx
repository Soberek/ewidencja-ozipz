import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { AlarmClock, Mail } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import type {
  OzipzLetter,
  OzipzFacility,
  OzipzProgram,
  OzipzJrwaCase,
  OzipzStaff,
} from "../../types/ozipz.types";
import { LetterSchema } from "../../schemas/ozipz.schemas";
import { z } from "zod";
import { LetterHeaderKancelariaCard } from "./components/LetterHeaderKancelariaCard";
import { LetterEntityRelationFields } from "./components/LetterEntityRelationFields";
import { getTodayIsoDate } from "../../utils/dateUtils";

export const LetterFormSchema = LetterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LetterFormInput = z.input<typeof LetterFormSchema>;
export type LetterFormOutput = z.output<typeof LetterFormSchema>;

interface LetterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingLetter: OzipzLetter | null;
  initialValues?: Partial<OzipzLetter>;
  facilities: OzipzFacility[];
  programs: OzipzProgram[];
  jrwaCases: OzipzJrwaCase[];
  staff: OzipzStaff[];
  onSave: (data: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt">) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzLetter>) => unknown | Promise<unknown>;
}

export function LetterDialog({
  isOpen,
  onClose,
  editingLetter,
  initialValues,
  facilities,
  programs,
  jrwaCases,
  staff,
  onSave,
  onUpdate,
}: LetterDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LetterFormInput, undefined, LetterFormOutput>({
    resolver: zodResolver(LetterFormSchema),
    defaultValues: {
      direction: "wychodzace",
      letterNumber: "",
      letterDate: getTodayIsoDate(),
      caseSign: "",
      senderRecipient: "",
      facilityId: "",
      subject: "",
      programId: "",
      assignedPerson: "",
      status: "nowe",
      notes: "",
      responseDueDate: "",
    },
  });

  const direction = watch("direction");
  const facilityId = watch("facilityId");
  const caseSign = watch("caseSign");

  useEffect(() => {
    if (editingLetter) {
      reset({
        direction: editingLetter.direction,
        letterNumber: editingLetter.letterNumber || "",
        letterDate: editingLetter.letterDate || getTodayIsoDate(),
        caseSign: editingLetter.caseSign || "",
        senderRecipient: editingLetter.senderRecipient || "",
        facilityId: editingLetter.facilityId || "",
        subject: editingLetter.subject || "",
        programId: editingLetter.programId || "",
        assignedPerson: editingLetter.assignedPerson || "",
        status: editingLetter.status || "nowe",
        notes: editingLetter.notes || "",
        responseDueDate: editingLetter.responseDueDate || "",
      });
    } else {
      reset({
        direction: "wychodzace",
        letterNumber: "",
        letterDate: getTodayIsoDate(),
        caseSign: "",
        senderRecipient: "",
        facilityId: "",
        subject: "",
        programId: "",
        assignedPerson: "",
        status: "nowe",
        notes: "",
        responseDueDate: "",
        ...initialValues,
      });
    }
  }, [editingLetter, initialValues, isOpen, reset]);

  const handleFacilityChange = (facId: string) => {
    setValue("facilityId", facId);
    if (!facId) return;
    const found = facilities.find((f) => f.id === facId);
    if (found && !watch("senderRecipient")) {
      setValue("senderRecipient", `${found.name} (${found.city})`);
    }
  };

  const handleCaseChange = (sign: string) => {
    setValue("caseSign", sign);
    if (!sign) return;
    const found = jrwaCases.find((c) => c.fullCaseSign === sign);
    if (found) {
      if (found.programId && !watch("programId")) {
        setValue("programId", found.programId);
      }
      if (found.assignedEducator && !watch("assignedPerson")) {
        setValue("assignedPerson", found.assignedEducator);
      }
    }
  };

  const onSubmit = async (data: LetterFormOutput) => {
    const payload: Omit<OzipzLetter, "id" | "createdAt" | "updatedAt"> = {
      direction: data.direction,
      letterNumber: data.letterNumber.trim(),
      letterDate: data.letterDate.trim(),
      caseSign: data.caseSign?.trim() || undefined,
      senderRecipient: (data.senderRecipient || "").trim(),
      facilityId: data.facilityId || undefined,
      subject: data.subject.trim(),
      programId: data.programId || undefined,
      assignedPerson: (data.assignedPerson || "").trim(),
      status: data.status || "nowe",
      notes: data.notes?.trim() || undefined,
      responseDueDate: data.responseDueDate || undefined,
    };

    try {
      if (editingLetter) await onUpdate(editingLetter.id, payload);
      else await onSave(payload);
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać pisma." });
    }
  };

  const errorMessage = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(", ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerAccent="blue"
      icon={<Mail className="size-5" />}
      title={editingLetter ? "Edycja Pisma Urzędowego" : "Nowe Pismo w Dzienniku Korespondencji"}
      description="Dziennik korespondencji przychodzącej i wychodzącej sekcji OZiPZ"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingLetter ? "Zapisz Zmiany" : "Zarejestruj Pismo"}
    >
      <div className="space-y-4">
        <LetterHeaderKancelariaCard
          register={register}
          errors={errors}
          direction={direction}
          onDirectionChange={(val) => setValue("direction", val, { shouldValidate: true })}
          letterDate={watch("letterDate") || ""}
          onLetterDateChange={(val) => setValue("letterDate", val, { shouldValidate: true })}
        />

        <LetterEntityRelationFields
          register={register}
          errors={errors}
          direction={direction}
          facilityId={facilityId || ""}
          caseSign={caseSign || ""}
          facilities={facilities}
          programs={programs}
          jrwaCases={jrwaCases}
          staff={staff}
          onFacilityChange={handleFacilityChange}
          onCaseChange={handleCaseChange}
          currentSenderRecipient={watch("senderRecipient") || ""}
          onSenderRecipientChange={(val) => setValue("senderRecipient", val, { shouldValidate: true })}
          currentProgramId={watch("programId") || ""}
          onProgramIdChange={(val) => setValue("programId", val, { shouldValidate: true })}
          currentAssignedPerson={watch("assignedPerson") || ""}
          onAssignedPersonChange={(val) => setValue("assignedPerson", val, { shouldValidate: true })}
          currentStatus={watch("status") || "nowe"}
          onStatusChange={(val) => setValue("status", val as LetterFormInput["status"], { shouldValidate: true })}
        />

        <div className="space-y-1 sm:w-1/2">
          <label htmlFor="letter-response-due" className="font-semibold text-foreground flex items-center gap-1 text-xs">
            <AlarmClock className="size-3 text-primary" /> Termin odpowiedzi / załatwienia
          </label>
          <DatePicker
            id="letter-response-due"
            value={watch("responseDueDate") || ""}
            onChange={(date) => setValue("responseDueDate", date, { shouldValidate: true })}
            placeholder="Brak terminu"
            size="sm"
            allowClear
          />
          <p className="text-[11px] text-muted-foreground">Pulpit przypomni o terminie, dopóki pismo nie będzie zakończone.</p>
        </div>
      </div>
    </ModalDialog>
  );
}
