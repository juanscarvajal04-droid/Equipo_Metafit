import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme';

/* Paleta oscura: restaura los valores por defecto de COLORS en las mismas
   claves que la paleta clara sobrescribe (superficies, textos y bordes). */
const DARK_PALETTE = {
  bg: '#0a0a0f',
  bgSecondary: '#12121e',
  bgCard: '#1a1a2e',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.1)',
  borderActive: 'rgba(255,255,255,0.2)',
  inputBg: '#1a1a2e',
  checkBg: 'rgba(16,185,129,0.15)',
  waterLight: 'rgba(59,130,246,0.2)',
};

/* Paleta clara: conserva los colores de marca (rojo, púrpura, semáforos)
   y solo cambia superficies, textos y bordes. */
const LIGHT_PALETTE = {
  bg: '#f2f4f9',
  bgSecondary: '#e9ecf4',
  bgCard: '#ffffff',
  text: '#0f172a',
  textSecondary: 'rgba(15,23,42,0.6)',
  textMuted: 'rgba(15,23,42,0.4)',
  border: 'rgba(15,23,42,0.1)',
  borderActive: 'rgba(15,23,42,0.2)',
  inputBg: '#ffffff',
  checkBg: 'rgba(16,185,129,0.18)',
  waterLight: 'rgba(59,130,246,0.15)',
};

const STORAGE_KEY = 'metafit_theme_movil';

/** Aplica una paleta u otra mutando COLORS en el lugar: todos los consumidores
    comparten la misma referencia y la leen en cada render. Es clave aplicar la
    paleta completa en AMBAS direcciones para que al volver a oscuro se
    restauren los valores claros que quedaron pegados. */
export function swapPalette(isDark) {
  Object.assign(COLORS, isDark ? DARK_PALETTE : LIGHT_PALETTE);
}

const ThemeContext = createContext({
  isDark: true,
  theme: 'dark',
  mode: 'dark',
  toggle: () => {},
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => { if (saved) setMode(saved); })
      .catch(() => {});
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme !== 'light');
  swapPalette(isDark);

  const toggle = () => setMode((prev) => {
    const curDark = prev === 'dark' || (prev === 'system' && systemScheme !== 'light');
    const next = curDark ? 'light' : 'dark';
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    return next;
  });

  const setModeSafe = (m) => {
    setMode(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const value = {
    isDark,
    theme: isDark ? 'dark' : 'light',
    mode,
    toggle,
    toggleTheme: toggle,
    setMode: setModeSafe,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);