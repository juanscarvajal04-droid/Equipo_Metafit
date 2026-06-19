// ============================================================
// src/context/AuthContext.jsx — MetaFit Global Auth State
//
// RESPONSABILIDAD ÚNICA (ISO 25000 - SoC):
// Este Contexto es el ÚNICO responsable de:
//   ✅ Proveer el estado global de sesión (user, token)
//   ✅ Exponer acciones de alto nivel: login(), logout()
//
// NO es responsable de:
//   ❌ Hacer peticiones HTTP directas
//   ❌ Manipular localStorage directamente
//   ❌ Conocer la estructura de la respuesta del backend
//
// Toda la lógica de infraestructura es delegada a:
//   → src/services/authService.js
// ============================================================

import { createContext, useContext, useState } from 'react';
import {
  loginUser,
  persistSession,
  clearSession,
  loadStoredUser,
  loadStoredToken,
} from '../services/authService';

const AuthContext = createContext(null);

/* ────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }) {
  /**
   * Inicialización lazy: intenta restaurar la sesión desde
   * localStorage al montar la app. Si los datos están corruptos,
   * loadStoredUser() y loadStoredToken() retornan null de forma segura.
   */
  const [user,  setUser]  = useState(() => loadStoredUser());
  const [token, setToken] = useState(() => loadStoredToken());

  /**
   * login: delega la autenticación al authService.
   * El Contexto solo recibe el resultado ya procesado y
   * actualiza el estado global de la aplicación.
   *
   * @param {{ correo: string, contrasena: string }} credentials
   * @returns {Promise<object>} userData — { id, email, role, nombres, apellidos }
   */
  const login = async ({ correo, contrasena }) => {
    const { accessToken, user: userData } = await loginUser({ correo, contrasena });

    // Delega la persistencia al servicio
    persistSession(accessToken, userData);

    // Actualiza el estado global del Contexto
    setToken(accessToken);
    setUser(userData);

    return userData;
  };

  /**
   * logout: delega la limpieza de sesión al authService
   * y resetea el estado global a null.
   */
  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  /* ── Valor expuesto al árbol de componentes ── */
  const contextValue = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/* ────────────────────────────────────────────────────────────── */

/**
 * useAuth: hook de consumo del contexto.
 * Lanza un error descriptivo si se usa fuera del AuthProvider,
 * facilitando el diagnóstico durante el desarrollo.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() debe ser usado dentro de un <AuthProvider>.');
  }
  return context;
}