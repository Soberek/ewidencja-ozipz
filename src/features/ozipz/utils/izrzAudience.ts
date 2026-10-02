/**
 * Opis grupy docelowej do punktu 5 IZRZ („Grupa docelowa i liczba osób objętych zadaniem”).
 *
 * Wejściem jest pole `audienceGroup` działania zapisane przez edytor w formacie
 * „Grupa 1: Uczniowie - 45, Kadra pedagogiczna - 5; Grupa 2: …”. Wynik to czytelny,
 * wielowierszowy opis — jedna linia na odbiorcę, z nagłówkami przy kilku grupach.
 * Opis odbiorców działania.
 */
import { shortDzialanieLabel } from "./izrzUtils";

const TRAILING_COUNT = /\s*[-–]\s*(\d+)\s*$/;
const DEFAULT_GROUP_NAME = /^grupa\s*\d+$/i;

interface AudienceBlock {
  name: string;
  lines: string[];
}

function splitRecipientLines(body: string): string[] {
  // Przecinek rozdziela odbiorców tylko wtedy, gdy każdy z nich ma własną liczebność
  // („Opiekunowie - 3, Uczestnicy - 30”). Wyliczenie bez liczb („Dzieci, młodzież, dorośli - 150”)
  // pozostaje jedną linią.
  const lines: string[] = [];
  let pending: string[] = [];
  for (const token of body.split(",").map((t) => t.trim()).filter(Boolean)) {
    pending.push(token);
    if (TRAILING_COUNT.test(token)) {
      lines.push(pending.join(", "));
      pending = [];
    }
  }
  if (pending.length > 0) lines.push(pending.join(", "));
  return lines.map(normalizeLine);
}

function normalizeLine(line: string): string {
  return line.replace(TRAILING_COUNT, " - $1").replace(/\s+/g, " ").trim();
}

function parseBlocks(raw: string): AudienceBlock[] {
  return raw
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const named = chunk.match(/^([^:]+):\s*(.+)$/);
      return named
        ? { name: named[1].trim(), lines: splitRecipientLines(named[2]) }
        : { name: "", lines: splitRecipientLines(chunk) };
    })
    .filter((block) => block.lines.length > 0);
}

/**
 * Suma liczebności zapisanych przy odbiorcach (0, gdy żaden nie ma liczby).
 * Działa zarówno na surowym `audienceGroup`, jak i na gotowym opisie z IZRZ.
 */
export function sumAudienceCounts(text: string | null | undefined): number {
  return String(text || "")
    .split(/[\n;,]/)
    .reduce((sum, part) => sum + Number(part.match(TRAILING_COUNT)?.[1] ?? 0), 0);
}

export function buildIzrzAudienceDescription(
  raw: string | null | undefined,
  opts: { actionType?: string | null; participantsCount?: number | null } = {}
): string {
  const participants = Math.max(0, Number(opts.participantsCount) || 0);
  const blocks = parseBlocks(String(raw || ""));

  if (blocks.length === 0) {
    return participants > 0 ? `Uczestnicy - ${participants}` : "";
  }

  // Jedyny odbiorca bez liczby (np. „Mieszkańcy powiatu”) dostaje liczbę uczestników działania.
  if (blocks.length === 1 && blocks[0].lines.length === 1 && participants > 0) {
    const [line] = blocks[0].lines;
    if (!TRAILING_COUNT.test(line)) blocks[0].lines[0] = `${line} - ${participants}`;
  }

  const label = shortDzialanieLabel(opts.actionType);
  const multiple = blocks.length > 1;

  return blocks
    .flatMap((block, idx) => {
      const isDefaultName = !block.name || DEFAULT_GROUP_NAME.test(block.name);
      let header: string | null = null;
      if (multiple) header = isDefaultName ? `${label} ${idx + 1}:` : `${block.name}:`;
      else if (!isDefaultName) header = `${block.name}:`;
      return header ? [header, ...block.lines] : block.lines;
    })
    .join("\n");
}
