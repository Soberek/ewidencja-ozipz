import type { OzipzAction, OzipzPublication } from "../../../types/ozipz.types";
import {
  actionPublicationTitle,
  buildPublicationRegistry,
  channelFamilyOf,
  extractUrls,
  isPublicationAction,
  matchPublicationCandidates,
  type ChannelFamily,
} from "./publicationMatcher";

type NewPublication = Omit<OzipzPublication, "id" | "createdAt" | "updatedAt">;

export interface ReconcilePlan {
  /** Publikacje bez powiązanego działania, dla których znaleziono odpowiadające działanie. */
  attach: { publication: OzipzPublication; action: OzipzAction }[];
  /** Działania "Publikacja media" bez wpisu w ewidencji publikacji. */
  create: { action: OzipzAction; publication: NewPublication }[];
}

const CHANNEL_BY_FAMILY: Record<ChannelFamily, string> = {
  gov: "Strona www PSSE Myślibórz (gov.pl)",
  x: "Profil X (@PSSEMysliborz)",
  fb: "Facebook PSSE Myślibórz",
  other: "Inne media",
};

/**
 * Plan uzgodnienia ewidencji publikacji z rejestrem działań:
 * najpierw łączymy istniejące publikacje z ich działaniami (po linku albo tytule i dacie),
 * potem dla pozostałych działań "Publikacja media" proponujemy nowe wpisy ewidencji.
 */
export function planRegistryReconcile(publications: OzipzPublication[], actions: OzipzAction[]): ReconcilePlan {
  const referenced = new Set(publications.map((p) => p.actionId).filter(Boolean));
  const orphanActions = actions.filter((a) => isPublicationAction(a) && !referenced.has(a.id));
  const unlinkedPublications = publications.filter((p) => !p.actionId);

  const actionRegistry = buildPublicationRegistry([], orphanActions);
  const matches = matchPublicationCandidates(
    unlinkedPublications.map((p) => ({
      urls: [p.link || "", ...extractUrls(p.notes)],
      title: p.title,
      date: p.publicationDate,
      channel: channelFamilyOf(p.channel),
    })),
    actionRegistry
  );

  const byId = new Map(orphanActions.map((a) => [a.id, a]));
  const attach: ReconcilePlan["attach"] = [];
  matches.forEach((m, i) => {
    const action = m && (m.level === "linked" || m.level === "probable") ? byId.get(m.entry.id) : undefined;
    if (action) attach.push({ publication: unlinkedPublications[i], action });
  });

  const attached = new Set(attach.map((a) => a.action.id));
  const create = orphanActions
    .filter((a) => !attached.has(a.id))
    .map((action) => ({
      action,
      publication: {
        title: actionPublicationTitle(action),
        channel: CHANNEL_BY_FAMILY[channelFamilyOf(action.actionType + " " + (action.sourceInfo || ""))],
        publicationDate: action.date,
        topic: action.programName || action.topic || "",
        link: extractUrls(action.notes)[0],
        reachCount: 0,
        author: action.leadEducator || "",
        actionId: action.id,
        notes: "Uzupełniono z rejestru działań (publikacja zarejestrowana wcześniej jako działanie)",
      },
    }));

  return { attach, create };
}
