import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import type { OzipzContact, OzipzFacility, OzipzSchoolParticipation } from "../../../types/ozipz.types";
import { collectParticipationEmails, type ParticipationEmailSource } from "../../../utils/participationUtils";
import { EmailsCopyDialog } from "../../modals/EmailsCopyDialog";

interface ParticipationEmailsCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Zgłoszenia po zastosowaniu filtrów widoku. */
  participations: OzipzSchoolParticipation[];
  /** Baza placówek – e-mail szkoły (sekretariatu). */
  facilities?: OzipzFacility[];
  /** Spis kontaktów – aktualny adres koordynatora powiązanego ze zgłoszeniem. */
  contacts?: OzipzContact[];
}

const SOURCE_OPTIONS: { value: ParticipationEmailSource; label: string }[] = [
  { value: "both", label: "Szkoły i koordynatorzy" },
  { value: "school", label: "E-mail szkoły (sekretariat)" },
  { value: "coordinator", label: "E-mail koordynatora zgłoszenia" },
];

const participationsLabel = (n: number) =>
  n === 1 ? "zgłoszenie" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "zgłoszenia" : "zgłoszeń";

export function ParticipationEmailsCopyDialog({ open, onOpenChange, participations, facilities = [], contacts = [] }: ParticipationEmailsCopyDialogProps) {
  const [source, setSource] = useState<ParticipationEmailSource>("both");
  const { emails, invalid, withoutEmail } = useMemo(
    () => collectParticipationEmails(participations, source, facilities, contacts),
    [participations, source, facilities, contacts]
  );
  const missingNames = Array.from(new Set(withoutEmail.map((p) => p.facilityName)));

  return (
    <EmailsCopyDialog
      open={open}
      onOpenChange={onOpenChange}
      emails={emails}
      invalid={invalid}
      description={`Adresy z ${participations.length} ${participationsLabel(participations.length)} widocznych po filtrowaniu – np. wybranego programu i roku szkolnego. Duplikaty są pomijane. Koordynatorzy pochodzą ze zgłoszenia (kontakt ze Spisu kontaktów albo zapisany w zgłoszeniu), e-mail szkoły – z Bazy placówek.`}
      footnote={
        withoutEmail.length > 0
          ? `${withoutEmail.length} ${participationsLabel(withoutEmail.length)} bez adresu w wybranym źródle: ${missingNames.slice(0, 5).join(", ")}${missingNames.length > 5 ? ` i ${missingNames.length - 5} innych` : ""}`
          : undefined
      }
      controls={
        <Select
          label="Źródło adresów"
          value={source}
          onChange={(val) => setSource((val || "both") as ParticipationEmailSource)}
          options={SOURCE_OPTIONS}
          searchable={false}
        />
      }
    />
  );
}
