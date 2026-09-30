import {
  LayoutDashboard,
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
  History,
  Wrench,
  CalendarClock,
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

export interface ToolConfig {
  id: string;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords?: string[];
}

/** Narzędzia dostępne w module „Narzędzia”. Nowe narzędzie: wpis tutaj + widok w ToolsSection. */
export const TOOLS = [
  {
    id: "lista-obecnosci",
    path: "/narzedzia/lista-obecnosci",
    label: "Lista obecności",
    description: "Druk listy obecności uczestników zajęć lub prelekcji (F/PT/PZ/01/01).",
    icon: ClipboardPen,
    keywords: ["obecność", "druk", "prelekcja", "podpisy"],
  },
  {
    id: "druk-rozdzielnika",
    path: "/narzedzia/druk-rozdzielnika",
    label: "Druk rozdzielnika",
    description: "Rozdzielnik materiałów do podpisu — z zadania w rejestrze albo pusty blankiet.",
    icon: Printer,
    keywords: ["rozdzielnik", "blankiet", "druk", "podpis"],
  },
  {
    id: "praca-w-dniu-wolnym",
    path: "/narzedzia/praca-w-dniu-wolnym",
    label: "Praca w dniu wolnym",
    description: "Wniosek do Dyrektora o zgodę na pracę w sobotę, niedzielę lub święto — z listą pracowników i kontrolą błędów.",
    icon: CalendarClock,
    keywords: ["wniosek", "sobota", "niedziela", "święto", "zgoda", "dzień wolny", "nadgodziny"],
  },
] as const satisfies readonly ToolConfig[];

export type ToolId = (typeof TOOLS)[number]["id"];

export function findTool(id: string | undefined): ToolConfig | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

export const SIDEBAR_GROUPS: readonly SidebarGroupConfig[] = [
  {
    id: "work",
    label: "Praca bieżąca",
    items: [
      { id: "pulpit", path: "/", label: "Pulpit główny", icon: LayoutDashboard, end: true, keywords: ["start", "dashboard"] },
      { id: "dzialania", path: "/dzialania", label: "Rejestr działań", icon: FileCheck, keywords: ["akcje", "ewidencja"] },
      { id: "harmonogram", path: "/harmonogram", label: "Harmonogram", icon: Calendar, keywords: ["kalendarz", "plan"] },
      { id: "sprawozdania", path: "/sprawozdania", label: "Mierniki i sprawozdania", icon: BarChart3, keywords: ["raport", "miernik budżetowy", "statystyki"] },
      { id: "narzedzia", path: "/narzedzia", label: "Narzędzia", icon: Wrench, keywords: TOOLS.flatMap((tool) => [tool.label, ...tool.keywords]) },
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
      { id: "historia", path: "/historia", label: "Historia zmian i kosz", icon: History, keywords: ["kosz", "przywróć", "cofnij", "usunięte", "audyt"] },
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
  const tool = TOOLS.find((item) => item.path === pathname);
  if (tool) return withSubtitle("/narzedzia", tool.label);
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

export function matchesNavQuery(item: Pick<SidebarItemConfig, "label" | "keywords">, query: string): boolean {
  if (!query) return true;
  return [item.label, ...(item.keywords ?? [])].some((text) => normalizeNavQuery(text).includes(query));
}
