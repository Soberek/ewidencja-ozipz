export const THEME_STORAGE_KEY = "ozipz_theme";

export type ThemeMode = "light" | "dark";

export function readStoredTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function persistTheme(mode: ThemeMode) {
  applyTheme(mode);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Preferencja motywu nie jest krytyczna.
  }
}
