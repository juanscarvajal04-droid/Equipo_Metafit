import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * HomeRedirect — Redirige al usuario a la página de inicio correcta según su rol.
 *
 * Administrador → /dashboard  (acceso total)
 * Recepcionista → /afiliados  (gestión de membresías)
 * Entrenador    → /rutinas    (su módulo principal; /afiliados es solo lectura para él)
 */
const ROLE_HOME = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",   // ← Módulo principal del Entrenador
};

export default function HomeRedirect() {
  const { user } = useAuth();
  const to = ROLE_HOME[user?.role] || "/login";
  return <Navigate to={to} replace />;
}
