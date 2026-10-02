import { Phone, Mail, Copy, Check, Briefcase, AlertTriangle, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatPhone, getContactRole, phoneHref, type ContactRole } from "../contactUtils";
import { extractEmails, mailtoHref, parseEmails } from "../../../utils/emailUtils";

const ROLE_BADGE_CLASS: Record<ContactRole, string> = {
  coordinator:
    "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
  director:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  pedagogue:
    "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900",
  other:
    "bg-muted/40 text-foreground border-border",
};

export function ContactRoleBadge({ position }: { position?: string }) {
  const role = getContactRole(position);
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium py-0.5 whitespace-normal text-left", ROLE_BADGE_CLASS[role])}
    >
      <Briefcase className="size-2.5 mr-1 inline shrink-0" />
      {position || "Osoba do kontaktu"}
    </Badge>
  );
}

interface CopyButtonProps {
  value: string;
  copyKey: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  label: string;
}

function CopyButton({ value, copyKey, copiedId, onCopy, label }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCopy(value, copyKey);
      }}
      className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 shrink-0"
      title={label}
      aria-label={label}
    >
      {copiedId === copyKey ? (
        <Check className="size-3 text-emerald-600" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}

interface ContactFieldProps {
  id: string;
  value?: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

export function ContactEmail({ id, value, copiedId, onCopy }: ContactFieldProps) {
  if (!value?.trim()) {
    return <span className="text-[11px] text-muted-foreground italic">Brak e-maila</span>;
  }
  const parsed = parseEmails(value);
  const valid = parsed.valid.length > 0 && parsed.invalid.length === 0;
  const emails = extractEmails(value);
  return (
    <div className="flex items-center gap-1 text-xs min-w-0">
      <Mail className="size-3 text-muted-foreground shrink-0" />
      <a
        href={mailtoHref(value)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "hover:underline truncate max-w-[200px]",
          valid ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-amber-400"
        )}
        title={valid ? value : `${value} – adres wygląda na niepoprawny`}
      >
        {value}
      </a>
      <CopyButton
        value={emails.length > 0 ? emails.join("; ") : value.trim()}
        copyKey={`email-${id}`}
        copiedId={copiedId}
        onCopy={onCopy}
        label={emails.length > 1 ? "Kopiuj adresy e-mail" : "Kopiuj adres e-mail"}
      />
    </div>
  );
}

export function ContactPhone({ id, value, copiedId, onCopy }: ContactFieldProps) {
  if (!value?.trim()) {
    return <span className="text-[11px] text-muted-foreground italic">Brak telefonu</span>;
  }
  const href = phoneHref(value);
  const display = formatPhone(value);
  return (
    <div className="flex items-center gap-1 font-mono text-xs text-foreground whitespace-nowrap">
      <Phone className="size-3 text-muted-foreground shrink-0" />
      {href ? (
        <a
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline hover:text-foreground"
          title={`Zadzwoń: ${display}`}
        >
          {display}
        </a>
      ) : (
        <span>{display}</span>
      )}
      <CopyButton
        value={display}
        copyKey={`phone-${id}`}
        copiedId={copiedId}
        onCopy={onCopy}
        label="Kopiuj numer telefonu"
      />
    </div>
  );
}

export function ContactProgramsBadge({ programs }: { programs?: string[] }) {
  if (!programs || programs.length === 0) return null;
  const label =
    programs.length === 1 ? "1 program" : programs.length < 5 ? `${programs.length} programy` : `${programs.length} programów`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1 rounded-[3px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <ClipboardList className="size-2.5" />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="mb-1 font-semibold">Koordynowane programy:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {programs.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

export function ContactIssuesIndicator({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center text-amber-600 dark:text-amber-400"
          aria-label={`Do uzupełnienia: ${issues.join(", ")}`}
          onClick={(e) => e.stopPropagation()}
        >
          <AlertTriangle className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="mb-1 font-semibold">Do uzupełnienia:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
