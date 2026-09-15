// movil/src/context/AuthContext.js
// ─── Contexto de autenticación — App Móvil (Expo/React Native) ──
// Provee { user, token, loading, login, logout } a toda la navegación de la
// app. Comparado con el AuthContext web (frontend_web):
//   • Persistencia: AsyncStorage (almacenamiento asíncrono nativo) en lugar de
//     localStorage (síncrono). Por eso aquí restoreSession es async y devuelve
//     una Promise, y existe el estado `loading`: hasta que el storage no se lee
//     no podemos saber si hay sesión, y la UI DEBE esperar antes de decidir si
//     mostrar Login o las tabs (AppNavigator usa `loading` para ese gate).
//   • No hay axios configurado aquí: a diferencia del web (que crea authAxios),
//     el móvil usa el interceptor del api.js que lee el token de AsyncStorage
//     en cada petición, por lo que login/logout solo gestionan ese storage.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, TOKEN_KEY, USER_KEY, ROLE_KEY } from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider — Envuelve la app y gestiona la sesión del afiliado.
 *
 * Estado que maneja: user (objeto del afiliado), token y loading (true solo
 * mientras se restaura la sesión desde AsyncStorage).
 *
 * API calls: login() → POST /login (vía loginRequest del api.js). La
 * restauración de sesión NO llama al backend; confía en el storage local.
 *
 * @param {object}   props        - Props del provider.
 * @param {ReactNode} props.children - Árbol de la app bajo el contexto.
 * @returns {JSX.Element} <AuthContext.Provider> con el valor de autenticación.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Restaura la sesión al arrancar: lee token+usuario de AsyncStorage
   * (multiGet → una sola consulta al storage nativo) y, SOLO si el usuario
   * parseado tiene `role` válido, marca la sesión como activa. El bloque try/
   * catch silencia errores de lectura y la cláusula finally libera `loading`:
   * si no hay sesión la app cae al Login. Se ejecuta una sola vez por montaje
   * (deps vacías). Es async porque AsyncStorage NO es síncrono como el
   * localStorage del web — de ahí el estado `loading`.
   */
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

  /**
   * useCallback: inicia sesión del afiliado.
   * 1) loginRequest → POST /login (el api.js expone la función); 2) persiste
   * token/user/role con un solo multiSet en AsyncStorage; 3) actualiza estado
   * en memoria. Memoizado con [] para identidad estable en la navegación.
   * @param {string} correo     - Email del afiliado.
   * @param {string} contrasena - Contraseña.
   * @returns {Promise<object>} userData del backend (para quien lo necesite).
   */
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

  /**
   * useCallback: cierra sesión limpiando token/user/role de AsyncStorage
   * (multiRemove) y poniendo el estado a null → AppNavigator vuelve a Login.
   * No llama al backend (el token simplemente deja de enviarse).
   */
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

/**
 * useAuth — Hook de acceso al contexto de autenticación.
 * @returns {{ user, token, loading, login, logout }} Valor del AuthContext.
 * @throws {Error} Si se usa fuera de un <AuthProvider> (error de configuración).
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
}
