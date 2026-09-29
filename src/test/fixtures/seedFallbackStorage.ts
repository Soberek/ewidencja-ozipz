import { MIGRATED_FIREBASE_DATA } from "./migratedData";

/** Loads the historical snapshot into the fallback (localStorage) store, which otherwise starts empty. */
export function seedFallbackStorage(): void {
  const { dictionaryItems, ...collections } = MIGRATED_FIREBASE_DATA;
  const entries: Record<string, unknown[]> = { ...collections, dictionaries: dictionaryItems };
  for (const [key, rows] of Object.entries(entries)) {
    localStorage.setItem(`ozipz_${key}`, JSON.stringify(rows));
  }
}
