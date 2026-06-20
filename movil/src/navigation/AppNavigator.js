import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import MiPerfilScreen from '../screens/MiPerfilScreen';
import MiRutinaScreen from '../screens/MiRutinaScreen';
import MiDietaScreen from '../screens/MiDietaScreen';
import MiProgresoScreen from '../screens/MiProgresoScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#208AEF" />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#208AEF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        headerStyle: { backgroundColor: '#208AEF' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="Perfil"
        component={MiPerfilScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
      <Tab.Screen
        name="Rutina"
        component={MiRutinaScreen}
        options={{ tabBarLabel: 'Rutina' }}
      />
      <Tab.Screen
        name="Dieta"
        component={MiDietaScreen}
        options={{ tabBarLabel: 'Dieta' }}
      />
      <Tab.Screen
        name="Progreso"
        component={MiProgresoScreen}
        options={{ tabBarLabel: 'Progreso' }}
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
    backgroundColor: '#fff',
  },
});
