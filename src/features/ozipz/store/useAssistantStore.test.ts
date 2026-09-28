import { beforeEach, describe, expect, it, vi } from "vitest";
import { assistantClient } from "@/db/assistant/client";
import { useAssistantStore } from "./useAssistantStore";
import type { AssistantDraft } from "../types/assistant.types";
vi.mock("@/db/assistant/client", () => ({
  assistantClient: {
    generate: vi.fn(),
    load: vi.fn(),
    review: vi.fn(),
    saveDraft: vi.fn(),
    saveConfig: vi.fn(),
  },
}));
const draft: AssistantDraft = {
  id: "d",
  programId: "p",
  edition: "2026",
  request: "pismo",
  subject: "HNT",
  body: "Treść",
  recipient: "Szkoły",
  date: "2026-09-10",
  caseSign: "1",
  signature: "Podpis",
  sources: [],
  facts: [],
  missing: [],
  conflicts: [],
  warnings: [],
  review: {
    passed: true,
    issues: [],
    claims: [],
    fingerprint: "v",
    checkedAt: "now",
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  useAssistantStore.setState({
    snapshot: null,
    draft: null,
    request: "",
    programId: "",
    busy: null,
    error: null,
  });
});
describe("assistant workflow state", () => {
  it("lets the backend discover and resolve a program without manual selection", async () => {
    useAssistantStore.setState({ request: "Napisz pismo o HNT" });
    vi.mocked(assistantClient.generate).mockRejectedValue(
      new Error("Doprecyzuj program"),
    );
    await useAssistantStore.getState().generate();
    expect(assistantClient.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        request: "Napisz pismo o HNT",
        programId: undefined,
      }),
    );
    expect(useAssistantStore.getState().error).toBe("Doprecyzuj program");
  });
  it("keeps the draft editable after an API failure", async () => {
    useAssistantStore.setState({ draft });
    vi.mocked(assistantClient.review).mockRejectedValue(
      new Error("Błędny klucz"),
    );
    await useAssistantStore.getState().review();
    expect(useAssistantStore.getState().draft).toEqual(draft);
    expect(useAssistantStore.getState().busy).toBeNull();
    expect(useAssistantStore.getState().error).toBe("Błędny klucz");
  });
  it("prevents duplicate in-flight generation", async () => {
    useAssistantStore.setState({
      busy: "Praca",
      request: "HNT",
      programId: "p",
    });
    await useAssistantStore.getState().generate();
    expect(assistantClient.generate).not.toHaveBeenCalled();
  });
  it("invalidates approval when the request changes", () => {
    useAssistantStore.setState({ draft });
    useAssistantStore.getState().setRequest("nowe informacje");
    expect(useAssistantStore.getState().draft?.review).toBeNull();
  });
  it("opens saved projects and preserves evidence", () => {
    useAssistantStore.getState().selectDraft(draft);
    expect(useAssistantStore.getState().request).toBe(draft.request);
    expect(useAssistantStore.getState().programId).toBe(draft.programId);
  });
});
