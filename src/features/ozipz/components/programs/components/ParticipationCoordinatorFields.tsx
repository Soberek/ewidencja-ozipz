import { useId, useMemo, useState } from "react";
import { AlertTriangle, Building2, Link2, Mail, Phone, UserCheck, UserPlus, Wand2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { OzipzContact, OzipzFacility } from "../../../types/ozipz.types";
import { hasEmail, hasPhone, phoneHref } from "../../contacts/contactUtils";
import {
  buildCoordinatorOptions,
  facilityCardCoordinator,
  isContactOfFacility,
  isContactWithoutFacility,
  matchCoordinatorContact,
  pickCoordinatorPosition,
  splitContactLine,
  type CoordinatorDraft,
} from "../participationCoordinator";
import { CoordinatorQuickAddPanel, type NewContactData } from "./CoordinatorQuickAddPanel";

interface ParticipationCoordinatorFieldsProps {
  contacts: OzipzContact[];
  facilities: OzipzFacility[];
  facility: OzipzFacility | null;
  positions: string[];
  selectedContactId: string;
  /** Nazwisko i kontakt zapisane w zgłoszeniu – przy wpisach bez powiązania z kartoteką. */
  storedName: string;
  storedContactLine: string;
  error?: string;
  assignToFacility: boolean;
  onAssignToFacilityChange: (value: boolean) => void;
  onSelect: (contact: OzipzContact | null) => void;
  onQuickAdd?: (data: NewContactData) => Promise<OzipzContact | undefined>;
}

const EMPTY_DRAFT: CoordinatorDraft = { name: "", phone: "", email: "" };

export function ParticipationCoordinatorFields({
  contacts,
  facilities,
  facility,
  positions,
  selectedContactId,
  storedName,
  storedContactLine,
  error,
  assignToFacility,
  onAssignToFacilityChange,
  onSelect,
  onQuickAdd,
}: ParticipationCoordinatorFieldsProps) {
  const selectId = useId();
  const [draft, setDraft] = useState<CoordinatorDraft | null>(null);

  const options = useMemo(() => buildCoordinatorOptions(contacts, facility), [contacts, facility]);
  const selected = useMemo(() => contacts.find((c) => c.id === selectedContactId), [contacts, selectedContactId]);
  const unlinkedName = !selected && storedName.trim() ? storedName.trim() : "";
  const unlinkedMatch = useMemo(
    () => (unlinkedName ? matchCoordinatorContact(unlinkedName, contacts, facility) : undefined),
    [unlinkedName, contacts, facility]
  );
  const cardCoordinator = useMemo(
    () => (!selected && !unlinkedName ? facilityCardCoordinator(facility, contacts) : null),
    [selected, unlinkedName, facility, contacts]
  );
  const canAssign = Boolean(selected && facility && isContactWithoutFacility(selected, facilities));
  const otherFacility = selected && facility && !canAssign && !isContactOfFacility(selected, facility) ? selected.facilityName : "";

  const openQuickAdd = (initial: CoordinatorDraft) => onQuickAdd && setDraft(initial);

  const handleCreate = async (data: NewContactData) => {
    const created = await onQuickAdd?.(data);
    if (created) {
      onSelect(created);
      setDraft(null);
    }
    return created;
  };

  return (
    <div className="space-y-2.5 rounded-[3px] border border-border/70 bg-muted/20 p-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={selectId} className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <UserCheck className="size-3.5 text-primary" />
            <span>
              Szkolny Koordynator Programu <span className="text-destructive">*</span>
            </span>
          </label>
          {onQuickAdd && !draft && (
            <button
              type="button"
              onClick={() => openQuickAdd(EMPTY_DRAFT)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              <UserPlus className="size-3" />
              Nowy kontakt
            </button>
          )}
        </div>

        {draft ? (
          <CoordinatorQuickAddPanel
            initial={draft}
            defaultPosition={pickCoordinatorPosition(positions)}
            positions={positions}
            facility={facility}
            existingContacts={contacts}
            onCreate={handleCreate}
            onUseExisting={(contact) => {
              onSelect(contact);
              setDraft(null);
            }}
            onCancel={() => setDraft(null)}
          />
        ) : (
          <Select
            id={selectId}
            value={selected ? selected.id : ""}
            onChange={(id) => onSelect(contacts.find((c) => c.id === id) || null)}
            options={options}
            placeholder={contacts.length ? "-- Wybierz koordynatora ze Spisu Kontaktów --" : "Spis kontaktów jest pusty – dodaj nowy kontakt"}
            searchPlaceholder="Szukaj po nazwisku, placówce, telefonie..."
            emptyText="Brak osoby w spisie – użyj „Nowy kontakt”"
            error={error}
            size="sm"
            clearable
          />
        )}
      </div>

      {!draft && selected && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {selected.position && <span className="font-medium text-foreground">{selected.position}</span>}
          {hasPhone(selected) && (
            <a href={phoneHref(selected.phone) ?? undefined} className="inline-flex items-center gap-1 font-mono hover:text-primary">
              <Phone className="size-3" />
              {selected.phone}
            </a>
          )}
          {hasEmail(selected) && (
            <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 font-mono hover:text-primary">
              <Mail className="size-3" />
              {selected.email}
            </a>
          )}
          {!hasPhone(selected) && !hasEmail(selected) && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              Brak telefonu i e-maila – uzupełnij w Spisie Kontaktów
            </span>
          )}
          {otherFacility && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3" />
              Przypisany do: {otherFacility}
            </span>
          )}
        </div>
      )}

      {!draft && canAssign && facility && (
        <label className="flex cursor-pointer items-start gap-2 text-[11px] text-foreground">
          <input
            type="checkbox"
            checked={assignToFacility}
            onChange={(e) => onAssignToFacilityChange(e.target.checked)}
            className="mt-0.5 size-3.5 cursor-pointer rounded border-input text-primary focus:ring-0"
          />
          <span>
            Przypisz ten kontakt do placówki <strong>{facility.name}</strong> w Spisie Kontaktów
          </span>
        </label>
      )}

      {!draft && unlinkedName && (
        <div role="status" className="space-y-1.5 rounded-[3px] border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-800 dark:text-amber-300">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Koordynator wpisany ręcznie: <strong>{unlinkedName}</strong>
              {storedContactLine ? ` (${storedContactLine})` : ""} – nie jest powiązany ze Spisem Kontaktów.
            </span>
          </p>
          <div className="flex flex-wrap gap-2 pl-5">
            {unlinkedMatch ? (
              <Button type="button" size="sm" variant="outline" onClick={() => onSelect(unlinkedMatch)}>
                <Link2 className="size-3.5" />
                Powiąż z kontaktem {unlinkedMatch.name}
              </Button>
            ) : (
              onQuickAdd && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openQuickAdd({ name: unlinkedName, ...splitContactLine(storedContactLine) })}
                >
                  <UserPlus className="size-3.5" />
                  Dodaj do Spisu Kontaktów
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {!draft && cardCoordinator && onQuickAdd && (
        <button
          type="button"
          onClick={() => openQuickAdd(cardCoordinator)}
          className="inline-flex items-center gap-1 text-left text-[11px] font-medium text-primary hover:underline cursor-pointer"
        >
          <Wand2 className="size-3 shrink-0" />
          Karta placówki wskazuje koordynatora {cardCoordinator.name} – dodaj go do kontaktów i wybierz
        </button>
      )}
    </div>
  );
}
