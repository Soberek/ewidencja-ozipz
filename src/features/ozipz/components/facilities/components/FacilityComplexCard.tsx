import { useMemo } from "react";
import { Layers, Link as LinkIcon, Sparkles, Building2 } from "lucide-react";
import { SearchableSelect, type SelectOption } from "@/components/ui/select";
import type { UseFormRegister } from "react-hook-form";
import type { OzipzFacility } from "../../../types/ozipz.types";
import type { FacilityFormInput } from "../FacilityDialog";

interface FacilityComplexCardProps {
  register: UseFormRegister<FacilityFormInput>;
  isComplex: boolean;
  parentFacilityId: string;
  availableComplexes: OzipzFacility[];
  onComplexChange: (checked: boolean) => void;
  onParentSelect: (parentId: string) => void;
}

export function FacilityComplexCard({
  register,
  isComplex,
  parentFacilityId,
  availableComplexes,
  onComplexChange,
  onParentSelect,
}: FacilityComplexCardProps) {
  const complexOptions: SelectOption[] = useMemo(() => {
    return availableComplexes.map((c) => ({
      value: c.id,
      label: c.name,
      description: `${c.address}, ${c.city} (gm. ${c.municipality})`,
      icon: Building2,
      badge: "Zespół",
    }));
  }, [availableComplexes]);

  return (
    <div className="p-3 bg-muted/40 rounded-[3px] border border-border/70 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Layers className="size-3.5 text-primary" />
          <span>Struktura Organizacyjna i Zespoły Szkół</span>
        </label>
        <span className="text-[10px] text-muted-foreground font-mono">Relacje placówek</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-[2px] bg-background border border-border/60">
          <input
            type="checkbox"
            id="isComplexCheckbox"
            {...register("isComplex")}
            onChange={(e) => onComplexChange(e.target.checked)}
            className="rounded border-input text-primary size-4"
          />
          <label
            htmlFor="isComplexCheckbox"
            className="text-xs font-semibold text-foreground cursor-pointer select-none"
          >
            Ta placówka jest <strong className="text-primary">Zespołem Szkół / Placówek</strong>
          </label>
        </div>

        {!isComplex && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <LinkIcon className="size-3 text-muted-foreground" />
              <span>Należy do Zespołu Szkół:</span>
            </label>
            <SearchableSelect
              value={parentFacilityId || ""}
              onChange={onParentSelect}
              options={complexOptions}
              placeholder="-- Brak (Placówka samodzielna) --"
              searchPlaceholder="Szukaj zespołu szkół..."
              size="sm"
              clearable
            />
          </div>
        )}
      </div>

      {parentFacilityId && !isComplex && (
        <div className="flex items-center gap-1.5 text-[11px] text-primary bg-primary/10 p-2 rounded-[2px]">
          <Sparkles className="size-3.5 shrink-0" />
          <span>
            Dane adresowe mogą zostać automatycznie zsynchronizowane z wybranym Zespołem Szkół.
          </span>
        </div>
      )}
    </div>
  );
}
