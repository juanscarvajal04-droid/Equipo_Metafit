// movil/src/screens/__tests__/MiRutinaScreen.test.js
// Cubre carga inicial, pull-to-refresh y cambio de ciclo.
import React from 'react';
import { RefreshControl } from 'react-native';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import MiRutinaScreen from '../MiRutinaScreen';
import {
  getMisCiclos,
  getPlanEntrenamiento,
  getPlanRutinaDia,
  getMisNotasEjercicio,
} from '../../services/api';

jest.mock('../../services/api', () => ({
  getMisCiclos: jest.fn(),
  getPlanEntrenamiento: jest.fn(),
  getPlanRutinaDia: jest.fn(),
  guardarProgresoEjercicio: jest.fn(),
  getProgresoEjercicioHoy: jest.fn(),
  guardarNotaEjercicio: jest.fn(),
  getMisNotasEjercicio: jest.fn(),
}));

jest.mock('../../hooks/useAutoRefresh', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.setTimeout(30000);

describe('<MiRutinaScreen />', () => {
  test('carga la rutina, refresca y cambia de ciclo', async () => {
    getMisCiclos.mockResolvedValue({
      data: [
        { id_ciclo: 1, nombre_ciclo: 'Ciclo 1', activo: 1 },
        { id_ciclo: 2, nombre_ciclo: 'Ciclo 2', activo: 0 },
      ],
    });
    getPlanEntrenamiento.mockResolvedValue({ data: { rutinas: [] } });
    getPlanRutinaDia.mockResolvedValue({ data: null });
    getMisNotasEjercicio.mockResolvedValue({ data: [] });

    const { getByText, UNSAFE_getByType } = render(<MiRutinaScreen />);

    await waitFor(() => expect(getByText('Mi Rutina')).toBeTruthy());
    expect(getMisCiclos).toHaveBeenCalledTimes(1);

    await act(async () => {
      UNSAFE_getByType(RefreshControl).props.onRefresh();
      await Promise.resolve();
    });
    await waitFor(() => expect(getMisCiclos).toHaveBeenCalledTimes(2));

    fireEvent.press(getByText('Ciclo: Ciclo 1'));
    fireEvent.press(getByText('Ciclo 2'));

    await waitFor(() => expect(getPlanEntrenamiento).toHaveBeenCalledWith(2));
  });
});
