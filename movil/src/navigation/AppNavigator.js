import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import MiPerfilScreen from '../screens/MiPerfilScreen';
import MiRutinaScreen from '../screens/MiRutinaScreen';
import MiDietaScreen from '../screens/MiDietaScreen';
import MiProgresoScreen from '../screens/MiProgresoScreen';
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {token ? (
        <MainTabs key="main-tabs" />
      ) : (
        <Stack.Navigator key="auth-stack" initialRouteName="Landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
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
