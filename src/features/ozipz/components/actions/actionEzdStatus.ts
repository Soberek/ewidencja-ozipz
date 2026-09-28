import type { OzipzAction } from "../../types/ozipz.types";
import { isPublicationActionType } from "./editor/editorUtils";

export type ActionEzdState = "publication" | "registered" | "pending" | "not_applicable";

export function getActionEzdState(action: OzipzAction): ActionEzdState {
  if (isPublicationActionType(action.actionType)) return "publication";
  if (action.ezdStatus === "nie_dotyczy" || action.ezdStatus === "brak_ezd") return "not_applicable";
  if (action.ezdStatus === "do_ezd") return "pending";
  if (action.ezdStatus === "w_ezd" || action.ezdStatus === "zarejestrowana" || (!action.ezdStatus && Boolean(action.jrwaSign?.trim()))) {
    return "registered";
  }
  return "pending";
}

/** Krótkie etykiety statusu EZD do podsumowań formularza (kody z bazy → tekst dla użytkownika). */
export const EZD_STATUS_LABELS: Record<string, string> = {
  w_ezd: "W EZD",
  zarejestrowana: "W EZD",
  do_ezd: "Do EZD",
  nie_dotyczy: "EZD: nie dotyczy",
  brak_ezd: "EZD: nie dotyczy",
};
