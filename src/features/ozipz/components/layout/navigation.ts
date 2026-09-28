import {
  LayoutDashboard,
  Sparkles,
  FileCheck,
  Calendar,
  Mail,
  Boxes,
  ClipboardList,
  BarChart3,
  FileSearch,
  Globe,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  FolderTree,
  UserCog,
  FileText,
  Bookmark,
  Package,
  Settings,
  ClipboardPen,
  Printer,
  type LucideIcon,
} from "lucide-react";
import type { HealthPromotionTab } from "../../types/ozipz.types";

export interface SidebarItemConfig {
  id: HealthPromotionTab;
  path: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Dodatkowe frazy dopasowywane przez wyszukiwarkę modułów. */
  keywords?: string[];
}

export interface SidebarGroupConfig {
  id: string;
  label: string;
  items: SidebarItemConfig[];
}

export const SIDEBAR_GROUPS: readonly SidebarGroupConfig[] = [
  {
    id: "work",
    label: "Praca bieżąca",
    items: [
      { id: "pulpit", path: "/", label: "Pulpit główny", icon: LayoutDashboard, end: true, keywords: ["start", "dashboard"] },
      { id: "dzialania", path: "/dzialania", label: "Rejestr działań", icon: FileCheck, keywords: ["akcje", "ewidencja"] },
      { id: "harmonogram", path: "/harmonogram", label: "Harmonogram", icon: Calendar, keywords: ["kalendarz", "plan"] },
      { id: "lista-obecnosci", path: "/lista-obecnosci", label: "Lista obecności", icon: ClipboardPen, keywords: ["obecność", "druk", "prelekcja", "podpisy"] },
      { id: "sprawozdania", path: "/sprawozdania", label: "Mierniki i sprawozdania", icon: BarChart3, keywords: ["raport", "miernik budżetowy", "statystyki"] },
      { id: "asystent", path: "/asystent", label: "Asystent AI", icon: Sparkles, keywords: ["ai", "czat"] },
    ],
  },
  {
    id: "office",
    label: "Kancelaria",
    items: [
      { id: "znaki", path: "/znaki", label: "Spis spraw JRWA", icon: Bookmark, keywords: ["znak sprawy", "teczka"] },
      { id: "pisma", path: "/pisma", label: "Pisma i korespondencja", icon: Mail, keywords: ["listy", "poczta"] },
      { id: "rejestry", path: "/rejestry", label: "Rejestry urzędowe", icon: ClipboardList },
      { id: "skany", path: "/skany", label: "Archiwum skanów PDF", icon: FileSearch, keywords: ["pdf", "dokumenty"] },
    ],
  },
  {
    id: "materials",
    label: "Materiały i media",
    items: [
      { id: "materialy", path: "/materialy", label: "Katalog materiałów", icon: Package, keywords: ["ulotki", "plakaty", "magazyn"] },
      { id: "rozdzielniki", path: "/rozdzielniki", label: "Rozdzielniki", icon: Boxes, keywords: ["dystrybucja", "wydania"] },
      { id: "druk-rozdzielnika", path: "/druk-rozdzielnika", label: "Druk rozdzielnika", icon: Printer, keywords: ["rozdzielnik", "blankiet", "druk", "podpis"] },
      { id: "publikacje", path: "/publikacje", label: "Publikacje media", icon: Globe, keywords: ["artykuły", "gov", "x"] },
    ],
  },
  {
    id: "places",
    label: "Placówki i programy",
    items: [
      { id: "lokalizacje", path: "/lokalizacje", label: "Baza placówek", icon: Building2, keywords: ["szkoły", "przedszkola"] },
      { id: "programy", path: "/programy", label: "Programy profilaktyczne", icon: BookOpen },
      { id: "szkoly-w-programie", path: "/szkoly-w-programie", label: "Udział w programach", icon: GraduationCap, keywords: ["szkoły w programie"] },
      { id: "kontakty", path: "/kontakty", label: "Spis kontaktów", icon: Users, keywords: ["telefony", "dyrektorzy"] },
    ],
  },
  {
    id: "config",
    label: "Konfiguracja",
    items: [
      { id: "slowniki", path: "/slowniki", label: "Centrum słowników", icon: FolderTree, keywords: ["formy działań", "grupy odbiorców", "gminy", "kampanie"] },
      { id: "opisy-zadan", path: "/opisy-zadan", label: "Szablony zadań", icon: FileText, keywords: ["opisy"] },
      { id: "osoby", path: "/osoby", label: "Kadra pracownicza", icon: UserCog, keywords: ["pracownicy", "personel"] },
    ],
  },
];

/** Pozycje przypięte do stopki paska bocznego. */
export const SIDEBAR_FOOTER_ITEMS: readonly SidebarItemConfig[] = [
  { id: "ustawienia", path: "/ustawienia", label: "Ustawienia", icon: Settings, keywords: ["kopia", "baza danych"] },
];

const FOOTER_GROUP_LABEL = "System";

export interface CurrentPage {
  group: string;
  item: SidebarItemConfig;
  /** Podstrona w obrębie modułu (np. „Nowe działanie”). */
  subtitle?: string;
}

const ALL_ITEMS = [
  ...SIDEBAR_GROUPS.flatMap((group) => group.items.map((item) => ({ group: group.label, item }))),
  ...SIDEBAR_FOOTER_ITEMS.map((item) => ({ group: FOOTER_GROUP_LABEL, item })),
];

function findByPath(path: string) {
  return ALL_ITEMS.find(({ item }) => item.path === path);
}

function withSubtitle(path: string, subtitle: string): CurrentPage | undefined {
  const match = findByPath(path);
  return match && { ...match, subtitle };
}

/** Mapuje ścieżkę routera na pozycję menu (z uwzględnieniem podstron i aliasów). */
export function resolveCurrentPage(pathname: string): CurrentPage | undefined {
  if (pathname === "/dzialania/nowe") return withSubtitle("/dzialania", "Nowe działanie");
  if (/^\/dzialania\/[^/]+\/edytuj$/.test(pathname)) return withSubtitle("/dzialania", "Edycja działania");
  if (pathname === "/miernik-budzetowy") return withSubtitle("/sprawozdania", "Miernik budżetowy");
  if (pathname === "/pulpit") return findByPath("/");
  if (pathname === "/slownik-dzialania") return findByPath("/slowniki");
  return findByPath(pathname);
}

/** Normalizacja do wyszukiwania bez polskich znaków i wielkości liter. */
export function normalizeNavQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .trim();
}

export function matchesNavQuery(item: SidebarItemConfig, query: string): boolean {
  if (!query) return true;
  return [item.label, ...(item.keywords ?? [])].some((text) => normalizeNavQuery(text).includes(query));
}
