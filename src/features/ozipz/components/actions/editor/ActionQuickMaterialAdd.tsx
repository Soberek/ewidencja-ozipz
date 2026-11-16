import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialDialog } from "../../materials/MaterialDialog";
import type { OzipzDictionaryItem, OzipzMaterial } from "../../../types/ozipz.types";
import type { ActionEditorSectionProps } from "./editor.types";

/** Dodanie nowego materiału do katalogu bez wychodzenia z formularza działania; po zapisie trafia do dystrybucji. */
export function ActionQuickMaterialAdd({ materialTypes, onAddMaterial, onCreated }: {
  materialTypes: OzipzDictionaryItem[];
  onAddMaterial: NonNullable<ActionEditorSectionProps["onAddMaterial"]>;
  onCreated: (material: OzipzMaterial) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const save = async (payload: Parameters<typeof onAddMaterial>[0]) => {
    const created = await onAddMaterial(payload);
    onCreated(created);
    toast.success(`Dodano „${created.title}” do katalogu materiałów i wybrano w działaniu.`);
  };

  return <>
    <Button type="button" variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={() => setIsOpen(true)}>
      <Plus className="size-3.5" /> Nowy materiał do katalogu
    </Button>
    {/* Okno renderuje się w portalu, ale zdarzenia Reacta i tak bubblują do formularza działania — zatrzymujemy
        submit i skróty (⌘/Ctrl+Enter), żeby zapis materiału nie zapisał przy okazji działania. */}
    <div className="contents" onSubmit={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <MaterialDialog isOpen={isOpen} onClose={() => setIsOpen(false)} editingMaterial={null}
        materialTypes={materialTypes} onSave={save} onUpdate={() => undefined} />
    </div>
  </>;
}
