// src/utils/theme.js
// Modo claro/oscuro — persistencia en localStorage, tema por defecto: OSCURO
'use strict';

const STORAGE_KEY = 'metafit_theme';

export const THEMES = { DARK: 'dark', LIGHT: 'light' };

/** Tema persistido (default: dark). */
export const getTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || THEMES.DARK;
  } catch {
    return THEMES.DARK;
  }
};

/** Aplica el tema al <html data-theme="..."> y lo persiste. */
export const setTheme = (theme) => {
  const t = theme === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch { /* almacenamiento no disponible */ }
  applyTheme(t);
  return t;
};

export const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

/** Toggle dark ↔ light (devuelve el nuevo tema). */
export const toggleTheme = () =>
  setTheme(getTheme() === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);

/** Inicializa el tema antes del primer render. */
export const initTheme = () => applyTheme(getTheme());