import { useState, useMemo, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { useOzipzDbStore } from "../../store/useOzipzDbStore";
import { useModalStore } from "../../store/useModalStore";
import type { RegisterTabKey, OfficialRegisterKey, OzipzAction, OzipzFacility } from "../../types/ozipz.types";
import { RegistersStatsHeader } from "./components/RegistersStatsHeader";
import { RegistersTypeTabs } from "./components/RegistersTypeTabs";
import { RegistersFilterBar } from "./components/RegistersFilterBar";
import { ActiveRegisterBanner } from "./components/ActiveRegisterBanner";
import { InformationRegisterTable } from "./components/InformationRegisterTable";
import { PublicationsRegisterTable } from "./components/PublicationsRegisterTable";
import { VisitationsRegisterTable } from "./components/VisitationsRegisterTable";
import { RegistersConfigurationTab } from "./components/RegistersConfigurationTab";
import { parseRegisterMappings, resolveActionRegisters } from "../../utils/registerConfig";
import { exportRegisterToCsv, exportRegisterToExcel } from "../../utils/registerPresentation";
import { printRegister } from "../../utils/registerPrint";
import { useRegisterFiltering } from "./hooks/useRegisterFiltering";
import { useKpiVisibility } from "@/hooks/usePersistentToggle";

export function RegistersSection() {
  const actions = useOzipzDbStore((state) => state.actions);
  const facilities = useOzipzDbStore((state) => state.facilities);
  const staff = useOzipzDbStore((state) => state.staff);
  const saveRegisterMappings = useOzipzDbStore((state) => state.saveRegisterMappings);
  const dictionaryItems = useOzipzDbStore((state) => state.dictionaryItems);
  const activityTypes = useMemo(() => dictionaryItems.filter((item) => item.dictType === "activityType"), [dictionaryItems]);
  const jrwaSymbols = useMemo(() => {
    const seen = new Set<string>();
    return dictionaryItems.filter((item) => {
      if (item.dictType !== "jrwaSymbol" || item.code === "070" || item.code === "9010" || item.id.startsWith("dict-jrw-") || seen.has(item.code)) return false;
      seen.add(item.code);
      return true;
    });
  }, [dictionaryItems]);
  const registerMappings = useMemo(() => parseRegisterMappings(dictionaryItems), [dictionaryItems]);
  const db = { actions, facilities, staff, activityTypes, jrwaSymbols, registerMappings, saveRegisterMappings };
  const openModal = useModalStore((s) => s.openModal);

  // Stan aktywnej zakładki
  const [activeTab, setActiveTab] = useState<RegisterTabKey>("informacje");

  const { isKpiVisible: showKpiSummary, toggleKpi: handleToggleKpi } = useKpiVisibility("registers");

  // Filtry
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [month, setMonth] = useState<string>("");
  const [jrwa, setJrwa] = useState<string>("");
  const [educator, setEducator] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Mapa placówek do szybkiego wyszukiwania adresów
  const facilitiesMap = useMemo(() => {
    const map = new Map<string, OzipzFacility>();
    db.facilities.forEach((f) => map.set(f.id, f));
    return map;
  }, [db.facilities]);

  // Lista unikalnych edukatorów / osób odpowiedzialnych
  const educators = useMemo(() => {
    const set = new Set<string>();
    db.staff.forEach((s) => {
      if (s.fullName && s.fullName.trim()) set.add(s.fullName.trim());
    });
    db.actions.forEach((a) => {
      if (a.leadEducator && a.leadEducator.trim()) set.add(a.leadEducator.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [db.staff, db.actions]);

  // Kwalifikacja wszystkich działań do 3 rejestrów
  const allRegisterActions = useMemo(() => {
    const grouped: Record<OfficialRegisterKey, OzipzAction[]> = {
      informacje: [],
      publikacje: [],
      wizytacje: [],
    };

    db.actions.forEach((action) => {
      const keys = resolveActionRegisters({
        action,
        mappings: db.registerMappings,
      });

      keys.forEach((key) => {
        if (grouped[key]) {
          grouped[key].push(action);
        }
      });
    });

    return grouped;
  }, [db.actions, db.registerMappings]);

  // Statystyki globalne dla paska KPI
  const stats = useMemo(() => {
    const uniqueIds = new Set<string>();
    allRegisterActions.informacje.forEach((a) => uniqueIds.add(a.id));
    allRegisterActions.publikacje.forEach((a) => uniqueIds.add(a.id));
    allRegisterActions.wizytacje.forEach((a) => uniqueIds.add(a.id));

    const totalRecipients = allRegisterActions.informacje.reduce(
      (sum, a) => sum + (Number(a.participantsCount) || 0),
      0
    );

    return {
      totalCount: uniqueIds.size,
      informacjeCount: allRegisterActions.informacje.length,
      totalRecipients,
      publikacjeCount: allRegisterActions.publikacje.length,
      wizytacjeCount: allRegisterActions.wizytacje.length,
    };
  }, [allRegisterActions]);

  // Przefiltrowane listy dla każdego rejestru przez dedykowany hook
  const { filteredInformacje, filteredPublikacje, filteredWizytacje, isFiltered } =
    useRegisterFiltering({
      allRegisterActions,
      year,
      month,
      jrwa,
      educator,
      search,
    });

  // Liczniki zakładek
  const tabCounts: Record<RegisterTabKey, number> = useMemo(
    () => ({
      informacje: filteredInformacje.length,
      publikacje: filteredPublikacje.length,
      wizytacje: filteredWizytacje.length,
      konfiguracja: db.activityTypes.length,
    }),
    [filteredInformacje.length, filteredPublikacje.length, filteredWizytacje.length, db.activityTypes.length]
  );

  const handleClearFilters = useCallback(() => {
    setYear("");
    setMonth("");
    setJrwa("");
    setEducator("");
    setSearch("");
  }, []);

  // Kliknięcie wiersza otwiera edytor działania
  const handleActionClick = useCallback(
    (action: OzipzAction) => {
      openModal("action", { item: action });
    },
    [openModal]
  );

  // Obsługa eksportu i druku
  const currentRegisterKey: OfficialRegisterKey =
    activeTab === "konfiguracja" ? "informacje" : activeTab;

  const currentActionsList =
    currentRegisterKey === "informacje"
      ? filteredInformacje
      : currentRegisterKey === "publikacje"
      ? filteredPublikacje
      : filteredWizytacje;

  const handlePrint = () => {
    printRegister({
      registerKey: currentRegisterKey,
      actions: currentActionsList,
      facilitiesMap,
      filters: {
        year: year || undefined,
        month: month || undefined,
        jrwa: jrwa || undefined,
        educator: educator || undefined,
        search: search.trim() || undefined,
      },
    });
  };

  const handleExportExcel = () => {
    exportRegisterToExcel(currentRegisterKey, currentActionsList, facilitiesMap);
  };

  const handleExportCsv = () => {
    exportRegisterToCsv(currentRegisterKey, currentActionsList, facilitiesMap);
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Nagłówek modułu */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            <span>Rejestry Urzędowe OZiPZ (WSSE Szczecin)</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Oficjalny Rejestr Informacji (Załącznik nr 3), Rejestr Publikacji oraz Rejestr Wizytacji zasilane automatycznie z działań edukacyjnych.
          </p>
        </div>
      </div>

      {/* 2. Pasek KPI */}
      {showKpiSummary && (
        <RegistersStatsHeader
          totalCount={stats.totalCount}
          informacjeCount={stats.informacjeCount}
          totalRecipients={stats.totalRecipients}
          publikacjeCount={stats.publikacjeCount}
          wizytacjeCount={stats.wizytacjeCount}
        />
      )}

      {/* 3. Zakładki 3 rejestrów + Konfiguracja */}
      <RegistersTypeTabs
        selectedTab={activeTab}
        onSelectTab={setActiveTab}
        tabCounts={tabCounts}
        isKpiVisible={showKpiSummary}
        onToggleKpi={handleToggleKpi}
      />

      {/* 4. Pasek filtrów i toolbar akcji */}
      <RegistersFilterBar
        year={year}
        onYearChange={setYear}
        month={month}
        onMonthChange={setMonth}
        jrwa={jrwa}
        onJrwaChange={setJrwa}
        educator={educator}
        onEducatorChange={setEducator}
        search={search}
        onSearchChange={setSearch}
        jrwaSymbols={db.jrwaSymbols}
        educators={educators}
        isFiltered={isFiltered}
        onClearFilters={handleClearFilters}
        onPrint={handlePrint}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        isConfigTab={activeTab === "konfiguracja"}
      />

      {/* 5. Baner nagłówkowy aktywnego rejestru */}
      {activeTab !== "konfiguracja" && (
        <ActiveRegisterBanner
          activeTab={activeTab}
          filteredCount={
            activeTab === "informacje"
              ? filteredInformacje.length
              : activeTab === "publikacje"
              ? filteredPublikacje.length
              : filteredWizytacje.length
          }
        />
      )}

      {/* 6. Widoki poszczególnych rejestrów */}
      {activeTab === "informacje" && (
        <InformationRegisterTable
          actions={filteredInformacje}
          onActionClick={handleActionClick}
        />
      )}

      {activeTab === "publikacje" && (
        <PublicationsRegisterTable
          actions={filteredPublikacje}
          onActionClick={handleActionClick}
        />
      )}

      {activeTab === "wizytacje" && (
        <VisitationsRegisterTable
          actions={filteredWizytacje}
          facilitiesMap={facilitiesMap}
          onActionClick={handleActionClick}
        />
      )}

      {activeTab === "konfiguracja" && (
        <RegistersConfigurationTab
          activityTypes={db.activityTypes}
          existingMappings={db.registerMappings}
          onSaveMappings={db.saveRegisterMappings}
        />
      )}
    </div>
  );
}

export default RegistersSection;
