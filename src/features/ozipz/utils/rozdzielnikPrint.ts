import type { OzipzAction, OzipzDistribution, OzipzMaterial } from "../types/ozipz.types";
import { formatDatePl } from "./dateUtils";
import {
  escapeHtml,
  escapeMultiline,
  officialFormDocument,
  OFFICIAL_FORM_META_HTML,
  responsibleSignatureHtml,
  STATION_STAMP_HTML,
} from "./printHtml";

export interface RozdzielnikItem {
  title: string;
  /** Pusta = do wpisania ręcznie. */
  quantity?: number;
}

export interface RozdzielnikSources {
  actions: OzipzAction[];
  distributions: OzipzDistribution[];
  materials: OzipzMaterial[];
}

/**
 * Materiały wydane w ramach zadania: pozycje rozdzielnika przypięte do działania oraz do dystrybucji
 * zapisanej razem z nim (np. ulotki z prelekcji). Gdy działanie nie ma pozycji rozdzielnika, używa
 * materiału i liczby sztuk z samego działania. Ten sam tytuł jest sumowany.
 */
export function collectActionMaterials(action: OzipzAction, sources: RozdzielnikSources): RozdzielnikItem[] {
  const related = [action, ...sources.actions.filter((a) => a.linkedActionId === action.id)];
  const totals = new Map<string, number>();
  const add = (title: string, quantity: number) => totals.set(title, (totals.get(title) ?? 0) + quantity);

  for (const source of related) {
    const rows = sources.distributions.filter((d) => d.actionId === source.id);
    if (rows.length > 0) {
      rows.forEach((d) => add(d.materialTitle.trim(), d.quantity));
    } else if ((source.materialsDistributedCount ?? 0) > 0) {
      const material = sources.materials.find((m) => m.id === source.materialId);
      add(material?.title.trim() ?? "", source.materialsDistributedCount ?? 0);
    }
  }

  return [...totals].map(([title, quantity]) => ({ title, quantity }));
}

export interface RozdzielnikPrintOptions {
  /** Data w formacie ISO (YYYY-MM-DD); pusta = miejsce do wpisania ręcznie. */
  date?: string;
  programName: string;
  institution: string;
  items: RozdzielnikItem[];
}

const DATE_PLACEHOLDER = "....................";

const CSS = `
    h1 { text-align: center; font-size: 13pt; font-weight: 700; margin-top: 17mm; }
    .lead { text-align: center; margin-top: 0.5mm; }
    .program { text-align: center; margin: 1.5mm auto 0; max-width: 130mm; }
    table { margin-top: 7mm; }
    thead th { height: 18mm; }
    tbody td { height: 11mm; padding: 1mm 1.5mm; }
    .col-lp { width: 10mm; }
    .col-institution { width: 55mm; }
    .col-material { width: 52mm; }
    .col-count { width: 19mm; }
`;

export function buildRozdzielnikHtml({ date, programName, institution, items }: RozdzielnikPrintOptions): string {
  const dateText = date ? formatDatePl(date, DATE_PLACEHOLDER) : DATE_PLACEHOLDER;
  // Tyle wierszy, ile materiałów; bez materiałów jeden pusty wiersz do wpisania ręcznie
  const rows: RozdzielnikItem[] = items.length > 0 ? items : [{ title: "" }];
  const rowCount = rows.length;

  const bodyHtml = rows
    .map((item, i) => {
      const shared =
        i === 0
          ? `<td class="col-lp" rowspan="${rowCount}">1</td>
          <td rowspan="${rowCount}">${escapeMultiline(institution)}</td>`
          : "";
      const signature = i === 0 ? `<td rowspan="${rowCount}"></td>` : "";
      return `
        <tr>
          ${shared}
          <td class="col-material">${escapeMultiline(item.title)}</td>
          <td>${item.quantity ?? ""}</td>
          ${signature}
        </tr>`;
    })
    .join("");

  return officialFormDocument(
    "Rozdzielnik",
    CSS,
    `
    ${OFFICIAL_FORM_META_HTML}
    ${STATION_STAMP_HTML}

    <h1>ROZDZIELNIK z dn. ${escapeHtml(dateText)} r.</h1>
    <div class="lead">materiałów oświatowo-zdrowotnych/edukacyjnych</div>
    <div class="program">${escapeMultiline(programName)}</div>

    <table>
      <thead>
        <tr>
          <th class="col-lp">Lp.</th>
          <th class="col-institution">Instytucja/organizacja</th>
          <th class="col-material">Rodzaj materiałów/<br>tytuł</th>
          <th class="col-count">Liczba wydanych sztuk</th>
          <th>Data i czytelny podpis</th>
        </tr>
      </thead>
      <tbody>${bodyHtml}
      </tbody>
    </table>
    ${responsibleSignatureHtml("18mm")}`
  );
}
