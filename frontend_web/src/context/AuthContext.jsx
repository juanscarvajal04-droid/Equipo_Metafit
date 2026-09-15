// frontend_web/src/context/AuthContext.jsx
// ─── Contexto global de autenticación ────────────────────────
// Provee a toda la app el estado de sesión (user, token, isAuthReady),
// las acciones login/logout y la instancia axios ya autenticada (authAxios).
// Separación de responsabilidades: la persistencia en localStorage vive en
// services/authService.js; aquí solo se orquesta estado de React + navegación.
import { createContext, useContext, useRef, useState } from "react";
import { flushSync } from "react-dom";
import api from "../services/api";
import { loginUser, persistSession, clearSession, loadStoredUser, loadStoredToken } from "../services/authService";

const AuthContext = createContext(null);

/**
 * AuthProvider — Envoltorio raíz de la aplicación.
 *
 * Qué hace: renderiza el <AuthContext.Provider> con la sesión activa y las
 * acciones de login/logout para todos los componentes hijos.
 *
 * Qué rol lo usa: lo consumen tanto la web staff (login protegido por
 * ProtectedRoute) como los componentes que llaman a la API.
 *
 * Estado que maneja:
 *   · user  → objeto { id, email, role, nombres, apellidos } o null
 *   · token → JWT o null
 *   · isAuthReady → bandera de "autenticación resuelta" que ProtectedRoute
 *     consulta para decidir si mostrar el spinner o redirigir.
 *
 * API calls: login() → POST /login vía loginUser() de services/authService.
 * Todas las demás llamadas de los hijos salen por authAxios (instancia con el
 * interceptor de token de api.js).
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes envueltos por el provider.
 */
export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => loadStoredUser());
  const [token, setToken] = useState(() => loadStoredToken() || null);

  /**
   * isAuthReady — Indica que el estado de autenticación ya fue resuelto.
   *
   * Se inicializa en `true` porque loadStoredUser() y la lectura de localStorage
   * son síncronas: al montar AuthProvider ya sabemos si hay sesión o no.
   * Se pone en `false` SOLO durante el instante en que login() guarda en
   * localStorage pero antes de que flushSync actualice el contexto React.
   * ProtectedRoute espera (spinner) mientras sea `false`.
   */
  const [isAuthReady, setIsAuthReady] = useState(true);

  // authAxios estable (reutiliza la instancia de api.js)
  const axiosRef = useRef(api);

  /**
   * Login contra el backend real (Node.js → MySQL).
   * Retorna el objeto user plano: { id, email, role, nombres, apellidos }.
   *
   * Flujo completo:
   *   1. loginUser() → POST /login { email, password } (la credencial se valida
   *      en el backend; aquí NO se valida nada en el cliente a propósito).
   *   2. persistSession() guarda token + user + role en localStorage como
   *      respaldo síncrono (ProtectedRoute lo lee si el estado React aún no
   *      llegó al componente).
   *   3. flushSync() fuerza que React aplique setToken/setUser/isAuthReady de
   *      forma SINCRÓNICA, antes de que login() retorne. Sin flushSync, React 18
   *      batcha los setState y ProtectedRoute puede renderizar con ctxToken/
   *      ctxUser = null en el primer frame tras navigate() (bug de flash blanco).
   *
   * @param {{ correo: string, contrasena: string }} credenciales
   * @returns {Promise<object>} Datos del usuario autenticado.
   * @throws {AxiosError} Si el backend rechaza las credenciales.
   */
  const login = async ({ correo, contrasena }) => {
    const { accessToken, user: userData } = await loginUser({ correo, contrasena });

    // ✅ Primero localStorage (respaldo síncrono — ProtectedRoute lo lee si el
    //    estado React aún no llegó al componente)
    persistSession(accessToken, userData);

    // ✅ flushSync: fuerza React a procesar los setState AHORA, de forma síncrona,
    //    antes de que login() retorne. Así, cuando Login.jsx llame navigate()
    //    justo después del await, el Context ya tiene token y user válidos.
    //    isAuthReady se pone en true al mismo tiempo para que ProtectedRoute
    //    nunca vea un estado intermedio donde token existe pero user es null.
    flushSync(() => {
      setToken(accessToken);
      setUser(userData);
      setIsAuthReady(true);
    });

    return userData;   // { id, email, role, nombres, apellidos }
  };

  /**
   * Cierra la sesión: borra el localStorage (clearSession) y resetea el estado
   * de React en un solo flushSync para que ningún frame intermedio muestre
   * datos de un usuario ya deslogueado (misma técnica que login).
   */
  const logout = () => {
    clearSession();
    flushSync(() => {
      setToken(null);
      setUser(null);
      setIsAuthReady(true);
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthReady, login, logout, authAxios: axiosRef.current }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — Devuelve el contexto de autenticación para consumirlo en un
 * componente hijo. Lanza error si se invoca fuera de un <AuthProvider> para
 * fallar rápido y detectar wiring incorrecto en desarrollo.
 *
 * @returns {{ user: object|null, token: string|null, isAuthReady: boolean,
 *             login: Function, logout: Function, authAxios: object }}
 * @throws {Error} Si no hay un AuthProvider en el árbol de componentes.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  return context;
}