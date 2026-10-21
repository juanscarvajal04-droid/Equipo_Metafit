// movil/src/screens/__tests__/MiPerfilScreen.test.js
// Cubre carga inicial, refetch por foco, refresh manual y push token.
import React from 'react';
import { Image, RefreshControl } from 'react-native';
import { render, waitFor, act } from '@testing-library/react-native';
import MiPerfilScreen from '../MiPerfilScreen';
import { getMiPerfil, getMisCiclos, getMisRestricciones } from '../../services/api';
import { activarPushNotifications } from '../../services/notifications';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  API_URL: 'http://api.test',
  getMiPerfil: jest.fn(),
  getMisCiclos: jest.fn(),
  getMisRestricciones: jest.fn(),
}));

jest.setTimeout(30000);

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ logout: jest.fn() }),
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDark: true, toggle: jest.fn() }),
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
});
