import { ActionDialog } from "../actions/ActionDialog";
import { ParticipationDialog } from "../programs/ParticipationDialog";
import { ScheduleDialog } from "../schedule/ScheduleDialog";
import { FacilityDialog } from "../facilities/FacilityDialog";
import { ContactDialog } from "../contacts/ContactDialog";
import { ProgramDialog } from "../programs/ProgramDialog";
import { runModalAction } from "./modalActionUtils";
import type { LinkedDistributionPayload } from "../actions/editor/editor.types";
import type { useOzipzDb } from "../../hooks/useOzipzDb";
import type {
  OzipzAction,
  OzipzProgram,
  OzipzSchoolParticipation,
  OzipzScheduleEvent,
  OzipzFacility,
  OzipzContact,
} from "../../types/ozipz.types";

interface CoreEntityModalsProps {
  activeModal: string | null;
  payload: unknown;
  closeModal: () => void;
  db: ReturnType<typeof useOzipzDb>;
}

export function CoreEntityModals({
  activeModal,
  payload,
  closeModal,
  db,
}: CoreEntityModalsProps) {
  const municipalityNames = db.municipalities.map((m) => m.label || m.code);
  const contactPositionNames = db.contactPositions.map((p) => p.label || p.code);

  const handleSaveAction = async (
    data: Omit<OzipzAction, "id" | "createdAt" | "updatedAt">,
    autoCreateJrwa?: { section: string; jrwaSymbol: string; caseNumber: number; year: number; fullCaseSign: string },
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: LinkedDistributionPayload
  ) => {
    const mat = data.materialId ? db.materials.find((m) => m.id === data.materialId) : undefined;
    await runModalAction(
      () =>
        db.saveActionWithRelations({
          action: data,
          autoCreateJrwa,
          companionDistribution: linkedDistribution,
          distributionMaterials:
            distributionMaterials && distributionMaterials.length > 0
              ? distributionMaterials
              : mat && data.materialsDistributedCount && data.materialsDistributedCount > 0
              ? [
                  {
                    materialId: mat.id,
                    title: mat.title,
                    type: mat.materialType,
                    quantity: data.materialsDistributedCount,
                  },
                ]
              : undefined,
        }),
      linkedDistribution
        ? "Zarejestrowano działanie i powiązaną dystrybucję materiałów."
        : "Działanie edukacyjne zostało zarejestrowane pomyślnie",
      "Błąd zapisu działania",
      undefined,
      { rethrow: true }
    );
  };

  const handleUpdateAction = async (
    id: string,
    data: Partial<OzipzAction>,
    distributionMaterials?: Array<{ materialId: string; title: string; type?: string; quantity: number }>,
    linkedDistribution?: LinkedDistributionPayload
  ) => {
    await runModalAction(
      () => db.updateActionWithRelations(id, data, distributionMaterials, linkedDistribution),
      linkedDistribution
        ? "Zaktualizowano działanie i dodano powiązaną dystrybucję materiałów."
        : "Działanie zostało zaktualizowane.",
      "Błąd aktualizacji działania",
      undefined,
      { rethrow: true }
    );
  };

  return (
    <>
      {activeModal === "action" && (
        <ActionDialog
          isOpen={true}
          onClose={closeModal}
          editingAction={(payload as { item?: OzipzAction | null })?.item || null}
          actions={db.actions}
          programs={db.programs}
          materials={db.materials}
          facilities={db.facilities}
          scheduleEvents={db.scheduleEvents}
          jrwaCases={db.jrwaCases}
          dictionaryItems={db.dictionaryItems}
          staff={db.staff}
          templates={db.templates}
          distributions={db.distributions}
          municipalities={municipalityNames}
          isReadOnly={(payload as { isReadOnly?: boolean })?.isReadOnly || false}
          onSave={handleSaveAction}
          onUpdate={handleUpdateAction}
          onAddFacility={db.addFacility}
        />
      )}

      <ParticipationDialog
        isOpen={activeModal === "participation"}
        onClose={closeModal}
        editingParticipation={(payload as { item?: OzipzSchoolParticipation | null })?.item || null}
        initialProgramId={(payload as { programId?: string })?.programId}
        initialFacilityId={(payload as { facilityId?: string })?.facilityId}
        programs={db.programs}
        jrwaSymbols={db.dictionaryItems.filter((d) => d.dictType === "jrwaSymbol")}
        onCreateProgram={(data) =>
          runModalAction(
            () => db.addProgram(data),
            `Dodano program „${data.name}” (JRWA ${data.jrwaSymbol}) do katalogu.`,
            "Błąd dodawania programu",
            undefined,
            { rethrow: true }
          )
        }
        participations={db.participations}
        facilities={db.facilities}
        contacts={db.contacts}
        contactPositions={contactPositionNames}
        onQuickAddContact={(data) =>
          runModalAction(
            () => db.addContact(data),
            `Dodano ${data.name} do Spisu Kontaktów.`,
            "Błąd dodawania kontaktu"
          )
        }
        onUpdateContact={(id, data) =>
          runModalAction(
            () => db.updateContact(id, data),
            "Kontakt koordynatora przypisano do placówki.",
            "Błąd przypisania kontaktu do placówki"
          )
        }
        onSave={(data) =>
          runModalAction(
            () => db.addParticipation(data),
            "Zgłoszenie placówki do programu zostało zapisane.",
            "Błąd zapisu zgłoszenia",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateParticipation(id, data),
            "Zgłoszenie placówki zostało zaktualizowane.",
            "Błąd aktualizacji zgłoszenia",
            undefined,
            { rethrow: true }
          )
        }
      />

      <ScheduleDialog
        isOpen={activeModal === "schedule"}
        onClose={closeModal}
        editingEvent={(payload as { item?: OzipzScheduleEvent | null })?.item || null}
        facilities={db.facilities}
        programs={db.programs}
        activityTypes={db.activityTypes}
        recipientGroups={db.recipientGroups}
        campaigns={db.campaigns}
        annotationReasons={db.annotationReasons}
        staff={db.staff}
        onSave={async (data) => {
          await runModalAction(
            () => db.addScheduleEvent(data),
            "Zadanie zostało dodane do harmonogramu.",
            "Błąd dodawania zadania",
            undefined,
            { rethrow: true }
          );
        }}
        onUpdate={async (id, data) => {
          await runModalAction(
            () => db.updateScheduleEvent(id, data),
            "Zadanie zostało zaktualizowane.",
            "Błąd aktualizacji zadania",
            undefined,
            { rethrow: true }
          );
        }}
      />

      <FacilityDialog
        isOpen={activeModal === "facility"}
        onClose={closeModal}
        editingFacility={(payload as { item?: OzipzFacility | null })?.item || null}
        locationTypes={db.locationTypes}
        facilities={db.facilities}
        municipalities={municipalityNames}
        municipalityItems={db.municipalities}
        onSave={(data) =>
          runModalAction(
            () => db.addFacility(data),
            "Placówka / instytucja została dodana.",
            "Błąd dodawania placówki",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateFacility(id, data),
            "Dane placówki zostały zaktualizowane.",
            "Błąd aktualizacji placówki",
            undefined,
            { rethrow: true }
          )
        }
      />

      <ContactDialog
        isOpen={activeModal === "contact"}
        onClose={closeModal}
        editingContact={(payload as { item?: OzipzContact | null })?.item || null}
        facilities={db.facilities}
        positions={contactPositionNames}
        municipalities={municipalityNames}
        existingContacts={db.contacts}
        onSave={(data) =>
          runModalAction(
            () => db.addContact(data),
            "Kontakt / koordynator został pomyślnie dodany.",
            "Błąd dodawania kontaktu",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateContact(id, data),
            "Dane kontaktu zostały zaktualizowane.",
            "Błąd aktualizacji kontaktu",
            undefined,
            { rethrow: true }
          )
        }
      />

      <ProgramDialog
        isOpen={activeModal === "program"}
        onClose={closeModal}
        editingProgram={(payload as { item?: OzipzProgram | null })?.item || null}
        jrwaSymbols={db.dictionaryItems.filter((d) => d.dictType === "jrwaSymbol")}
        onSave={(data) =>
          runModalAction(
            () => db.addProgram(data),
            "Program profilaktyczny został dodany.",
            "Błąd dodawania programu",
            undefined,
            { rethrow: true }
          )
        }
        onUpdate={(id, data) =>
          runModalAction(
            () => db.updateProgram(id, data),
            "Program profilaktyczny został zaktualizowany.",
            "Błąd aktualizacji programu",
            undefined,
            { rethrow: true }
          )
        }
      />
    </>
  );
}
