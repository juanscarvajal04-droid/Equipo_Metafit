// movil/src/screens/__tests__/LoginScreen.test.js
// ISO 25010 · Usabilidad: la pantalla de login renderiza los campos
// de email/contraseña, valida vacíos y delega el envío en useAuth().
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

const mockLogin = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
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
      response: { data: { error: 'Correo o contraseña incorrectos' } },
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'x@metafit.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'incorrecta');
    fireEvent.press(getByText('Ingresar al Sistema →'));

    await waitFor(() =>
      expect(getByText('⚠️ Correo o contraseña incorrectos')).toBeTruthy()
    );
  });
});