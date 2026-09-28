import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilityDialog, type FacilityFormInput } from "../../facilities/FacilityDialog";
import { municipalityName, municipalityPostalCode } from "../../../utils/facilityUtils";
import type { OzipzDictionaryItem, OzipzFacility } from "../../../types/ozipz.types";
import type { ActionEditorSectionProps } from "./editor.types";

type FacilityPayload = Omit<OzipzFacility, "id" | "createdAt" | "updatedAt">;

/** Dodanie nowego miejsca do bazy placówek bez wychodzenia z formularza działania. */
export function ActionQuickFacilityAdd({ name, municipality, facilities, municipalities, dictionaryItems, onAddFacility, onCreated }: {
  name: string;
  municipality: string;
  facilities: OzipzFacility[];
  municipalities: string[];
  dictionaryItems: OzipzDictionaryItem[];
  onAddFacility: NonNullable<ActionEditorSectionProps["onAddFacility"]>;
  onCreated: (facility: OzipzFacility) => void;
}) {
  const locationTypes = dictionaryItems.filter((d) => d.dictType === "locationType");
  const municipalityItems = dictionaryItems.filter((d) => d.dictType === "municipality" || d.dictType === "gmina");
  // Stabilny obiekt wartości startowych — FacilityDialog resetuje formularz przy jego zmianie.
  const [initialValues, setInitialValues] = useState<Partial<FacilityFormInput> | null>(null);
  const typedName = name.trim();

  const open = () => {
    const gmina = municipalityName(municipality);
    setInitialValues({
      name: typedName,
      municipality: gmina,
      city: gmina,
      postalCode: gmina ? municipalityPostalCode(municipalityItems, gmina) || "" : "",
    });
  };

  const save = async (payload: FacilityPayload) => {
    const created = await onAddFacility(payload);
    onCreated(created);
    toast.success(`Dodano „${created.name}” do bazy placówek i wybrano w działaniu.`);
  };

  return <>
    <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" onClick={open}>
      <Plus className="size-3.5" />
      {typedName ? `Dodaj „${typedName}” do bazy placówek` : "Dodaj nowe miejsce"}
    </Button>
    {/* Okno renderuje się w portalu, ale zdarzenia Reacta i tak bubblują do formularza działania — zatrzymujemy
        submit i skróty (⌘/Ctrl+Enter), żeby zapis placówki nie zapisał przy okazji działania. */}
    <div className="contents" onSubmit={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <FacilityDialog
        isOpen={initialValues !== null}
        onClose={() => setInitialValues(null)}
        editingFacility={null}
        variant="quick"
        initialValues={initialValues ?? undefined}
        locationTypes={locationTypes}
        facilities={facilities}
        municipalities={municipalities}
        municipalityItems={municipalityItems}
        onSave={save}
        onUpdate={() => undefined}
      />
    </div>
  </>;
}
