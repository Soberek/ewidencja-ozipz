import React from "react";
import { KpiToggleButton } from "@/components/ui/filter-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Info, BookOpen, Eye, Settings2 } from "lucide-react";
import type { RegisterTabKey } from "../../../types/ozipz.types";

export interface RegisterTabDef {
  key: RegisterTabKey;
  label: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor?: string;
}

export const OFFICIAL_REGISTER_TABS: Record<RegisterTabKey, RegisterTabDef> = {
  informacje: {
    key: "informacje",
    label: "Informacje",
    title: "Rejestr Informacji z Realizacji Zadań (Zał. nr 3 WSSE)",
    description: "Działania edukacyjne, szkolenia, prelekcje i pogadanki",
    icon: Info,
  },
  publikacje: {
    key: "publikacje",
    label: "Publikacje",
    title: "Rejestr Publikacji Medialnych i Internetowych",
    description: "Artykuły gov.pl, media społecznościowe i prasa",
    icon: BookOpen,
  },
  wizytacje: {
    key: "wizytacje",
    label: "Wizytacje",
    title: "Rejestr Wizytacji i Kontroli Koordynacyjnych",
    description: "Wizytacje placówek i spotkania w terenie",
    icon: Eye,
  },
  konfiguracja: {
    key: "konfiguracja",
    label: "Konfiguracja",
    title: "Konfiguracja i Mapowanie Form Działań do Rejestrów",
    description: "Zasady automatycznego kwalifikowania wpisów",
    icon: Settings2,
  },
};

export interface RegistersTypeTabsProps {
  selectedTab: RegisterTabKey;
  onSelectTab: (tab: RegisterTabKey) => void;
  tabCounts: Record<RegisterTabKey, number>;
  isKpiVisible?: boolean;
  onToggleKpi?: () => void;
}

export function RegistersTypeTabs({
  selectedTab,
  onSelectTab,
  tabCounts,
  isKpiVisible = true,
  onToggleKpi,
}: RegistersTypeTabsProps) {
  const options = Object.values(OFFICIAL_REGISTER_TABS).map((tab) => ({
    value: tab.key,
    label: tab.label,
    icon: tab.icon,
    title: tab.title,
    count: tab.key !== "konfiguracja" ? tabCounts[tab.key] ?? 0 : undefined,
  }));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 select-none">
      <SegmentedControl aria-label="Rodzaj rejestru" value={selectedTab} onChange={onSelectTab} options={options} />
      {onToggleKpi && <KpiToggleButton visible={isKpiVisible} onToggle={onToggleKpi} className="ml-auto" />}
    </div>
  );
}
