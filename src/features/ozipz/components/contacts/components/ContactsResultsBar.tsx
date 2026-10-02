import { Mail, Download, Table2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

export type ContactsViewMode = "table" | "grouped";

export interface ContactsResultsBarProps {
  shownCount: number;
  totalCount: number;
  emailCount: number;
  viewMode: ContactsViewMode;
  onViewModeChange: (mode: ContactsViewMode) => void;
  onCopyEmails: () => void;
  onExportVCard: () => void;
}

const VIEW_OPTIONS = [
  { value: "table", label: "Tabela", icon: Table2 },
  { value: "grouped", label: "Wg placówek", icon: LayoutGrid },
] as const;

export function ContactsResultsBar({
  shownCount,
  totalCount,
  emailCount,
  viewMode,
  onViewModeChange,
  onCopyEmails,
  onExportVCard,
}: ContactsResultsBarProps) {
  return (
    <div className="flex flex-col gap-2 px-0.5 select-none sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        Wyświetlono <span className="font-mono font-semibold text-foreground tabular-nums">{shownCount}</span>
        {shownCount !== totalCount && (
          <>
            {" "}z <span className="font-mono font-semibold text-foreground tabular-nums">{totalCount}</span>
          </>
        )}{" "}
        {shownCount === 1 ? "kontakt" : "kontaktów"}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyEmails}
          disabled={emailCount === 0}
          title="Adresy wyświetlonych kontaktów do pola DW/UDW – z wyborem separatora"
        >
          <Mail className="size-3.5" />
          <span>Kopiuj e-maile ({emailCount})</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onExportVCard}
          disabled={shownCount === 0}
          title="Pobiera plik .vcf do importu w telefonie, Outlooku lub Kontaktach Google"
        >
          <Download className="size-3.5" />
          <span>Eksport vCard</span>
        </Button>

        <SegmentedControl
          aria-label="Widok spisu kontaktów"
          size="sm"
          value={viewMode}
          onChange={onViewModeChange}
          options={VIEW_OPTIONS}
          className="ml-1"
        />
      </div>
    </div>
  );
}
