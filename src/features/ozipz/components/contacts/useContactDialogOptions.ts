import { useMemo } from "react";
import { Building2, School } from "lucide-react";
import type { SelectOption } from "@/components/ui/select";
import type { AutocompleteOption } from "@/components/ui/autocomplete";
import type { OzipzDictionaryItem, OzipzFacility } from "../../types/ozipz.types";

/** Listy podpowiedzi formularza kontaktu: stanowiska, gminy i placówki pogrupowane według gmin. */
export function useContactDialogOptions(
  positions: (string | OzipzDictionaryItem)[],
  municipalities: string[],
  facilities: OzipzFacility[]
) {
  const dynamicPositions: string[] = useMemo(() => {
    return Array.from(
      new Set(
        positions
          .map((p) => {
            if (typeof p === "string") return p.trim();
            if (p && typeof p === "object") return (p.label || p.code || "").trim();
            return "";
          })
          .filter(Boolean)
      )
    );
  }, [positions]);

  const dynamicMunicipalities: string[] = useMemo(() => {
    return Array.from(
      new Set(
        municipalities
          .map((m) => (typeof m === "string" ? m.trim() : ""))
          .filter(Boolean)
      )
    );
  }, [municipalities]);

  const facilityAutocompleteOptions: AutocompleteOption[] = useMemo(() => {
    return facilities.map((f) => {
      const groupLabel = f.municipality
        ? f.municipality.toLowerCase().startsWith("gmina")
          ? f.municipality
          : `Gmina ${f.municipality}`
        : "Inne";

      return {
        value: f.id,
        label: f.name,
        group: groupLabel,
        description: `${f.address}, ${f.city}`,
        icon: f.isComplex ? Building2 : School,
        badge: f.isComplex ? "Zespół" : undefined,
      };
    });
  }, [facilities]);

  const municipalityOptions: SelectOption[] = useMemo(() => {
    return dynamicMunicipalities.map((m) => ({
      value: m,
      label: m,
    }));
  }, [dynamicMunicipalities]);

  return { dynamicPositions, facilityAutocompleteOptions, municipalityOptions };
}
