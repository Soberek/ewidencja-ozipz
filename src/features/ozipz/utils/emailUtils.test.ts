import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyTextToClipboard,
  emailCountLabel,
  extractEmails,
  invalidEmails,
  isValidEmail,
  mailtoHref,
  parseEmails,
  uniqueEmails,
} from "./emailUtils";

describe("emailUtils", () => {
  it("validates a single address", () => {
    expect(isValidEmail(" jan@sp.pl ")).toBe(true);
    expect(isValidEmail("jan@sp")).toBe(false);
    expect(isValidEmail("jan@sp.pl; ewa@sp.pl")).toBe(false);
  });

  it("extracts several addresses from one field regardless of separator", () => {
    expect(extractEmails("a@sp.pl; b@sp.pl, c@sp.pl\nd@sp.pl e@sp.pl / f@sp.pl")).toEqual([
      "a@sp.pl", "b@sp.pl", "c@sp.pl", "d@sp.pl", "e@sp.pl", "f@sp.pl",
    ]);
  });

  it("strips names, angle brackets, mailto and trailing punctuation", () => {
    expect(extractEmails('Jan Kowalski <jan@sp.pl>; mailto:ewa@sp.pl, "adam@sp.pl".')).toEqual([
      "jan@sp.pl", "ewa@sp.pl", "adam@sp.pl",
    ]);
  });

  it("separates invalid address-like entries and ignores plain words", () => {
    expect(parseEmails("dyrektor: jan@sp; ewa@sp.pl")).toEqual({ valid: ["ewa@sp.pl"], invalid: ["jan@sp"] });
    expect(invalidEmails(["jan@sp", "x@", "jan@sp", null])).toEqual(["jan@sp", "x@"]);
  });

  it("deduplicates case-insensitively keeping first spelling and order", () => {
    expect(uniqueEmails(["Sekretariat@sp.pl", "sekretariat@sp.pl; drugi@sp.pl", undefined, ""])).toEqual([
      "Sekretariat@sp.pl", "drugi@sp.pl",
    ]);
  });

  it("builds mailto links for one or many addresses", () => {
    expect(mailtoHref("jan@sp.pl")).toBe("mailto:jan@sp.pl");
    expect(mailtoHref("jan@sp.pl; ewa@sp.pl")).toBe("mailto:jan@sp.pl,ewa@sp.pl");
  });

  it("declines the count in Polish", () => {
    expect(emailCountLabel(0)).toBe("0 e-maili");
    expect(emailCountLabel(1)).toBe("1 e-mail");
    expect(emailCountLabel(3)).toBe("3 e-maile");
    expect(emailCountLabel(5)).toBe("5 e-maili");
    expect(emailCountLabel(12)).toBe("12 e-maili");
    expect(emailCountLabel(22)).toBe("22 e-maile");
    expect(emailCountLabel(112)).toBe("112 e-maili");
  });

  describe("copyTextToClipboard", () => {
    const original = navigator.clipboard;
    afterEach(() => {
      Object.assign(navigator, { clipboard: original });
      vi.restoreAllMocks();
    });

    it("uses the Clipboard API when available", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      await expect(copyTextToClipboard("a@sp.pl")).resolves.toBe(true);
      expect(writeText).toHaveBeenCalledWith("a@sp.pl");
    });

    it("falls back to selecting text when the Clipboard API refuses", async () => {
      Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
      const execCommand = vi.fn().mockReturnValue(true);
      Object.assign(document, { execCommand });
      await expect(copyTextToClipboard("a@sp.pl")).resolves.toBe(true);
      expect(execCommand).toHaveBeenCalledWith("copy");
    });
  });
});
