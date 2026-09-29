import { SpreadsheetImportDialog } from "../modals/SpreadsheetImportDialog";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { generateId } from "../../../../db/repositories/id-generator";
import type { OzipzFacility } from "../../types/ozipz.types";
import { FACILITY_IMPORT_COLUMNS, planFacilityImport } from "../../utils/spreadsheetImport";

interface FacilityImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Import placówek z arkusza; istniejące (ta sama nazwa i miejscowość) są uzupełniane, nie dublowane. */
export function FacilityImportDialog({ isOpen, onClose }: FacilityImportDialogProps) {
  const facilities = useOzipzDbStore((state) => state.facilities);
  const batchUpsertFacilities = useOzipzDbStore((state) => state.batchUpsertFacilities);

  return (
    <SpreadsheetImportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import placówek z arkusza"
      entityLabel="placówek"
      columns={FACILITY_IMPORT_COLUMNS}
      templateFileName="Wzor_importu_placowek.xlsx"
      templateExample={["Szkoła Podstawowa nr 1", "szkoła podstawowa", "ul. Szkolna 1", "74-300", "Myślibórz", "Myślibórz", "powiat myśliborski", "Gmina Myślibórz", "sekretariat@sp1.pl", "95 747 00 00", ""]}
      plan={(rows) => planFacilityImport(rows, facilities)}
      onImport={async (plan) => {
        const now = new Date().toISOString();
        const records: OzipzFacility[] = [...plan.toCreate, ...plan.toUpdate].map((draft) => {
          const current = draft.id ? facilities.find((facility) => facility.id === draft.id) : undefined;
          return {
            ...draft,
            id: draft.id ?? generateId("fac"),
            createdAt: current?.createdAt ?? now,
            updatedAt: now,
          } as OzipzFacility;
        });
        await batchUpsertFacilities(records);
      }}
    />
  );
}
