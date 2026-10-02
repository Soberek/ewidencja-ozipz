import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Package } from "lucide-react";
import { Select, SearchableSelect, type SelectOption } from "@/components/ui/select";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OzipzMaterial, OzipzDictionaryItem } from "../../../types/ozipz.types";
import type { DistributionFormInput } from "../DistributionDialog";

interface DistributionMaterialCardProps {
  register: UseFormRegister<DistributionFormInput>;
  errors: FieldErrors<DistributionFormInput>;
  selectedMaterialId: string;
  materials: OzipzMaterial[];
  materialTypes: OzipzDictionaryItem[];
  onMaterialChange: (matId: string) => void;
  currentMaterialType?: string;
  onMaterialTypeChange?: (val: string) => void;
}

export function DistributionMaterialCard({
  register,
  errors,
  selectedMaterialId,
  materials,
  materialTypes,
  onMaterialChange,
  currentMaterialType = "",
  onMaterialTypeChange,
}: DistributionMaterialCardProps) {
  const materialOptions: SelectOption[] = useMemo(() => {
    return materials.map((m) => ({
      value: m.id,
      label: m.title,
      description: `Typ: ${m.materialType}${m.publisher ? ` • Wydawca: ${m.publisher}` : ""}`,
      icon: Package,
      badge: m.materialType,
      badgeVariant: "secondary",
    }));
  }, [materials]);

  const typeOptions: SelectOption[] = useMemo(() => {
    return materialTypes.map((mt) => ({
      value: mt.code,
      label: mt.label,
    }));
  }, [materialTypes]);

  return (
    <div className="p-3 bg-muted/20 border border-border/70 rounded-[3px] space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="distribution-material" className="font-bold text-foreground flex items-center gap-1.5 text-xs">
          <Package className="size-3.5 text-emerald-600" />
          <span>
            Wybierz Materiał z Katalogu <span className="text-destructive">*</span>
          </span>
        </label>
        <SearchableSelect
          id="distribution-material"
          value={selectedMaterialId}
          onChange={onMaterialChange}
          options={materialOptions}
          placeholder="-- Wybierz materiał z magazynu --"
          searchPlaceholder="Szukaj materiału oświatowego..."
          error={errors.materialId?.message as string}
          size="sm"
          clearable
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label htmlFor="distribution-material-title" className="font-semibold text-foreground text-xs">Nazwa / Tytuł (jeśli własna)</label>
          <Input
            id="distribution-material-title"
            type="text"
            placeholder="np. Tytuł materiału lub pakietu..."
            {...register("materialTitle")}
            className="h-8 text-xs font-medium"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="distribution-material-type" className="font-semibold text-foreground text-xs">Typ Materiału (ze słownika)</label>
          <Select
            id="distribution-material-type"
            value={currentMaterialType}
            onChange={(val) => onMaterialTypeChange?.(val)}
            options={typeOptions}
            placeholder="-- Wybierz typ materiału --"
            searchPlaceholder="Szukaj typu materiału..."
            size="sm"
            clearable
          />
        </div>
      </div>
    </div>
  );
}
