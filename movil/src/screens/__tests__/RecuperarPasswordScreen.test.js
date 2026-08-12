// movil/src/screens/__tests__/RecuperarPasswordScreen.test.js
// ISO 25010 · Usabilidad: el flujo de recuperación arranca desde el login
// y la pantalla envía el correo, mostrando éxito/error y token de modo prueba.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecuperarPasswordScreen from '../RecuperarPasswordScreen';
import LoginScreen from '../LoginScreen';

const mockSolicitar = jest.fn();
const mockReset = jest.fn();

jest.mock('../../services/api', () => ({
  solicitarRecuperacion: (...args) => mockSolicitar(...args),
  resetPasswordRequest: (...args) => mockReset(...args),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ token: null, loading: false }),
}));

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('<RecuperarPasswordScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el formulario: título, campo de correo y botón', () => {
    const { getByText, getByPlaceholderText } = render(
      <RecuperarPasswordScreen navigation={navigation} />
    );

    expect(getByText('Recuperar Contraseña')).toBeTruthy();
    expect(getByPlaceholderText('Correo electrónico')).toBeTruthy();
    expect(getByText('Enviar solicitud')).toBeTruthy();
    expect(getByText('Volver al login')).toBeTruthy();
  });

  test('envía el correo y muestra el mensaje de éxito cuando el envío es real', async () => {
    mockSolicitar.mockResolvedValueOnce({ mensaje: 'ok' });

    const { getByPlaceholderText, getByText } = render(
      <RecuperarPasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'carlos@metafit.com');
    fireEvent.press(getByText('Enviar solicitud'));

    await waitFor(() =>
      expect(mockSolicitar).toHaveBeenCalledWith('carlos@metafit.com')
    );
    expect(
      getByText('Si el correo existe, recibirás un enlace para restablecer tu contraseña.')
    ).toBeTruthy();
  });

  test('muestra el token en modo prueba si el backend lo devuelve', async () => {
    mockSolicitar.mockResolvedValueOnce({ modoPrueba: true, token: 'jwt-modo-prueba' });

    const { getByPlaceholderText, getByText } = render(
      <RecuperarPasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'carlos@metafit.com');
    fireEvent.press(getByText('Enviar solicitud'));

    await waitFor(() => expect(getByText(/jwt-modo-prueba/)).toBeTruthy());
    expect(getByText(/Modo prueba/)).toBeTruthy();
  });

  test('muestra el error del backend si la solicitud falla', async () => {
    mockSolicitar.mockRejectedValueOnce({
      response: { data: { error: 'Demasiados intentos' } },
    });

    const { getByPlaceholderText, getByText } = render(
      <RecuperarPasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'carlos@metafit.com');
    fireEvent.press(getByText('Enviar solicitud'));

    await waitFor(() => expect(getByText('⚠️ Demasiados intentos')).toBeTruthy());
  });

  test('navega desde LoginScreen al presionar "¿Olvidaste tu contraseña?"', () => {
    const loginNav = { navigate: jest.fn(), replace: jest.fn() };
    const { getByText } = render(<LoginScreen navigation={loginNav} />);

    fireEvent.press(getByText('¿Olvidaste tu contraseña?'));

    expect(loginNav.navigate).toHaveBeenCalledWith('RecuperarPassword');
  });
});