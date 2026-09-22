// movil/src/context/__tests__/ThemeContext.test.jsx
// Regresión: el toggle debe aplicar la paleta en AMBAS direcciones y persistir
// la elección en AsyncStorage (bug: al volver a oscuro los colores quedaban claros).
import React from 'react';
import { render, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { COLORS } from '../../theme';
import { swapPalette, ThemeProvider, useTheme } from '../ThemeContext';

const LIGHT = { bg: '#f2f4f9', text: '#0f172a', bgCard: '#ffffff' };
const DARK = { bg: '#0a0a0f', text: '#ffffff', bgCard: '#1a1a2e' };

describe('swapPalette (regresión del bug)', () => {
  test('aplica la paleta clara al pasar de oscuro a claro', () => {
    swapPalette(true); // arranca en oscuro
    expect(COLORS.bg).toBe(DARK.bg);

    swapPalette(false); // va a claro
    expect(COLORS.bg).toBe(LIGHT.bg);
    expect(COLORS.text).toBe(LIGHT.text);
    expect(COLORS.bgCard).toBe(LIGHT.bgCard);
  });

  test('restaura la paleta oscura al volver desde claro (el bug reportado)', () => {
    swapPalette(false); // dejar la paleta clara pegada en COLORS
    expect(COLORS.bg).toBe(LIGHT.bg);

    swapPalette(true); // volver a oscuro DEBE restaurar los valores
    expect(COLORS.bg).toBe(DARK.bg);
    expect(COLORS.text).toBe(DARK.text);
    expect(COLORS.bgCard).toBe(DARK.bgCard);
    expect(COLORS.bgSecondary).toBe('#12121e');
    expect(COLORS.inputBg).toBe('#1a1a2e');
  });
});

describe('<ThemeProvider />', () => {
  let ctx;

  function Probe() {
    ctx = useTheme();
    return null;
  }

  const renderWithTheme = () => render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );

  beforeEach(async () => {
    ctx = null;
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('expone theme/toggleTheme y persiste el cambio de modo en AsyncStorage', async () => {
    renderWithTheme();
    await act(async () => {});

    expect(ctx.theme).toBe('dark');
    expect(ctx.isDark).toBe(true);
    expect(typeof ctx.toggleTheme).toBe('function');

    // Oscuro → Claro
    await act(async () => { ctx.toggleTheme(); });
    expect(ctx.theme).toBe('light');
    expect(ctx.isDark).toBe(false);
    expect(COLORS.bg).toBe(LIGHT.bg);
    expect(await AsyncStorage.getItem('metafit_theme_movil')).toBe('light');

    // Claro → Oscuro (el caso que fallaba)
    await act(async () => { ctx.toggleTheme(); });
    expect(ctx.theme).toBe('dark');
    expect(ctx.isDark).toBe(true);
    expect(COLORS.bg).toBe(DARK.bg);
    expect(COLORS.text).toBe(DARK.text);
    expect(await AsyncStorage.getItem('metafit_theme_movil')).toBe('dark');
  });

  test('restaura el tema guardado desde AsyncStorage al montar', async () => {
    await AsyncStorage.setItem('metafit_theme_movil', 'light');

    renderWithTheme();
    await act(async () => {});

    expect(ctx.theme).toBe('light');
    expect(ctx.isDark).toBe(false);
    expect(COLORS.bg).toBe(LIGHT.bg);
  });
});