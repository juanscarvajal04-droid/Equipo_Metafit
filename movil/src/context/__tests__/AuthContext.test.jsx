// movil/src/context/__tests__/AuthContext.test.jsx
// ISO 25010 · Seguridad: login, logout y restauración de sesión inicial
// desde AsyncStorage.
import React from 'react';
import { render, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  loginRequest: jest.fn(),
  TOKEN_KEY: 'metafit_token',
  USER_KEY: 'metafit_user',
  ROLE_KEY: 'metafit_role',
}));

import { AuthProvider, useAuth } from '../../context/AuthContext';
import { loginRequest } from '../../services/api';

let ctx;
function Probe() {
  ctx = useAuth();
  return null;
}

const renderWithAuth = () => render(
  <AuthProvider>
    <Probe />
  </AuthProvider>
);

beforeEach(async () => {
  ctx = null;
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('<AuthProvider /> (móvil)', () => {
  test('restaura la sesión guardada en AsyncStorage al montar', async () => {
    await AsyncStorage.multiSet([
      ['metafit_token', 'jwt-almacenado'],
      ['metafit_user', JSON.stringify({ id: 3, email: 'afi@metafit.com', role: 'Afiliado' })],
      ['metafit_role', 'Afiliado'],
    ]);

    renderWithAuth();

    await act(async () => {});

    expect(ctx.token).toBe('jwt-almacenado');
    expect(ctx.user?.email).toBe('afi@metafit.com');
    expect(ctx.loading).toBe(false);
  });

  test('login persiste el token y el usuario en AsyncStorage y actualiza el estado', async () => {
    loginRequest.mockResolvedValueOnce({
      data: {
        accessToken: 'jwt-nuevo',
        user: { id: 1, email: 'carlos@metafit.com', role: 'Administrador' },
      },
    });

    renderWithAuth();
    await act(async () => {});

    await act(async () => {
      await ctx.login('carlos@metafit.com', 'Admin123!');
    });

    expect(ctx.token).toBe('jwt-nuevo');
    expect(ctx.user?.role).toBe('Administrador');
    expect(await AsyncStorage.getItem('metafit_token')).toBe('jwt-nuevo');
    expect(JSON.parse(await AsyncStorage.getItem('metafit_user'))).toMatchObject({
      email: 'carlos@metafit.com',
    });
    expect(await AsyncStorage.getItem('metafit_role')).toBe('Administrador');
  });

  test('login fallido propaga el error y no guarda sesión', async () => {
    loginRequest.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    renderWithAuth();
    await act(async () => {});

    await expect(
      act(async () => ctx.login('x@y.com', 'mal'))
    ).rejects.toThrow('Credenciales inválidas');

    expect(ctx.token).toBeNull();
    expect(ctx.user).toBeNull();
    expect(await AsyncStorage.getItem('metafit_token')).toBeNull();
  });

  test('logout limpia el estado y AsyncStorage', async () => {
    await AsyncStorage.multiSet([
      ['metafit_token', 'jwt-almacenado'],
      ['metafit_user', JSON.stringify({ id: 3, email: 'afi@metafit.com', role: 'Afiliado' })],
      ['metafit_role', 'Afiliado'],
    ]);

    renderWithAuth();
    await act(async () => {});

    await act(async () => {
      await ctx.logout();
    });

    expect(ctx.token).toBeNull();
    expect(ctx.user).toBeNull();
    expect(await AsyncStorage.getItem('metafit_token')).toBeNull();
    expect(await AsyncStorage.getItem('metafit_user')).toBeNull();
  });
});