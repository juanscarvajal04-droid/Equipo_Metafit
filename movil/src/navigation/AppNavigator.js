// movil/src/navigation/AppNavigator.js
// ─── Navegación raíz de la app móvil (login <-> tabs) ────────
// Decide QUÉ stack mostrar según el estado de autenticación:
//   • loading (restaurando sesión desde AsyncStorage) → LoadingScreen
//   • sin token (visitante)     → stack público: Landing / Login / RecuperarPassword
//   • con token (afiliado)      → RootStack + MainTabs (Perfil/Rutina/Dieta/Progreso)
//
// Por qué ese orden importa: si la app decidiera el stack ANTES de leer
// AsyncStorage, un afiliado con sesión vería el Login por un instante (flash).
// El gate `loading` evita ese parpadeo y el flash es imposible.
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RecuperarPasswordScreen from '../screens/RecuperarPasswordScreen';
import MiPerfilScreen from '../screens/MiPerfilScreen';
import MiRutinaScreen from '../screens/MiRutinaScreen';
import MiDietaScreen from '../screens/MiDietaScreen';
import MiProgresoScreen from '../screens/MiProgresoScreen';
import RegistroEjercicioScreen from '../screens/RegistroEjercicioScreen';
import RegistroConsumoScreen from '../screens/RegistroConsumoScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import { COLORS, FONTS } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Pantalla de carga inicial: spinner mientras el auth restaura la sesión. */
function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.purple} />
    </View>
  );
}

/** Iconos de Ionicons por pestaña (focused/unfocused para el estado visual). */
const TAB_ICONS = {
  Perfil: { focused: 'person', unfocused: 'person-outline' },
  Rutina: { focused: 'barbell', unfocused: 'barbell-outline' },
  Dieta: { focused: 'restaurant', unfocused: 'restaurant-outline' },
  Progreso: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
};

/**
 * RootStack — Stack logeado: MainTabs base + pantallas full-screen que se
 * abren ENCIMA de las tabs (registro de ejercicio, registro de consumo y
 * edición de perfil). headerShown false: cada pantalla dibuja su propia barra.
 *
 * @returns {JSX.Element} Navegador de stack del área autenticada.
 */
function RootStack() {
  return (
    <Stack.Navigator key="root-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="RegistroEjercicio" component={RegistroEjercicioScreen} />
      <Stack.Screen name="RegistroConsumo" component={RegistroConsumoScreen} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
    </Stack.Navigator>
  );
}

/**
 * MainTabs — Barra inferior (bottom tab) del afiliado con 4 pestañas:
 * Perfil, Rutina, Dieta, Progreso. Estilo dark con tinte activo púrpura claro
 * (COLORS.purpleLight) e inactivo muted; iconos Ionicons por TAB_ICONS.
 *
 * @returns {JSX.Element} Tab.Navigator con las 4 pantallas del afiliado.
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.purpleLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.xsmall,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Perfil" component={MiPerfilScreen} />
      <Tab.Screen name="Rutina" component={MiRutinaScreen} />
      <Tab.Screen name="Dieta" component={MiDietaScreen} />
      <Tab.Screen name="Progreso" component={MiProgresoScreen} />
    </Tab.Navigator>
  );
}

/**
 * AppNavigator — Navegador raíz que controla el flujo según la sesión.
 *
 * Flujo condicional (en este orden):
 *  1) SI `loading` (restaurando desde AsyncStorage) → LoadingScreen: evita el
 *     flash de Login y es requisito porque la restauración es asíncrona.
 *  2) SI `token` → RootStack (tabs + modales de registro/edición).
 *  3) SI NO hay token → stack público (Landing → Login/RecuperarPassword).
 *
 * Además força el remontaje del NavigationContainer con `key` al cambiar de
 * tema (isDark): al re-crearse el árbol, todas las pantallas re-leen la paleta
 * ya aplicada por ThemeContext sin necesidad de invalidarla 		manualmente.
 *
 * @param {Object} _props - Sin props externas (usa useAuth + useTheme).
 * @returns {JSX.Element} NavigationContainer con el stack correcto.
 */
export default function AppNavigator() {
  const { token, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return <LoadingScreen />;
  }

  // key={isDark ? 'd' : 'l'} fuerza un remontaje al cambiar de tema:
  // todas las pantallas se re-renderizan y leen la paleta ya aplicada.
  return (
    <NavigationContainer key={isDark ? 'd' : 'l'}>
      {token ? (
        <RootStack key="root-stack" />
      ) : (
        <Stack.Navigator key="auth-stack" initialRouteName="Landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

/** Estilos base: pantalla de carga centrada sobre el fondo global. */
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
});
