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
import { COLORS, FONTS } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.purple} />
    </View>
  );
}

const TAB_ICONS = {
  Perfil: { focused: 'person', unfocused: 'person-outline' },
  Rutina: { focused: 'barbell', unfocused: 'barbell-outline' },
  Dieta: { focused: 'restaurant', unfocused: 'restaurant-outline' },
  Progreso: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
};

// Stack raíz que envuelve las tabs: permite abrir pantallas de registro
// (RegistroEjercicio/RegistroConsumo) encima del área logeada.
function RootStack() {
  return (
    <Stack.Navigator key="root-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="RegistroEjercicio" component={RegistroEjercicioScreen} />
      <Stack.Screen name="RegistroConsumo" component={RegistroConsumoScreen} />
    </Stack.Navigator>
  );
}

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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
});
