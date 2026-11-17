import { forwardRef, useState } from "react";

// A4 przy 96 dpi i skala podglądu na ekranie
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PREVIEW_SCALE = 0.62;

interface A4PrintPreviewProps {
  html: string;
  title: string;
  /** Skala podglądu na ekranie; domyślnie pomniejszony, 1 = rozmiar rzeczywisty. */
  scale?: number;
  /** Rozciąga podgląd do wysokości treści (dokumenty dłuższe niż jedna strona). */
  fitContent?: boolean;
}

/** Podgląd dokumentu A4; ten sam iframe służy do druku (zob. printPreviewFrame). */
export const A4PrintPreview = forwardRef<HTMLIFrameElement, A4PrintPreviewProps>(
  ({ html, title, scale = PREVIEW_SCALE, fitContent = false }, ref) => {
    const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);
    const height = fitContent ? Math.max(A4_HEIGHT_PX, contentHeight) : A4_HEIGHT_PX;

    return (
      <div
        className="border bg-white shadow-sm overflow-hidden shrink-0"
        style={{ width: A4_WIDTH_PX * scale, height: height * scale }}
      >
        <iframe
          ref={ref}
          title={title}
          srcDoc={html}
          onLoad={(e) => {
            if (fitContent) setContentHeight(e.currentTarget.contentDocument?.documentElement.scrollHeight ?? A4_HEIGHT_PX);
          }}
          style={{
            width: A4_WIDTH_PX,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: 0,
          }}
        />
      </div>
    );
  }
);
A4PrintPreview.displayName = "A4PrintPreview";

export function printPreviewFrame(frame: HTMLIFrameElement | null): void {
  const frameWindow = frame?.contentWindow;
  frameWindow?.focus();
  frameWindow?.print();
}

/** Drukuje dokument HTML bez pokazywania go na ekranie (ukryty iframe usuwany po zamknięciu okna druku). */
export function printHtmlDocument(html: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  const cleanup = () => window.setTimeout(() => frame.remove(), 1000);
  frame.onload = () => {
    const frameWindow = frame.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }
    frameWindow.addEventListener("afterprint", cleanup);
    frameWindow.focus();
    frameWindow.print();
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
}
