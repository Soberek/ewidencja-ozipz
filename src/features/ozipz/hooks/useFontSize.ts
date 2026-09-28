import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ozipz_font_size_percent";
export const MIN_FONT_SIZE = 50;
export const MAX_FONT_SIZE = 150;
export const DEFAULT_FONT_SIZE = 100;

export function useFontSize() {
  const [fontSizePercent, setFontSizePercentState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val >= MIN_FONT_SIZE && val <= MAX_FONT_SIZE) {
          return val;
        }
      }
    } catch {}
    return DEFAULT_FONT_SIZE;
  });

  const applyFontSize = useCallback((val: number) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(val)));
    setFontSizePercentState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {}
    document.documentElement.style.fontSize = `${clamped}%`;
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizePercent}%`;
  }, [fontSizePercent]);

  return {
    fontSizePercent,
    setFontSizePercent: applyFontSize,
    increaseFontSize: () => applyFontSize(fontSizePercent + 5),
    decreaseFontSize: () => applyFontSize(fontSizePercent - 5),
    resetFontSize: () => applyFontSize(DEFAULT_FONT_SIZE),
  };
}
