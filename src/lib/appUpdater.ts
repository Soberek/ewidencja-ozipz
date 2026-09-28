import type { Update } from "@tauri-apps/plugin-updater";

export type { Update };

export const isDesktopApp = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function getAppVersion(): Promise<string | null> {
  if (!isDesktopApp()) return null;
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

/** Resolves to the newer release, or null when the app is up to date or runs outside the desktop shell. */
export async function checkForAppUpdate(): Promise<Update | null> {
  if (!isDesktopApp()) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  return check();
}

/** Downloads and runs the installer; on Windows the installer closes the app itself. */
export async function installAppUpdate(update: Update, onProgress?: (percent: number | null) => void): Promise<void> {
  let total = 0;
  let received = 0;
  await update.downloadAndInstall((event) => {
    if (event.event === "Started") total = event.data.contentLength ?? 0;
    if (event.event === "Progress") {
      received += event.data.chunkLength;
      onProgress?.(total ? Math.round((received / total) * 100) : null);
    }
  });
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
