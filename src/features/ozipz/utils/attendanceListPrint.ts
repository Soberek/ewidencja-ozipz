import { formatDatePl } from "./dateUtils";
import {
  escapeHtml,
  escapeMultiline,
  officialFormDocument,
  OFFICIAL_FORM_META_HTML,
  responsibleSignatureHtml,
  STATION_STAMP_HTML,
} from "./printHtml";

/** Blankiet „Lista obecności” wg Załącznika Nr 8 do Zarządzenia Nr 15 GIS z 29.01.2013 (F/PT/PZ/01/01). */
export interface AttendanceListPrintOptions {
  /** Treść po „w ramach:” — zwykle nazwa programu profilaktycznego. */
  programName: string;
  /** Data zajęć w formacie ISO (YYYY-MM-DD); pusta = miejsce do wpisania ręcznie. */
  date?: string;
  /** Instytucja/organizacja wpisywana w pierwszym wierszu tabeli. */
  institution: string;
}

const DATE_PLACEHOLDER = "............";

const CSS = `
    .annex { text-align: right; margin-bottom: 7mm; }
    h1 { text-align: center; font-size: 13pt; font-weight: 700; margin-top: 15mm; }
    .lead { text-align: center; margin-top: 0.5mm; }
    .program { text-align: center; margin-top: 4mm; }
    table { margin-top: 4mm; }
    th { height: 17mm; }
    td { height: 61mm; }
    .col-institution { width: 60mm; }
    .col-count { width: 55mm; }
`;

export function buildAttendanceListHtml({ programName, date, institution }: AttendanceListPrintOptions): string {
  const dateText = date ? `${formatDatePl(date, DATE_PLACEHOLDER)} r.` : DATE_PLACEHOLDER;

  return officialFormDocument(
    "Lista obecności",
    CSS,
    `
    <div class="annex">
      Załącznik Nr 8 do Zarządzenia Nr 15<br>
      Głównego Inspektora Sanitarnego<br>
      z dnia 29 stycznia 2013
    </div>
    ${OFFICIAL_FORM_META_HTML}
    ${STATION_STAMP_HTML}

    <h1>Lista obecności</h1>
    <div class="lead">Z prelekcji/wykładu/konferencji/stoiska edukacyjnego w dniu ${escapeHtml(dateText)} w ramach:</div>
    <div class="program">${escapeMultiline(programName)}</div>

    <table>
      <thead>
        <tr>
          <th class="col-lp">Lp.</th>
          <th class="col-institution">Instytucja/organizacja</th>
          <th class="col-count">Ilość osób uczestniczących</th>
          <th>Podpis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="col-lp">1</td>
          <td>${escapeMultiline(institution)}</td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
    ${responsibleSignatureHtml("44mm")}`
  );
}
