import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Calendar } from "lucide-react";
import type {
  OzipzScheduleEvent,
  OzipzDictionaryItem,
  OzipzFacility,
  OzipzProgram,
  OzipzStaff,
} from "../../types/ozipz.types";
import { ScheduleEventSchema } from "../../schemas/ozipz.schemas";
import { z } from "zod";
import { format, isValid, parseISO } from "date-fns";
import { ScheduleActivityFormFields } from "./components/ScheduleActivityFormFields";
import { ScheduleLocationDatesFields } from "./components/ScheduleLocationDatesFields";
import { ScheduleStatusNotesFields } from "./components/ScheduleStatusNotesFields";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { POLISH_MONTHS_NOMINATIVE } from "../../utils/adnotacjaUtils";
import { findCampaign } from "../actions/editor/actionEditorSubmitUtils";

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  isValid(parseISO(value)) && format(parseISO(value), "yyyy-MM-dd") === value;

export const ScheduleFormSchema = ScheduleEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().trim().min(1, "Wpisz tytuł zadania."),
  activityTypeCode: z.string().min(1, "Wybierz formę działania."),
  eventDate: z.string().min(1, "Wybierz datę realizacji.").refine((value) => !value || isIsoDate(value), "Wybierz prawidłową datę."),
  endDate: z.string().optional().refine((value) => !value || isIsoDate(value), "Wybierz prawidłową datę zakończenia."),
  location: z.string().trim().min(1, "Wpisz miejsce realizacji."),
  status: z.string().min(1, "Wybierz status zadania."),
  responsiblePerson: z.string().min(1, "Wybierz osobę odpowiedzialną."),
}).superRefine((data, ctx) => {
  if (data.endDate && data.endDate < data.eventDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "Data zakończenia nie może być wcześniejsza niż rozpoczęcia." });
  }
  if (["postponed", "odroczone", "odwolane"].includes(data.status) && !data.annotationReasonCode) {
    ctx.addIssue({ code: "custom", path: ["annotationReasonCode"], message: "Wybierz powód odroczenia lub odwołania." });
  }
});

export type ScheduleFormInput = z.input<typeof ScheduleFormSchema>;
export type ScheduleFormOutput = z.output<typeof ScheduleFormSchema>;

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent?: OzipzScheduleEvent | null;
  activityTypes?: OzipzDictionaryItem[];
  recipientGroups?: OzipzDictionaryItem[];
  campaigns?: OzipzDictionaryItem[];
  annotationReasons?: OzipzDictionaryItem[];
  facilities?: OzipzFacility[];
  programs?: OzipzProgram[];
  staff?: OzipzStaff[];
  onSave: (data: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt">) => void | Promise<void>;
  onUpdate: (id: string, data: Partial<OzipzScheduleEvent>) => void | Promise<void>;
}

export function ScheduleDialog({
  isOpen,
  onClose,
  editingEvent,
  activityTypes = [],
  recipientGroups = [],
  campaigns = [],
  annotationReasons = [],
  facilities = [],
  programs = [],
  staff = [],
  onSave,
  onUpdate,
}: ScheduleDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormInput, undefined, ScheduleFormOutput>({
    resolver: zodResolver(ScheduleFormSchema),
    defaultValues: {
      activityTypeCode: "",
      title: "",
      eventDate: getTodayIsoDate(),
      endDate: "",
      topic: "",
      programId: "",
      campaignId: "",
      recipientGroup: "",
      location: "",
      facilityId: "",
      status: "zaplanowane",
      annotationReasonCode: "",
      responsiblePerson: "",
      notes: "",
    },
  });

  const selectedActivityTypeCode = watch("activityTypeCode");
  const selectedStatus = watch("status");
  const selectedProgramId = watch("programId");
  const selectedCampaignId = watch("campaignId");

  useEffect(() => {
    if (editingEvent) {
      reset({
        activityTypeCode: editingEvent.activityTypeCode || "",
        title: editingEvent.title || "",
        eventDate: editingEvent.eventDate || getTodayIsoDate(),
        endDate: editingEvent.endDate || "",
        topic: editingEvent.topic || "",
        programId: editingEvent.programId || "",
        // Starsze zadania trzymają id pozycji słownika – formularz pracuje na kodzie, jak rejestr działań.
        campaignId: findCampaign(campaigns, editingEvent.campaignId)?.code || editingEvent.campaignId || "",
        recipientGroup: editingEvent.recipientGroup || "",
        location: editingEvent.location || "",
        facilityId: editingEvent.facilityId || "",
        status: editingEvent.status || "zaplanowane",
        annotationReasonCode: editingEvent.annotationReasonCode || "",
        responsiblePerson: editingEvent.responsiblePerson || "",
        notes: editingEvent.notes || "",
      });
    } else {
      reset({
        activityTypeCode: "",
        title: "",
        eventDate: getTodayIsoDate(),
        endDate: "",
        topic: "",
        programId: "",
        campaignId: "",
        recipientGroup: "",
        location: "",
        facilityId: "",
        status: "zaplanowane",
        annotationReasonCode: "",
        responsiblePerson: "",
        notes: "",
      });
    }
  }, [editingEvent, isOpen, reset]);

  const handleActivityTypeChange = (code: string) => {
    setValue("activityTypeCode", code, { shouldValidate: true });
    const found = activityTypes.find((a) => a.code === code);
    if (found && !watch("title")?.trim()) {
      setValue("title", found.label, { shouldValidate: true });
    }
  };

  const handleFacilityChange = (facId: string) => {
    setValue("facilityId", facId);
    const found = facilities.find((f) => f.id === facId);
    if (found) {
      setValue("location", `${found.name}, ${found.city || found.municipality}`, { shouldValidate: true });
    }
  };

  const handleLocationChange = (location: string) => {
    setValue("location", location, { shouldValidate: true });
    setValue("facilityId", "");
  };

  const onSubmit = async (data: ScheduleFormOutput) => {
    const selectedAct = activityTypes.find((a) => a.code === data.activityTypeCode);
    const selectedProg = programs.find((p) => p.id === data.programId);
    const selectedCamp = findCampaign(campaigns, data.campaignId);
    const selectedReason = annotationReasons.find((r) => r.code === data.annotationReasonCode);

    const isPostponed = data.status === "postponed" || data.status === "odroczone" || data.status === "odwolane";

    const payload: Omit<OzipzScheduleEvent, "id" | "createdAt" | "updatedAt"> = {
      title: data.title.trim(),
      activityTypeCode: data.activityTypeCode || undefined,
      activityTypeName: selectedAct?.label ?? (editingEvent?.activityTypeCode === data.activityTypeCode ? editingEvent?.activityTypeName : undefined),
      eventDate: data.eventDate,
      endDate: data.endDate?.trim() || undefined,
      topic: data.topic?.trim() || (selectedProg ? selectedProg.name : undefined),
      programId: data.programId || undefined,
      programName: selectedProg?.name ?? (editingEvent?.programId === data.programId ? editingEvent?.programName : undefined),
      campaignId: selectedCamp?.code || data.campaignId || undefined,
      campaignName: selectedCamp?.label ?? (editingEvent?.campaignId === data.campaignId ? editingEvent?.campaignName : undefined),
      recipientGroup: data.recipientGroup || undefined,
      location: data.location.trim() || "",
      facilityId: data.facilityId || undefined,
      status: data.status,
      annotationReasonCode: isPostponed ? data.annotationReasonCode : undefined,
      annotationReasonLabel: isPostponed
        ? selectedReason?.label ?? (editingEvent?.annotationReasonCode === data.annotationReasonCode ? editingEvent?.annotationReasonLabel : undefined)
        : undefined,
      annotationText: isPostponed ? editingEvent?.annotationText : undefined,
      responsiblePerson: data.responsiblePerson.trim() || "",
      month: Number(data.eventDate.slice(5, 7)),
      monthName: POLISH_MONTHS_NOMINATIVE[Number(data.eventDate.slice(5, 7))],
      year: Number(data.eventDate.slice(0, 4)),
      manuallyCompleted: editingEvent?.status === data.status ? editingEvent.manuallyCompleted : false,
      notes: data.notes?.trim() || undefined,
    };

    try {
      if (editingEvent) {
        await onUpdate(editingEvent.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać zadania." });
    }
  };

  const errorMessage = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)
    .join(" ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      headerAccent="amber"
      icon={<Calendar className="size-5" />}
      title={editingEvent ? "Edytuj zadanie" : "Dodaj zadanie do planu pracy"}
      description="Uzupełnij szczegóły zadania. Pola oznaczone * są wymagane."
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingEvent ? "Zapisz zmiany" : "Dodaj zadanie"}
    >
      <div className="space-y-5">
        <section aria-labelledby="schedule-task-heading" className="space-y-3">
          <h3 id="schedule-task-heading" className="border-b border-border pb-2 text-sm font-semibold">Zadanie</h3>
          <ScheduleActivityFormFields
            register={register}
            errors={errors}
            selectedActivityTypeCode={selectedActivityTypeCode ?? ""}
            selectedProgramId={selectedProgramId ?? ""}
            selectedCampaignId={selectedCampaignId ?? ""}
            activityTypes={activityTypes}
            programs={programs}
            campaigns={campaigns}
            onActivityTypeChange={handleActivityTypeChange}
            onProgramChange={(progId) => setValue("programId", progId, { shouldValidate: true })}
            onCampaignChange={(campId) => setValue("campaignId", campId, { shouldValidate: true })}
          />
        </section>

        <section aria-labelledby="schedule-place-heading" className="space-y-3">
          <h3 id="schedule-place-heading" className="border-b border-border pb-2 text-sm font-semibold">Termin i odbiorcy</h3>
          <ScheduleLocationDatesFields
            errors={errors}
            facilities={facilities}
            recipientGroups={recipientGroups}
            onFacilityChange={handleFacilityChange}
            currentRecipientGroup={watch("recipientGroup") ?? ""}
            onRecipientGroupChange={(grp) => setValue("recipientGroup", grp, { shouldValidate: true })}
            currentLocation={watch("location") ?? ""}
            onLocationChange={handleLocationChange}
            eventDate={watch("eventDate") ?? ""}
            onEventDateChange={(d) => setValue("eventDate", d, { shouldValidate: true })}
            endDate={watch("endDate") ?? ""}
            onEndDateChange={(d) => setValue("endDate", d, { shouldValidate: true })}
          />
        </section>

        <section aria-labelledby="schedule-status-heading" className="space-y-3">
          <h3 id="schedule-status-heading" className="border-b border-border pb-2 text-sm font-semibold">Organizacja i status</h3>
          <ScheduleStatusNotesFields
            register={register}
            errors={errors}
            selectedStatus={selectedStatus ?? ""}
            staff={staff}
            annotationReasons={annotationReasons}
            currentResponsiblePerson={watch("responsiblePerson") ?? ""}
            onResponsiblePersonChange={(val) => setValue("responsiblePerson", val, { shouldValidate: true })}
            onStatusChange={(val) => setValue("status", val, { shouldValidate: true })}
            currentAnnotationReasonCode={watch("annotationReasonCode") ?? ""}
            onAnnotationReasonChange={(val) => setValue("annotationReasonCode", val, { shouldValidate: true })}
          />
        </section>
      </div>
    </ModalDialog>
  );
}
