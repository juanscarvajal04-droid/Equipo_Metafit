// movil/src/screens/__tests__/RegistroConsumoScreen.test.jsx
// Cubre el envío del formulario de consumo (fire-and-forget con void).
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegistroConsumoScreen from '../RegistroConsumoScreen';
import useMutation from '../../hooks/useMutation';

jest.mock('../../hooks/useMutation', () => ({ __esModule: true, default: jest.fn() }));

jest.setTimeout(30000);

describe('<RegistroConsumoScreen />', () => {
  const execute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useMutation.mockReturnValue({ execute, loading: false });
  });

  test('envía la cantidad consumida al registrar el consumo', () => {
    const navigation = { goBack: jest.fn() };
    const route = {
      params: {
        id_ciclo: 1,
        num_comida: 2,
        id_alimento: 3,
        nombre: 'Pollo',
        macrosPor100g: { calorias: 165, proteinas: 31, carbohidratos: 0, grasas: 3.6 },
      },
    };

    const { getByPlaceholderText, getByText } = render(
      <RegistroConsumoScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText('Ej: 180'), '150');
    fireEvent.press(getByText('Guardar consumo'));

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id_ciclo: 1,
        num_comida: 2,
        id_alimento: 3,
        cantidad_g_consumida: 150,
      })
    );
  });
});
