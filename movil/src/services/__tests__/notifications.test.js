// movil/src/services/__tests__/notifications.test.js
// Cobertura del flujo de permisos, token Expo y registro en backend.
import * as Notifications from 'expo-notifications';
import api from '../api';
import {
  obtenerExpoPushToken,
  registrarPushTokenEnBackend,
  activarPushNotifications,
} from '../notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'proyecto-expo' } } },
  easConfig: { projectId: 'proyecto-eas' },
}));
jest.mock('../api', () => ({ put: jest.fn() }));

const handlerConfiguradoAlImportar = Notifications.setNotificationHandler.mock.calls.length > 0;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notifications', () => {
  test('configura el handler al importar el módulo', () => {
    expect(handlerConfiguradoAlImportar).toBe(true);
  });

  test('obtiene el token si el permiso ya está concedido', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });

    await expect(obtenerExpoPushToken()).resolves.toBe('ExponentPushToken[abc]');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'proyecto-expo',
    });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('solicita permiso y devuelve null si se deniega', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    await expect(obtenerExpoPushToken()).resolves.toBeNull();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('acepta permiso concedido después de solicitarlo', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-nuevo' });

    await expect(obtenerExpoPushToken()).resolves.toBe('token-nuevo');
  });

  test('devuelve null y registra advertencia si falla el token', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Notifications.getPermissionsAsync.mockRejectedValue(new Error('sin servicio'));

    await expect(obtenerExpoPushToken()).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('registra el token en el backend e ignora el error de red', async () => {
    api.put.mockResolvedValueOnce({ data: {} });
    await registrarPushTokenEnBackend('ExponentPushToken[abc]');
    expect(api.put).toHaveBeenCalledWith('/usuarios/me/push-token', {
      push_token: 'ExponentPushToken[abc]',
    });

    await registrarPushTokenEnBackend(null);
    expect(api.put).toHaveBeenCalledTimes(1);

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    api.put.mockRejectedValueOnce(new Error('offline'));
    await expect(registrarPushTokenEnBackend('token')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('activa notificaciones solo cuando hay token', async () => {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-activo' });
    api.put.mockResolvedValue({ data: {} });

    await expect(activarPushNotifications()).resolves.toBe('token-activo');
    expect(api.put).toHaveBeenCalled();

    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await expect(activarPushNotifications()).resolves.toBeNull();
  });
});
