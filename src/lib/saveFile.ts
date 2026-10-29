import { invoke } from "@tauri-apps/api/core";

/**
 * Zapis wygenerowanego dokumentu w miejscu wybranym przez użytkownika.
 * Aplikacja desktopowa: okno „Zapisz jako” (zapamiętuje ostatni folder).
 * Przeglądarka: systemowe okno zapisu, jeśli je obsługuje, w przeciwnym razie zwykłe pobranie.
 */
export interface SaveFileOptions {
  fileName: string;
  filterName: string;
  extension: string;
  mimeType: string;
  title?: string;
}

export interface SavedFile {
  fileName: string;
  /** Pełna ścieżka na dysku — tylko w aplikacji desktopowej. */
  path?: string;
}

const LAST_FOLDER_KEY = "ozipz_lastSaveFolder";

const isDesktopApp = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function readLastFolder(): string | null {
  try { return localStorage.getItem(LAST_FOLDER_KEY); } catch { return null; }
}

function rememberFolder(path: string): void {
  const separator = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (separator <= 0) return;
  try { localStorage.setItem(LAST_FOLDER_KEY, path.slice(0, separator)); } catch { /* Tylko wygoda — zapis się udał. */ }
}

export function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

export function suggestedSavePath(fileName: string, lastFolder: string | null): string {
  if (!lastFolder) return fileName;
  const separator = lastFolder.includes("\\") ? "\\" : "/";
  return lastFolder.replace(/[\\/]+$/, "") + separator + fileName;
}

function withExtension(path: string, extension: string): string {
  return path.toLowerCase().endsWith(`.${extension}`) ? path : `${path}.${extension}`;
}

async function saveInDesktopApp(blob: Blob, options: SaveFileOptions): Promise<SavedFile | null> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const selected = await save({
    title: options.title,
    defaultPath: suggestedSavePath(options.fileName, readLastFolder()),
    filters: [{ name: options.filterName, extensions: [options.extension] }],
  });
  if (!selected) return null;

  const destinationPath = withExtension(selected, options.extension);
  const contents = Array.from(new Uint8Array(await blob.arrayBuffer()));
  await invoke("save_generated_file", { destinationPath, contents });
  rememberFolder(destinationPath);
  return { fileName: fileNameFromPath(destinationPath), path: destinationPath };
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ name: string; createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>;

async function saveInBrowser(blob: Blob, options: SaveFileOptions): Promise<SavedFile | null> {
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: options.fileName,
        types: [{ description: options.filterName, accept: { [options.mimeType]: [`.${options.extension}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { fileName: handle.name };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = options.fileName;
  link.click();
  // Zwolnienie adresu dopiero po przejęciu pliku przez przeglądarkę.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { fileName: options.fileName };
}

/** Zwraca zapisany plik albo null, gdy użytkownik anulował wybór miejsca. */
export function saveFileAs(blob: Blob, options: SaveFileOptions): Promise<SavedFile | null> {
  return isDesktopApp() ? saveInDesktopApp(blob, options) : saveInBrowser(blob, options);
}

export function revealSavedFile(path: string): Promise<void> {
  return invoke("reveal_saved_file", { path });
}
