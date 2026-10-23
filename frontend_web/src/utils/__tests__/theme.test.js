import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  THEMES,
  getTheme,
  setTheme,
  applyTheme,
  toggleTheme,
  initTheme,
} from "../theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("theme", () => {
  test("usa oscuro por defecto y persiste el tema elegido", () => {
    expect(getTheme()).toBe(THEMES.DARK);

    expect(setTheme(THEMES.LIGHT)).toBe(THEMES.LIGHT);
    expect(localStorage.getItem("metafit_theme")).toBe(THEMES.LIGHT);
    expect(document.documentElement.getAttribute("data-theme")).toBe(THEMES.LIGHT);

    expect(setTheme("otro")).toBe(THEMES.DARK);
    expect(getTheme()).toBe(THEMES.DARK);
  });

  test("toggleTheme alterna y applyTheme/initTheme actualizan el documento", () => {
    applyTheme(THEMES.LIGHT);
    expect(document.documentElement.getAttribute("data-theme")).toBe(THEMES.LIGHT);

    localStorage.setItem("metafit_theme", THEMES.DARK);
    expect(toggleTheme()).toBe(THEMES.LIGHT);
    expect(toggleTheme()).toBe(THEMES.DARK);

    localStorage.setItem("metafit_theme", THEMES.LIGHT);
    initTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe(THEMES.LIGHT);
  });

  test("tolera localStorage no disponible", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage");
    });
    expect(getTheme()).toBe(THEMES.DARK);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage");
    });
    expect(setTheme(THEMES.LIGHT)).toBe(THEMES.LIGHT);
    expect(document.documentElement.getAttribute("data-theme")).toBe(THEMES.LIGHT);
  });
});
