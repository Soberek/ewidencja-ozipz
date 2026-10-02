import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Mail } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EMAIL_SEPARATOR_OPTIONS, copyTextToClipboard, emailCountLabel } from "../../utils/emailUtils";

const SEPARATOR_STORAGE_KEY = "oz.emailSeparator";

function readSeparator(): string {
  try {
    const value = localStorage.getItem(SEPARATOR_STORAGE_KEY);
    return EMAIL_SEPARATOR_OPTIONS.some((o) => o.value === value) ? value! : EMAIL_SEPARATOR_OPTIONS[0].value;
  } catch {
    return EMAIL_SEPARATOR_OPTIONS[0].value;
  }
}

function writeSeparator(value: string): void {
  try {
    localStorage.setItem(SEPARATOR_STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export interface EmailsCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unikalne, poprawne adresy do skopiowania. */
  emails: string[];
  description: ReactNode;
  /** Dodatkowe pola nad separatorem, np. wybór źródła adresów. */
  controls?: ReactNode;
  /** Informacja pod listą, np. ile pozycji nie ma adresu. */
  footnote?: ReactNode;
  /** Wpisy wyglądające na adres, ale niepoprawne – pominięte przy kopiowaniu. */
  invalid?: string[];
}

/** Okno kopiowania wielu adresów do pola DW/UDW – wspólne dla Placówek i Spisu kontaktów. */
export function EmailsCopyDialog({ open, onOpenChange, emails, description, controls, footnote, invalid = [] }: EmailsCopyDialogProps) {
  const [separator, setSeparator] = useState(readSeparator);
  const [copied, setCopied] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const text = emails.join(separator);

  useEffect(() => {
    setCopied(false);
  }, [open, text]);

  const handleSeparatorChange = (value: string | null | undefined) => {
    const next = value || EMAIL_SEPARATOR_OPTIONS[0].value;
    setSeparator(next);
    writeSeparator(next);
  };

  const handleCopy = async () => {
    if (await copyTextToClipboard(text, fieldRef.current)) {
      setCopied(true);
      toast.success(`Skopiowano ${emailCountLabel(emails.length)}`, {
        description: "Wklej w pole UDW, aby adresaci nie widzieli się nawzajem.",
      });
    } else {
      fieldRef.current?.focus();
      fieldRef.current?.select();
      toast.error("Nie udało się skopiować automatycznie — lista jest zaznaczona, naciśnij Ctrl+C (⌘C).");
    }
  };

  return (
    <ModalDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Kopiuj adresy e-mail"
      description={description}
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
        {controls}
        <Select
          label="Separator"
          value={separator}
          onChange={handleSeparatorChange}
          options={EMAIL_SEPARATOR_OPTIONS}
          searchable={false}
        />
      </div>

      <textarea
        ref={fieldRef}
        readOnly
        value={text}
        placeholder="Brak adresów do skopiowania"
        aria-label="Lista adresów e-mail"
        onFocus={(e) => e.currentTarget.select()}
        className="h-40 w-full resize-none rounded-[3px] border border-input bg-muted/30 p-2 font-mono text-xs focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <p className="text-[11px] text-muted-foreground">
        {emailCountLabel(emails.length)}
        {footnote && <> · {footnote}</>}
      </p>
      {invalid.length > 0 && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-px size-3 shrink-0" />
          <span>Pominięto niepoprawne adresy (popraw je w kartotece): {invalid.join(", ")}</span>
        </p>
      )}
    </ModalDialog>
  );
}
