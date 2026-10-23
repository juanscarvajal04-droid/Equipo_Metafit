// movil/src/screens/__tests__/MiProgresoScreen.test.js
// Cubre carga inicial y pull-to-refresh del progreso.
import React from 'react';
import { RefreshControl } from 'react-native';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
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

  test('muestra historiales completos, agua, ejercicios y consumos', async () => {
    getMiProgreso.mockResolvedValue({
      data: {
        progreso: Array.from({ length: 6 }, (_, i) => ({
          id_progreso: i + 1,
          fecha: `2026-10-0${i + 1}`,
          peso: 70 - i,
          imc: 23 - i * 0.1,
          musculo: 30,
          cintura: 80,
        })),
      },
    });
    getAguaHistorial.mockResolvedValue({
      data: [{ fecha: '2026-10-01', vasos: 6 }],
    });
    getConsumoHistorial.mockResolvedValue({
      data: [
        { fecha: '2026-10-01', nombre_alimento: 'Pollo', consumado: true },
        { fecha: '2026-10-01', nombre_alimento: 'Arroz', consumado: false },
      ],
    });
    getProgresoEjercicioHistorial.mockResolvedValue({
      data: [
        { fecha: '2026-10-01', completado: true },
        { fecha: '2026-10-01', completado: false },
        { fecha: '2026-10-02', completado: true },
      ],
    });
    getHistorialEjerciciosReales.mockResolvedValue({
      data: [
        {
          id_registro: 1,
          nombre_ejercicio: 'Sentadilla',
          fecha: '2026-10-01',
          series: 3,
          repeticiones: 12,
          peso_utilizado_kg: 20,
          notas: 'buena forma',
          volumen: 720,
        },
      ],
    });
    getHistorialConsumosReales.mockResolvedValue({
      data: [
        {
          id_consumo: 1,
          nombre_alimento: 'Pollo',
          fecha: '2026-10-01',
          num_comida: 2,
          calorias_consumidas: 250,
        },
      ],
    });

    const { getByText } = render(<MiProgresoScreen />);

    await waitFor(() => expect(getByText('Ejercicios Completados')).toBeTruthy());
    expect(getByText('Consumo de Agua')).toBeTruthy();
    expect(getByText('Consumo de Alimentos')).toBeTruthy();
    expect(getByText('Ejercicios Registrados')).toBeTruthy();
    expect(getByText('Consumos Registrados')).toBeTruthy();
    expect(getByText('1/2')).toBeTruthy();

    fireEvent.press(getByText('Ver historial completo'));
    expect(getByText('Mostrar menos')).toBeTruthy();
    fireEvent.press(getByText('Mostrar menos'));
    expect(getByText('Ver historial completo')).toBeTruthy();
  });
});
