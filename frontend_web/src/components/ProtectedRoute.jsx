import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — Guarda de rutas con RBAC
 *
 * @param {string[]} allowedRoles  Roles permitidos para esta ruta.
 *                                 Si se omite, solo verifica autenticación.
 *
 * Flujo:
 *  autenticación pendiente      → spinner (espera a que isAuthReady sea true)
 *  sin token                    → /login
 *  rol no permitido             → página de inicio del rol actual (ver ROLE_HOME)
 *  ok                           → <Outlet />
 *
 * ROLE_HOME define la página de inicio por rol:
 *  Administrador → /dashboard  (vista financiera + control total)
 *  Recepcionista → /afiliados  (su módulo de trabajo principal)
 *  Entrenador    → /rutinas    (su módulo de trabajo principal, NO /afiliados)
 *
 * NOTA DE IMPLEMENTACIÓN:
 *  isAuthReady (del AuthContext) garantiza que el estado de autenticación ya
 *  fue resuelto antes de tomar cualquier decisión de redirección. Esto elimina
 *  el bucle /login causado por el batching asíncrono de React 18 cuando
 *  token/user todavía son null en el primer render tras login().
 *
 *  Además, se mantiene el fallback a localStorage como capa extra de seguridad
 *  para el caso (muy raro) donde isAuthReady=true pero ctxUser aún no propagó.
 */

/** Página de inicio por rol (para redirecciones cuando se accede a ruta no permitida) */
const ROLE_HOME = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",   // ← Su home real: módulo de entrenamiento
};

/** Spinner minimalista — visible solo mientras el auth se resuelve */
function AuthSpinner() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#0a0a0f",
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid rgba(227,28,37,0.3)",
        borderTopColor: "#e31c25",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles }) {
  const { token: ctxToken, user: ctxUser, isAuthReady } = useAuth();

  // ── Fase 1: Esperar a que el estado de autenticación esté listo ──────────
  // isAuthReady = false SOLO durante el instante de transición login/logout.
  // Evita que ProtectedRoute tome decisiones de redirección con datos stale.
  if (!isAuthReady) return <AuthSpinner />;

  // ── Fase 2: Resolver token y user ────────────────────────────────────────
  // Fallback síncrono a localStorage: capa extra de seguridad para el caso
  // donde isAuthReady=true pero el contexto React aún no propagó al hijo.
  const token = ctxToken || localStorage.getItem("metafit_token");

  let user = ctxUser;
  if (!user) {
    try {
      const raw = localStorage.getItem("metafit_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Solo usar si tiene role válido (evita bucle con datos corruptos)
        if (parsed?.role) user = parsed;
      }
    } catch { /* ignorar JSON inválido */ }
  }

  // ── Fase 3: Decisiones de enrutado ──────────────────────────────────────

  // 1. Sin autenticación → login
  if (!token || !user) return <Navigate to="/login" replace />;

  // 2. Rol no permitido → home del rol actual
  //    Ej: Entrenador intenta /dashboard → redirige a /rutinas
  //    Ej: Recepcionista intenta /personal → redirige a /afiliados
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || "/login";
    return <Navigate to={home} replace />;
  }

  // 3. Todo OK — el rol está en allowedRoles → renderiza la ruta hija
  return <Outlet />;
}
