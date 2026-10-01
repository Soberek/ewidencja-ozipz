import type { OzipzAction, OzipzProgram } from "../../../types/ozipz.types";
import { getActionEzdState } from "../actionEzdStatus";
import type { ActiveFilterItem } from "../list/ActionsFilterChips";
import { DEFAULT_PUBLICATIONS_MODE, DEFAULT_STATUS_FILTER, type PublicationsMode, type StatusFilter } from "./useActionFilterState";
import { isPublicationActionType, normalizeActionType } from "../editor/editorUtils";
import { municipalityName } from "../../../utils/facilityUtils";

export interface ActionsFilterCriteria {
  programs?: OzipzProgram[];
  search: string; effectivePeriod: string;
  /** Rok działania ("2026"); pusty = wszystkie lata. */
  yearFilter?: string;
  statusFilter: StatusFilter;
  quickFilterEzd: boolean;
  quickFilterProgramOnly: boolean; quickFilterInProgress: boolean;
  materialsOnlyFilter: boolean; quickFilterPublications: boolean; hidePublications: boolean;
  selectedMunicipalities: string[]; selectedPrograms: string[];
  selectedActivityTypes: string[]; selectedTopics: string[];
  educatorFilter: string; ezdFilter: string;
}

// Tekst przeszukiwany dla danego działania; obiekty w store są niemutowalne, więc cache po referencji jest bezpieczny.
const searchTextCache = new WeakMap<OzipzAction, string>();
function actionSearchText(a: OzipzAction): string {
  let text = searchTextCache.get(a);
  if (text === undefined) {
    text = `${a.title || ""} ${a.facilityName || ""} ${a.municipality || ""} ${a.leadEducator || ""} ${a.jrwaSign || ""} ${a.izrzSign || ""} ${a.programName || ""} ${a.actionType || ""} ${a.topic || ""} ${a.audienceGroup || ""}`.toLowerCase();
    searchTextCache.set(a, text);
  }
  return text;
}

export function filterActionsList(actions: OzipzAction[], c: ActionsFilterCriteria): OzipzAction[] {
  const hasExplicitPub = c.quickFilterPublications ||
    c.selectedActivityTypes.some((t) => isPublicationActionType(t) || t.toLowerCase().includes("publikac"));
  const query = c.search.trim().toLowerCase();
  const municipalities = new Set(c.selectedMunicipalities.map((m) => municipalityName(m).toLowerCase()));
  const topics = new Set(c.selectedTopics.map((t) => t.toLowerCase()));
  const educator = c.educatorFilter.toLowerCase();

  return actions
    .filter((a) => {
      if (c.statusFilter === "aktywne" && a.status === "odroczone") return false;
      if (c.statusFilter === "zakonczone" && a.status !== "wykonane") return false;
      if (c.quickFilterEzd && getActionEzdState(a) !== "pending") return false;
      if (c.quickFilterProgramOnly && !a.programId && !a.programName) return false;
      if (c.quickFilterInProgress && a.status !== "w_toku" && a.status !== "planowane") return false;
      if (c.materialsOnlyFilter && (Number(a.materialsDistributedCount) || 0) <= 0) return false;
      if (c.quickFilterPublications && !isPublicationActionType(a.actionType)) return false;
      if (c.hidePublications && !hasExplicitPub && isPublicationActionType(a.actionType)) return false;
      if (c.yearFilter && !(a.date || "").startsWith(`${c.yearFilter}-`)) return false;

      if (c.effectivePeriod) {
        const m = parseInt(a.date.slice(5, 7), 10);
        const qMatch = c.effectivePeriod === "q1" ? m >= 1 && m <= 3 : c.effectivePeriod === "q2" ? m >= 4 && m <= 6 : c.effectivePeriod === "q3" ? m >= 7 && m <= 9 : c.effectivePeriod === "q4" ? m >= 10 && m <= 12 : false;
        const hMatch = c.effectivePeriod === "h1" ? m >= 1 && m <= 6 : c.effectivePeriod === "h2" ? m >= 7 && m <= 12 : false;
        const mMatch = /^\d{2}$/.test(c.effectivePeriod) && a.date.slice(5, 7) === c.effectivePeriod;
        if (!qMatch && !hMatch && !mMatch) return false;
      }

      if (municipalities.size > 0 && !municipalities.has(municipalityName(a.municipality).toLowerCase())) return false;

      if (c.selectedPrograms.length > 0) {
        const matchProg = c.selectedPrograms.some((prog) =>
          prog === "none" ? !a.programId && !a.programName :
          a.programId === prog || Boolean(a.programName && (
            a.programName.toLowerCase().includes(prog.toLowerCase()) ||
            c.programs?.some((p) => p.id === prog && p.name.toLowerCase() === a.programName?.toLowerCase())
          ))
        );
        if (!matchProg) return false;
      }

      if (c.selectedActivityTypes.length > 0) {
        const actType = (a.actionType || "").toLowerCase();
        const normType = normalizeActionType(a.actionType).toLowerCase();
        const matchType = c.selectedActivityTypes.some((t) => {
          const lt = t.toLowerCase();
          if (lt === "publikacje" || lt === "publikacje_wszystkie" || lt.includes("wszystkie publikacje") || lt.includes("publikacje (wszystkie")) {
            return isPublicationActionType(a.actionType);
          }
          const normFilter = normalizeActionType(t).toLowerCase();
          return lt === actType || lt === normType || normFilter === normType || normFilter === actType;
        });
        if (!matchType) return false;
      }

      if (topics.size > 0 && !topics.has((a.topic || "").toLowerCase())) return false;

      if (educator && (a.leadEducator || "").toLowerCase() !== educator) return false;
      if (c.ezdFilter !== "all" && a.ezdStatus !== c.ezdFilter) return false;

      if (query && !actionSearchText(a).includes(query)) return false;
      return true;
    })
    .sort((a, b) => ((b.date || "") < (a.date || "") ? -1 : (b.date || "") > (a.date || "") ? 1 : 0));
}

export interface FilterChipState {
  search: string; effectivePeriod: string; yearFilter: string;
  statusFilter: StatusFilter; publicationsMode: PublicationsMode;
  quickFilterEzd: boolean; quickFilterProgramOnly: boolean; quickFilterInProgress: boolean; materialsOnlyFilter: boolean;
  selectedMunicipalities: string[]; selectedPrograms: string[]; selectedActivityTypes: string[]; selectedTopics: string[];
  educatorFilter: string; ezdFilter: string;
}

export interface FilterChipSetters {
  setSearch: (val: string) => void;
  setSelectedMonth: (val: string) => void; setPeriodFilter: (val: string) => void; setYearFilter: (val: string) => void;
  setStatusFilter: (val: StatusFilter) => void; setPublicationsMode: (val: PublicationsMode) => void;
  setQuickFilterEzd: (val: boolean) => void; setQuickFilterProgramOnly: (val: boolean) => void;
  setQuickFilterInProgress: (val: boolean) => void; setMaterialsOnlyFilter: (val: boolean) => void;
  setSelectedMunicipalities: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedPrograms: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedActivityTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  setEducatorFilter: (val: string) => void; setEzdFilter: (val: string) => void;
}

/** Widok, w którym rejestr się otwiera; etykieta pojawia się tylko dla filtrów, które od niego odbiegają. */
export interface FilterDefaults {
  period: string;
  year: string;
}

const PERIOD_LABELS: Record<string, string> = {
  q1: "I Kwartał (I-III)", q2: "II Kwartał (IV-VI)", q3: "III Kwartał (VII-IX)", q4: "IV Kwartał (X-XII)",
  h1: "I Półrocze (I-VI)", h2: "II Półrocze (VII-XII)",
  "01": "Styczeń", "02": "Luty", "03": "Marzec", "04": "Kwiecień", "05": "Maj", "06": "Czerwiec",
  "07": "Lipiec", "08": "Sierpień", "09": "Wrzesień", "10": "Październik", "11": "Listopad", "12": "Grudzień",
};
const EZD_LABELS: Record<string, string> = { do_ezd: "Wymaga EZD", w_ezd: "Wprowadzone w EZD", nie_dotyczy: "Nie dotyczy" };
const STATUS_LABELS: Record<StatusFilter, string> = { aktywne: "Aktywne", wszystkie: "Wszystkie", zakonczone: "Zakończone" };
const PUBLICATIONS_LABELS: Record<PublicationsMode, string> = { ukryte: "Schowane", widoczne: "Widoczne", tylko: "Tylko publikacje" };

/**
 * Etykiety filtrów odbiegających od widoku domyślnego. Usunięcie etykiety przywraca wartość domyślną,
 * a ich liczba jest liczbą aktywnych filtrów.
 */
export function generateActiveFilterChips(
  f: FilterChipState,
  s: FilterChipSetters,
  defaults: FilterDefaults,
  programs: OzipzProgram[] = []
): ActiveFilterItem[] {
  const chips: ActiveFilterItem[] = [];
  const search = f.search.trim();
  if (search) chips.push({ id: "search", label: "Szukaj", value: `„${search}”`, onRemove: () => s.setSearch("") });
  if (f.yearFilter !== defaults.year) {
    chips.push({ id: "year", label: "Rok", value: f.yearFilter || "Wszystkie lata", onRemove: () => s.setYearFilter(defaults.year) });
  }
  if (f.effectivePeriod !== defaults.period) {
    chips.push({
      id: "period", label: "Okres",
      value: f.effectivePeriod ? PERIOD_LABELS[f.effectivePeriod] || f.effectivePeriod : f.yearFilter ? "Cały rok" : "Wszystkie miesiące",
      onRemove: () => { s.setPeriodFilter(""); s.setSelectedMonth(defaults.period); },
    });
  }
  if (f.statusFilter !== DEFAULT_STATUS_FILTER) {
    chips.push({ id: "status", label: "Status", value: STATUS_LABELS[f.statusFilter], onRemove: () => s.setStatusFilter(DEFAULT_STATUS_FILTER) });
  }
  if (f.publicationsMode !== DEFAULT_PUBLICATIONS_MODE) {
    chips.push({ id: "publications", label: "Publikacje", value: PUBLICATIONS_LABELS[f.publicationsMode], onRemove: () => s.setPublicationsMode(DEFAULT_PUBLICATIONS_MODE) });
  }
  if (f.quickFilterEzd) chips.push({ id: "quick-ezd", label: "EZD", value: "Wymaga wpisu", onRemove: () => s.setQuickFilterEzd(false) });
  if (f.quickFilterProgramOnly) chips.push({ id: "quick-program", label: "Działania", value: "Tylko programowe", onRemove: () => s.setQuickFilterProgramOnly(false) });
  if (f.quickFilterInProgress) chips.push({ id: "quick-in-progress", label: "Status", value: "W toku / planowane", onRemove: () => s.setQuickFilterInProgress(false) });
  if (f.materialsOnlyFilter) chips.push({ id: "materials", label: "Materiały", value: "MAT > 0", onRemove: () => s.setMaterialsOnlyFilter(false) });
  f.selectedMunicipalities.forEach((m) => chips.push({ id: `muni-${m}`, label: "Gmina", value: m, onRemove: () => s.setSelectedMunicipalities((p) => p.filter((x) => x !== m)) }));
  f.selectedPrograms.forEach((p) => chips.push({ id: `prog-${p}`, label: "Program", value: p === "none" ? "Nieprogramowe (własne)" : programs.find((program) => program.id === p)?.name || p, onRemove: () => s.setSelectedPrograms((x) => x.filter((i) => i !== p)) }));
  f.selectedActivityTypes.forEach((a) => chips.push({ id: `act-${a}`, label: "Forma", value: a, onRemove: () => s.setSelectedActivityTypes((p) => p.filter((x) => x !== a)) }));
  f.selectedTopics.forEach((t) => chips.push({ id: `top-${t}`, label: "Tematyka", value: t, onRemove: () => s.setSelectedTopics((p) => p.filter((x) => x !== t)) }));
  if (f.educatorFilter) chips.push({ id: "edu", label: "Edukator", value: f.educatorFilter, onRemove: () => s.setEducatorFilter("") });
  if (f.ezdFilter !== "all") chips.push({ id: "ezd", label: "Status EZD", value: EZD_LABELS[f.ezdFilter] || f.ezdFilter, onRemove: () => s.setEzdFilter("all") });
  return chips;
}
