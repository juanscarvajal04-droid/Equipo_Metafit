import { createContext, useContext, useRef, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const BASE_URL = "http://localhost:3001";

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

  // authAxios estable (no se recrea en cada render)
  const axiosRef = useRef(null);
  if (!axiosRef.current) {
    axiosRef.current = axios.create({ baseURL: BASE_URL });
  }

  // Interceptor: inyecta el token actual en cada petición
  axiosRef.current.interceptors.request.handlers = [];   // limpiar handlers duplicados
  axiosRef.current.interceptors.request.use((config) => {
    const t = localStorage.getItem("metafit_token");
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
  });

  /**
   * Login contra el servidor custom (server.cjs).
   * Retorna el objeto user plano: { id, email, role, nombres, apellidos }
   */
  const login = async ({ correo, contrasena }) => {
    const response = await axios.post(`${BASE_URL}/login`, {
      email:    correo,
      password: contrasena,
    });

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