import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * HomeRedirect — Redirige al usuario a la página de inicio correcta según su rol.
 *
 * Administrador → /dashboard  (acceso total)
 * Recepcionista → /afiliados  (gestión de membresías)
 * Entrenador    → /rutinas    (su módulo principal; /afiliados es solo lectura para él)
 *
 * NOTA: Lee localStorage como fallback por el timing asíncrono de React setState.
 */
const ROLE_HOME = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",   // ← Módulo principal del Entrenador
};

export default function HomeRedirect() {
  const { user: ctxUser } = useAuth();

  // ✅ Fallback síncrono a localStorage
  let user = ctxUser;
  if (!user) {
    try {
      const raw = localStorage.getItem("metafit_user");
      if (raw) user = JSON.parse(raw);
    } catch { /* ignorar */ }
  }

  const to = ROLE_HOME[user?.role] || "/login";
  return <Navigate to={to} replace />;
}
