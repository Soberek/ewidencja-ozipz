import type { z } from "zod";

/**
 * Waliduje wiersz bazy schematem domenowym. Wiersz niezgodny ze schematem (np. zapisany przez starszą wersję)
 * nie może zablokować wczytania całego modułu — zostaje zwrócony w stanie surowym z ostrzeżeniem w konsoli.
 */
export function parseRow<S extends z.ZodType>(schema: S, raw: Record<string, unknown>, entity: string): z.output<S> {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  console.warn(`[Mappers] Wiersz ${entity} ${String(raw.id ?? "")} nie przeszedł walidacji:`, result.error.issues);
  return raw as unknown as z.output<S>;
}
