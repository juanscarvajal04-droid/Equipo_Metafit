import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from './api';

/* Configura cómo se presentan las notificaciones con la app abierta. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Solicita permisos y devuelve el Expo Push Token (o null). */
export async function obtenerExpoPushToken() {
  if (Platform.OS === 'web') return null;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {}
    );
    return token.data || null;
  } catch (err) {
    console.warn('[notifications] no se pudo obtener token:', err.message);
    return null;
  }
}

/** Registra el push token en el backend (idempotente, ignora errores). */
export async function registrarPushTokenEnBackend(token) {
  if (!token) return;
  try {
    await api.put('/usuarios/me/push-token', { push_token: token });
  } catch (err) {
    console.warn('[notifications] no se pudo registrar token:', err.message);
  }
}

/** Pide permiso + registra el token (llamar tras login exitoso). */
export async function activarPushNotifications() {
  const token = await obtenerExpoPushToken();
  if (token) await registrarPushTokenEnBackend(token);
  return token;
}