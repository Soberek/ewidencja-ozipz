import { describe, expect, it } from "vitest";
import { isRiskyDatabaseLocation } from "./client";

describe("isRiskyDatabaseLocation", () => {
  it("flags cloud-synced folders and network shares", () => {
    expect(isRiskyDatabaseLocation("C:\\Users\\jan\\OneDrive - PSSE\\Dokumenty\\Ewidencja OZiPZ\\ozipz.db")).toBe(true);
    expect(isRiskyDatabaseLocation("C:\\Users\\jan\\Dropbox\\ozipz.db")).toBe(true);
    expect(isRiskyDatabaseLocation("\\\\serwer\\wspolne\\ozipz.db")).toBe(true);
  });

  it("accepts local folders", () => {
    expect(isRiskyDatabaseLocation("C:\\Users\\jan\\Documents\\Ewidencja OZiPZ\\ozipz.db")).toBe(false);
    expect(isRiskyDatabaseLocation("D:\\Ewidencja\\ozipz.db")).toBe(false);
  });
});
