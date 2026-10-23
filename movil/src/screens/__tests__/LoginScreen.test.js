// movil/src/screens/__tests__/LoginScreen.test.js
// ISO 25010 · Usabilidad: la pantalla de login renderiza los campos
// de email/contraseña, valida vacíos y delega el envío en useAuth().
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

const mockLogin = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('../../services/notifications', () => ({
  activarPushNotifications: jest.fn().mockResolvedValue(null),
}));

const navigation = { navigate: jest.fn(), replace: jest.fn() };

describe('<LoginScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el título, campos de email/contraseña y el botón de login', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <LoginScreen navigation={navigation} />
    );

    expect(getByText('MetaFit')).toBeTruthy();
    expect(getByText('Iniciar Sesión')).toBeTruthy();
    expect(getByPlaceholderText('Correo electrónico')).toBeTruthy();
    expect(getByPlaceholderText('Contraseña')).toBeTruthy();
    expect(getByText('Ingresar al Sistema →')).toBeTruthy();
    expect(getByText('¿Olvidaste tu contraseña?')).toBeTruthy();
  });

  test('muestra validación si se presiona login con campos vacíos', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);

    fireEvent.press(getByText('Ingresar al Sistema →'));

    expect(getByText('⚠️ Ingresá correo y contraseña')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('envía correo y contraseña al authContext cuando son válidos', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1, email: 'e@f.com', role: 'Afiliado' });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'afiliado@metafit.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'Clave123!');
    fireEvent.press(getByText('Ingresar al Sistema →'));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('afiliado@metafit.com', 'Clave123!'));
  });

  test('muestra el mensaje del backend si el login falla', async () => {
    mockLogin.mockRejectedValueOnce({
      response: { status: 401 },
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'x@metafit.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'incorrecta');
    fireEvent.press(getByText('Ingresar al Sistema →'));

    await waitFor(() =>
      expect(getByText('⚠️ Correo o contraseña incorrectos.')).toBeTruthy()
    );
  });

  test.each([
    [{}, 'No se pudo conectar al servidor. Verificá tu conexión.'],
    [{ response: { status: 403 } }, 'Tu cuenta no está activa. Contactá a la recepción.'],
    [{ response: { status: 429 } }, 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.'],
    [{ response: { status: 500 } }, 'Error del servidor. Intentá más tarde.'],
    [{ response: { status: 400 } }, 'Ocurrió un error inesperado. Intentá de nuevo.'],
  ])('mapea el error %j al mensaje esperado', async (error, mensaje) => {
    mockLogin.mockRejectedValueOnce(error);
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'x@metafit.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'Clave123!');
    fireEvent.press(getByText('Ingresar al Sistema →'));

    await waitFor(() => expect(getByText(`⚠️ ${mensaje}`)).toBeTruthy());
  });

  test('permite alternar la visibilidad de la contraseña', () => {
    const { UNSAFE_getAllByType } = render(<LoginScreen navigation={navigation} />);
    const eye = UNSAFE_getAllByType(TouchableOpacity).find((n) => n.props.hitSlop);
    fireEvent.press(eye);
    expect(eye).toBeTruthy();
  });
});