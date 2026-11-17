import { izrzInstitutionName, isIzrzDraftNumber, IZRZ_ATTACHMENT_LABELS, type IzrzGeneratorData } from "./izrzGenerator";

export interface EzdTitle {
  id: "case" | "izrz" | "attendance" | "distribution";
  /** Do czego służy tytuł w EZD. */
  label: string;
  text: string;
}

export interface EzdTitleParts {
  /** Forma zadania (np. „Stoisko edukacyjne, dystrybucja”). */
  taskType: string;
  /** Własny tytuł działania, gdy mówi więcej niż sama forma (np. temat pisma). */
  subject?: string;
  institution: string;
  city: string;
  program?: string;
  dateFormatted: string;
  /** Numer IZRZ; undefined = działanie nie ma IZRZ, pusty/projekt = IZRZ bez numeru. */
  izrzNumber?: string;
  hasAttendanceList?: boolean;
  hasDistributionList?: boolean;
}

/** Placówka z miejscowością — bez dublowania, gdy nazwa placówki już ją zawiera („… w Myśliborzu”). */
function placeLabel(institutionName: string, cityName: string): string {
  const institution = institutionName.trim();
  const city = cityName.trim();
  if (!institution) return city;
  if (!city) return institution;
  const stem = city.slice(0, Math.max(4, city.length - 3)).toLocaleLowerCase("pl");
  return institution.toLocaleLowerCase("pl").includes(stem) ? institution : `${institution}, ${city}`;
}

const join = (parts: (string | undefined)[]) => parts.map((p) => (p ?? "").trim()).filter(Boolean).join(" – ");

/**
 * Gotowe tytuły do wklejenia w EZD, w jednym schemacie: forma zadania – placówka – (program) – data.
 * Sprawa opisuje całe zadanie, dokumenty w sprawie powtarzają jego rdzeń z własnym oznaczeniem.
 */
export function composeEzdTitles(parts: EzdTitleParts): EzdTitle[] {
  const place = placeLabel(parts.institution, parts.city);
  const subject = parts.subject?.trim() && parts.subject.trim() !== parts.taskType.trim() ? parts.subject : "";
  const date = parts.dateFormatted;

  const titles: EzdTitle[] = [
    { id: "case", label: "Tytuł sprawy", text: join([parts.taskType, subject, place, parts.program, date]) },
  ];

  if (parts.izrzNumber !== undefined) {
    const marker = isIzrzDraftNumber(parts.izrzNumber) ? "IZRZ" : `IZRZ ${parts.izrzNumber}`;
    titles.push({ id: "izrz", label: "Tytuł dokumentu — IZRZ", text: join([marker, parts.taskType, place, date]) });
  }
  if (parts.hasAttendanceList) {
    titles.push({
      id: "attendance",
      label: "Załącznik — lista obecności",
      text: join([IZRZ_ATTACHMENT_LABELS.attendance, place, date]),
    });
  }
  if (parts.hasDistributionList) {
    titles.push({
      id: "distribution",
      label: "Załącznik — rozdzielnik",
      text: join([IZRZ_ATTACHMENT_LABELS.distribution, place, date]),
    });
  }
  return titles.filter((t) => t.text.length > 0);
}

/** Tytuły dla otwartego dokumentu IZRZ (zawsze z tytułem IZRZ). */
export function buildEzdTitles(data: IzrzGeneratorData): EzdTitle[] {
  return composeEzdTitles({
    taskType: data.taskType,
    institution: izrzInstitutionName(data),
    city: data.city,
    program: data.programName,
    dateFormatted: data.dateFormatted,
    izrzNumber: data.reportNumber,
    hasAttendanceList: data.hasAttendanceList,
    hasDistributionList: data.hasDistributionList,
  });
}
