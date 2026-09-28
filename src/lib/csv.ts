/** Quote a CSV cell and keep spreadsheet formulas from evaluating on open. */
export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  const safe = typeof value !== "number" && /^[\s\x00-\x1f\x7f]*[=+@-]/u.test(text)
    ? `'${text}`
    : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
