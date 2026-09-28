import { useMemo } from "react";
import { Building2, MapPin } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OzipzContact } from "../../../types/ozipz.types";
import { getContactIssues, getContactRole, type ContactRole } from "../contactUtils";
import {
  ContactEmail,
  ContactIssuesIndicator,
  ContactPhone,
  ContactProgramsBadge,
  ContactRoleBadge,
} from "./ContactCells";

export interface ContactsGroupedViewProps {
  contacts: OzipzContact[];
  programsIndex?: Map<string, string[]>;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onEdit: (contact: OzipzContact) => void;
}

interface FacilityGroup {
  key: string;
  facilityName: string;
  contacts: OzipzContact[];
}

interface MunicipalityGroup {
  municipality: string;
  count: number;
  facilities: FacilityGroup[];
}

// Dyrektor na górze karty placówki, potem koordynatorzy i pedagodzy
const ROLE_ORDER: Record<ContactRole, number> = { director: 0, coordinator: 1, pedagogue: 2, other: 3 };
const NO_MUNICIPALITY = "Bez przypisanej gminy";
const NO_FACILITY = "Placówka nieokreślona";

function groupContacts(contacts: OzipzContact[]): MunicipalityGroup[] {
  const byMuni = new Map<string, Map<string, FacilityGroup>>();

  for (const c of contacts) {
    const muni = c.municipality?.trim() || NO_MUNICIPALITY;
    const facilityName = c.facilityName?.trim() || NO_FACILITY;
    const key = c.facilityId || facilityName.toLowerCase();

    if (!byMuni.has(muni)) byMuni.set(muni, new Map());
    const facilities = byMuni.get(muni)!;
    if (!facilities.has(key)) facilities.set(key, { key, facilityName, contacts: [] });
    facilities.get(key)!.contacts.push(c);
  }

  return Array.from(byMuni.entries())
    .map(([municipality, facilities]) => {
      const list = Array.from(facilities.values())
        .map((f) => ({
          ...f,
          contacts: [...f.contacts].sort(
            (a, b) =>
              ROLE_ORDER[getContactRole(a.position)] - ROLE_ORDER[getContactRole(b.position)] ||
              a.name.localeCompare(b.name, "pl")
          ),
        }))
        .sort((a, b) => a.facilityName.localeCompare(b.facilityName, "pl"));
      return {
        municipality,
        facilities: list,
        count: list.reduce((sum, f) => sum + f.contacts.length, 0),
      };
    })
    .sort((a, b) => {
      if (a.municipality === NO_MUNICIPALITY) return 1;
      if (b.municipality === NO_MUNICIPALITY) return -1;
      return a.municipality.localeCompare(b.municipality, "pl");
    });
}

export function ContactsGroupedView({
  contacts,
  programsIndex,
  copiedId,
  onCopy,
  onEdit,
}: ContactsGroupedViewProps) {
  const groups = useMemo(() => groupContacts(contacts), [contacts]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.municipality} aria-label={`Gmina ${g.municipality}`} className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="size-3.5" />
              {g.municipality === NO_MUNICIPALITY ? g.municipality : `Gmina ${g.municipality}`}
              <span className="font-mono font-medium normal-case tracking-normal">
                · {g.facilities.length} plac. · {g.count} os.
              </span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
              {g.facilities.map((f) => (
                <article
                  key={f.key}
                  className="rounded-[3px] border border-border bg-card"
                >
                  <header className="flex items-start gap-1.5 border-b border-border bg-muted/30 px-3 py-2">
                    <Building2 className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p
                      className="text-xs font-semibold text-foreground leading-tight line-clamp-2"
                      title={f.facilityName}
                    >
                      {f.facilityName}
                    </p>
                  </header>

                  <ul className="divide-y divide-border">
                    {f.contacts.map((c) => (
                      <li key={c.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => onEdit(c)}
                          onKeyDown={(e) => {
                            if (e.target !== e.currentTarget) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onEdit(c);
                            }
                          }}
                          aria-label={`Edytuj kontakt ${c.name}`}
                          className="w-full px-3 py-2 space-y-1 text-left hover:bg-muted/40 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <span className="text-xs font-semibold text-foreground leading-tight break-words">
                                {c.name}
                              </span>
                              <ContactIssuesIndicator issues={getContactIssues(c)} />
                            </div>
                            <ContactProgramsBadge programs={programsIndex?.get(c.id)} />
                          </div>
                          <ContactRoleBadge position={c.position} />
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                            <ContactPhone id={c.id} value={c.phone} copiedId={copiedId} onCopy={onCopy} />
                            <ContactEmail id={c.id} value={c.email} copiedId={copiedId} onCopy={onCopy} />
                          </div>
                          {c.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2" title={c.notes}>
                              {c.notes}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TooltipProvider>
  );
}
