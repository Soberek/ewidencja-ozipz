export const MUNICIPALITY_POSTAL_CONFIG: Record<string, { postalCode: string; postalCity: string }> = {
  mysliborz: { postalCode: "74-300", postalCity: "Myślibórz" },
  "myślibórz": { postalCode: "74-300", postalCity: "Myślibórz" },
  barlinek: { postalCode: "74-320", postalCity: "Barlinek" },
  debno: { postalCode: "74-400", postalCity: "Dębno" },
  "dębno": { postalCode: "74-400", postalCity: "Dębno" },
  boleszkowice: { postalCode: "74-311", postalCity: "Boleszkowice" },
  nowogrodek: { postalCode: "74-407", postalCity: "Nowogródek Pomorski" },
  "nowogródek": { postalCode: "74-407", postalCity: "Nowogródek Pomorski" },
  "nowogrodek pomorski": { postalCode: "74-407", postalCity: "Nowogródek Pomorski" },
  "nowogródek pomorski": { postalCode: "74-407", postalCity: "Nowogródek Pomorski" },
};

export function getPostalDetailsForMunicipality(municipality?: string | null): { postalCode: string; postalCity: string } {
  if (!municipality) {
    return { postalCode: "74-300", postalCity: "Myślibórz" };
  }
  const key = municipality.trim().toLowerCase();
  return MUNICIPALITY_POSTAL_CONFIG[key] || { postalCode: "74-300", postalCity: "Myślibórz" };
}

/**
 * Rozpoznaje miejscowość z nazwy placówki (np. "Szkoła Podstawowa w Ratajach" -> "Rataje", "Przedszkole w Karsku" -> "Karsko")
 */
export function extractLocalityFromFacilityName(facilityName?: string | null): string | null {
  if (!facilityName) return null;
  const match = facilityName.match(/\bw\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?)/i);
  if (match && match[1]) {
    const rawLoc = match[1].trim();
    const mapping: Record<string, string> = {
      "ratajach": "Rataje",
      "rataje": "Rataje",
      "smolnicy": "Smolnica",
      "smolnica": "Smolnica",
      "cychrach": "Cychry",
      "cychry": "Cychry",
      "różańsku": "Różańsko",
      "rozansku": "Różańsko",
      "różańsko": "Różańsko",
      "karsku": "Karsko",
      "karsko": "Karsko",
      "kierzkowie": "Kierzków",
      "kierzkow": "Kierzków",
      "kierzków": "Kierzków",
      "nawrocku": "Nawrocko",
      "nawrocko": "Nawrocko",
      "mostkowie": "Mostkowo",
      "mostkowo": "Mostkowo",
      "dziedzicach": "Dziedzice",
      "dziedzice": "Dziedzice",
      "sarbinowie": "Sarbinowo",
      "sarbinowo": "Sarbinowo",
      "boleszkowicach": "Boleszkowice",
      "boleszkowice": "Boleszkowice",
      "nowogródku pomorskim": "Nowogródek Pomorski",
      "nowogrodku pomorskim": "Nowogródek Pomorski",
      "nowogródku": "Nowogródek Pomorski",
      "barlinku": "Barlinek",
      "barlinek": "Barlinek",
      "dębnie": "Dębno",
      "debnie": "Dębno",
      "dębno": "Dębno",
      "debno": "Dębno",
      "myśliborzu": "Myślibórz",
      "mysliborzu": "Myślibórz",
      "myślibórz": "Myślibórz",
      "mysliborz": "Myślibórz",
    };
    const lower = rawLoc.toLowerCase();
    return mapping[lower] || rawLoc;
  }
  return null;
}

export function formatAdresIzrz(
  lok: {
    nazwa?: string | null;
    zespol_nazwa?: string | null;
    ulica?: string | null;
    nr_budynku?: string | null;
    kod_pocztowy?: string | null;
    miasto?: string | null;
    gmina?: string | null;
  } | null | undefined
): string {
  if (!lok) return '';
  const parts: string[] = [];
  const nazwa = lok.zespol_nazwa
    ? `${lok.zespol_nazwa} – ${lok.nazwa || ''}`.trim()
    : String(lok.nazwa || '').trim();
  if (nazwa) parts.push(nazwa);

  const ulicaRaw = [lok.ulica, lok.nr_budynku].filter(Boolean).join(' ').trim();
  if (ulicaRaw) {
    const isStreetPrefix = /^ul\.?\s|^al\.?\s|^pl\.?\s|^os\.?\s/i.test(ulicaRaw);
    const hasStreetKeyword = /\bulica\b|\baleja\b|\bplac\b|\bosiedle\b/i.test(ulicaRaw);
    if (isStreetPrefix || hasStreetKeyword) {
      parts.push(ulicaRaw);
    } else {
      const firstWord = ulicaRaw.split(/\s+/)[0]?.toLowerCase();
      const miastoLower = (lok.miasto || '').trim().toLowerCase();
      if (firstWord && miastoLower && firstWord === miastoLower) {
        parts.push(ulicaRaw);
      } else if (/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(ulicaRaw) && !/^\d+/.test(ulicaRaw)) {
        parts.push(`ul. ${ulicaRaw}`);
      } else {
        parts.push(ulicaRaw);
      }
    }
  }

  const postalDetails = getPostalDetailsForMunicipality(lok.gmina || lok.miasto);
  const kodPocztowy = lok.kod_pocztowy || postalDetails.postalCode;
  const miastoPocztowe = postalDetails.postalCity;

  const kodMiasto = `${kodPocztowy} ${miastoPocztowe}`.trim();
  if (kodMiasto) parts.push(kodMiasto);

  return parts.join(', ');
}
