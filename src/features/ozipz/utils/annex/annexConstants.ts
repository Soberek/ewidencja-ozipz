export const POLISH_MONTHS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
] as const;

export const STATION_COUNTIES = [
  "Białogard",
  "Choszczno",
  "Drawsko Pomorskie",
  "Goleniów",
  "Gryfice",
  "Gryfino",
  "Kamień Pomorski",
  "Kołobrzeg",
  "Koszalin",
  "Łobez",
  "Myślibórz",
  "Police",
  "Pyrzyce",
  "Sławno",
  "Stargard",
  "Szczecin",
  "Szczecinek",
  "Świdwin",
  "Świnoujście",
  "Wałcz",
] as const;

export const COUNTY_LOCATIVE: Record<string, string> = {
  "Białogard": "w Białogardzie",
  "Choszczno": "w Choszcznie",
  "Drawsko Pomorskie": "w Drawsku Pomorskim",
  "Goleniów": "w Goleniowie",
  "Gryfice": "w Gryficach",
  "Gryfino": "w Gryfinie",
  "Kamień Pomorski": "w Kamieniu Pomorskim",
  "Kołobrzeg": "w Kołobrzegu",
  "Koszalin": "w Koszalinie",
  "Łobez": "w Łobzie",
  "Myślibórz": "w Myśliborzu",
  "Police": "w Policach",
  "Pyrzyce": "w Pyrzycach",
  "Sławno": "w Sławnie",
  "Stargard": "w Stargardzie",
  "Szczecin": "w Szczecinie",
  "Szczecinek": "w Szczecinku",
  "Świdwin": "w Świdwinie",
  "Świnoujście": "w Świnoujściu",
  "Wałcz": "w Wałczu",
};

export const formatStationForHeader = (stationName: string): string => {
  const clean = stationName.trim();
  if (!clean) return "PSSE w Myśliborzu";

  for (const [county, locative] of Object.entries(COUNTY_LOCATIVE)) {
    if (clean.toLowerCase().includes(county.toLowerCase())) {
      return `PSSE ${locative}`;
    }
  }

  if (/^psse\s+/i.test(clean)) return clean;
  if (/^w\s+/i.test(clean)) return `PSSE ${clean}`;
  return `PSSE w ${clean}`;
};

export const formatPeriodForHeader = (selectedMonths: readonly number[]): string => {
  const selected = [...new Set(selectedMonths.map(Number))]
    .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12)
    .sort((a, b) => a - b);

  if (selected.length === 0 || selected.length === 12) {
    return "styczeń - grudzień";
  }

  if (selected.length === 1) {
    return POLISH_MONTHS[selected[0] - 1].toLowerCase();
  }

  const first = selected[0];
  const last = selected[selected.length - 1];
  const isConsecutive =
    selected.length === last - first + 1 && selected.every((num, i) => num === first + i);

  if (isConsecutive) {
    if (first === 1 && last === 3) return "styczeń - marzec (I kwartał)";
    if (first === 4 && last === 6) return "kwiecień - czerwiec (II kwartał)";
    if (first === 7 && last === 9) return "lipiec - wrzesień (III kwartał)";
    if (first === 10 && last === 12) return "październik - grudzień (IV kwartał)";
    if (first === 1 && last === 6) return "styczeń - czerwiec (I półrocze)";
    if (first === 7 && last === 12) return "lipiec - grudzień (II półrocze)";

    return `${POLISH_MONTHS[first - 1].toLowerCase()} - ${POLISH_MONTHS[last - 1].toLowerCase()}`;
  }

  return `${POLISH_MONTHS[first - 1].toLowerCase()} - ${POLISH_MONTHS[last - 1].toLowerCase()}`;
};

export const buildDefaultHeaderTitle = (
  annexNum: 1 | 2,
  stationName: string,
  selectedMonths: readonly number[],
  year: number = new Date().getFullYear()
): string => {
  const stationFormatted = formatStationForHeader(stationName);
  const periodFormatted = formatPeriodForHeader(selectedMonths);

  const stationPart = stationFormatted ? `${stationFormatted} ` : "";
  const periodPart = periodFormatted ? `${periodFormatted} ` : "";

  return `Załącznik nr ${annexNum} OZiPZ ${stationPart}mierniki za ${periodPart}${year} r.`;
};

export function formatReportMonthLabel(months: readonly number[]): string {
  const normalized = [...new Set(months.map(Number))]
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
    .sort((left, right) => left - right);
  if (!normalized.length || normalized.length === 12) return "Cały rok";
  if (normalized.length === 1) return POLISH_MONTHS[normalized[0] - 1];
  if (normalized.length === 6 && normalized[0] === 1 && normalized[5] === 6) return "I Półrocze (I-VI)";
  if (normalized.length === 6 && normalized[0] === 7 && normalized[5] === 12) return "II Półrocze (VII-XII)";
  const contiguous = normalized.every((month, index) => index === 0 || month === normalized[index - 1] + 1);
  if (contiguous) return `${POLISH_MONTHS[normalized[0] - 1]}–${POLISH_MONTHS[normalized[normalized.length - 1] - 1]}`;
  return normalized.map((month) => POLISH_MONTHS[month - 1]).join(", ");
}
