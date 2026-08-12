import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme';

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

/** Aplica la paleta (muta COLORS en el lugar: todos los consumidores
    comparten la misma referencia y la leen en cada render). */
export function swapPalette(isDark) {
  Object.assign(COLORS, isDark ? {} : LIGHT_PALETTE);
}

const ThemeContext = createContext({
  isDark: true,
  mode: 'dark',
  toggle: () => {},
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

  return (
    <ThemeContext.Provider value={{ isDark, mode, toggle, setMode: setModeSafe }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);