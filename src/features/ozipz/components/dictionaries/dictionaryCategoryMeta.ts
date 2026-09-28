import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  FileText,
  MapPin,
  Package,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { DICTIONARY_CATEGORIES_CONFIG, type DictionaryCategoryDef } from "../../constants";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  activityType: Activity,
  recipientGroup: Users,
  campaign: Sparkles,
  annotationReason: AlertCircle,
  locationType: Building2,
  municipality: MapPin,
  materialType: Package,
  jrwaSymbol: Bookmark,
  documentType: FileText,
  staffRole: Briefcase,
  contactPosition: UserCheck,
  all: BookOpen,
};

export function getCategoryIcon(key: string): LucideIcon {
  return CATEGORY_ICONS[key] ?? BookOpen;
}

export interface DictionaryCategoryGroup {
  id: string;
  label: string;
  keys: string[];
}

/** Grupowanie kategorii w nawigacji centrum słowników. */
export const DICTIONARY_CATEGORY_GROUPS: DictionaryCategoryGroup[] = [
  { id: "work", label: "Działania i plan pracy", keys: ["activityType", "recipientGroup", "campaign", "annotationReason"] },
  { id: "places", label: "Miejsca", keys: ["locationType", "municipality"] },
  { id: "office", label: "Kancelaria i dokumenty", keys: ["jrwaSymbol", "documentType", "materialType"] },
  { id: "people", label: "Kadra i kontakty", keys: ["staffRole", "contactPosition"] },
];

/** Definicja kategorii — także dla słowników własnych spoza konfiguracji. */
export function getCategoryDef(key: string): DictionaryCategoryDef {
  return (
    DICTIONARY_CATEGORIES_CONFIG[key] ?? {
      key,
      label: key,
      shortLabel: key,
      description: "Słownik własny utworzony przez użytkownika.",
      iconName: "BookOpen",
      badgeClass: "",
    }
  );
}

export const isJrwaCategory = (key: string) =>
  key === "jrwaSymbol" || key === "symbole_jrwa" || key.toLowerCase().includes("jrwa");

export const isMunicipalityCategory = (key: string) => key === "municipality" || key === "gmina";
