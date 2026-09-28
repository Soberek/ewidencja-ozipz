import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Mail } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { OzipzFacility } from "../../types/ozipz.types";
import { collectFacilityEmails, type FacilityEmailSource } from "../../utils/facilityUtils";
import { emailToastCount } from "../../utils/educationTypesUtils";

interface FacilityEmailsCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Placówki po zastosowaniu filtrów widoku. */
  facilities: OzipzFacility[];
}

const SOURCE_OPTIONS: { value: FacilityEmailSource; label: string }[] = [
  { value: "facility", label: "E-mail placówki (sekretariat)" },
  { value: "coordinator", label: "E-mail koordynatora" },
  { value: "both", label: "Placówki i koordynatora" },
];

const SEPARATOR_OPTIONS = [
  { value: "; ", label: "Średnik (Outlook)" },
  { value: ", ", label: "Przecinek (Gmail)" },
  { value: "\n", label: "Nowa linia" },
];

export function FacilityEmailsCopyDialog({ open, onOpenChange, facilities }: FacilityEmailsCopyDialogProps) {
  const [source, setSource] = useState<FacilityEmailSource>("facility");
  const [separator, setSeparator] = useState("; ");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const emails = useMemo(() => collectFacilityEmails(facilities, source), [facilities, source]);
  const text = emails.join(separator);
  const withoutEmail = facilities.length - facilities.filter((f) => collectFacilityEmails([f], source).length > 0).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`Skopiowano ${emailToastCount(emails.length)}`);
    } catch {
      toast.error("Nie udało się skopiować do schowka — zaznacz tekst ręcznie.");
    }
  };

  return (
    <ModalDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Kopiuj adresy e-mail"
      description={`Adresy z ${facilities.length} placówek widocznych po filtrowaniu. Duplikaty i niepoprawne adresy są pomijane.`}
      icon={<Mail className="size-5" />}
      size="lg"
      footer={
        <DialogFooter className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 p-3 px-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zamknij</Button>
          <Button onClick={handleCopy} disabled={emails.length === 0} className="min-w-[140px]">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Skopiowano" : "Kopiuj do schowka"}
          </Button>
        </DialogFooter>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Źródło adresów"
          value={source}
          onChange={(val) => setSource((val || "facility") as FacilityEmailSource)}
          options={SOURCE_OPTIONS}
          searchable={false}
        />
        <Select
          label="Separator"
          value={separator}
          onChange={(val) => setSeparator(val || "; ")}
          options={SEPARATOR_OPTIONS}
          searchable={false}
        />
      </div>

      <textarea
        readOnly
        value={text}
        aria-label="Lista adresów e-mail"
        onFocus={(e) => e.currentTarget.select()}
        className="h-40 w-full resize-none rounded-[3px] border border-input bg-muted/30 p-2 font-mono text-xs focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <p className="text-[11px] text-muted-foreground">
        {emailToastCount(emails.length)}
        {withoutEmail > 0 && ` · ${withoutEmail} placówek bez adresu w wybranym źródle`}
      </p>
    </ModalDialog>
  );
}
