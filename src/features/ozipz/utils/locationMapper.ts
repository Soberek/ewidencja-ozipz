import type { OzipzFacility } from "../types/ozipz.types";

export interface RawLocationInput {
  id?: string | number;
  name?: string;
  nazwa?: string;
  title?: string;
  type?: string;
  typ?: string;
  address?: string;
  adres?: string;
  city?: string;
  miejscowosc?: string;
  postalCode?: string;
  kodPocztowy?: string;
  municipality?: string;
  gmina?: string;
  county?: string;
  powiat?: string;
  leadingAuthority?: string;
  organProwadzacy?: string;
  notes?: string;
  [key: string]: unknown;
}

export function parseFirebaseRawInput(input: unknown): RawLocationInput[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((item) => typeof item === "object" && item !== null) as RawLocationInput[];
  }
  if (typeof input === "string") {
    try {
      return parseFirebaseRawInput(JSON.parse(input));
    } catch {
      return [];
    }
  }
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    for (const key of ["locations", "facilities", "placowki", "data", "items"]) {
      if (Array.isArray(obj[key])) {
        return parseFirebaseRawInput(obj[key]);
      }
    }
    return Object.entries(obj).map(([key, val]) => {
      if (typeof val === "object" && val !== null) {
        return { id: key, ...(val as object) } as RawLocationInput;
      }
      return null;
    }).filter(Boolean) as RawLocationInput[];
  }
  return [];
}

export function mapRawLocationToFacility(raw: RawLocationInput, existing: OzipzFacility[] = []): OzipzFacility {
  const name = (raw.name || raw.nazwa || raw.title || "").trim();
  const address = (raw.address || raw.adres || "").trim();
  const city = (raw.city || raw.miejscowosc || "").trim();
  const postalCode = (raw.postalCode || raw.kodPocztowy || "").trim();
  const municipality = (raw.municipality || raw.gmina || city || "").trim();
  const county = (raw.county || raw.powiat || "myśliborski").trim();
  const leadingAuthority = (raw.leadingAuthority || raw.organProwadzacy || `Gmina ${municipality}`).trim();

  const found = existing.find((f) => f.name.toLowerCase() === name.toLowerCase() && f.city.toLowerCase() === city.toLowerCase());
  const now = new Date().toISOString();
  const isComplex = name.toLowerCase().includes("zespół") || name.toLowerCase().includes("zespol");

  return {
    id: found ? found.id : `fac-fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name || "Placówka bez nazwy",
    type: (raw.type || raw.typ || "szkola") as string,
    educationTypes: found?.educationTypes ?? [],
    address,
    city,
    postalCode,
    municipality,
    county,
    leadingAuthority,
    isComplex: found?.isComplex ?? isComplex,
    parentFacilityId: found?.parentFacilityId ?? undefined,
    notes: (raw.notes as string) || undefined,
    createdAt: found ? found.createdAt : now,
    updatedAt: now,
  };
}
