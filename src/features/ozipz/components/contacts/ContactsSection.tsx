import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { OzipzContact } from "../../types/ozipz.types";
import { useContacts, useOzipzDbStore } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import { downloadBlob } from "../../utils/downloadHelper";
import { getTodayIsoDate } from "../../utils/dateUtils";
import { ContactsStatsHeader } from "./components/ContactsStatsHeader";
import { ContactsFilterBar } from "./components/ContactsFilterBar";
import { ContactsTableView } from "./components/ContactsTableView";
import { ContactsGroupedView } from "./components/ContactsGroupedView";
import { ContactsResultsBar, type ContactsViewMode } from "./components/ContactsResultsBar";
import {
  buildContactProgramsIndex,
  collectEmails,
  contactsToVCard,
  getContactRole,
  hasEmail,
  hasPhone,
  isContactIncomplete,
  matchesContactSearch,
  matchesRoleFilter,
  type ContactRoleFilter,
} from "./contactUtils";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export interface ContactsSectionProps {
  contacts?: OzipzContact[];
  onOpenAdd?: () => void;
  onOpenEdit?: (contact: OzipzContact) => void;
  onDelete?: (id: string) => void | Promise<void>;
}

function readStorage(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

export function ContactsSection(props: ContactsSectionProps) {
  const contactsStore = useContacts();
  const participations = useOzipzDbStore((s) => s.participations);
  const openModal = useModalStore((s) => s.openModal);

  const contacts = props.contacts ?? contactsStore.contacts;
  const onOpenAdd = props.onOpenAdd ?? (() => openModal("contact"));
  const onOpenEdit =
    props.onOpenEdit ?? ((contact: OzipzContact) => openModal("contact", { item: contact }));
  const onDelete =
    props.onDelete ??
    (async (id: string) => {
      try {
        await contactsStore.deleteContact(id);
        toast.success("Usunięto kontakt");
      } catch {
        toast.error("Błąd podczas usuwania kontaktu");
      }
    });

  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [muniFilter, setMuniFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<ContactRoleFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewMode, setViewMode] = useState<ContactsViewMode>(() =>
    readStorage("oz.contactsViewMode", "table") === "grouped" ? "grouped" : "table"
  );
  const { isKpiVisible: showKpiSummary, toggleKpi: toggleKpiSummary } = useKpiVisibility("contacts");

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const handleViewModeChange = useCallback((mode: ContactsViewMode) => {
    setViewMode(mode);
    writeStorage("oz.contactsViewMode", mode);
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      toast.error("Nie udało się skopiować do schowka");
      return false;
    }
  }, []);

  const handleCopy = useCallback(
    async (text: string, id: string) => {
      if (!(await copyToClipboard(text))) return;
      setCopiedId(id);
      toast.success(`Skopiowano: ${text}`);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedId(null), 2000);
    },
    [copyToClipboard]
  );

  // Unikalne stanowiska i gminy
  const positions = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.position) set.add(c.position);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [contacts]);

  const municipalities = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.municipality) set.add(c.municipality);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [contacts]);

  const programsIndex = useMemo(
    () => buildContactProgramsIndex(contacts, participations ?? []),
    [contacts, participations]
  );

  // Statystyki
  const stats = useMemo(() => {
    return {
      total: contacts.length,
      withPhone: contacts.filter(hasPhone).length,
      withEmail: contacts.filter(hasEmail).length,
      coordinators: contacts.filter((c) => getContactRole(c.position) === "coordinator").length,
      incomplete: contacts.filter(isContactIncomplete).length,
    };
  }, [contacts]);

  // Filtrowane kontakty
  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        if (positionFilter !== "all" && c.position !== positionFilter) return false;
        if (muniFilter !== "all" && c.municipality !== muniFilter) return false;
        if (!matchesRoleFilter(c, roleFilter)) return false;
        return matchesContactSearch(c, search);
      })
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pl"));
  }, [contacts, positionFilter, muniFilter, roleFilter, search]);

  const filteredEmails = useMemo(() => collectEmails(filteredContacts), [filteredContacts]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (positionFilter !== "all") count++;
    if (muniFilter !== "all") count++;
    if (roleFilter !== "all") count++;
    return count;
  }, [search, positionFilter, muniFilter, roleFilter]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setPositionFilter("all");
    setMuniFilter("all");
    setRoleFilter("all");
  }, []);

  const handleCopyEmails = useCallback(async () => {
    if (filteredEmails.length === 0) return;
    if (await copyToClipboard(filteredEmails.join("; "))) {
      toast.success(`Skopiowano ${filteredEmails.length} adresów e-mail`, {
        description: "Wklej je w pole UDW, aby wysłać pismo do całej grupy.",
      });
    }
  }, [filteredEmails, copyToClipboard]);

  const handleExportVCard = useCallback(() => {
    if (filteredContacts.length === 0) return;
    const blob = new Blob([contactsToVCard(filteredContacts)], { type: "text/vcard;charset=utf-8" });
    downloadBlob(blob, `kontakty_ozipz_${getTodayIsoDate()}.vcf`);
    toast.success(`Wyeksportowano ${filteredContacts.length} kontaktów do pliku vCard`);
  }, [filteredContacts]);

  const handleShowIncomplete = useCallback(() => {
    setRoleFilter((prev) => (prev === "incomplete" ? "all" : "incomplete"));
  }, []);

  const isFiltered = activeFiltersCount > 0;

  return (
    <div className="space-y-4">
      {/* KPI Stats Header */}
      {showKpiSummary && (
        <ContactsStatsHeader
          total={stats.total}
          withPhone={stats.withPhone}
          withEmail={stats.withEmail}
          coordinators={stats.coordinators}
          incomplete={stats.incomplete}
          isIncompleteActive={roleFilter === "incomplete"}
          onShowIncomplete={handleShowIncomplete}
        />
      )}

      {/* Pasek filtrów, wyszukiwania i dodawania */}
      <ContactsFilterBar
        search={search}
        onSearchChange={setSearch}
        positionFilter={positionFilter}
        onPositionFilterChange={setPositionFilter}
        positions={positions}
        muniFilter={muniFilter}
        onMuniFilterChange={setMuniFilter}
        municipalities={municipalities}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        incompleteCount={stats.incomplete}
        onOpenAdd={onOpenAdd}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
        activeFiltersCount={activeFiltersCount}
        isKpiVisible={showKpiSummary}
        onToggleKpi={toggleKpiSummary}
      />

      {contacts.length > 0 && (
        <ContactsResultsBar
          shownCount={filteredContacts.length}
          totalCount={contacts.length}
          emailCount={filteredEmails.length}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onCopyEmails={handleCopyEmails}
          onExportVCard={handleExportVCard}
        />
      )}

      {viewMode === "grouped" && filteredContacts.length > 0 ? (
        <ContactsGroupedView
          contacts={filteredContacts}
          programsIndex={programsIndex}
          copiedId={copiedId}
          onCopy={handleCopy}
          onEdit={onOpenEdit}
        />
      ) : (
        <ContactsTableView
          contacts={filteredContacts}
          programsIndex={programsIndex}
          copiedId={copiedId}
          onCopy={handleCopy}
          onEdit={onOpenEdit}
          onDelete={onDelete}
          onOpenAdd={onOpenAdd}
          onClearFilters={handleClearFilters}
          isFiltered={isFiltered}
        />
      )}
    </div>
  );
}

export default ContactsSection;
