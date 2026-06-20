import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, TOKEN_KEY, USER_KEY, ROLE_KEY } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        if (storedToken[1] && storedUser[1]) {
          const parsed = JSON.parse(storedUser[1]);
          if (parsed?.role) {
            setToken(storedToken[1]);
            setUser(parsed);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (correo, contrasena) => {
    const response = await loginRequest(correo, contrasena);
    const { accessToken, user: userData } = response.data;

    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_KEY, JSON.stringify(userData)],
      [ROLE_KEY, userData.role || ''],
    ]);

    setToken(accessToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ROLE_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
}
