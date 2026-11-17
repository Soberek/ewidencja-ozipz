import { composeIzrzRemarks, type IzrzGeneratorData } from "./izrzGenerator";
import { escapeHtml, escapeMultiline, officialFormDocument, responsibleSignatureHtml, STATION_STAMP_HTML } from "./printHtml";

const CSS = `
    .page { padding: 14mm 18mm 15mm 20mm; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm; }
    .place-date { width: 62mm; text-align: center; padding-top: 6mm; }
    .case { margin-top: 8mm; }
    h1 { text-align: center; font-size: 12pt; font-weight: 700; text-transform: uppercase; margin: 9mm 0 4mm; }
    .point { margin-top: 4.5mm; break-inside: avoid; }
    .label { font-weight: 700; }
    .label em { font-weight: 400; }
    .value { margin: 1mm 0 0 5mm; min-height: 5mm; }
    .figure { font-weight: 700; }
`;

function point(number: number, label: string, value: string, labelNote = ""): string {
  const note = labelNote ? ` <em>${escapeHtml(labelNote)}</em>` : "";
  return `
    <div class="point">
      <div class="label">${number}. ${escapeHtml(label)}${note}:</div>
      <div class="value">${value ? escapeMultiline(value) : "&nbsp;"}</div>
    </div>`;
}

/** Wydruk IZRZ — te same punkty i treść co w dokumencie .docx (szablon izrz.docx). */
export function buildIzrzHtml(data: IzrzGeneratorData): string {
  const caseNumber = data.caseNumber ? escapeHtml(data.caseNumber) : "&nbsp;";

  return officialFormDocument(
    `IZRZ ${data.reportNumber}`,
    CSS,
    `
    <div class="top">
      ${STATION_STAMP_HTML}
      <div class="place-date">
        ${escapeHtml(data.city)}, ${escapeHtml(data.dateFormatted)} r.
        <div class="dotted-line" style="margin-top: 1mm;"></div>
        (miejscowość, data)
      </div>
    </div>

    <div class="case"><strong>Znak sprawy:</strong> ${caseNumber}</div>

    <h1>Informacja dotycząca realizacji zadania ${escapeHtml(data.reportNumber)}</h1>

    ${point(1, "Zadanie realizowane w ramach", data.programName, "(nazwa interwencji)")}
    ${point(2, "Forma zadania", data.taskType)}
    ${point(3, "Miejsce wykonania zadania", data.address, "(nazwa i adres instytucji)")}
    ${point(4, "Termin wykonania zadania", data.dateFormatted)}
    <div class="point">
      <div class="label">5. Grupa docelowa i liczba osób objętych zadaniem: <span class="figure">${data.viewerCount}</span></div>
      <div class="value">${data.viewerCountDescription ? escapeMultiline(data.viewerCountDescription) : "&nbsp;"}</div>
    </div>
    ${point(6, "Zakres uczestnictwa", data.taskDescription, "(czynności wykonane w trakcie realizacji zadania)")}
    ${point(7, "Uwagi, dodatkowe informacje", composeIzrzRemarks(data))}

    ${responsibleSignatureHtml("16mm")}`
  );
}
