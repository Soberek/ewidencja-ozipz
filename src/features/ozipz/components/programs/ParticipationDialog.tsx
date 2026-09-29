import { useMemo, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { GraduationCap } from "lucide-react";
import type {
  OzipzSchoolParticipation,
  OzipzProgram,
  OzipzFacility,
  OzipzContact,
} from "../../types/ozipz.types";
import {
  currentSchoolYear,
  isSchoolYear,
  findDuplicateParticipation,
  coordinatorContactLine,
  schoolYearOptions,
} from "../../utils/participationUtils";
import { SchoolParticipationSchema } from "../../schemas/ozipz.schemas";
import { ParticipationProgramFacilityFields } from "./components/ParticipationProgramFacilityFields";
import { ParticipationCoordinatorFields } from "./components/ParticipationCoordinatorFields";
import { ParticipationMetricsStatusFields } from "./components/ParticipationMetricsStatusFields";
import type { NewContactData } from "./components/CoordinatorQuickAddPanel";
import { isContactOfFacility, isContactWithoutFacility, suggestCoordinator } from "./participationCoordinator";

/** Pole liczbowe formularza: puste pole (NaN z valueAsNumber) daje czytelny komunikat zamiast błędu typu. */
const countField = (min: number, message: string) => z.number({ error: message }).int(message).min(min, message);

export const ParticipationFormSchema = SchoolParticipationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  schoolYear: z.string().trim().min(1, "Wybierz rok szkolny z listy"),
  schoolCoordinatorName: z.string().trim().min(1, "Wybierz szkolnego koordynatora programu"),
  pupilsCount: countField(1, "Podaj liczbę uczniów biorących udział w programie (ogółem)"),
  classesCount: countField(1, "Liczba klas / oddziałów musi wynosić co najmniej 1"),
  parentsCount: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? 0 : value),
    countField(0, "Liczba rodziców nie może być ujemna")
  ),
});

export type ParticipationFormInput = z.input<typeof ParticipationFormSchema>;
export type ParticipationFormOutput = z.output<typeof ParticipationFormSchema>;

type ParticipationPayload = Omit<OzipzSchoolParticipation, "id" | "createdAt" | "updatedAt">;

interface ParticipationDialogProps {
  isOpen: boolean;
  onClose: () => unknown | Promise<unknown>;
  editingParticipation: OzipzSchoolParticipation | null;
  initialProgramId?: string;
  initialFacilityId?: string;
  programs: OzipzProgram[];
  facilities: OzipzFacility[];
  participations?: OzipzSchoolParticipation[];
  /** Spis Kontaktów – źródło szkolnych koordynatorów. */
  contacts?: OzipzContact[];
  contactPositions?: string[];
  onSave: (data: ParticipationPayload) => unknown | Promise<unknown>;
  onUpdate: (id: string, data: Partial<OzipzSchoolParticipation>) => unknown | Promise<unknown>;
  /** Szybkie dodanie koordynatora do Spisu Kontaktów bez zamykania formularza. */
  onQuickAddContact?: (data: NewContactData) => Promise<OzipzContact | undefined>;
  onUpdateContact?: (id: string, data: Partial<OzipzContact>) => unknown | Promise<unknown>;
}

export function ParticipationDialog({
  isOpen,
  onClose,
  editingParticipation,
  initialProgramId,
  initialFacilityId,
  programs,
  facilities,
  participations = [],
  contacts = [],
  contactPositions = [],
  onSave,
  onUpdate,
  onQuickAddContact,
  onUpdateContact,
}: ParticipationDialogProps) {
  const [assignToFacility, setAssignToFacility] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ParticipationFormInput, undefined, ParticipationFormOutput>({
    resolver: zodResolver(ParticipationFormSchema),
    defaultValues: {
      programId: initialProgramId || "",
      programName: "",
      facilityId: "",
      facilityName: "",
      municipality: "",
      schoolYear: currentSchoolYear(),
      schoolCoordinatorName: "",
      schoolCoordinatorContact: "",
      schoolCoordinatorContactId: "",
      classesCount: 1,
      pupilsCount: Number.NaN,
      parentsCount: 0,
      hasDeclaration: true,
      hasFinalReport: false,
      evaluationGrade: "",
      notes: "",
    },
  });

  // Listy czytane przy otwarciu formularza. Ich późniejsza zmiana (np. szybko dodany kontakt)
  // nie może resetować wpisanych danych, więc nie są zależnościami efektu.
  const lists = useRef({ programs, facilities, contacts });
  lists.current = { programs, facilities, contacts };

  useEffect(() => {
    if (!isOpen) return;
    const { programs: progs, facilities: facs, contacts: people } = lists.current;
    setAssignToFacility(true);
    if (editingParticipation) {
      const linkedId = editingParticipation.schoolCoordinatorContactId;
      reset({
        programId: editingParticipation.programId || "",
        programName: editingParticipation.programName || "",
        facilityId: editingParticipation.facilityId || "",
        facilityName: editingParticipation.facilityName || "",
        municipality: editingParticipation.municipality || "",
        schoolYear: editingParticipation.schoolYear || currentSchoolYear(),
        schoolCoordinatorName: editingParticipation.schoolCoordinatorName || "",
        schoolCoordinatorContact: editingParticipation.schoolCoordinatorContact || "",
        schoolCoordinatorContactId: linkedId && people.some((c) => c.id === linkedId) ? linkedId : "",
        classesCount: editingParticipation.classesCount || 1,
        pupilsCount: editingParticipation.pupilsCount || Number.NaN,
        parentsCount: editingParticipation.parentsCount || 0,
        hasDeclaration: editingParticipation.hasDeclaration ?? true,
        hasFinalReport: editingParticipation.hasFinalReport ?? false,
        evaluationGrade: editingParticipation.evaluationGrade || "",
        notes: editingParticipation.notes || "",
      });
    } else {
      const initProg = initialProgramId ? progs.find((p) => p.id === initialProgramId) : null;
      const initFac = initialFacilityId ? facs.find((f) => f.id === initialFacilityId) : null;
      const coordinator = suggestCoordinator(people, initFac);
      reset({
        programId: initialProgramId || "",
        programName: initProg ? initProg.name : "",
        facilityId: initFac?.id || "",
        facilityName: initFac?.name || "",
        municipality: initFac?.municipality || "",
        schoolYear: initProg?.editionYear && isSchoolYear(initProg.editionYear) ? initProg.editionYear : currentSchoolYear(),
        schoolCoordinatorName: coordinator?.name || "",
        schoolCoordinatorContact: coordinator ? coordinatorContactLine(coordinator) : "",
        schoolCoordinatorContactId: coordinator?.id || "",
        classesCount: 1,
        pupilsCount: Number.NaN,
        parentsCount: 0,
        hasDeclaration: true,
        hasFinalReport: false,
        evaluationGrade: "",
        notes: "",
      });
    }
  }, [editingParticipation, initialProgramId, initialFacilityId, isOpen, reset]);

  const selectedFacId = watch("facilityId") || "";
  const selectedProgramId = watch("programId") || "";
  const schoolYear = (watch("schoolYear") || "").trim();
  const coordinatorId = watch("schoolCoordinatorContactId") || "";
  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacId) || null,
    [facilities, selectedFacId]
  );

  const schoolYears = useMemo(
    () => schoolYearOptions([...participations.map((p) => p.schoolYear), ...programs.map((p) => p.editionYear)]),
    [participations, programs]
  );

  const programYearEntries = useMemo(
    () =>
      selectedProgramId && schoolYear
        ? participations.filter(
            (p) => p.programId === selectedProgramId && p.schoolYear.trim() === schoolYear && p.id !== editingParticipation?.id
          )
        : [],
    [participations, selectedProgramId, schoolYear, editingParticipation?.id]
  );

  const applyCoordinator = (contact: OzipzContact | null) => {
    setValue("schoolCoordinatorContactId", contact?.id || "");
    setValue("schoolCoordinatorName", contact?.name || "", { shouldValidate: Boolean(contact) });
    setValue("schoolCoordinatorContact", contact ? coordinatorContactLine(contact) : "");
  };

  const handleFacilitySelect = (id: string) => {
    setValue("facilityId", id, { shouldValidate: true });
    const f = facilities.find((item) => item.id === id);
    setValue("facilityName", f?.name || "", { shouldValidate: true });
    setValue("municipality", f?.municipality || "", { shouldValidate: true });
    if (!f) return;

    // Koordynatora podmieniamy tylko, gdy go brak albo należy do innej placówki.
    const current = contacts.find((c) => c.id === getValues("schoolCoordinatorContactId"));
    const hasCoordinator = Boolean(current) || Boolean(getValues("schoolCoordinatorName")?.trim());
    const belongsElsewhere = current && !isContactOfFacility(current, f) && !isContactWithoutFacility(current, facilities);
    if (!hasCoordinator || belongsElsewhere) applyCoordinator(suggestCoordinator(contacts, f) || null);
  };

  const handleProgramSelect = (progId: string) => {
    const selProg = programs.find((p) => p.id === progId);
    setValue("programId", progId, { shouldValidate: true });
    setValue("programName", selProg?.name || "", { shouldValidate: true });
    if (selProg) {
      if (!editingParticipation && isSchoolYear(selProg.editionYear)) setValue("schoolYear", selProg.editionYear, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ParticipationFormOutput) => {
    if (!isSchoolYear(data.schoolYear.trim())) {
      setError("schoolYear", { message: "Wybierz rok szkolny z listy" });
      return;
    }
    const facility = facilities.find((f) => f.id === data.facilityId);
    if (!facility) {
      setError("facilityName", { message: "Wybierz placówkę z bazy. Brakującą placówkę dodaj w Bazie placówek." });
      return;
    }
    const selProg = programs.find((p) => p.id === data.programId);
    if (!selProg) {
      setError("programId", { message: "Wybierz program z katalogu." });
      return;
    }
    // Aktualne dane z kartoteki; kontakt usunięty w międzyczasie zostaje jako wpis bez powiązania.
    const coordinator = data.schoolCoordinatorContactId
      ? contacts.find((c) => c.id === data.schoolCoordinatorContactId)
      : undefined;
    const payload: ParticipationPayload = {
      ...data,
      programName: selProg.name,
      facilityId: facility.id,
      facilityName: facility.name,
      municipality: facility.municipality,
      schoolYear: data.schoolYear.trim(),
      schoolCoordinatorName: coordinator?.name.trim() || data.schoolCoordinatorName.trim(),
      schoolCoordinatorContact: coordinator ? coordinatorContactLine(coordinator) : data.schoolCoordinatorContact?.trim() || "",
      schoolCoordinatorContactId: coordinator?.id,
      classesCount: data.classesCount,
      pupilsCount: data.pupilsCount,
      parentsCount: data.parentsCount,
      hasDeclaration: Boolean(data.hasDeclaration),
      hasFinalReport: Boolean(data.hasFinalReport),
      evaluationGrade: data.evaluationGrade || "",
      notes: data.notes?.trim() || "",
    };

    if (findDuplicateParticipation(participations, payload, editingParticipation?.id)) {
      setError("facilityName", { message: "Ta placówka ma już zgłoszenie do tego programu w wybranym roku z tym samym koordynatorem. Edytuj istniejące zgłoszenie." });
      return;
    }
    try {
      if (editingParticipation) await onUpdate(editingParticipation.id, payload);
      else await onSave(payload);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nie udało się zapisać zgłoszenia." });
      return;
    }
    if (coordinator && assignToFacility && onUpdateContact && isContactWithoutFacility(coordinator, facilities)) {
      try {
        await onUpdateContact(coordinator.id, {
          facilityId: facility.id,
          facilityName: facility.name,
          municipality: facility.municipality,
        });
      } catch {
        // Zgłoszenie jest zapisane; o błędzie przypisania kontaktu informuje komunikat operacji.
      }
    }
    onClose();
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
      headerAccent="primary"
      icon={<GraduationCap className="size-5" />}
      title={
        editingParticipation
          ? "Edycja Zgłoszenia do Programu"
          : "Nowe Zgłoszenie Szkoły / Placówki do Programu"
      }
      description="Udział placówki w programie profilaktycznym: koordynator szkolny, liczba uczniów, deklaracja i sprawozdanie"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitText={editingParticipation ? "Zapisz Zmiany" : "Zapisz Zgłoszenie"}
    >
      <div className="space-y-4">
        <ParticipationProgramFacilityFields
          register={register}
          errors={errors}
          selectedFacId={selectedFacId}
          programs={programs}
          facilities={facilities}
          programYearEntries={programYearEntries}
          schoolYear={schoolYear}
          schoolYears={schoolYears}
          onSchoolYearChange={(year) => setValue("schoolYear", year, { shouldValidate: true })}
          onProgramSelect={handleProgramSelect}
          onFacilitySelect={handleFacilitySelect}
          currentProgramId={selectedProgramId}
        />

        <ParticipationCoordinatorFields
          contacts={contacts}
          facilities={facilities}
          facility={selectedFacility}
          positions={contactPositions}
          selectedContactId={coordinatorId}
          storedName={watch("schoolCoordinatorName") || ""}
          storedContactLine={watch("schoolCoordinatorContact") || ""}
          error={errors.schoolCoordinatorName?.message}
          assignToFacility={assignToFacility}
          onAssignToFacilityChange={setAssignToFacility}
          onSelect={applyCoordinator}
          onQuickAdd={onQuickAddContact}
        />

        <ParticipationMetricsStatusFields
          register={register}
          errors={errors}
          currentEvaluationGrade={watch("evaluationGrade") || ""}
          onEvaluationGradeChange={(val) => setValue("evaluationGrade", val, { shouldValidate: true })}
        />
      </div>
    </ModalDialog>
  );
}
