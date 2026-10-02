import type { OzipzAction, OzipzProgram, OzipzPublication } from "../../../types/ozipz.types";
import { PUBLICATION_DEFAULTS } from "../../../constants";
import type { ImportSourceId } from "../sources/importTypes";
import type { EvaluatedRow, ImportRow } from "./importRows";
import { saveImportedPublication } from "./saveImportedPublication";

type NewAction = Omit<OzipzAction, "id" | "createdAt" | "updatedAt">;
type NewPublication = Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">;

export const DEFAULT_PUBLICATION_AUTHOR = "OZiPZ PSSE Myślibórz";

export const IMPORT_SOURCE_CONFIG: Record<ImportSourceId, {
  label: string;
  channel: string;
  actionType: string;
  facilityName: string;
  publicationNote: string;
  actionNote: string;
}> = {
  gov: {
    label: "strona PSSE Myślibórz (gov.pl)",
    channel: "Strona www PSSE Myślibórz (gov.pl)",
    actionType: "Publikacja media (Strona)",
    facilityName: PUBLICATION_DEFAULTS.facilityName,
    publicationNote: "Własna publikacja ze strony PSSE Myślibórz",
    actionNote: "Automatyczny import publikacji ze strony www (bez znaku EZD).",
  },
  x: {
    label: "profil X @PSSEMysliborz",
    channel: "Profil X (@PSSEMysliborz)",
    actionType: "Publikacja media (Portal X)",
    facilityName: "Portal X (@PSSEMysliborz)",
    publicationNote: "Wpis na portalu X (Twitter)",
    actionNote: "Automatycznie utworzone działanie dla publikacji na portalu X (bez znaku EZD).",
  },
};

export const canonicalLink = (row: ImportRow) => row.finalUrl || row.url;

export function buildImportPayloads(row: ImportRow, author: string, programs: OzipzProgram[]): { action: NewAction; publication: NewPublication } {
  const config = IMPORT_SOURCE_CONFIG[row.source];
  const educator = author.trim() || DEFAULT_PUBLICATION_AUTHOR;
  const title = row.title.trim();
  const topic = row.customTopic.trim() || "Promocja Zdrowia";
  const link = canonicalLink(row);
  const jrwa = row.customJrwa || "9011";
  const program = programs.find((p) => p.id === row.programId);

  return {
    publication: {
      title,
      channel: config.channel,
      publicationDate: row.date,
      topic,
      link,
      reachCount: 0,
      author: educator,
      notes: `${config.publicationNote} [JRWA: ${jrwa}]`,
    },
    action: {
      title,
      actionType: config.actionType,
      date: row.date,
      facilityName: config.facilityName,
      municipality: PUBLICATION_DEFAULTS.municipality,
      programId: program?.id,
      programName: program?.name,
      topic,
      audienceGroup: PUBLICATION_DEFAULTS.audienceGroup,
      participantsCount: 0,
      materialsDistributedCount: 0,
      leadEducator: educator,
      ezdStatus: "nie_dotyczy",
      status: "wykonane",
      izrzSign: undefined,
      notes: `${config.actionNote} [JRWA: ${jrwa}] Link: ${link}`,
    },
  };
}

export interface ImportStoreWriters {
  addPublication: (pub: NewPublication) => Promise<OzipzPublication>;
  addAction: (action: NewAction) => Promise<OzipzAction>;
  deleteAction: (id: string) => Promise<void>;
}

/** Zapisuje kolejno wybrane wiersze (publikacja + działanie). Przerywa na pierwszym błędzie. */
export async function importPublicationRows(
  rows: ImportRow[],
  author: string,
  programs: OzipzProgram[],
  store: ImportStoreWriters,
  onImported: (key: string) => void
): Promise<void> {
  for (const row of rows) {
    const { action, publication } = buildImportPayloads(row, author, programs);
    await saveImportedPublication({ action, publication, ...store });
    onImported(row.key);
  }
}

/**
 * Powiązanie pobranego wpisu z istniejącym rekordem zamiast tworzenia duplikatu:
 *  - rekord publikacji bez linku → uzupełniamy link,
 *  - samo działanie (historyczny wpis bez publikacji) → dokładamy publikację wskazującą na to działanie.
 */
export function buildLinkOperation(
  row: EvaluatedRow,
  actions: OzipzAction[]
):
  | { kind: "update-publication"; publicationId: string; patch: Partial<OzipzPublication> }
  | { kind: "add-publication"; publication: NewPublication }
  | null {
  const entry = row.match?.entry;
  if (!entry) return null;
  const link = canonicalLink(row);
  if (entry.publicationId) {
    return entry.hasLink ? null : { kind: "update-publication", publicationId: entry.publicationId, patch: { link } };
  }
  const action = actions.find((a) => a.id === entry.actionId);
  if (!action) return null;
  const config = IMPORT_SOURCE_CONFIG[row.source];
  return {
    kind: "add-publication",
    publication: {
      title: row.title.trim() || entry.title,
      channel: config.channel,
      publicationDate: action.date,
      topic: action.programName || action.topic || row.customTopic,
      link,
      reachCount: 0,
      author: action.leadEducator || DEFAULT_PUBLICATION_AUTHOR,
      actionId: action.id,
      notes: `${config.publicationNote} – powiązano z istniejącym działaniem podczas importu`,
    },
  };
}
