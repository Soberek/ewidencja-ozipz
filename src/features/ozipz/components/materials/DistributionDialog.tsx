import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { SearchableSelect } from "@/components/ui/select";
import { Package, Layers } from "lucide-react";
import type {
  OzipzMaterial,
  OzipzDistribution,
  OzipzFacility,
  OzipzStaff,
  OzipzDictionaryItem,
  OzipzAction,
} from "../../types/ozipz.types";
import { DistributionSchema } from "../../schemas/ozipz.schemas";
import { z } from "zod";
import { DistributionMaterialCard } from "./components/DistributionMaterialCard";
import { DistributionRecipientCard } from "./components/DistributionRecipientCard";
import { DistributionDetailsCard } from "./components/DistributionDetailsCard";
import { getTodayIsoDate } from "../../utils/dateUtils";

export const DistributionFormSchema = DistributionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DistributionFormInput = z.input<typeof DistributionFormSchema>;
export type DistributionFormOutput = z.output<typeof DistributionFormSchema>;

interface DistributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingDistribution: OzipzDistribution | null;
  initialMaterialId?: string;
  materials: OzipzMaterial[];
  materialTypes: OzipzDictionaryItem[];
  facilities: OzipzFacility[];
  staff: OzipzStaff[];
  actions?: OzipzAction[];
  municipalities?: string[];
  onSave: (data: Omit<OzipzDistribution, "id" | "createdAt">) => void;
  onUpdate: (id: string, data: Partial<OzipzDistribution>) => void;
}

export function DistributionDialog({
  isOpen,
  onClose,
  editingDistribution,
  initialMaterialId,
  materials,
  materialTypes,
  facilities,
  staff,
  actions = [],
  municipalities = [],
  onSave,
  onUpdate,
}: DistributionDialogProps) {
  const dynamicMunicipalities: string[] = useMemo(() => {
    const fromProps = municipalities.filter(Boolean);
    const fromFac = facilities.map((f) => f.municipality).filter(Boolean);
    return Array.from(new Set([...fromProps, ...fromFac])).sort((a: string, b: string) =>
      a.localeCompare(b, "pl")
    );
  }, [municipalities, facilities]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DistributionFormInput, undefined, DistributionFormOutput>({
    resolver: zodResolver(DistributionFormSchema),
    defaultValues: {
      materialId: initialMaterialId || "",
      materialTitle: "",
      materialType: "",
      recipientName: "",
      facilityId: "",
      municipality: "",
      actionId: "",
      actionTitle: "",
      quantity: 0,
      distributionDate: getTodayIsoDate(),
      assignedEducator: "",
      purpose: "",
      notes: "",
    },
  });

  const selectedMaterialId = watch("materialId");
  const selectedFacilityId = watch("facilityId");
  const selectedActionId = watch("actionId");

  useEffect(() => {
    if (editingDistribution) {
      reset({
        materialId: editingDistribution.materialId || "",
        materialTitle: editingDistribution.materialTitle || "",
        materialType: editingDistribution.materialType || "",
        recipientName: editingDistribution.recipientName || "",
        facilityId: editingDistribution.facilityId || "",
        municipality: editingDistribution.municipality || "",
        actionId: editingDistribution.actionId || "",
        actionTitle: editingDistribution.actionTitle || "",
        quantity: editingDistribution.quantity || 0,
        distributionDate:
          editingDistribution.distributionDate || getTodayIsoDate(),
        assignedEducator: editingDistribution.assignedEducator || "",
        purpose: editingDistribution.purpose || "",
        notes: editingDistribution.notes || "",
      });
    } else {
      reset({
        materialId: initialMaterialId || "",
        materialTitle: "",
        materialType: "",
        recipientName: "",
        facilityId: "",
        municipality: "",
        actionId: "",
        actionTitle: "",
        quantity: 0,
        distributionDate: getTodayIsoDate(),
        assignedEducator: "",
        purpose: "",
        notes: "",
      });
    }
  }, [editingDistribution, initialMaterialId, isOpen, reset]);

  const handleMaterialChange = (matId: string) => {
    setValue("materialId", matId);
    if (!matId) return;
    const found = materials.find((m) => m.id === matId);
    if (found) {
      setValue("materialTitle", found.title);
      setValue("materialType", found.materialType);
    }
  };

  const handleFacilityChange = (facId: string) => {
    setValue("facilityId", facId);
    if (!facId) return;
    const found = facilities.find((f) => f.id === facId);
    if (found) {
      setValue("recipientName", found.name);
      if (found.municipality) setValue("municipality", found.municipality);
    }
  };

  const handleActionChange = (actId: string) => {
    setValue("actionId", actId);
    if (!actId) {
      setValue("actionTitle", "");
      return;
    }
    const found = actions.find((a) => a.id === actId);
    if (found) {
      setValue("actionTitle", found.title);
      if (found.facilityName && !watch("recipientName")) {
        setValue("recipientName", found.facilityName);
      }
      if (found.facilityId && !watch("facilityId")) {
        setValue("facilityId", found.facilityId);
      }
      if (found.municipality && !watch("municipality")) {
        setValue("municipality", found.municipality);
      }
    }
  };

  const onSubmit = (data: DistributionFormOutput) => {
    const payload: Omit<OzipzDistribution, "id" | "createdAt"> = {
      materialId: data.materialId,
      materialTitle: data.materialTitle.trim(),
      materialType: data.materialType,
      facilityId: data.facilityId || undefined,
      recipientName: data.recipientName.trim(),
      municipality: data.municipality || undefined,
      actionId: data.actionId || undefined,
      actionTitle: data.actionTitle?.trim() || undefined,
      quantity: Number(data.quantity) || 0,
      distributionDate: data.distributionDate.trim(),
      assignedEducator: data.assignedEducator?.trim() || "",
      purpose: data.purpose?.trim() || "",
      notes: data.notes?.trim() || undefined,
    };

    if (editingDistribution) {
      onUpdate(editingDistribution.id, payload);
    } else {
      onSave(payload);
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
      headerAccent="emerald"
      icon={<Package className="size-5" />}
      title={editingDistribution ? "Edycja Rozdzielnika / Wydania" : "Nowe Wydanie Materiałów (Rozdzielnik)"}
      description="Ewidencja dystrybucji materiałów oświatowych do placówek oświatowych i partnerów"
      error={errorMessage || null}
      onSubmit={handleSubmit(onSubmit)}
      submitText={editingDistribution ? "Zapisz Zmiany" : "Wydaj Materiały"}
    >
      <div className="space-y-4 text-xs">
        {actions.length > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-[3px] space-y-1.5">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Layers className="size-3.5 text-primary" />
              <span>Powiązane Zadanie Źródłowe (Działanie Edukacyjne)</span>
            </label>

            <SearchableSelect
              value={selectedActionId || ""}
              onChange={handleActionChange}
              options={actions.map((a) => ({
                value: a.id,
                label: `${a.date} · ${a.title}`,
                description: `Placówka: ${a.facilityName} (gm. ${a.municipality})`,
                badge: a.jrwaSign || undefined,
              }))}
              placeholder="-- Samodzielny rozdzielnik (brak powiązania z zadaniem) --"
              searchPlaceholder="Szukaj działania po tytule, dacie, szkole..."
              size="sm"
              clearable
            />
          </div>
        )}

        <DistributionMaterialCard
          register={register}
          errors={errors}
          selectedMaterialId={selectedMaterialId || ""}
          materials={materials}
          materialTypes={materialTypes}
          onMaterialChange={handleMaterialChange}
          currentMaterialType={watch("materialType") || ""}
          onMaterialTypeChange={(val) => setValue("materialType", val, { shouldValidate: true })}
        />

        <DistributionRecipientCard
          register={register}
          errors={errors}
          selectedFacilityId={selectedFacilityId || ""}
          facilities={facilities}
          dynamicMunicipalities={dynamicMunicipalities}
          onFacilityChange={handleFacilityChange}
          currentRecipientName={watch("recipientName") || ""}
          onRecipientNameChange={(name) => setValue("recipientName", name, { shouldValidate: true })}
          currentMunicipality={watch("municipality") || ""}
          onMunicipalityChange={(muni) => setValue("municipality", muni, { shouldValidate: true })}
        />

        <DistributionDetailsCard
          register={register}
          errors={errors}
          staff={staff}
          currentAssignedEducator={watch("assignedEducator") || ""}
          onAssignedEducatorChange={(val) => setValue("assignedEducator", val, { shouldValidate: true })}
          distributionDate={watch("distributionDate") || ""}
          onDistributionDateChange={(d) => setValue("distributionDate", d, { shouldValidate: true })}
        />
      </div>
    </ModalDialog>
  );
}
