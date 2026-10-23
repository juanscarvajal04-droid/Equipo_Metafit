// movil/src/navigation/__tests__/AppNavigator.test.jsx
// Cubre el loading, el stack de autenticación y el stack logueado.
import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import AppNavigator from '../AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../context/ThemeContext', () => ({ useTheme: jest.fn() }));

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    NavigationContainer: ({ children }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const ReactLib = require('react');
  const Navigator = ({ children }) => ReactLib.createElement(ReactLib.Fragment, null, children);
  const Screen = ({ component: Comp }) => (Comp ? ReactLib.createElement(Comp) : null);
  return { createNativeStackNavigator: () => ({ Navigator, Screen }) };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const ReactLib = require('react');
  const Navigator = ({ children, screenOptions }) => {
    if (screenOptions) {
      const options = screenOptions({ route: { name: 'Perfil' } });
      options.tabBarIcon?.({ focused: true, color: '#fff', size: 22 });
      options.tabBarIcon?.({ focused: false, color: '#fff', size: 22 });
    }
    return ReactLib.createElement(ReactLib.Fragment, null, children);
  };
  const Screen = ({ component: Comp }) => (Comp ? ReactLib.createElement(Comp) : null);
  return { createBottomTabNavigator: () => ({ Navigator, Screen }) };
});

jest.mock('../../screens/LandingScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Landing') };
});
jest.mock('../../screens/LoginScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Login') };
});
jest.mock('../../screens/RecuperarPasswordScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Recuperar') };
});
jest.mock('../../screens/MiPerfilScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Perfil') };
});
jest.mock('../../screens/MiRutinaScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Rutina') };
});
jest.mock('../../screens/MiDietaScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Dieta') };
});
jest.mock('../../screens/MiProgresoScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla Progreso') };
});
jest.mock('../../screens/RegistroEjercicioScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla RegistroEjercicio') };
});
jest.mock('../../screens/RegistroConsumoScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla RegistroConsumo') };
});
jest.mock('../../screens/EditarPerfilScreen', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: () => ReactLib.createElement(Text, null, 'pantalla EditarPerfil') };
});

describe('<AppNavigator />', () => {
  beforeEach(() => jest.clearAllMocks());

  test('mientras carga la sesión muestra el spinner', () => {
    useAuth.mockReturnValue({ token: null, loading: true });
    useTheme.mockReturnValue({ isDark: false });

    const { UNSAFE_getByType } = render(<AppNavigator />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  test('sin token muestra el stack de autenticación', async () => {
    useAuth.mockReturnValue({ token: null, loading: false });
    useTheme.mockReturnValue({ isDark: false });

    const { getByText } = render(<AppNavigator />);
    await waitFor(() => expect(getByText('pantalla Landing')).toBeTruthy());
    expect(getByText('pantalla Login')).toBeTruthy();
    expect(getByText('pantalla Recuperar')).toBeTruthy();
  });

  test('con token muestra tabs y pantallas de registro', async () => {
    useAuth.mockReturnValue({ token: 'jwt-token', loading: false });
    useTheme.mockReturnValue({ isDark: true });

    const { getByText } = render(<AppNavigator />);
    await waitFor(() => expect(getByText('pantalla Rutina')).toBeTruthy());
    expect(getByText('pantalla Perfil')).toBeTruthy();
    expect(getByText('pantalla Dieta')).toBeTruthy();
    expect(getByText('pantalla Progreso')).toBeTruthy();
    expect(getByText('pantalla RegistroEjercicio')).toBeTruthy();
    expect(getByText('pantalla RegistroConsumo')).toBeTruthy();
    expect(getByText('pantalla EditarPerfil')).toBeTruthy();
  });
});
