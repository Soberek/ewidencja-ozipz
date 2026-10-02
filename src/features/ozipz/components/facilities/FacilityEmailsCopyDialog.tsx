import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import type { OzipzContact, OzipzFacility } from "../../types/ozipz.types";
import { collectFacilityEmails, type FacilityEmailSource } from "../../utils/facilityUtils";
import { invalidEmails } from "../../utils/emailUtils";
import { getContactRole } from "../contacts/contactUtils";
import { EmailsCopyDialog } from "../modals/EmailsCopyDialog";

interface FacilityEmailsCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Placówki po zastosowaniu filtrów widoku. */
  facilities: OzipzFacility[];
  /** Spis kontaktów – koordynatorzy przypisani do placówek uzupełniają adresy koordynatorów. */
  contacts?: OzipzContact[];
}

const SOURCE_OPTIONS: { value: FacilityEmailSource; label: string }[] = [
  { value: "facility", label: "E-mail placówki (sekretariat)" },
  { value: "coordinator", label: "E-mail koordynatora" },
  { value: "both", label: "Placówki i koordynatora" },
];

const facilitiesLabel = (n: number) => (n === 1 ? "placówka" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "placówki" : "placówek");

export function FacilityEmailsCopyDialog({ open, onOpenChange, facilities, contacts = [] }: FacilityEmailsCopyDialogProps) {
  const [source, setSource] = useState<FacilityEmailSource>("facility");

  const coordinators = useMemo(() => contacts.filter((c) => getContactRole(c.position) === "coordinator"), [contacts]);
  const { emails, withoutEmail } = useMemo(
    () => collectFacilityEmails(facilities, source, coordinators),
    [facilities, source, coordinators]
  );
  const invalid = useMemo(() => {
    const facilityIds = new Set(facilities.map((f) => f.id));
    return invalidEmails([
      ...(source !== "coordinator" ? facilities.map((f) => f.email) : []),
      ...(source !== "facility" ? facilities.map((f) => f.defaultCoordinatorEmail) : []),
      ...(source !== "facility" ? coordinators.filter((c) => c.facilityId && facilityIds.has(c.facilityId)).map((c) => c.email) : []),
    ]);
  }, [facilities, coordinators, source]);

  return (
    <EmailsCopyDialog
      open={open}
      onOpenChange={onOpenChange}
      emails={emails}
      invalid={invalid}
      description={`Adresy z ${facilities.length} placówek widocznych po filtrowaniu. Duplikaty są pomijane. Koordynatorzy pochodzą z karty placówki i ze Spisu kontaktów (kontakty przypisane do placówki).`}
      footnote={withoutEmail.length > 0 ? `${withoutEmail.length} ${facilitiesLabel(withoutEmail.length)} bez adresu w wybranym źródle` : undefined}
      controls={
        <Select
          label="Źródło adresów"
          value={source}
          onChange={(val) => setSource((val || "facility") as FacilityEmailSource)}
          options={SOURCE_OPTIONS}
          searchable={false}
        />
      }
    />
  );
}
