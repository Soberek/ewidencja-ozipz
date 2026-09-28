/** Escapuje tekst wstawiany do dokumentów HTML generowanych do druku. */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Escapuje tekst wielowierszowy, zamieniając nowe linie na <br>. */
export function escapeMultiline(text: string): string {
  return escapeHtml(text.trim()).replace(/\r?\n/g, "<br>");
}

// ——— Wspólne elementy urzędowych blankietów A4 (formularz F/PT/PZ/01/01) ———

/**
 * Styl bazowy strony A4 i elementów wspólnych blankietów (metryka, pieczątka, podpis, tabela).
 * Lato 10 pt z plików w public/fonts/lato — działa bez internetu.
 */
export const OFFICIAL_FORM_BASE_CSS = `
    @font-face { font-family: "Lato"; font-weight: 400; src: url("/fonts/lato/lato-latin-400-normal.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212; }
    @font-face { font-family: "Lato"; font-weight: 400; src: url("/fonts/lato/lato-latin-ext-400-normal.woff2") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF, U+20A0-20C0, U+2C60-2C7F, U+A720-A7FF; }
    @font-face { font-family: "Lato"; font-weight: 700; src: url("/fonts/lato/lato-latin-700-normal.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212; }
    @font-face { font-family: "Lato"; font-weight: 700; src: url("/fonts/lato/lato-latin-ext-700-normal.woff2") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF, U+20A0-20C0, U+2C60-2C7F, U+A720-A7FF; }
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff; }
    body {
      font-family: "Lato", Arial, sans-serif;
      font-size: 10pt;
      color: #000;
      line-height: 1.35;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 16mm 17mm 15mm 14mm;
    }
    .form-meta { text-align: right; line-height: 1.6; }
    .stamp { width: 86mm; margin-top: 1mm; text-align: center; }
    .dotted-line { border-top: 1px dotted #000; margin-bottom: 1mm; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #000; text-align: center; vertical-align: middle; font-size: 10pt; font-weight: 400; padding: 2mm; }
    .col-lp { width: 8mm; padding: 1mm; }
    .signature { margin-left: auto; width: 62mm; text-align: center; }
`;

/** Numer formularza, data wydania i paginacja w prawym górnym rogu. */
export const OFFICIAL_FORM_META_HTML = `
    <div class="form-meta">
      F/PT/PZ/01/01<br>
      Data wydania: 29-01-2013<br>
      Strona 1 z 1
    </div>`;

export const STATION_STAMP_HTML = `
    <div class="stamp">
      <div class="dotted-line"></div>
      (pieczątka stacji sanitarno-epidemiologicznej)
    </div>`;

export function responsibleSignatureHtml(marginTop: string): string {
  return `
    <div class="signature" style="margin-top: ${marginTop};">
      <div class="dotted-line"></div>
      (podpis osoby odpowiedzialnej)
    </div>`;
}

export function officialFormDocument(title: string, css: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — Ewidencja OZiPZ</title>
  <style>${OFFICIAL_FORM_BASE_CSS}${css}</style>
</head>
<body>
  <div class="page">${body}
  </div>
</body>
</html>`;
}
