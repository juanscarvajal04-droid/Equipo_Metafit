// movil/src/screens/__tests__/RegistroConsumoScreen.test.jsx
// Cubre el envío del formulario de consumo (fire-and-forget con void).
import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
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

  test('valida la cantidad y ejecuta los callbacks de éxito/error', () => {
    let options;
    useMutation.mockImplementation((_fn, opts) => {
      options = opts;
      return { execute, loading: false };
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { goBack: jest.fn() };
    const route = { params: { id_ciclo: 1, nombre: 'Pollo' } };
    const { getByPlaceholderText, getByText, UNSAFE_getAllByType } = render(
      <RegistroConsumoScreen navigation={navigation} route={route} />
    );

    fireEvent.press(getByText('Guardar consumo'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Dato inválido',
      'Ingresá la cantidad consumida en gramos (mayor a 0).'
    );

    fireEvent.changeText(getByPlaceholderText('Ej: 180'), '150');
    options.onSuccess({ data: { calorias_consumidas: 247.5 } });
    expect(alertSpy).toHaveBeenCalledWith(
      'Registrado',
      'Consumo guardado (247.5 kcal).',
      expect.any(Array)
    );
    alertSpy.mock.calls.at(-1)[2][0].onPress();
    expect(navigation.goBack).toHaveBeenCalled();

    options.onError(new Error('boom'), 'No se pudo guardar');
    expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo guardar');

    alertSpy.mockRestore();
  });

  test('vuelve atrás desde el encabezado y usa el nombre por defecto', () => {
    const navigation = { goBack: jest.fn() };
    const { getAllByText, UNSAFE_getAllByType } = render(
      <RegistroConsumoScreen navigation={navigation} route={{ params: {} }} />
    );

    expect(getAllByText('Alimento').length).toBeGreaterThan(0);
    const back = UNSAFE_getAllByType(TouchableOpacity).find(
      (n) => n.props.activeOpacity === 0.7
    );
    fireEvent.press(back);
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
