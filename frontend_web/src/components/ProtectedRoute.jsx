import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — Guarda de rutas con RBAC
 *
 * @param {string[]} allowedRoles  Roles permitidos para esta ruta.
 *                                 Si se omite, solo verifica autenticación.
 *
 * Flujo:
 *  sin token            → /login
 *  rol no permitido     → página de inicio del rol actual (ver ROLE_HOME)
 *  ok                   → <Outlet />
 *
 * ROLE_HOME define la página de inicio por rol:
 *  Administrador → /dashboard  (vista financiera + control total)
 *  Recepcionista → /afiliados  (su módulo de trabajo principal)
 *  Entrenador    → /rutinas    (su módulo de trabajo principal, NO /afiliados)
 *
 * NOTA DE IMPLEMENTACIÓN:
 *  Los setState de React son asíncronos (batched). Tras login(), puede existir
 *  un render donde token/user del contexto aún son null aunque localStorage
 *  ya tenga los datos. Por eso leemos localStorage como fuente de verdad
 *  sincrónica de respaldo.
 */

/** Página de inicio por rol (para redirecciones cuando se accede a ruta no permitida) */
const ROLE_HOME = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",   // ← Su home real: módulo de entrenamiento
};

export default function ProtectedRoute({ allowedRoles }) {
  const { token: ctxToken, user: ctxUser } = useAuth();

  // ✅ Fallback síncrono a localStorage para evitar parpadeo de autenticación.
  // Cuando React aún no propagó setToken/setUser, localStorage ya tiene los datos.
  const token = ctxToken || localStorage.getItem("metafit_token");

  let user = ctxUser;
  if (!user) {
    try {
      const raw = localStorage.getItem("metafit_user");
      if (raw) user = JSON.parse(raw);
    } catch { /* ignorar JSON inválido */ }
  }

  // 1. Sin autenticación → login
  if (!token) return <Navigate to="/login" replace />;

  // 2. Rol no permitido → home del rol actual
  //    Ej: Entrenador intenta /dashboard → redirige a /rutinas
  //    Ej: Recepcionista intenta /personal → redirige a /afiliados
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const home = ROLE_HOME[user?.role] || "/login";
    return <Navigate to={home} replace />;
  }

  // 3. Todo OK — el rol está en allowedRoles → renderiza la ruta hija
  return <Outlet />;
}
