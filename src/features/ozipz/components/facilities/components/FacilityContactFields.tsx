import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Mail, Phone, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { FacilityFormInput } from "../FacilityDialog";

interface FacilityContactFieldsProps {
  register: UseFormRegister<FacilityFormInput>;
  errors: FieldErrors<FacilityFormInput>;
}

const labelClass = "flex items-center gap-1 text-[11px] font-semibold text-muted-foreground";

/** Kontakt instytucji (sekretariat) oraz domyślny szkolny koordynator programów OZiPZ. */
export function FacilityContactFields({ register, errors }: FacilityContactFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <fieldset className="space-y-2 rounded-[3px] border border-border/70 p-3">
        <legend className="px-1 text-xs font-bold text-foreground">Kontakt placówki (sekretariat)</legend>
        <div className="space-y-1">
          <label htmlFor="facility-email" className={labelClass}><Mail className="size-3" />E-mail</label>
          <Input id="facility-email" type="email" placeholder="sekretariat@szkola.pl" {...register("email")} className="h-8 text-xs" />
          {errors.email && <p className="text-[10px] font-semibold text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="facility-phone" className={labelClass}><Phone className="size-3" />Telefon</label>
          <Input id="facility-phone" type="tel" placeholder="np. 95 747 00 00" {...register("phone")} className="h-8 font-mono text-xs" />
        </div>
      </fieldset>

      <fieldset className="space-y-2 rounded-[3px] border border-border/70 p-3">
        <legend className="px-1 text-xs font-bold text-foreground">Koordynator programów OZiPZ</legend>
        <div className="space-y-1">
          <label htmlFor="facility-coordinator" className={labelClass}><User className="size-3" />Imię i nazwisko</label>
          <Input id="facility-coordinator" placeholder="np. Jan Kowalski" {...register("defaultCoordinatorName")} className="h-8 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label htmlFor="facility-coordinator-email" className={labelClass}><Mail className="size-3" />E-mail</label>
            <Input id="facility-coordinator-email" type="email" {...register("defaultCoordinatorEmail")} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label htmlFor="facility-coordinator-phone" className={labelClass}><Phone className="size-3" />Telefon</label>
            <Input id="facility-coordinator-phone" type="tel" {...register("defaultCoordinatorPhone")} className="h-8 font-mono text-xs" />
          </div>
        </div>
        {errors.defaultCoordinatorEmail && (
          <p className="text-[10px] font-semibold text-destructive">{errors.defaultCoordinatorEmail.message}</p>
        )}
        <p className="text-[10px] text-muted-foreground">Podpowiadany przy nowym zgłoszeniu placówki do programu.</p>
      </fieldset>
    </div>
  );
}
