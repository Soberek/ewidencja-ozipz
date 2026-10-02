import { expect, it } from "vitest";
import { importScanFile } from "./scan-files";

it("rejects an oversized scan before reading it in any database mode", async () => {
  const oversized = { name: "large.pdf", type: "application/pdf", size: 60 * 1024 * 1024 + 1 } as File;
  await expect(importScanFile(oversized)).rejects.toThrow("60 MiB");
});
