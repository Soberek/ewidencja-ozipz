import { describe, it, expect } from "vitest";
import { editAssistantDraft, canExportAssistantDraft } from "./assistantUtils";
import type { AssistantDraft } from "../types/assistant.types";
export const checkedDraft: AssistantDraft = {
  id: "draft",
  programId: "hnt-26",
  edition: "2026/2027",
  request: "Zaproszenie",
  subject: "Zaproszenie do programu HNT",
  body: "Szanowni Państwo,\n\nzapraszamy do udziału w programie.",
  recipient: "Dyrektorzy szkół podstawowych",
  date: "2026-09-10",
  caseSign: "OZ.1.2026",
  signature: "Podpis",
  facts: [],
  missing: [],
  conflicts: [],
  sources: [],
  warnings: [],
  review: {
    passed: true,
    issues: [],
    claims: [],
    fingerprint: "checked",
    checkedAt: "2026-09-10",
  },
};
describe("export eligibility", () => {
  it("allows a reviewed document", () =>
    expect(canExportAssistantDraft(checkedDraft)).toBe(true));
  it.each([
    "body",
    "date",
    "caseSign",
    "recipient",
    "signature",
    "subject",
    "request",
  ] as const)("invalidates approval after editing %s", (key) => {
    expect(
      canExportAssistantDraft(
        editAssistantDraft(checkedDraft, { [key]: "zmiana" }),
      ),
    ).toBe(false);
  });
  it.each([
    { missing: ["Jaki termin?"] },
    { conflicts: ["Inna edycja"] },
    { body: "Termin [DO UZUPEŁNIENIA: data]" },
  ])("blocks incomplete drafts", (change) =>
    expect(canExportAssistantDraft({ ...checkedDraft, ...change })).toBe(false),
  );
});
