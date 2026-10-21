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

  test('updateUser fusiona cambios y actualiza localStorage', () => {
    localStorage.setItem('metafit_token', 'jwt-persistido');
    localStorage.setItem('metafit_user', JSON.stringify({ id: 7, email: 'karla@metafit.com', role: 'Recepcionista' }));
    localStorage.setItem('metafit_role', 'Recepcionista');

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => result.current.updateUser({ foto: 'https://cdn.test/karla.jpg' }));

    expect(result.current.user.foto).toBe('https://cdn.test/karla.jpg');
    expect(JSON.parse(localStorage.getItem('metafit_user')).foto).toBe('https://cdn.test/karla.jpg');
  });

  test('switchRole reemplaza por completo la sesión anterior', async () => {
    localStorage.setItem('metafit_token', 'jwt-admin-anterior');
    localStorage.setItem('metafit_user', JSON.stringify({ id: 1, email: 'carlos@metafit.com', role: 'Administrador' }));
    localStorage.setItem('metafit_role', 'Administrador');
    localStorage.setItem('notif_vistas_1', JSON.stringify({ ts: 1, total: 4 }));

    loginUser.mockResolvedValueOnce({
      accessToken: 'jwt-entrenador-nuevo',
      user: { id: 2, email: 'laura@metafit.com', role: 'Entrenador' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.switchRole('laura@metafit.com', 'Laura123!', 'Entrenador');
    });

    expect(loginUser).toHaveBeenCalledWith({
      correo: 'laura@metafit.com',
      contrasena: 'Laura123!',
    });
    expect(result.current.token).toBe('jwt-entrenador-nuevo');
    expect(result.current.user.role).toBe('Entrenador');
    expect(localStorage.getItem('metafit_token')).toBe('jwt-entrenador-nuevo');
    expect(localStorage.getItem('metafit_role')).toBe('Entrenador');
    expect(localStorage.getItem('metafit_user')).not.toContain('Administrador');
    expect(localStorage.getItem('notif_vistas_1')).toBeNull();
  });

  test('switchRole fallido conserva la sesión anterior', async () => {
    localStorage.setItem('metafit_token', 'jwt-admin-anterior');
    localStorage.setItem('metafit_user', JSON.stringify({ id: 1, email: 'carlos@metafit.com', role: 'Administrador' }));
    localStorage.setItem('metafit_role', 'Administrador');

    loginUser.mockRejectedValueOnce(new Error('credenciales inválidas'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(
        result.current.switchRole('laura@metafit.com', 'incorrecta', 'Entrenador')
      ).rejects.toThrow('credenciales inválidas');
    });

    expect(result.current.token).toBe('jwt-admin-anterior');
    expect(result.current.user.role).toBe('Administrador');
    expect(localStorage.getItem('metafit_token')).toBe('jwt-admin-anterior');
    expect(localStorage.getItem('metafit_role')).toBe('Administrador');
  });

  test('switchRole rechaza credenciales de otro rol sin tocar la sesión', async () => {
    localStorage.setItem('metafit_token', 'jwt-admin-anterior');
    localStorage.setItem('metafit_user', JSON.stringify({ id: 1, email: 'carlos@metafit.com', role: 'Administrador' }));
    localStorage.setItem('metafit_role', 'Administrador');

    loginUser.mockResolvedValueOnce({
      accessToken: 'jwt-recepcion-nuevo',
      user: { id: 4, email: 'maria@metafit.com', role: 'Recepcionista' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(
        result.current.switchRole('maria@metafit.com', 'Maria123!', 'Entrenador')
      ).rejects.toThrow('Las credenciales corresponden al rol Recepcionista');
    });

    expect(result.current.user.role).toBe('Administrador');
    expect(localStorage.getItem('metafit_token')).toBe('jwt-admin-anterior');
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