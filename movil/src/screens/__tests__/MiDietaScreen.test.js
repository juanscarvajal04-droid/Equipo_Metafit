// movil/src/screens/__tests__/MiDietaScreen.test.js
// Cubre carga inicial, refresh manual, botón actualizar y cambio de ciclo.
import React from 'react';
import { RefreshControl, TouchableOpacity } from 'react-native';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import MiDietaScreen from '../MiDietaScreen';
import {
  getMisCiclos,
  getPlanNutricional,
  getAguaHoy,
} from '../../services/api';

jest.mock('../../services/api', () => ({
  getMisCiclos: jest.fn(),
  getPlanNutricional: jest.fn(),
  guardarAgua: jest.fn(),
  getAguaHoy: jest.fn(),
  guardarConsumoAlimento: jest.fn(),
}));

jest.mock('../../hooks/useAutoRefresh', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../components/common/BarraAgua', () => 'BarraAgua');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.setTimeout(30000);

describe('<MiDietaScreen />', () => {
  test('carga la dieta, refresca y cambia de ciclo', async () => {
    getMisCiclos.mockResolvedValue({
      data: [
        { id_ciclo: 1, nombre_ciclo: 'Ciclo 1', activo: 1 },
        { id_ciclo: 2, nombre_ciclo: 'Ciclo 2', activo: 0 },
      ],
    });
    getPlanNutricional.mockResolvedValue({
      data: { detalle: [], recomendacion_agua_vasos: 8 },
    });
    getAguaHoy.mockResolvedValue({ data: { vasos: 0 } });

    const { getByText, UNSAFE_getByType, UNSAFE_getAllByType } = render(<MiDietaScreen />);

    await waitFor(() => expect(getByText('Mi Dieta')).toBeTruthy());
    expect(getByText(/Recomendado: 8 vasos \/ 2 L al día/)).toBeTruthy();
    expect(getMisCiclos).toHaveBeenCalledTimes(1);

    await act(async () => {
      UNSAFE_getByType(RefreshControl).props.onRefresh();
      await Promise.resolve();
    });
    await waitFor(() => expect(getMisCiclos).toHaveBeenCalledTimes(2));

    const refreshButton = UNSAFE_getAllByType(TouchableOpacity).find((n) => n.props.hitSlop);
    await act(async () => {
      refreshButton.props.onPress();
      await Promise.resolve();
    });
    await waitFor(() => expect(getMisCiclos).toHaveBeenCalledTimes(3));

    fireEvent.press(getByText('Ciclo: Ciclo 1'));
    fireEvent.press(getByText('Ciclo 2'));

    await waitFor(() => expect(getPlanNutricional).toHaveBeenCalledWith(2));
  });
});
