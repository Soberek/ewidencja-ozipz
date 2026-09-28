import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { AlertTriangle, Briefcase, Loader2, Mail, Phone, User, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/ui/autocomplete";
import type { OzipzContact, OzipzFacility } from "../../../types/ozipz.types";
import { findDuplicateContacts, formatPhone, isValidEmail } from "../../contacts/contactUtils";
import type { CoordinatorDraft } from "../participationCoordinator";

export type NewContactData = Omit<OzipzContact, "id" | "createdAt" | "updatedAt">;

interface CoordinatorQuickAddPanelProps {
  initial: CoordinatorDraft;
  defaultPosition: string;
  positions: string[];
  facility: OzipzFacility | null;
  existingContacts: OzipzContact[];
  onCreate: (data: NewContactData) => Promise<OzipzContact | undefined>;
  onUseExisting: (contact: OzipzContact) => void;
  onCancel: () => void;
}

const DUPLICATE_REASON = { email: "ten sam e-mail", phone: "ten sam telefon", name: "to samo imię i nazwisko" } as const;

/**
 * Szybkie dopisanie koordynatora do Spisu Kontaktów bez opuszczania formularza zgłoszenia.
 * Panel leży wewnątrz formularza modala, więc nie używa własnego <form> – Enter dodaje kontakt zamiast zapisywać zgłoszenie.
 */
export function CoordinatorQuickAddPanel({
  initial,
  defaultPosition,
  positions,
  facility,
  existingContacts,
  onCreate,
  onUseExisting,
  onCancel,
}: CoordinatorQuickAddPanelProps) {
  const ids = useId();
  const [name, setName] = useState(initial.name);
  const [position, setPosition] = useState(defaultPosition);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const duplicates = useMemo(
    () => findDuplicateContacts({ name, phone, email }, existingContacts).slice(0, 3),
    [name, phone, email, existingContacts]
  );

  const submit = async () => {
    if (busy) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (trimmedName.length < 3) {
      setError("Podaj imię i nazwisko koordynatora.");
      return;
    }
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError("Niepoprawny format adresu e-mail.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const created = await onCreate({
        name: trimmedName,
        position: position.trim() || defaultPosition,
        facilityId: facility?.id,
        facilityName: facility?.name || "",
        municipality: facility?.municipality || undefined,
        phone: formatPhone(phone),
        email: trimmedEmail,
      });
      if (!created) setError("Nie udało się dodać kontaktu. Dane w formularzu zostały zachowane – spróbuj ponownie.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się dodać kontaktu.");
    } finally {
      setBusy(false);
    }
  };

  // Enter w polu panelu nie może wysłać całego formularza zgłoszenia.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" || e.defaultPrevented || !(e.target instanceof HTMLInputElement)) return;
    e.preventDefault();
    void submit();
  };

  return (
    <div
      role="group"
      aria-label="Nowy kontakt – szkolny koordynator"
      onKeyDown={handleKeyDown}
      className="space-y-2.5 rounded-[3px] border border-primary/40 bg-primary/5 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <UserPlus className="size-3.5 text-primary" />
          Nowy kontakt w Spisie Kontaktów
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Zamknij dodawanie kontaktu"
          className="rounded-[2px] p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${ids}-name`} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <User className="size-3 text-primary" />
            <span>Imię i nazwisko <span className="text-destructive">*</span></span>
          </label>
          <Input
            id={`${ids}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. mgr Anna Nowak"
            className="h-8 text-xs"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${ids}-position`} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Briefcase className="size-3 text-primary" />
            <span>Stanowisko / rola</span>
          </label>
          <Autocomplete
            id={`${ids}-position`}
            options={positions}
            value={position}
            onChange={setPosition}
            placeholder={defaultPosition}
            size="sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${ids}-phone`} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Phone className="size-3 text-primary" />
            <span>Telefon</span>
          </label>
          <Input
            id={`${ids}-phone`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="np. 600 000 000"
            className="h-8 text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${ids}-email`} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Mail className="size-3 text-primary" />
            <span>E-mail</span>
          </label>
          <Input
            id={`${ids}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="np. a.nowak@szkola.pl"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {facility
          ? <>Kontakt zostanie przypisany do placówki <strong className="text-foreground">{facility.name}</strong>.</>
          : "Wybierz placówkę, aby kontakt został do niej przypisany."}
        {!phone.trim() && !email.trim() && " Bez telefonu i e-maila kontakt będzie oznaczony w spisie jako niekompletny."}
      </p>

      {duplicates.length > 0 && (
        <div role="status" className="rounded-[3px] border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-800 dark:text-amber-300">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5 shrink-0" />
            Ta osoba może już być w spisie:
          </p>
          <ul className="mt-1 space-y-1">
            {duplicates.map((d) => (
              <li key={d.contact.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>{d.contact.name}</strong>
                  {d.contact.facilityName ? `, ${d.contact.facilityName}` : ""} ({DUPLICATE_REASON[d.reason]})
                </span>
                <button
                  type="button"
                  onClick={() => onUseExisting(d.contact)}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Wybierz tę osobę
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="text-[11px] font-semibold text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
          Anuluj
        </Button>
        <Button type="button" size="sm" onClick={() => void submit()} disabled={busy}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
          Dodaj i wybierz
        </Button>
      </div>
    </div>
  );
}
