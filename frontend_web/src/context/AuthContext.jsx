import { createContext, useContext, useRef, useState } from "react";
import { flushSync } from "react-dom";
import api from "../services/api";
import { loginUser, persistSession, clearSession, loadStoredUser, loadStoredToken } from "../services/authService";

const AuthContext = createContext(null);

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
   * Retorna el objeto user plano: { id, email, role, nombres, apellidos }
   *
   * IMPORTANTE: Usamos flushSync para forzar que React aplique setToken/setUser
   * de forma síncrona ANTES de que el llamador ejecute navigate().
   * Sin flushSync, React 18 batcha los setState y ProtectedRoute puede renderizar
   * con ctxToken/ctxUser = null en el primer frame tras la navegación.
   *
   * También guardamos en localStorage como respaldo síncrono adicional.
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  return context;
}