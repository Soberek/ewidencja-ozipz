import type { OzipzAction, OzipzFacility } from "../types/ozipz.types";
import { formatAdresIzrz, extractLocalityFromFacilityName, toAsciiSlug } from "./izrzUtils";
import { buildIzrzAudienceDescription, sumAudienceCounts } from "./izrzAudience";
import type { IzrzMaterialLine } from "./izrzContext";
import { formatFullJrwaSign } from "./programJrwaUtils";
import { getTodayIsoDate } from "./dateUtils";

export const IZRZ_DRAFT_NUMBER = "[PROJEKT - przed zatwierdzeniem]";
export const IZRZ_TEMPLATE_URL = "/generate-templates/izrz.docx";

export const IZRZ_ATTACHMENT_LABELS = {
  attendance: "Potwierdzenie spotkania zał. F/PT/PZ/01/02",
  distribution: "Rozdzielnik materiałów zał. F/PT/PZ/01/01",
} as const;

/** Treść dokumentu IZRZ — to samo źródło dla podglądu w aplikacji i pliku .docx. */
export interface IzrzGeneratorData {
  caseNumber: string;
  reportNumber: string;
  programName: string;
  taskType: string;
  address: string;
  city: string;
  dateIso: string;
  dateFormatted: string;
  viewerCount: number;
  viewerCountDescription: string;
  taskDescription: string;
  additionalInfo: string;
  hasAttendanceList: boolean;
  hasDistributionList: boolean;
  leadEducator: string;
}

export interface PrepareIzrzOptions {
  /** Materiały wydane w ramach zadania (z rozdzielników i powiązanych wpisów dystrybucji). */
  materials?: IzrzMaterialLine[];
}

function formatIsoDatePl(dateIso: string): string {
  const [year, month, day] = dateIso.split("-");
  return year && month && day ? `${day.slice(0, 2)}.${month}.${year}` : dateIso;
}

const CODE_LIKE = /^[a-z0-9_]+$/;

/** Pkt 1 IZRZ: program → akcja/kampania → tematyka → tytuł (o ile nie powtarza formy zadania). */
function resolveInterventionName(action: Partial<OzipzAction>): string {
  const topic = (action.topic || "").trim();
  const title = (action.title || "").trim();
  const candidates = [
    action.programName,
    action.campaignName,
    CODE_LIKE.test(topic) ? "" : topic,
    title === (action.actionType || "").trim() ? "" : title,
  ];
  return candidates.map((c) => (c || "").trim()).find((c) => c.length > 0) ?? "";
}

export function formatIzrzMaterials(lines: IzrzMaterialLine[]): string {
  const valid = lines.filter((l) => l.quantity > 0);
  if (valid.length === 0) return "";
  const total = valid.reduce((sum, l) => sum + l.quantity, 0);

  if (valid.every((l) => !l.title)) return `Przekazano materiały edukacyjne – ${total} szt.`;
  if (valid.length === 1) return `Przekazano materiały edukacyjne: ${valid[0].title} – ${total} szt.`;
  return [
    `Przekazano materiały edukacyjne (łącznie ${total} szt.):`,
    ...valid.map((l) => `- ${l.title || "materiały bez tytułu"} – ${l.quantity} szt.`),
  ].join("\n");
}

export function prepareIzrzData(
  action: Partial<OzipzAction>,
  facilityDetails?: Partial<OzipzFacility> | null,
  options: PrepareIzrzOptions = {}
): IzrzGeneratorData {
  const dateIso = action.date || getTodayIsoDate();

  const extractedLocality = extractLocalityFromFacilityName(action.facilityName);
  const city = facilityDetails?.city || extractedLocality || action.municipality || "Myślibórz";

  const address = facilityDetails
    ? formatAdresIzrz({
        nazwa: facilityDetails.name,
        ulica: facilityDetails.address,
        kod_pocztowy: facilityDetails.postalCode,
        miasto: facilityDetails.city,
        gmina: facilityDetails.municipality,
      })
    : formatAdresIzrz({
        nazwa: action.facilityName || "Placówka nieokreślona",
        gmina: action.municipality || "Myślibórz",
        miasto: extractedLocality || action.municipality || "Myślibórz",
      });

  const viewerCount = Math.max(0, Number(action.participantsCount) || 0);
  const materialsCount = Number(action.materialsDistributedCount) || 0;
  const materials =
    options.materials ?? (materialsCount > 0 ? [{ title: "", quantity: materialsCount }] : []);

  return {
    caseNumber: formatFullJrwaSign(action),
    reportNumber: (action.izrzSign || "").replace(/^IZRZ:\s*/i, "").trim() || IZRZ_DRAFT_NUMBER,
    programName: resolveInterventionName(action),
    taskType: action.actionType || "",
    address,
    city,
    dateIso,
    dateFormatted: formatIsoDatePl(dateIso),
    viewerCount,
    viewerCountDescription: buildIzrzAudienceDescription(action.audienceGroup, {
      actionType: action.actionType,
      participantsCount: viewerCount,
    }),
    taskDescription: (action.notes || "").trim(),
    additionalInfo: formatIzrzMaterials(materials),
    hasAttendanceList: false,
    hasDistributionList: materials.some((m) => m.quantity > 0),
    leadEducator: action.leadEducator || "",
  };
}

export function isIzrzDraftNumber(reportNumber: string): boolean {
  return !reportNumber.trim() || reportNumber === IZRZ_DRAFT_NUMBER;
}

export function listIzrzAttachments(data: Pick<IzrzGeneratorData, "hasAttendanceList" | "hasDistributionList">): string[] {
  const labels: string[] = [];
  if (data.hasAttendanceList) labels.push(IZRZ_ATTACHMENT_LABELS.attendance);
  if (data.hasDistributionList) labels.push(IZRZ_ATTACHMENT_LABELS.distribution);
  return labels.map((label, idx) => `${idx + 1}. ${label}`);
}

/** Pkt 7 w postaci wstawianej do dokumentu: uwagi + lista załączników. */
export function composeIzrzRemarks(data: IzrzGeneratorData): string {
  const attachments = listIzrzAttachments(data);
  return [
    data.additionalInfo.trim(),
    attachments.length > 0 ? `Załączniki:\n${attachments.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Braki, które warto uzupełnić przed wygenerowaniem dokumentu. */
export function getIzrzWarnings(data: IzrzGeneratorData): string[] {
  const warnings: string[] = [];
  if (isIzrzDraftNumber(data.reportNumber)) {
    warnings.push("Działanie nie ma nadanego numeru IZRZ — dokument zostanie oznaczony jako projekt.");
  }
  if (!data.caseNumber) warnings.push("Brak znaku sprawy JRWA.");
  if (!data.programName.trim()) warnings.push("Uzupełnij nazwę interwencji (pkt 1).");
  if (!data.taskDescription.trim()) warnings.push("Uzupełnij zakres czynności wykonanych (pkt 6).");
  if (data.viewerCount <= 0) warnings.push("Liczba osób objętych zadaniem wynosi 0.");

  const audienceSum = sumAudienceCounts(data.viewerCountDescription);
  if (audienceSum > 0 && data.viewerCount > 0 && audienceSum !== data.viewerCount) {
    warnings.push(
      `Suma liczebności grup (${audienceSum}) różni się od liczby osób objętych zadaniem (${data.viewerCount}).`
    );
  }
  return warnings;
}

export function buildIzrzDocxFileName(data: IzrzGeneratorData): string {
  const segments = [
    "IZRZ",
    isIzrzDraftNumber(data.reportNumber) ? "PROJEKT" : toAsciiSlug(data.reportNumber),
    data.dateIso,
    toAsciiSlug(data.city),
    toAsciiSlug(data.programName || data.taskType, 40),
  ].filter((segment) => segment.length > 0);

  return segments.join("_") + ".docx";
}

export async function generateIzrzDocxBlob(
  templateArrayBuffer: ArrayBuffer,
  data: IzrzGeneratorData
): Promise<Blob> {
  // Biblioteki .docx (~280 kB) ładujemy dopiero przy generowaniu, nie przy otwarciu rejestru działań.
  const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import("pizzip"), import("docxtemplater")]);
  const zip = new PizZip(templateArrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render({
    znak_sprawy: data.caseNumber,
    numer_izrz: data.reportNumber,
    nazwa_programu: data.programName,
    typ_zadania: data.taskType,
    miasto: data.city,
    adres: data.address,
    liczba_osob: data.viewerCount,
    liczba_osob_opis: data.viewerCountDescription,
    opis_zadania: data.taskDescription,
    dodatkowe_informacje: composeIzrzRemarks(data),
    data: data.dateFormatted,
    prowadzacy: data.leadEducator,
    osoba_prowadzaca: data.leadEducator,
    podpis: data.leadEducator,
    lista_obecnosci: data.hasAttendanceList ? IZRZ_ATTACHMENT_LABELS.attendance : "",
    rozdzielnik: data.hasDistributionList ? IZRZ_ATTACHMENT_LABELS.distribution : "",
  });

  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function downloadIzrzDocx(data: IzrzGeneratorData): Promise<string> {
  const templateResponse = await fetch(IZRZ_TEMPLATE_URL);
  if (!templateResponse.ok) {
    throw new Error(`Brak szablonu IZRZ w aplikacji (${IZRZ_TEMPLATE_URL}).`);
  }
  const blob = await generateIzrzDocxBlob(await templateResponse.arrayBuffer(), data);
  const fileName = buildIzrzDocxFileName(data);

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Zwolnienie adresu dopiero po przejęciu pliku przez przeglądarkę.
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}
