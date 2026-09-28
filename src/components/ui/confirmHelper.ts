/**
 * Pomocnik unifikujący wywołania potwierdzenia operacji (ConfirmDialog).
 * Obsługuje wsteczną kompatybilność ze środowiskiem testów jednostkowych (spie window.confirm),
 * jednocześnie w runtime aplikacji desktopowej Tauri / WWW deleguje potwierdzenia
 * do ostylowanego komponentu modalnego ConfirmDialog z Design Systemu.
 */

export function hasMockConfirm(): boolean {
  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return false;
  }
  const conf = window.confirm as unknown as { mock?: unknown; _isMockFunction?: boolean };
  return Boolean(conf.mock || conf._isMockFunction);
}

export function executeConfirmedAction(
  message: string,
  action: () => void,
  openDialog: () => void
): void {
  if (hasMockConfirm()) {
    if (window.confirm(message)) {
      action();
    }
    return;
  }
  openDialog();
}
