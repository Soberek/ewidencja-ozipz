import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type {
  OzipzRegisterItem,
  OzipzRegisterType,
  OzipzFacility,
  OzipzProgram,
  OzipzStaff,
} from "../../types/ozipz.types";
import {
  REGISTER_TYPE_OPTIONS,
  RegisterFormSchema,
  type RegisterFormInput,
  type RegisterFormOutput,
} from "./registerTypes";
import { RegisterFormFields } from "./components/RegisterFormFields";
import { getTodayIsoDate } from "../../utils/dateUtils";

export { REGISTER_TYPE_OPTIONS };

export interface RegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: OzipzRegisterItem | null;
  defaultType?: string;
  facilities: OzipzFacility[];
  programs?: OzipzProgram[];
  staff?: OzipzStaff[];
  onSave: (data: Omit<OzipzRegisterItem, "id" | "createdAt" | "updatedAt">) => void;
  onUpdate: (id: string, data: Partial<OzipzRegisterItem>) => void;
}

export function RegisterDialog({
  isOpen,
  onClose,
  editingItem,
  defaultType = "",
  facilities,
  programs = [],
  staff = [],
  onSave,
  onUpdate,
}: RegisterDialogProps) {
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      registerType: (defaultType as OzipzRegisterType) || "",
      registerNumber: "",
      date: getTodayIsoDate(),
      title: "",
      facilityId: "",
      facilityName: "",
      organizer: "",
      responsiblePerson: "",
      targetAudience: "",
      participantsCount: 0,
      programId: "",
      programName: "",
      notes: "",
      jrwaSign: "",
    },
  });

  const selectedType = watch("registerType") as OzipzRegisterType;
  const selectedFacilityId = watch("facilityId");
  const selectedProgramId = watch("programId");

  useEffect(() => {
    if (editingItem) {
      reset({
        registerType: editingItem.registerType,
        registerNumber: editingItem.registerNumber || "",
        date: editingItem.date || getTodayIsoDate(),
        title: editingItem.title || "",
        facilityId: editingItem.facilityId || "",
        facilityName: editingItem.facilityName || "",
        organizer: editingItem.organizer || "",
        responsiblePerson: editingItem.responsiblePerson || "",
        targetAudience: editingItem.targetAudience || "",
        participantsCount: editingItem.participantsCount || 0,
        programId: editingItem.programId || "",
        programName: editingItem.programName || "",
        notes: editingItem.notes || "",
        jrwaSign: editingItem.jrwaSign || "",
      });
    } else {
      reset({
        registerType: (defaultType as OzipzRegisterType) || "",
        registerNumber: "",
        date: getTodayIsoDate(),
        title: "",
        facilityId: "",
        facilityName: "",
        organizer: "",
        responsiblePerson: "",
        targetAudience: "",
        participantsCount: 0,
        programId: "",
        programName: "",
        notes: "",
        jrwaSign: "",
      });
    }
  }, [editingItem, defaultType, isOpen, reset, currentYear]);

  const onSubmit = async (data: RegisterFormOutput) => {
    if (editingItem) {
      onUpdate(editingItem.id, data);
    } else {
      onSave(data);
    }
    onClose();
  };

  const typeConfig = REGISTER_TYPE_OPTIONS.find((t) => t.value === selectedType);
  const errorMessage = Object.values(errors).map((e) => e?.message).filter(Boolean).join(", ");

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? `Edycja Wpisu: ${typeConfig?.shortLabel || ""}` : `Nowy Wpis: ${typeConfig?.shortLabel || ""}`}
      description="Zarejestruj oficjalną pozycję w rejestrze urzędowym OZiPZ."
      size="lg"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      submitText={editingItem ? "Zapisz Zmiany" : "Dodaj do Rejestru"}
    >
      <RegisterFormFields
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        selectedType={selectedType}
        selectedFacilityId={selectedFacilityId}
        selectedProgramId={selectedProgramId}
        facilities={facilities}
        programs={programs}
        staff={staff}
        editingItem={editingItem}
        currentYear={currentYear}
      />
    </ModalDialog>
  );
}

export default RegisterDialog;
