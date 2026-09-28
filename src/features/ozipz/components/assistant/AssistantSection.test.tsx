// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => false,
  invoke: vi.fn(),
}));
import { AssistantSection } from "./AssistantSection";
afterEach(cleanup);
describe("assistant browser boundary", () => {
  it("explains desktop requirements without requesting a key or accessing files", () => {
    render(<AssistantSection />);
    expect(screen.getByText("Asystent AI")).toBeDefined();
    expect(
      screen.getByText(/Otwórz Ewidencję OZiPZ jako aplikację/),
    ).toBeDefined();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
