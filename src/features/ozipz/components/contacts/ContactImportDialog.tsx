import { SpreadsheetImportDialog } from "../modals/SpreadsheetImportDialog";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { CONTACT_IMPORT_COLUMNS, planContactImport } from "../../utils/spreadsheetImport";

interface ContactImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Import kontaktów z arkusza; osoby już zapisane w tej samej placówce są pomijane. */
export function ContactImportDialog({ isOpen, onClose }: ContactImportDialogProps) {
  const contacts = useOzipzDbStore((state) => state.contacts);
  const facilities = useOzipzDbStore((state) => state.facilities);
  const addContact = useOzipzDbStore((state) => state.addContact);

  return (
    <SpreadsheetImportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import kontaktów z arkusza"
      entityLabel="kontaktów"
      columns={CONTACT_IMPORT_COLUMNS}
      templateFileName="Wzor_importu_kontaktow.xlsx"
      templateExample={["Anna Kowalska", "Dyrektor", "Szkoła Podstawowa nr 1", "Myślibórz", "600 000 000", "a.kowalska@sp1.pl", ""]}
      plan={(rows) => planContactImport(rows, contacts, facilities)}
      onImport={async (plan) => {
        for (const contact of plan.toCreate) await addContact(contact);
      }}
    />
  );
}
