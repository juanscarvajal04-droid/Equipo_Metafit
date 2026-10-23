// movil/src/screens/__tests__/EditarPerfilScreen.test.jsx
// Cubre prefill del perfil, validaciones, envío exitoso y error.
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EditarPerfilScreen from '../EditarPerfilScreen';
import { getPerfil, actualizarPerfil } from '../../services/perfilService';

jest.mock('../../services/perfilService', () => ({
  getPerfil: jest.fn(),
  actualizarPerfil: jest.fn(),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true }),
}));

describe('<EditarPerfilScreen />', () => {
  let alertSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => alertSpy.mockRestore());

  test('prefila los datos del perfil y muestra el IMC', async () => {
    getPerfil.mockResolvedValue({
      data: {
        estatura_cm: 170,
        telefono: '3001234567',
        direccion: 'Calle 1',
        ciclo_activo: { progreso_fisico: [{ peso_kg: 82 }] },
      },
    });

    const { getByText, getByDisplayValue } = render(
      <EditarPerfilScreen navigation={{ goBack: jest.fn() }} />
    );

    await waitFor(() => expect(getByDisplayValue('82')).toBeTruthy());
    expect(getByDisplayValue('170')).toBeTruthy();
    expect(getByDisplayValue('3001234567')).toBeTruthy();
    expect(getByDisplayValue('Calle 1')).toBeTruthy();
    expect(getByText(/IMC:/)).toBeTruthy();
    expect(getByText(/Último peso registrado/)).toBeTruthy();
  });

  test('valida peso y altura antes de enviar', async () => {
    getPerfil.mockResolvedValue({ data: {} });
    const { getByText, getByPlaceholderText } = render(
      <EditarPerfilScreen navigation={{ goBack: jest.fn() }} />
    );
    await waitFor(() => expect(getByText('Guardar cambios')).toBeTruthy());

    fireEvent.press(getByText('Guardar cambios'));
    expect(alertSpy).toHaveBeenCalledWith('Peso inválido', expect.any(String));

    fireEvent.changeText(getByPlaceholderText('Ej: 82'), '400');
    fireEvent.press(getByText('Guardar cambios'));
    expect(alertSpy).toHaveBeenCalledWith('Peso inválido', expect.any(String));

    fireEvent.changeText(getByPlaceholderText('Ej: 82'), '82');
    fireEvent.press(getByText('Guardar cambios'));
    expect(alertSpy).toHaveBeenCalledWith('Altura inválida', expect.any(String));
    expect(actualizarPerfil).not.toHaveBeenCalled();
  });

  test('envía el formulario y en éxito navega atrás', async () => {
    getPerfil.mockResolvedValue({ data: {} });
    actualizarPerfil.mockResolvedValue({ data: { imc: 27.68 } });
    const navigation = { goBack: jest.fn() };

    const { getByText, getByPlaceholderText } = render(
      <EditarPerfilScreen navigation={navigation} />
    );
    await waitFor(() => expect(getByText('Guardar cambios')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Ej: 82'), '80');
    fireEvent.changeText(getByPlaceholderText('Ej: 175'), '170');
    fireEvent.changeText(getByPlaceholderText('Ej: +57 300 123 4567'), '3009998877');
    fireEvent.changeText(getByPlaceholderText('Ej: Calle 80 # 11-22'), 'Cra 10');
    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() =>
      expect(actualizarPerfil).toHaveBeenCalledWith({
        telefono: '3009998877',
        direccion: 'Cra 10',
        peso_kg: 80,
        estatura_cm: 170,
      })
    );

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Perfil actualizado',
        expect.stringContaining('IMC'),
        expect.any(Array)
      )
    );

    const botones = alertSpy.mock.calls.find(([titulo]) => titulo === 'Perfil actualizado')[2];
    act(() => botones[0].onPress());
    expect(navigation.goBack).toHaveBeenCalled();
  });

  test('éxito sin IMC usa el mensaje simple', async () => {
    getPerfil.mockResolvedValue({ data: {} });
    actualizarPerfil.mockResolvedValue({ data: {} });

    const { getByText, getByPlaceholderText } = render(
      <EditarPerfilScreen navigation={{ goBack: jest.fn() }} />
    );
    await waitFor(() => expect(getByText('Guardar cambios')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Ej: 82'), '75');
    fireEvent.changeText(getByPlaceholderText('Ej: 175'), '175');
    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Perfil actualizado', 'Guardado correctamente.', expect.any(Array))
    );
  });

  test('error del backend muestra alerta de error', async () => {
    getPerfil.mockResolvedValue({ data: {} });
    actualizarPerfil.mockRejectedValue({ response: { data: { error: 'Servidor caído' } } });

    const { getByText, getByPlaceholderText } = render(
      <EditarPerfilScreen navigation={{ goBack: jest.fn() }} />
    );
    await waitFor(() => expect(getByText('Guardar cambios')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Ej: 82'), '75');
    fireEvent.changeText(getByPlaceholderText('Ej: 175'), '175');
    fireEvent.press(getByText('Guardar cambios'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Error', 'Servidor caído'));
  });
});
