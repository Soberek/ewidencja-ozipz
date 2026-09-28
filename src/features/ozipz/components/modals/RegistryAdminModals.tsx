import { DictionaryDialog } from "../dictionaries/DictionaryDialog";
import { RegisterDialog } from "../registers/RegisterDialog";
import { MaterialDialog } from "../materials/MaterialDialog";
import { DistributionDialog } from "../materials/DistributionDialog";
import { JrwaDialog } from "../jrwa/JrwaDialog";
import { LetterDialog } from "../letters/LetterDialog";
import { ScanDialog } from "../scans/ScanDialog";
import { PublicationDialog } from "../publications/PublicationDialog";
import { StaffDialog } from "../staff/StaffDialog";
import { TemplateDialog } from "../templates/TemplateDialog";
import { runModalAction } from "./modalActionUtils";
import type { useOzipzDb } from "../../hooks/useOzipzDb";
import type {
  OzipzDictionaryItem,
  OzipzRegisterItem,
  OzipzMaterial,
  OzipzDistribution,
  OzipzJrwaCase,
  OzipzLetter,
  OzipzPublication,
  OzipzStaff,
  OzipzTemplate,
} from "../../types/ozipz.types";

interface RegistryAdminModalsProps {
  activeModal: string | null;
  payload: unknown;
  closeModal: () => void;
  db: ReturnType<typeof useOzipzDb>;
}

export function RegistryAdminModals({
  activeModal,
  payload,
  closeModal,
  db,
}: RegistryAdminModalsProps) {
  const municipalityNames = db.municipalities.map((m) => m.label || m.code);
  const jrwaSymbols = db.dictionaryItems.filter((d) => d.dictType === "jrwaSymbol");

  return (
    <>
      <DictionaryDialog
        isOpen={activeModal === "dictionary"}
        onClose={closeModal}
        editingItem={(payload as { item?: OzipzDictionaryItem | null })?.item || null}
        defaultCategory={(payload as { category?: string })?.category || "activityType"}
        initialValues={(payload as { initialValues?: Partial<OzipzDictionaryItem> })?.initialValues}
        onSave={(data) =>
          runModalAction(
            () => db.addDictionaryItem(data),
            "Pozycja słownikowa została dodana.",
            "Błąd dodawania pozycji",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateDictionaryItem(id, data),
            "Pozycja słownikowa została zaktualizowana.",
            "Błąd aktualizacji pozycji",
            undefined,
            { rethrow: true }
          )
        }
      />

      <RegisterDialog
        isOpen={activeModal === "register"}
        onClose={closeModal}
        editingItem={(payload as { item?: OzipzRegisterItem | null })?.item || null}
        defaultType={(payload as { defaultType?: string })?.defaultType || "szkolenia"}
        facilities={db.facilities}
        programs={db.programs}
        staff={db.staff}
        onSave={(data) =>
          runModalAction(
            () => db.addRegister(data),
            "Wpis został zarejestrowany w ewidencji.",
            "Błąd zapisu wpisu",
            closeModal
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateRegister(id, data),
            "Wpis w ewidencji został zaktualizowany.",
            "Błąd aktualizacji wpisu",
            closeModal
          )
        }
      />

      <MaterialDialog
        isOpen={activeModal === "material"}
        onClose={closeModal}
        editingMaterial={(payload as { item?: OzipzMaterial | null })?.item || null}
        materialTypes={db.materialTypes}
        programs={db.programs}
        jrwaSymbols={jrwaSymbols}
        onSave={(data) =>
          runModalAction(
            () => db.addMaterial(data),
            "Materiał oświatowy został dodany do magazynu.",
            "Błąd dodawania materiału",
            closeModal
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateMaterial(id, data),
            "Dane materiału zostały zaktualizowane.",
            "Błąd aktualizacji materiału",
            closeModal
          )
        }
      />

      <DistributionDialog
        isOpen={activeModal === "distribution"}
        onClose={closeModal}
        editingDistribution={(payload as { item?: OzipzDistribution | null })?.item || null}
        initialMaterialId={(payload as { initialMaterialId?: string })?.initialMaterialId}
        materials={db.materials}
        materialTypes={db.materialTypes}
        facilities={db.facilities}
        staff={db.staff}
        actions={db.actions}
        municipalities={municipalityNames}
        onSave={(data) =>
          runModalAction(
            () => db.addDistribution(data),
            "Rozdzielnik materiałów został zarejestrowany.",
            "Błąd rejestracji rozdzielnika",
            closeModal
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateDistribution(id, data),
            "Rozdzielnik materiałów został zaktualizowany.",
            "Błąd aktualizacji rozdzielnika",
            closeModal
          )
        }
      />

      <JrwaDialog
        isOpen={activeModal === "jrwa"}
        onClose={closeModal}
        editingCase={(payload as { item?: OzipzJrwaCase | null })?.item || null}
        existingCases={db.jrwaCases}
        dictionaryItems={db.dictionaryItems}
        facilities={db.facilities}
        programs={db.programs}
        staff={db.staff}
        onSave={(data) =>
          runModalAction(
            () => db.addJrwaCase(data),
            "Sprawa JRWA została zarejestrowana w wykazie.",
            "Błąd rejestracji sprawy JRWA",
            closeModal
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateJrwaCase(id, data),
            "Sprawa JRWA została zaktualizowana.",
            "Błąd aktualizacji sprawy JRWA",
            closeModal
          )
        }
      />

      <LetterDialog
        isOpen={activeModal === "letter"}
        onClose={closeModal}
        editingLetter={(payload as { item?: OzipzLetter | null })?.item || null}
        initialValues={(payload as { initialValues?: Partial<OzipzLetter> })?.initialValues}
        facilities={db.facilities}
        programs={db.programs}
        jrwaCases={db.jrwaCases}
        staff={db.staff}
        onSave={(data) =>
          runModalAction(
            () => db.addLetter(data),
            "Pismo zostało zarejestrowane w dzienniku korespondencji.",
            "Błąd rejestracji pisma",
            closeModal
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateLetter(id, data),
            "Pismo zostało zaktualizowane.",
            "Błąd aktualizacji pisma",
            closeModal
          )
        }
      />

      <ScanDialog
        isOpen={activeModal === "scan"}
        onClose={closeModal}
        facilities={db.facilities}
        programs={db.programs}
        documentTypes={db.documentTypes}
        onSave={(data) =>
          runModalAction(
            () => db.addScan(data),
            "Skan dokumentu został dołączony do archiwum.",
            "Błąd dodawania skanu",
            closeModal
          )
        }
      />

      <PublicationDialog
        isOpen={activeModal === "publication"}
        onClose={closeModal}
        editingPublication={(payload as { item?: OzipzPublication | null })?.item || null}
        staff={db.staff}
        programs={db.programs}
        jrwaSymbols={jrwaSymbols}
        onSave={(data) =>
          runModalAction(
            () => db.addPublication(data),
            "Publikacja medialna została zarejestrowana.",
            "Błąd rejestracji publikacji",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updatePublication(id, data),
            "Publikacja medialna została zaktualizowana.",
            "Błąd aktualizacji publikacji",
            undefined,
            { rethrow: true }
          )
        }
      />

      <StaffDialog
        isOpen={activeModal === "staff"}
        onClose={closeModal}
        editingStaff={(payload as { item?: OzipzStaff | null })?.item || null}
        staffRoles={db.staffRoles}
        onSave={(data) =>
          runModalAction(
            () => db.addStaff(data),
            "Pracownik został dodany do kadry OZiPZ.",
            "Błąd dodawania pracownika",
            closeModal
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateStaff(id, data),
            "Dane pracownika zostały zaktualizowane.",
            "Błąd aktualizacji pracownika",
            closeModal
          )
        }
      />

      <TemplateDialog
        isOpen={activeModal === "template"}
        onClose={closeModal}
        editingTemplate={(payload as { item?: OzipzTemplate | null })?.item || null}
        programs={db.programs}
        topics={db.topics}
        jrwaSymbols={jrwaSymbols}
        actionTypes={db.activityTypes}
        onSave={(data) =>
          runModalAction(
            () => db.addTemplate(data),
            "Szablon zadania został zapisany.",
            "Błąd zapisu szablonu",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateTemplate(id, data),
            "Szablon zadania został zaktualizowany.",
            "Błąd aktualizacji szablonu",
            undefined,
            { rethrow: true }
          )
        }
      />
    </>
  );
}
