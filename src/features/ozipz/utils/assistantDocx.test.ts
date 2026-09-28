import { describe, it, expect } from "vitest";
import PizZip from "pizzip";
import { createAssistantDocx } from "./assistantDocx";
import type { AssistantDraft } from "../types/assistant.types";
function template(tag = "{tresc}"): Uint8Array {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${tag}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`,
  );
  zip.file("word/header1.xml", "Nagłówek urzędu");
  return zip.generate({ type: "uint8array" });
}
const draft: AssistantDraft = {
  id: "d",
  programId: "p",
  edition: "2026",
  request: "pismo",
  subject: "HNT",
  body: "Zażółć gęślą jaźń\nDrugi akapit & pismo",
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
describe("assistant DOCX export", () => {
  it("fills text and preserves the template and header", () => {
    const input = template();
    const before = input.slice();
    const output = new PizZip(createAssistantDocx(input, draft));
    expect(output.file("word/document.xml")?.asText()).toContain(
      "Zażółć gęślą jaźń",
    );
    expect(output.file("word/document.xml")?.asText()).toContain("&amp;");
    expect(output.file("word/header1.xml")?.asText()).toBe("Nagłówek urzędu");
    expect(input).toEqual(before);
  });
  it("rejects missing body slot", () =>
    expect(() => createAssistantDocx(template("{data}"), draft)).toThrow(
      "{tresc}",
    ));
  it("rejects an unreviewed draft", () =>
    expect(() =>
      createAssistantDocx(template(), { ...draft, review: null }),
    ).toThrow("sprawdź"));
  it("rejects unsupported placeholders instead of producing undefined", () =>
    expect(() => createAssistantDocx(template("{nieznane}"), draft)).toThrow());
});
