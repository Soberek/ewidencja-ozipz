import { describe, it, expect, vi } from "vitest";
import { runModalAction } from "./modalActionUtils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("runModalAction utility", () => {
  it("executes action, triggers toast.success, calls onSuccess callback and returns result", async () => {
    const onSuccess = vi.fn();
    const action = vi.fn().mockResolvedValue({ id: "123", name: "Działanie" });

    const result = await runModalAction(action, "Zapisano pomyślnie", "Błąd zapisu", onSuccess);

    expect(action).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Zapisano pomyślnie");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "123", name: "Działanie" });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("handles Error exception, shows toast.error with message, returns undefined and does not call onSuccess", async () => {
    const onSuccess = vi.fn();
    const action = vi.fn().mockRejectedValue(new Error("Błąd bazy danych"));

    const result = await runModalAction(action, "Sukces", "Błąd zapisu", onSuccess);

    expect(action).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Błąd zapisu: Błąd bazy danych");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("handles non-Error exception gracefully with fallback message", async () => {
    const onSuccess = vi.fn();
    const action = vi.fn().mockRejectedValue("string exception");

    const result = await runModalAction(action, "Sukces", "Błąd zapisu", onSuccess);

    expect(action).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Błąd zapisu: Błąd operacji");
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("re-throws error when rethrow option is true", async () => {
    const onSuccess = vi.fn();
    const testError = new Error("Krytyczny błąd SQLite");
    const action = vi.fn().mockRejectedValue(testError);

    await expect(
      runModalAction(action, "Sukces", "Błąd zapisu", onSuccess, { rethrow: true })
    ).rejects.toThrow("Krytyczny błąd SQLite");

    expect(toast.error).toHaveBeenCalledWith("Błąd zapisu: Krytyczny błąd SQLite");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
