import { forwardRef } from "react";

// A4 przy 96 dpi i skala podglądu na ekranie
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PREVIEW_SCALE = 0.62;

interface A4PrintPreviewProps {
  html: string;
  title: string;
}

/** Pomniejszony podgląd dokumentu A4; ten sam iframe służy do druku (zob. printPreviewFrame). */
export const A4PrintPreview = forwardRef<HTMLIFrameElement, A4PrintPreviewProps>(({ html, title }, ref) => (
  <div
    className="border bg-white shadow-sm overflow-hidden shrink-0"
    style={{ width: A4_WIDTH_PX * PREVIEW_SCALE, height: A4_HEIGHT_PX * PREVIEW_SCALE }}
  >
    <iframe
      ref={ref}
      title={title}
      srcDoc={html}
      style={{
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        transform: `scale(${PREVIEW_SCALE})`,
        transformOrigin: "top left",
        border: 0,
      }}
    />
  </div>
));
A4PrintPreview.displayName = "A4PrintPreview";

export function printPreviewFrame(frame: HTMLIFrameElement | null): void {
  const frameWindow = frame?.contentWindow;
  frameWindow?.focus();
  frameWindow?.print();
}
