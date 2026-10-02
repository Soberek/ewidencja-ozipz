import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, FileText } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { OzipzStaff } from "../../../types/ozipz.types";
import type { DistributionFormInput } from "../DistributionDialog";

interface DistributionDetailsCardProps {
  register: UseFormRegister<DistributionFormInput>;
  errors: FieldErrors<DistributionFormInput>;
  staff: OzipzStaff[];
  currentAssignedEducator?: string;
  onAssignedEducatorChange?: (educator: string) => void;
  distributionDate?: string;
  onDistributionDateChange?: (date: string) => void;
}

export function DistributionDetailsCard({
  register,
  errors,
  staff,
  currentAssignedEducator = "",
  onAssignedEducatorChange,
  distributionDate = "",
  onDistributionDateChange,
}: DistributionDetailsCardProps) {
  const staffOptions: SelectOption[] = useMemo(() => {
    return staff.map((s) => ({
      value: s.fullName,
      label: s.fullName,
      description: s.role,
      icon: User,
    }));
  }, [staff]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="distribution-quantity" className="font-semibold text-foreground text-xs">
            Liczba Wydanych Sztuk <span className="text-destructive">*</span>
          </label>
          <Input
            id="distribution-quantity"
            type="number"
            min={1}
            placeholder="np. 50"
            {...register("quantity", { valueAsNumber: true })}
            className="h-8 text-xs font-mono font-bold"
          />
          {errors.quantity && (
            <p className="text-[10px] text-destructive font-semibold">
              {errors.quantity.message as string}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="distribution-date" className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <Calendar className="size-3.5 text-primary" />
            <span>
              Data Wydania / Rozdzielnika <span className="text-destructive">*</span>
            </span>
          </label>
          <DatePicker
            id="distribution-date"
            value={distributionDate}
            onChange={(d) => onDistributionDateChange?.(d)}
            placeholder="Wybierz datę wydania..."
            size="sm"
            required
          />
          {errors.distributionDate && (
            <p className="text-[10px] text-destructive font-semibold">
              {errors.distributionDate.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="distribution-educator" className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
            <User className="size-3.5 text-primary" />
            <span>Wydający Pracownik (Kadra OZiPZ)</span>
          </label>
          <Select
            id="distribution-educator"
            value={currentAssignedEducator}
            onChange={(val) => onAssignedEducatorChange?.(val)}
            options={staffOptions}
            placeholder="-- Wybierz pracownika ze słownika kadry --"
            searchPlaceholder="Szukaj pracownika..."
            size="sm"
            clearable
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="distribution-purpose" className="font-semibold text-foreground">Cel Dystrybucji / Przeznaczenie</label>
          <Input
            id="distribution-purpose"
            type="text"
            placeholder="np. Realizacja programu Czyste Powietrze, warsztaty..."
            {...register("purpose")}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="distribution-notes" className="font-semibold text-foreground flex items-center gap-1.5">
          <FileText className="size-3.5 text-muted-foreground" />
          <span>Uwagi i Adnotacje</span>
        </label>
        <Textarea
          id="distribution-notes"
          rows={2}
          placeholder="np. informacja o odbiorcy osobistym, potwierdzenie odbioru..."
          {...register("notes")}
          className="text-xs"
        />
      </div>
    </>
  );
}
