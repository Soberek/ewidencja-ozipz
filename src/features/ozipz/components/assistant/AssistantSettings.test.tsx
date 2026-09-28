// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AssistantSettings } from "./AssistantSettings";
import type { AssistantConfig } from "../../types/assistant.types";
import { useAssistantStore } from "../../store/useAssistantStore";
afterEach(cleanup);
const config: AssistantConfig = {
  rootFolder: "C:/Materiały",
  programs: [],
  model: "model",
  monthlyLimitUsd: 5,
  styleFiles: [],
  templatePath: "",
  domains: [],
  style: "",
  styleApproved: false,
};
describe("single library configuration", () => {
  it("asks for one common root rather than assigning each program", () => {
    useAssistantStore.setState({ busy: null, snapshot: null });
    render(<AssistantSettings initial={config} />);
    expect(
      screen.getByRole("button", { name: "Wybierz wspólny folder" }),
    ).toBeDefined();
    expect(screen.getByText("C:/Materiały")).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Dodaj folder programu" }),
    ).toBeNull();
    expect(screen.queryByText("Program z ewidencji")).toBeNull();
    expect(screen.queryByLabelText("Edycja / rok szkolny")).toBeNull();
  });
});
