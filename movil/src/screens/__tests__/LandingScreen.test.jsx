// movil/src/screens/__tests__/LandingScreen.test.jsx
// Cubre el render completo de la landing y sus dos CTAs de navegación.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LandingScreen from '../LandingScreen';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true }),
}));

describe('<LandingScreen />', () => {
  test('renderiza hero, KPIs, funciones y sede', () => {
    const { getByText, getAllByText } = render(<LandingScreen navigation={{ navigate: jest.fn() }} />);

    expect(getAllByText('MetaFit').length).toBeGreaterThan(0);
    expect(getAllByText('Sport Gym Sede Santa Rosita').length).toBeGreaterThan(0);
    expect(getByText('1,200+')).toBeTruthy();
    expect(getByText('Afiliados activos')).toBeTruthy();
    expect(getByText('Rutinas Personalizadas')).toBeTruthy();
    expect(getByText('Plan Nutricional')).toBeTruthy();
    expect(getByText(/3 pasos simples/)).toBeTruthy();
    expect(getByText('La recepcionista crea tu perfil')).toBeTruthy();
    expect(getByText('3,500 m²')).toBeTruthy();
    expect(getAllByText('Bogotá, Colombia').length).toBeGreaterThan(0);
    expect(getByText('📧 admin@metafit.com')).toBeTruthy();
  });

  test('los dos botones navegan a Login', () => {
    const navigation = { navigate: jest.fn() };
    const { getByText } = render(<LandingScreen navigation={navigation} />);

    fireEvent.press(getByText('🚀 Ingresar al Sistema'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login');

    fireEvent.press(getByText('Iniciar Sesión'));
    expect(navigation.navigate).toHaveBeenCalledTimes(2);
  });
});
