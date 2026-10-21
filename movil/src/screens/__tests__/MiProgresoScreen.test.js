// movil/src/screens/__tests__/MiProgresoScreen.test.js
// Cubre carga inicial y pull-to-refresh del progreso.
import React from 'react';
import { RefreshControl } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import MiProgresoScreen from '../MiProgresoScreen';
import {
  getMiProgreso,
  getAguaHistorial,
  getConsumoHistorial,
  getProgresoEjercicioHistorial,
} from '../../services/api';
import {
  getHistorialEjerciciosReales,
  getHistorialConsumosReales,
} from '../../services/registroService';

jest.mock('../../services/api', () => ({
  getMiProgreso: jest.fn(),
  getAguaHistorial: jest.fn(),
  getConsumoHistorial: jest.fn(),
  getProgresoEjercicioHistorial: jest.fn(),
}));

jest.mock('../../services/registroService', () => ({
  getHistorialEjerciciosReales: jest.fn(),
  getHistorialConsumosReales: jest.fn(),
}));

jest.mock('../../hooks/useAutoRefresh', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../components/common/StatsCard', () => 'StatsCard');
jest.mock('../../components/graficos/GraficoPeso', () => 'GraficoPeso');
jest.mock('../../components/graficos/GraficoVolumen', () => 'GraficoVolumen');
jest.mock('../../components/graficos/GraficoCumplimiento', () => 'GraficoCumplimiento');

jest.setTimeout(30000);

describe('<MiProgresoScreen />', () => {
  test('carga el progreso y refresca con pull-to-refresh', async () => {
    getMiProgreso.mockResolvedValue({
      data: {
        progreso: [
          { fecha: '2026-10-10', peso: 70, imc: 22.5 },
          { fecha: '2026-10-01', peso: 72, imc: 23.1 },
        ],
      },
    });
    getAguaHistorial.mockResolvedValue({ data: [] });
    getConsumoHistorial.mockResolvedValue({ data: [] });
    getProgresoEjercicioHistorial.mockResolvedValue({ data: [] });
    getHistorialEjerciciosReales.mockResolvedValue({ data: [] });
    getHistorialConsumosReales.mockResolvedValue({ data: [] });

    const { getByText, UNSAFE_getByType } = render(<MiProgresoScreen />);

    await waitFor(() => expect(getByText('Peso Actual')).toBeTruthy());
    expect(getMiProgreso).toHaveBeenCalledTimes(1);

    await act(async () => {
      UNSAFE_getByType(RefreshControl).props.onRefresh();
      await Promise.resolve();
    });
    await waitFor(() => expect(getMiProgreso).toHaveBeenCalledTimes(2));
  });
});
