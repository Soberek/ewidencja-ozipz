import type { OzipzDictionaryItem, OzipzMaterial, OzipzProgram, OzipzTemplate } from "../types/ozipz.types";
import { plural } from "./actionBreakdown";
import { getProgramJrwaSymbol } from "./programJrwaUtils";
import { parseAudienceGroups } from "../components/actions/editor/audienceUtils";

// Formy działania nie sprawdzamy: w bazie idzie za słownikiem form (kod „prelekcja” stał się etykietą
// „Prelekcja (warsztat)”), więc puste rekordy z importu przestałyby być rozpoznawane.
export const isEmptyImportedTemplate = (template: OzipzTemplate) =>
  template.title === "Szablon zadania" &&
  template.topic === "inne" &&
  template.defaultAudience === "uczniowie_sp" &&
  !template.descriptionTemplate?.trim() &&
  !template.suggestedMaterials?.trim() &&
  !template.actionDefaults;

export type TemplateAudienceGroup = NonNullable<NonNullable<OzipzTemplate["actionDefaults"]>["audienceGroups"]>[number];
export type TemplatePayload = Omit<OzipzTemplate, "id" | "createdAt" | "updatedAt" | "suggestedMaterials">;

/** Treść szablonu w jednym kształcie: to, co wypełnia formularz działania. */
export interface TemplateContent {
  name: string;
  actionType: string;
  title: string;
  programId: string;
  jrwaSymbol: string;
  campaignId: string;
  leadEducator: string;
  numberOfActions: number;
  audienceGroups: TemplateAudienceGroup[];
  materialIds: string[];
  description: string;
}

/** Nazwy nadawane automatycznie („Grupa 2”) — w szablonie zostają puste, formularz i tak je pokazuje. */
const isDefaultGroupName = (name: string) => /^grupa\s*\d+$/i.test(name.trim());

/** Odbiorcy bez pustych pozycji i grup — tak je zapisujemy i porównujemy. */
function normalizeAudience(groups: TemplateAudienceGroup[]): TemplateAudienceGroup[] {
  return groups
    .map((group) => ({
      name: isDefaultGroupName(group.name) ? "" : group.name.trim(),
      items: group.items
        .filter((item) => item.name.trim())
        .map((item) => ({ name: item.name.trim(), ageFrom: item.ageFrom ?? null, ageTo: item.ageTo ?? null })),
    }))
    .filter((group) => group.items.length > 0);
}

export function normalizeTemplateContent(content: TemplateContent): TemplateContent {
  return {
    name: content.name.trim(),
    actionType: content.actionType.trim(),
    title: content.title.trim(),
    programId: content.programId,
    // Program sam wyznacza symbol JRWA — osobny symbol ma tylko klasyfikacja bez programu.
    jrwaSymbol: content.programId ? "" : content.jrwaSymbol,
    campaignId: content.campaignId,
    leadEducator: content.leadEducator.trim(),
    numberOfActions: Math.max(1, Math.trunc(Number(content.numberOfActions)) || 1),
    audienceGroups: normalizeAudience(content.audienceGroups),
    materialIds: [...new Set(content.materialIds.filter(Boolean))],
    description: content.description.trim(),
  };
}

/**
 * Odbiorcy ze starszego zapisu (tekst). Formularz działania spłaszczał grupy do listy nazw po średniku, więc każda nazwa
 * wyglądała jak osobna grupa — taki zapis łączymy w jedną grupę bez powtórzeń. Jawne grupy („Grupa I: …”) zostają.
 */
function legacyAudience(raw: string): TemplateAudienceGroup[] {
  if (!raw.trim()) return [];
  const groups = parseAudienceGroups(raw).filter((group) => group.items.some((item) => item.name.trim()));
  const flattened = groups.every((group) => group.items.length === 1 && isDefaultGroupName(group.name));
  if (flattened) {
    const names = [...new Set(groups.map((group) => group.items[0].name.trim()))];
    return names.length ? [{ name: "", items: names.map((name) => ({ name, ageFrom: null, ageTo: null })) }] : [];
  }
  return groups.map((group) => ({
    name: group.name,
    items: group.items.map((item) => ({ name: item.name, ageFrom: item.ageFrom ?? null, ageTo: item.ageTo ?? null })),
  }));
}

/**
 * Odczyt szablonu. Szablony sprzed pełnego zapisu trzymały program jako nazwę w `topic`, klasyfikację jako tekst
 * „JRWA 966.1 – …”, a odbiorców jako tekst (zob. legacyAudience).
 */
export function resolveTemplateContent(template: OzipzTemplate, programs: OzipzProgram[] = []): TemplateContent {
  const defaults = template.actionDefaults;
  const common = {
    name: template.title,
    actionType: template.actionType,
    title: defaults?.title || "",
    campaignId: defaults?.campaignId || "",
    leadEducator: defaults?.leadEducator || "",
    description: template.descriptionTemplate || "",
  };
  if (defaults?.audienceGroups) {
    return {
      ...common,
      programId: defaults.programId || "",
      jrwaSymbol: defaults.jrwaSymbol || "",
      numberOfActions: defaults.numberOfActions || 1,
      audienceGroups: defaults.audienceGroups,
      materialIds: defaults.materialIds || [],
    };
  }
  const topic = (template.topic || "").trim();
  const program = topic ? programs.find((p) => p.name === topic) : undefined;
  return {
    ...common,
    programId: program?.id || "",
    jrwaSymbol: program ? "" : topic.match(/^JRWA\s+([\d.]+)/)?.[1] || "",
    numberOfActions: 1,
    audienceGroups: legacyAudience(template.defaultAudience || ""),
    materialIds: [],
  };
}

/** Rekord do zapisu w bazie. Kolumny starszego zapisu (`topic`, `defaultAudience`) zostają puste — wszystko jest w actionDefaults. */
export function buildTemplatePayload(content: TemplateContent): TemplatePayload {
  const c = normalizeTemplateContent(content);
  return {
    title: c.name,
    actionType: c.actionType,
    descriptionTemplate: c.description,
    topic: "",
    defaultAudience: "",
    actionDefaults: {
      title: c.title,
      leadEducator: c.leadEducator,
      campaignId: c.campaignId,
      programId: c.programId,
      jrwaSymbol: c.jrwaSymbol,
      numberOfActions: c.numberOfActions,
      audienceGroups: c.audienceGroups,
      materialIds: c.materialIds,
    },
  };
}

/** Klucz porównania treści (bez nazwy szablonu) — do wykrycia, że formularz różni się od wczytanego szablonu. */
export function templateContentKey(content: TemplateContent): string {
  const { name: _name, ...rest } = normalizeTemplateContent(content);
  return JSON.stringify(rest);
}

/** Szablony w kolejności alfabetycznej, bez pustych rekordów z importu. */
export function usableTemplates(templates: OzipzTemplate[]): OzipzTemplate[] {
  return templates
    .filter((template) => !isEmptyImportedTemplate(template))
    .sort((a, b) => a.title.localeCompare(b.title, "pl"));
}

export interface TemplateDescription {
  programName: string;
  classification: string;
  count: string;
  audience: string;
  materials: string;
}

/** Krótki opis treści szablonu: program lub JRWA, liczba działań, odbiorcy i materiały. */
export function describeTemplateContent(
  content: TemplateContent,
  { programs = [], materials = [], jrwaSymbols = [] }: { programs?: OzipzProgram[]; materials?: OzipzMaterial[]; jrwaSymbols?: OzipzDictionaryItem[] } = {}
): TemplateDescription {
  const c = normalizeTemplateContent(content);
  const program = programs.find((p) => p.id === c.programId);
  const symbol = program ? getProgramJrwaSymbol(program) : c.jrwaSymbol;
  const symbolLabel = !program && symbol ? jrwaSymbols.find((j) => j.code === symbol)?.label.replace(new RegExp(`^${symbol.replace(/\./g, "\\.")}\\s*[-–:]?\\s*`), "") : "";
  const classification = program
    ? `${program.name}${symbol ? ` (JRWA ${symbol})` : ""}`
    : c.programId ? "Program usunięty z katalogu"
    : symbol ? `JRWA ${symbol}${symbolLabel ? ` — ${symbolLabel}` : ""}` : "";
  const groups = c.audienceGroups;
  const names = [...new Set(groups.flatMap((group) => group.items.map((item) => item.name)))];
  const audience = groups.length > 1 ? `${plural(groups.length, ["grupa", "grupy", "grup"])}: ${names.join(", ")}` : names.join(", ");
  const materialNames = c.materialIds.map((id) => materials.find((m) => m.id === id)?.title || "materiał usunięty z katalogu");
  return {
    programName: program?.name || "",
    classification,
    count: c.numberOfActions > 1 ? plural(c.numberOfActions, ["działanie", "działania", "działań"]) : "",
    audience,
    materials: materialNames.join(", "),
  };
}
