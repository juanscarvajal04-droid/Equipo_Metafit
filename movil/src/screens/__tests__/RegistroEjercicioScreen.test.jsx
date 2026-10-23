// movil/src/screens/__tests__/RegistroEjercicioScreen.test.jsx
// Cubre el envío del formulario de ejercicio (fire-and-forget con void).
import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
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

  test('valida series/repeticiones y ejecuta callbacks y navegación', () => {
    let options;
    useMutation.mockImplementation((_fn, opts) => {
      options = opts;
      return { execute, loading: false };
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { goBack: jest.fn() };
    const route = { params: { id_ciclo: 1, id_rutina: 4, orden: 2 } };
    const { getByPlaceholderText, getByText, UNSAFE_getAllByType } = render(
      <RegistroEjercicioScreen navigation={navigation} route={route} />
    );

    fireEvent.press(getByText('Guardar ejercicio'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Datos incompletos',
      'Ingresá series y repeticiones (mínimo 1).'
    );

    fireEvent.changeText(getByPlaceholderText(/series realizadas/i), '3');
    fireEvent.changeText(getByPlaceholderText(/Repeticiones por serie/i), '10');
    fireEvent.changeText(getByPlaceholderText(/Cómo te sentiste/i), '  fuerte  ');
    fireEvent.press(getByText('Guardar ejercicio'));
    expect(execute).toHaveBeenLastCalledWith(
      expect.objectContaining({
        peso_utilizado_kg: null,
        notas: 'fuerte',
      })
    );

    options.onSuccess();
    expect(alertSpy).toHaveBeenCalledWith(
      '✅ Ejercicio registrado',
      'Ejercicio guardado correctamente.',
      expect.any(Array)
    );
    alertSpy.mock.calls.at(-1)[2][0].onPress();
    expect(navigation.goBack).toHaveBeenCalled();

    options.onError({ response: { status: 409 } }, 'otro');
    expect(alertSpy).toHaveBeenCalledWith(
      'Error',
      'Ya registraste este ejercicio hoy. Volvé mañana.'
    );

    const back = UNSAFE_getAllByType(TouchableOpacity).find(
      (n) => n.props.activeOpacity === 0.7
    );
    fireEvent.press(back);
    alertSpy.mockRestore();
  });
});
