import { invoke } from "@tauri-apps/api/core";

/**
 * Pliki zgłoszeń do programów (skany deklaracji, PDF-y). Kopia trafia do folderu
 * „Zgłoszenia/<rok szkolny>” obok bazy, a zgłoszenie przechowuje ścieżkę względną.
 * Dostępne tylko w aplikacji desktopowej – przeglądarka nie ma dostępu do plików na dysku.
 */
export const PARTICIPATION_FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "heic", "doc", "docx", "odt", "rtf", "txt"];

const PREVIEW_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  txt: "text/plain",
};

export function supportsParticipationFiles(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function participationFileName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

/** Typ MIME dla podglądu w aplikacji; null – plik otwiera się w domyślnym programie. */
export function participationFilePreviewType(path: string): string | null {
  const extension = participationFileName(path).split(".").pop()?.toLowerCase() ?? "";
  return PREVIEW_TYPES[extension] ?? null;
}

/** Nazwa pliku w folderze zgłoszeń: „<program> – <placówka>”. */
export function participationFileBaseName(programName: string, facilityName: string): string {
  return [programName, facilityName].map((part) => part.trim()).filter(Boolean).join(" – ");
}

/** Okno wyboru pliku; zwraca ścieżkę źródłową albo null po anulowaniu. */
export async function pickParticipationFile(): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    directory: false,
    title: "Wybierz plik zgłoszenia",
    filters: [
      { name: "Skany i dokumenty", extensions: PARTICIPATION_FILE_EXTENSIONS },
      { name: "Wszystkie pliki", extensions: ["*"] },
    ],
  });
  return typeof selected === "string" ? selected : null;
}

export function importParticipationFile(sourcePath: string, schoolYear: string, baseName: string): Promise<string> {
  return invoke<string>("import_participation_file", { sourcePath, schoolYear, baseName });
}

export function discardParticipationFile(relativePath: string): Promise<void> {
  return invoke("discard_participation_file", { relativePath });
}

export async function readParticipationFile(relativePath: string): Promise<Blob> {
  const type = participationFilePreviewType(relativePath) ?? "application/octet-stream";
  const bytes = await invoke<ArrayBuffer>("read_participation_file", { relativePath });
  return new Blob([bytes], { type });
}

export function openParticipationFile(relativePath: string): Promise<void> {
  return invoke("open_participation_file", { relativePath });
}

export function revealParticipationFile(relativePath: string): Promise<void> {
  return invoke("reveal_participation_file", { relativePath });
}

export function openParticipationFilesFolder(): Promise<void> {
  return invoke("open_participation_files_folder");
}
