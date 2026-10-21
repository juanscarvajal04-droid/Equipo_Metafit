// movil/src/screens/__tests__/RegistroEjercicioScreen.test.jsx
// Cubre el envío del formulario de ejercicio (fire-and-forget con void).
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegistroEjercicioScreen from '../RegistroEjercicioScreen';
import useMutation from '../../hooks/useMutation';

jest.mock('../../hooks/useMutation', () => ({ __esModule: true, default: jest.fn() }));

jest.setTimeout(30000);

describe('<RegistroEjercicioScreen />', () => {
  const execute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useMutation.mockReturnValue({ execute, loading: false });
  });

  test('envía series y repeticiones al registrar el ejercicio', () => {
    const navigation = { goBack: jest.fn() };
    const route = {
      params: {
        id_ciclo: 1,
        id_rutina: 4,
        orden: 2,
        nombre: 'Sentadilla',
        nombre_rutina: 'Piernas',
      },
    };

    const { getByPlaceholderText, getByText } = render(
      <RegistroEjercicioScreen navigation={navigation} route={route} />
    );

    fireEvent.changeText(getByPlaceholderText(/series realizadas/i), '3');
    fireEvent.changeText(getByPlaceholderText(/Repeticiones por serie/i), '12');
    fireEvent.changeText(getByPlaceholderText('Ej: 40.5'), '25');
    fireEvent.press(getByText('Guardar ejercicio'));

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id_ciclo: 1,
        id_rutina: 4,
        orden: 2,
        series: 3,
        repeticiones: 12,
        peso_utilizado_kg: 25,
      })
    );
  });
});
