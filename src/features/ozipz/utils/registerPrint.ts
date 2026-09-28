import type { OfficialRegisterKey, OzipzAction, OzipzFacility } from "../types/ozipz.types";
import { OFFICIAL_REGISTERS_CONFIG, INFORMACJE_OFFICIAL_FOOTER } from "./registerConfig";
import {
  formatActionIzrzNumber,
  formatActionInterventionType,
  formatActionPrzedmiot,
  formatActionLocationDetails,
  formatActionRecipientCount,
} from "./registerPresentation";
import { escapeHtml } from "./printHtml";

export interface RegisterPrintOptions {
  registerKey: OfficialRegisterKey;
  actions: OzipzAction[];
  facilitiesMap: Map<string, OzipzFacility>;
  filters?: {
    year?: string;
    month?: string;
    jrwa?: string;
    educator?: string;
    search?: string;
  };
}

export function buildRegisterPrintHtml({
  registerKey,
  actions,
  facilitiesMap,
  filters,
}: RegisterPrintOptions): string {
  const meta = OFFICIAL_REGISTERS_CONFIG[registerKey];
  const filterParts: string[] = [];
  if (filters?.year) filterParts.push(`Rok: ${filters.year}`);
  if (filters?.month) filterParts.push(`Miesiąc: ${filters.month}`);
  if (filters?.jrwa) filterParts.push(`JRWA: ${filters.jrwa}`);
  if (filters?.educator) filterParts.push(`Osoba: ${filters.educator}`);
  if (filters?.search) filterParts.push(`Filtr: „${filters.search}”`);

  let tableHeaderHtml = "";
  let tableBodyHtml = "";

  if (registerKey === "informacje") {
    tableHeaderHtml = `
      <tr>
        <th style="width: 35px; text-align: center;">Lp.</th>
        <th style="width: 110px;">Nr informacji</th>
        <th style="width: 85px;">Data zadania</th>
        <th>Przedmiot sprawy</th>
        <th style="width: 100px;">Rodzaj</th>
        <th style="width: 60px; text-align: right;">Odbiorcy</th>
        <th style="width: 130px;">Osoba odp.</th>
        <th style="width: 100px;">Uwagi</th>
      </tr>
    `;

    tableBodyHtml = actions
      .map((a, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${escapeHtml(formatActionIzrzNumber(a))}</b></td>
          <td>${escapeHtml(a.date || "—")}</td>
          <td>${escapeHtml(formatActionPrzedmiot(a))}</td>
          <td>${escapeHtml(formatActionInterventionType(a))}</td>
          <td style="text-align: right; font-weight: 600;">${formatActionRecipientCount(a)}</td>
          <td>${escapeHtml(a.leadEducator || "—")}</td>
          <td>${escapeHtml(a.notes || "")}</td>
        </tr>
      `)
      .join("");
  } else if (registerKey === "publikacje") {
    tableHeaderHtml = `
      <tr>
        <th style="width: 35px; text-align: center;">Lp.</th>
        <th style="width: 90px;">Data publ.</th>
        <th>Tematyka informacji</th>
        <th style="width: 140px;">Osoba odp.</th>
        <th style="width: 130px;">Uwagi</th>
      </tr>
    `;

    tableBodyHtml = actions
      .map((a, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${escapeHtml(a.date || "—")}</td>
          <td>${escapeHtml(formatActionPrzedmiot(a))}</td>
          <td>${escapeHtml(a.leadEducator || "—")}</td>
          <td>${escapeHtml(a.notes || "")}</td>
        </tr>
      `)
      .join("");
  } else {
    tableHeaderHtml = `
      <tr>
        <th style="width: 110px;">Nr protokołu</th>
        <th style="width: 85px;">Data prot.</th>
        <th>Przedmiot wizytacji</th>
        <th>Dane wizytowanej placówki</th>
        <th style="width: 130px;">Osoba odp.</th>
        <th style="width: 100px;">Uwagi</th>
      </tr>
    `;

    tableBodyHtml = actions
      .map((a) => {
        const fac = a.facilityId ? facilitiesMap.get(a.facilityId) : null;
        return `
          <tr>
            <td><b>${escapeHtml(formatActionIzrzNumber(a))}</b></td>
            <td>${escapeHtml(a.date || "—")}</td>
            <td>${escapeHtml(formatActionPrzedmiot(a))}</td>
            <td>${escapeHtml(formatActionLocationDetails(a, fac))}</td>
            <td>${escapeHtml(a.leadEducator || "—")}</td>
            <td>${escapeHtml(a.notes || "")}</td>
          </tr>
        `;
      })
      .join("");
  }

  const totalRecipients = actions.reduce((sum, a) => sum + formatActionRecipientCount(a), 0);

  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <title>${meta.title} — Ewidencja OZiPZ</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 10mm 15mm 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 9pt;
          color: #111827;
          line-height: 1.3;
          padding: 10px;
        }
        .header {
          margin-bottom: 12px;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 6px;
        }
        .title {
          font-size: 13pt;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .subtitle {
          font-size: 8.5pt;
          color: #475569;
          margin-top: 2px;
        }
        .filters {
          font-size: 8pt;
          color: #334155;
          margin-top: 4px;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        th, td {
          border: 1px solid #94a3b8;
          padding: 4px 6px;
          font-size: 8.5pt;
          vertical-align: top;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 700;
          text-align: left;
          color: #1e293b;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 14px;
          font-size: 7.5pt;
          color: #64748b;
          border-top: 1px solid #cbd5e1;
          padding-top: 6px;
          display: flex;
          justify-content: space-between;
        }
        .footer-sig {
          font-style: italic;
        }
        .summary-box {
          margin-top: 10px;
          font-size: 8.5pt;
          font-weight: 600;
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${escapeHtml(meta.title)}</div>
        <div class="subtitle">Powiatowa Stacja Sanitarno-Epidemiologiczna w Myśliborzu — Stanowisko Pracy ds. OZiPZ</div>
        ${filterParts.length > 0 ? `<div class="filters">Filtry: ${escapeHtml(filterParts.join(" | "))}</div>` : ""}
      </div>

      <table>
        <thead>
          ${tableHeaderHtml}
        </thead>
        <tbody>
          ${tableBodyHtml || `<tr><td colspan="8" style="text-align: center; padding: 20px;">Brak wpisów dla wybranych kryteriów.</td></tr>`}
        </tbody>
      </table>

      <div class="summary-box">
        Łącznie pozycji w rejestrze: <b>${actions.length}</b>
        ${registerKey === "informacje" ? ` | Łączna liczba odbiorców: <b>${totalRecipients}</b>` : ""}
      </div>

      <div class="footer">
        <div class="footer-sig">
          ${registerKey === "informacje" ? escapeHtml(INFORMACJE_OFFICIAL_FOOTER) : "Ewidencja OZiPZ — Oficjalny rejestr urzędowy"}
        </div>
        <div>Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}</div>
      </div>
    </body>
    </html>
  `;
}

export function printRegister(options: RegisterPrintOptions): void {
  const html = buildRegisterPrintHtml(options);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Zablokowano otwieranie nowego okna wydruku. Zezwól przeglądarce na wyskakujące okienka.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
