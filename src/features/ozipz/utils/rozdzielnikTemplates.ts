import type { RozdzielnikItem } from "./rozdzielnikPrint";

/** Zapisany zestaw materiałów rozdzielnika — np. stały komplet ulotek dla danego programu. */
export interface RozdzielnikTemplate {
  id: string;
  name: string;
  /** Tekst wpisywany w pole „Program” rozdzielnika. */
  programName: string;
  items: RozdzielnikItem[];
  updatedAt: string;
}

/** Odczyt szablonu z bazy; odrzuca uszkodzone wpisy zamiast przerywać wczytywanie listy. */
export function parseRozdzielnikTemplate(value: unknown): RozdzielnikTemplate | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string" || !raw.name.trim() || !Array.isArray(raw.items)) return null;
  const items = raw.items.flatMap((item): RozdzielnikItem[] => {
    if (!item || typeof item !== "object") return [];
    const { title, quantity } = item as Record<string, unknown>;
    if (typeof title !== "string") return [];
    return [{ title, quantity: typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : undefined }];
  });
  return {
    id: raw.id,
    name: raw.name.trim(),
    programName: typeof raw.programName === "string" ? raw.programName : "",
    items,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

export function sortRozdzielnikTemplates(templates: RozdzielnikTemplate[]): RozdzielnikTemplate[] {
  return [...templates].sort((a, b) => a.name.localeCompare(b.name, "pl"));
}
