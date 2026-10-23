// movil/src/screens/__tests__/MiDietaScreen.test.js
// Cubre carga inicial, refresh manual, botón actualizar y cambio de ciclo.
import React from 'react';
import { Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import MiDietaScreen from '../MiDietaScreen';
import {
  getMisCiclos,
  getPlanNutricional,
  getAguaHoy,
  guardarAgua,
  guardarConsumoAlimento,
} from '../../services/api';

const mockParentNavigate = jest.fn();

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
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    getParent: () => ({ navigate: mockParentNavigate }),
  }),
}));

jest.setTimeout(30000);

describe('<MiDietaScreen />', () => {
  beforeEach(() => jest.clearAllMocks());
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

  test('interactúa con agua, alimentos, registro y guardado', async () => {
    getMisCiclos.mockResolvedValue({
      data: [{ id_ciclo: 1, nombre_ciclo: 'Ciclo 1', activo: 1 }],
    });
    getPlanNutricional.mockResolvedValue({
      data: {
        recomendacion_agua_vasos: 8,
        detalle: [
          {
            id_alimento: 1,
            nombre_alimento: 'Pollo',
            num_comida: 1,
            cantidad_g: 150,
            calorias_por_100g: 165,
            proteinas: 31,
            carbohidratos: 0,
            grasas: 3.6,
          },
          { id_alimento: 2, nombre_alimento: 'Arroz', num_comida: 3 },
          { id_alimento: 3, nombre_alimento: 'Sin grupo' },
        ],
      },
    });
    getAguaHoy.mockResolvedValue({ data: { vasos: 2 } });
    guardarAgua.mockResolvedValue({});
    guardarConsumoAlimento.mockResolvedValue({});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = render(<MiDietaScreen />);

    await waitFor(() => expect(getByText('Pollo')).toBeTruthy());
    expect(getByText('Sin grupo')).toBeTruthy();

    fireEvent.press(getByTestId('toggle-alimento-1'));
    fireEvent.press(getByTestId('registrar-alimento-1'));
    expect(mockParentNavigate).toHaveBeenCalledWith(
      'RegistroConsumo',
      expect.objectContaining({
        id_ciclo: 1,
        num_comida: 1,
        id_alimento: 1,
        nombre: 'Pollo',
        macrosPor100g: expect.objectContaining({ calorias: 165, proteinas: 31 }),
      })
    );

    fireEvent.press(getByTestId('vaso-agua-2'));
    await waitFor(() => expect(guardarAgua).toHaveBeenLastCalledWith(expect.any(String), 3));

    fireEvent.press(getByTestId('vaso-agua-2'));
    await waitFor(() => expect(guardarAgua).toHaveBeenLastCalledWith(expect.any(String), 2));

    guardarAgua.mockRejectedValueOnce(new Error('agua boom'));
    fireEvent.press(getByTestId('vaso-agua-2'));
    await waitFor(() => expect(guardarAgua).toHaveBeenCalledTimes(3));

    fireEvent.press(getByText('Guardar Progreso'));
    await waitFor(() => expect(guardarConsumoAlimento).toHaveBeenCalledTimes(1));
    expect(alertSpy).toHaveBeenCalledWith(
      '✅ Progreso guardado',
      'Tu consumo de alimentos fue guardado.'
    );

    guardarConsumoAlimento.mockRejectedValueOnce(new Error('save boom'));
    fireEvent.press(getByText('Guardar Progreso'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        '❌ No se pudo guardar',
        'Verificá tu conexión e intentá de nuevo.'
      )
    );
    alertSpy.mockRestore();
  });

  test('sin ciclo mantiene la pantalla y no guarda progreso', async () => {
    getMisCiclos.mockResolvedValue({ data: [] });
    getAguaHoy.mockResolvedValue({ data: { vasos: 0 } });

    const { getByText } = render(<MiDietaScreen />);

    await waitFor(() =>
      expect(getByText('Para registrar agua necesitás un ciclo activo.')).toBeTruthy()
    );
    expect(getByText('No hay alimentos en tu plan actual.')).toBeTruthy();

    fireEvent.press(getByText('Guardar Progreso'));
    expect(guardarConsumoAlimento).not.toHaveBeenCalled();
  });

  test('muestra el error de carga del servidor', async () => {
    getMisCiclos.mockRejectedValueOnce({ response: { status: 500 } });

    const { getByText } = render(<MiDietaScreen />);

    await waitFor(() =>
      expect(getByText('Error al cargar los datos. Intentá más tarde.')).toBeTruthy()
    );
  });
});
