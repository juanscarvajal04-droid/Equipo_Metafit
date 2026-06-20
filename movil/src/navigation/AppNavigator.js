import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import MiPerfilScreen from '../screens/MiPerfilScreen';
import MiRutinaScreen from '../screens/MiRutinaScreen';
import MiDietaScreen from '../screens/MiDietaScreen';
import MiProgresoScreen from '../screens/MiProgresoScreen';
import { COLORS, FONTS, BORDER_RADIUS } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.red} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.red,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.bgSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: COLORS.bg,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: FONTS.body,
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Perfil"
        component={MiPerfilScreen}
        options={{
          tabBarLabel: 'Perfil',
          headerTitle: 'Mi Perfil',
        }}
      />
      <Tab.Screen
        name="Rutina"
        component={MiRutinaScreen}
        options={{
          tabBarLabel: 'Rutina',
          headerTitle: 'Mi Rutina',
        }}
      />
      <Tab.Screen
        name="Dieta"
        component={MiDietaScreen}
        options={{
          tabBarLabel: 'Dieta',
          headerTitle: 'Mi Dieta',
        }}
      />
      <Tab.Screen
        name="Progreso"
        component={MiProgresoScreen}
        options={{
          tabBarLabel: 'Progreso',
          headerTitle: 'Mi Progreso',
        }}
      />
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
        <MainTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
