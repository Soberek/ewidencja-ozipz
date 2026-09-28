import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useFontSize,
  DEFAULT_FONT_SIZE,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from "./useFontSize";

describe("useFontSize Hook - Accessibility & Font Scaling", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.fontSize = "";
  });

  it("initializes with DEFAULT_FONT_SIZE (100%) when storage is empty", () => {
    const { result } = renderHook(() => useFontSize());
    expect(result.current.fontSizePercent).toBe(DEFAULT_FONT_SIZE);
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("initializes with stored value from localStorage", () => {
    localStorage.setItem("ozipz_font_size_percent", "115");
    const { result } = renderHook(() => useFontSize());
    expect(result.current.fontSizePercent).toBe(115);
    expect(document.documentElement.style.fontSize).toBe("115%");
  });

  it("increases and decreases font size by 5%", () => {
    const { result } = renderHook(() => useFontSize());

    act(() => {
      result.current.increaseFontSize();
    });
    expect(result.current.fontSizePercent).toBe(105);
    expect(document.documentElement.style.fontSize).toBe("105%");
    expect(localStorage.getItem("ozipz_font_size_percent")).toBe("105");

    act(() => {
      result.current.decreaseFontSize();
    });
    expect(result.current.fontSizePercent).toBe(100);
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("clamps font size between MIN_FONT_SIZE (50%) and MAX_FONT_SIZE (150%)", () => {
    const { result } = renderHook(() => useFontSize());

    act(() => {
      result.current.setFontSizePercent(200);
    });
    expect(result.current.fontSizePercent).toBe(MAX_FONT_SIZE);
    expect(document.documentElement.style.fontSize).toBe(`${MAX_FONT_SIZE}%`);

    act(() => {
      result.current.setFontSizePercent(20);
    });
    expect(result.current.fontSizePercent).toBe(MIN_FONT_SIZE);
    expect(document.documentElement.style.fontSize).toBe(`${MIN_FONT_SIZE}%`);
  });

  it("resets font size to DEFAULT_FONT_SIZE with resetFontSize()", () => {
    const { result } = renderHook(() => useFontSize());

    act(() => {
      result.current.setFontSizePercent(130);
    });
    expect(result.current.fontSizePercent).toBe(130);

    act(() => {
      result.current.resetFontSize();
    });
    expect(result.current.fontSizePercent).toBe(DEFAULT_FONT_SIZE);
    expect(document.documentElement.style.fontSize).toBe(`${DEFAULT_FONT_SIZE}%`);
  });
});
