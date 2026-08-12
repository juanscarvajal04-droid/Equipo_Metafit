// frontend_web/src/context/__tests__/AuthContext.test.jsx
// ISO 25010 · Seguridad: login/logout y persistencia de sesión en localStorage.
import React from 'react';
import { renderHook, act, render } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';

vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../../services/authService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loginUser: vi.fn(),
  };
});

import { AuthProvider, useAuth } from '../AuthContext';
import { loginUser } from '../../services/authService';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
});

describe('<AuthProvider />', () => {
  test('restaura sesión desde localStorage al montar', () => {
    localStorage.setItem('metafit_token', 'jwt-persistido');
    localStorage.setItem('metafit_user', JSON.stringify({ id: 7, email: 'karla@metafit.com', role: 'Recepcionista' }));
    localStorage.setItem('metafit_role', 'Recepcionista');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({ id: 7, email: 'karla@metafit.com', role: 'Recepcionista' });
    expect(result.current.token).toBe('jwt-persistido');
    expect(result.current.isAuthReady).toBe(true);
  });

  test('login llama al servicio, persiste en localStorage y actualiza el estado', async () => {
    loginUser.mockResolvedValueOnce({
      accessToken: 'jwt-nuevo',
      user: { id: 1, email: 'carlos@metafit.com', role: 'Administrador' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ correo: 'carlos@metafit.com', contrasena: 'Admin123!' });
    });

    expect(result.current.token).toBe('jwt-nuevo');
    expect(result.current.user.role).toBe('Administrador');
    expect(localStorage.getItem('metafit_token')).toBe('jwt-nuevo');
    expect(localStorage.getItem('metafit_user')).toBe(JSON.stringify({ id: 1, email: 'carlos@metafit.com', role: 'Administrador' }));
    expect(localStorage.getItem('metafit_role')).toBe('Administrador');
  });

  test('login fallido NO persiste sesión y propaga el error', async () => {
    loginUser.mockRejectedValueOnce(new Error('credenciales inválidas'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.login({ correo: 'x@y.com', contrasena: 'mal' })).rejects.toThrow('credenciales inválidas');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('metafit_token')).toBeNull();
  });

  test('logout limpia el estado y localStorage', async () => {
    localStorage.setItem('metafit_token', 'jwt-persistido');
    localStorage.setItem('metafit_user', JSON.stringify({ id: 7, email: 'karla@metafit.com', role: 'Recepcionista' }));
    localStorage.setItem('metafit_role', 'Recepcionista');

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('metafit_token')).toBeNull();
    expect(localStorage.getItem('metafit_user')).toBeNull();
  });
});

describe('useAuth()', () => {
  test('lanza error si renderiza fuera del AuthProvider', () => {
    function Consumer() {
      useAuth();
      return null;
    }
    expect(() => render(<Consumer />)).toThrow('useAuth debe usarse dentro de un <AuthProvider>');
  });
});