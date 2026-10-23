// movil/src/screens/__tests__/MiPerfilScreen.test.js
// Cubre carga inicial, refetch por foco, refresh manual y push token.
import React from 'react';
import { Alert, Image, Platform, RefreshControl } from 'react-native';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import MiPerfilScreen from '../MiPerfilScreen';
import api, { getMiPerfil, getMisCiclos, getMisRestricciones } from '../../services/api';
import { activarPushNotifications } from '../../services/notifications';
import * as ImagePicker from 'expo-image-picker';

const mockLogout = jest.fn();

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  API_URL: 'http://api.test',
  getMiPerfil: jest.fn(),
  getMisCiclos: jest.fn(),
  getMisRestricciones: jest.fn(),
}));

jest.setTimeout(30000);

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, toggle: jest.fn() }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../services/notifications', () => ({
  activarPushNotifications: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../hooks/useAutoRefresh', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('../../components/common/BadgeRestriccion', () => 'BadgeRestriccion');
jest.mock('../../components/historial/ResumenCiclo', () => 'ResumenCiclo');

describe('<MiPerfilScreen />', () => {
  test('carga el perfil y refresca por foco y por pull-to-refresh', async () => {
    getMiPerfil.mockResolvedValue({
      data: {
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@metafit.com',
        telefono: '3001234567',
        edad: 30,
        estatura_cm: 170,
        ciclo_activo: { progreso_fisico: [{ peso_kg: 65, imc: 22.5 }] },
      },
    });
    getMisCiclos.mockResolvedValue({
      data: [{
        id_ciclo: 1,
        activo: 1,
        numero_ciclo: 1,
        entrenador_nombres: 'Laura',
        entrenador_apellidos: 'Gómez',
        entrenador_rol: 'Entrenador',
        entrenador_foto: 'https://cdn.test/laura.jpg',
      }],
    });
    getMisRestricciones.mockResolvedValue({ data: [] });

    const listeners = {};
    const navigation = {
      navigate: jest.fn(),
      addListener: jest.fn((event, cb) => {
        listeners[event] = cb;
        return jest.fn();
      }),
    };

    const { getByText, UNSAFE_getAllByType, UNSAFE_getByType } = render(
      <MiPerfilScreen navigation={navigation} />
    );

    await waitFor(() => expect(getByText('Ana Pérez')).toBeTruthy());
    expect(getByText('Laura Gómez')).toBeTruthy();
    expect(getByText('Entrenador')).toBeTruthy();
    expect(
      UNSAFE_getAllByType(Image).some(
        (img) => img.props.source?.uri === 'https://cdn.test/laura.jpg'
      )
    ).toBe(true);
    expect(activarPushNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      listeners.focus();
      await Promise.resolve();
    });
    await waitFor(() => expect(getMiPerfil).toHaveBeenCalledTimes(2));

    await act(async () => {
      UNSAFE_getByType(RefreshControl).props.onRefresh();
      await Promise.resolve();
    });
    await waitFor(() => expect(getMiPerfil).toHaveBeenCalledTimes(3));
  });

  test('mapea los errores de carga y maneja el 401 sin alerta', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };
    const casos = [
      [{}, 'Sin conexión', 'Sin conexión. Verificá tu red.'],
      [
        { response: { status: 403 } },
        'Acceso denegado',
        'No tenés permiso para ver estos datos.',
      ],
      [
        { response: { status: 500 } },
        'Error',
        'Error al cargar los datos. Intentá más tarde.',
      ],
      [{ response: { status: 400 } }, 'Error', 'No se pudieron cargar los datos.'],
    ];

    for (const [error, titulo, mensaje] of casos) {
      alertSpy.mockClear();
      getMiPerfil.mockRejectedValueOnce(error);
      const view = render(<MiPerfilScreen navigation={navigation} />);
      await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(titulo, mensaje));
      view.unmount();
    }

    alertSpy.mockClear();
    getMiPerfil.mockRejectedValueOnce({ response: { status: 401 } });
    const view = render(<MiPerfilScreen navigation={navigation} />);
    await waitFor(() => expect(view.getByText('Usuario')).toBeTruthy());
    expect(alertSpy).not.toHaveBeenCalled();
    view.unmount();
    alertSpy.mockRestore();
  });

  test('cubre foto, edición, historial, restricciones y logout', async () => {
    const navigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };
    getMiPerfil.mockResolvedValue({
      data: {
        nombres: 'Ana',
        apellidos: 'Pérez',
        correo: 'ana@metafit.com',
        telefono: '3001234567',
        edad: 30,
        estatura_cm: 170,
        ciclo_activo: { progreso_fisico: [{ peso_kg: 65, imc: 22.5 }] },
      },
    });
    getMisCiclos.mockResolvedValue({
      data: [
        { id_ciclo: 2, activo: 0, numero_ciclo: 2 },
        { id_ciclo: 3, activo: 0, numero_ciclo: 3 },
        {
          id_ciclo: 1,
          activo: 1,
          numero_ciclo: 1,
          entrenador_nombres: 'Laura',
          entrenador_apellidos: 'Gómez',
          entrenador_rol: 'Entrenador',
        },
      ],
    });
    getMisRestricciones.mockResolvedValue({
      data: [
        {
          id_restriccion: 1,
          nombre_restriccion: 'Lactosa',
          efecto_relevante: 'Evitar lácteos',
        },
      ],
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const asset = { uri: 'file:///foto.jpg', fileName: 'foto.jpg', mimeType: 'image/jpeg' };

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      status: 'denied',
    });
    const { getByText } = render(<MiPerfilScreen navigation={navigation} />);

    await waitFor(() => expect(getByText('Ana Pérez')).toBeTruthy());
    expect(getByText('Evitar lácteos')).toBeTruthy();

    fireEvent.press(getByText('AP'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Permiso requerido',
        'Necesitamos acceso a tu galería.'
      )
    );

    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });
    fireEvent.press(getByText('AP'));
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());

    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ assets: [asset] });
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    fireEvent.press(getByText('AP'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Foto actualizada',
        'Tu foto de perfil fue subida correctamente.'
      )
    );

    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ assets: [asset] });
    api.post.mockRejectedValueOnce(new Error('upload boom'));
    fireEvent.press(getByText('AP'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'No se pudo subir la foto. Intenta nuevamente.'
      )
    );

    fireEvent.press(getByText('Editar perfil'));
    expect(navigation.navigate).toHaveBeenCalledWith('EditarPerfil');

    mockLogout.mockRejectedValueOnce(new Error('logout boom'));
    fireEvent.press(getByText('Cerrar Sesión'));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());

    alertSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('sube la foto en web usando Blob/File reales', async () => {
    const originalOS = Platform.OS;
    const originalFetch = global.fetch;
    const originalFile = global.File;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    if (!global.File) {
      global.File = require('buffer').File;
    }
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['foto'])),
    });

    getMiPerfil.mockResolvedValue({
      data: { nombres: 'Ana', apellidos: 'Pérez', correo: 'ana@metafit.com' },
    });
    getMisCiclos.mockResolvedValue({ data: [] });
    getMisRestricciones.mockResolvedValue({ data: [] });
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      assets: [{ uri: 'blob:http://local/foto', fileName: 'foto.jpg', mimeType: 'image/jpeg' }],
    });
    api.post.mockResolvedValueOnce({ data: { ok: true } });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };

    const { getByText } = render(<MiPerfilScreen navigation={navigation} />);
    await waitFor(() => expect(getByText('Ana Pérez')).toBeTruthy());

    fireEvent.press(getByText('AP'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Foto actualizada',
        'Tu foto de perfil fue subida correctamente.'
      )
    );
    expect(global.fetch).toHaveBeenCalledWith('blob:http://local/foto');
    expect(api.post).toHaveBeenCalledWith(
      '/afiliados/me/foto',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );

    alertSpy.mockRestore();
    global.fetch = originalFetch;
    global.File = originalFile;
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });
});
