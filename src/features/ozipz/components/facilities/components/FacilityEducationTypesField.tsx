import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CANONICAL_EDUCATION_TYPES } from "../../../constants";

interface FacilityEducationTypesFieldProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function FacilityEducationTypesField({ selected, onChange }: FacilityEducationTypesFieldProps) {
  // Typ zapisany wcześniej, a nieobecny na liście kanonicznej, nie może zniknąć po cichu.
  const options = [...CANONICAL_EDUCATION_TYPES, ...selected.filter((t) => !CANONICAL_EDUCATION_TYPES.includes(t))];
  const toggle = (type: string) => onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]);

  return (
    <div className="space-y-1.5 rounded-[3px] border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <GraduationCap className="size-3.5 text-primary" />
          Typy kształcenia / jednostki
        </span>
        <span className="text-[10px] text-muted-foreground">
          {selected.length ? `Wybrano: ${selected.length}` : "Dla zespołu zaznacz typy w jednostkach"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 pt-1">
        {options.map((type) => {
          const active = selected.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(type)}
              className={cn(
                "rounded border px-2 py-0.5 text-[11px] cursor-pointer",
                active
                  ? "border-primary bg-primary font-medium text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
