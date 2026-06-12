import { createContext, useContext, useRef, useState } from "react";
import api, { loginRequest } from "../services/api";

const AuthContext = createContext(null);

/** Limpia y valida el user guardado en localStorage. Si está corrupto, retorna null. */
const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem("metafit_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Descartar si no tiene role (datos corruptos / de otra app)
    if (!parsed?.role) {
      localStorage.removeItem("metafit_user");
      localStorage.removeItem("metafit_token");
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem("metafit_user");
    localStorage.removeItem("metafit_token");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => loadStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem("metafit_token") || null);

  // authAxios estable (reutiliza la instancia de api.js)
  const axiosRef = useRef(api);

  /**
   * Login contra el backend real (Node.js → MySQL).
   * Retorna el objeto user plano: { id, email, role, nombres, apellidos }
   */
  const login = async ({ correo, contrasena }) => {
    // loginRequest usa api.js → VITE_API_URL/login
    const response = await loginRequest(correo, contrasena);

    const { accessToken, user: userData } = response.data;

    // Guardar en localStorage
    localStorage.setItem("metafit_token", accessToken);
    localStorage.setItem("metafit_user",  JSON.stringify(userData));

    // Actualizar estado global
    setToken(accessToken);
    setUser(userData);

    return userData;   // { id, email, role, nombres, apellidos }
  };

  const logout = () => {
    localStorage.removeItem("metafit_token");
    localStorage.removeItem("metafit_user");
    localStorage.removeItem("metafit_role");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authAxios: axiosRef.current }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  return context;
}