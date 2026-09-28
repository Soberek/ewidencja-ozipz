import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { AssistantDraft } from "../types/assistant.types";
import { canExportAssistantDraft } from "./assistantUtils";
export const ASSISTANT_TEMPLATE_FIELDS = [
  "data",
  "znak_sprawy",
  "adresat",
  "temat",
  "tresc",
  "podpis",
] as const;
export function createAssistantDocx(
  template: Uint8Array,
  draft: AssistantDraft,
): Uint8Array {
  if (!canExportAssistantDraft(draft))
    throw new Error("Najpierw sprawdź aktualną treść i uzupełnij braki.");
  const zip = new PizZip(template);
  const found = new Set<string>();
  const values: Record<string, string> = {
    data: draft.date,
    znak_sprawy: draft.caseSign,
    adresat: draft.recipient,
    temat: draft.subject,
    tresc: draft.body,
    podpis: draft.signature,
  };
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    errorLogging: false,
    parser: (tag: string) => {
      const key = tag.trim();
      found.add(key);
      if (!ASSISTANT_TEMPLATE_FIELDS.some((field) => field === key))
        throw new Error(`Nieznane pole szablonu: ${key}`);
      return { get: () => values[key] };
    },
  });
  if (!found.has("tresc"))
    throw new Error(
      "W szablonie brakuje pola {tresc}. Oznacz miejsca na treść przed eksportem.",
    );
  doc.render(values);
  return doc.getZip().generate({ type: "uint8array", compression: "DEFLATE" });
}
