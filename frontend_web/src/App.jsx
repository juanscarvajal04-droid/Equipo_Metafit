import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeRedirect from "./components/HomeRedirect";

// ── Vistas con carga bajo demanda (code-splitting) ──────────────────────────
// Cada vista se descarga solo cuando el usuario navega a su ruta.
const Login            = lazy(() => import("./views/Login"));
const LandingPage      = lazy(() => import("./views/LandingPage"));
const RecuperarPassword = lazy(() => import("./views/RecuperarPassword"));
const ResetPassword    = lazy(() => import("./views/ResetPassword"));
const AdminDashboard   = lazy(() => import("./views/AdminDashboard"));
const AfiliadosView    = lazy(() => import("./views/AfiliadosView"));
const GestionPersonal  = lazy(() => import("./views/GestionPersonal"));
const RutinasView      = lazy(() => import("./views/RutinasView"));
const DietasView       = lazy(() => import("./views/DietasView"));
const PagosView        = lazy(() => import("./views/PagosView"));
const FinanzasView     = lazy(() => import("./views/FinanzasView"));

/**
 * App.jsx — Raíz de la aplicación
 *
 * Árbol de rutas (RBAC — Super Usuario):
 *
 *  /              → HomeRedirect (redirige al home del rol activo)
 *  /login         → pública
 *
 *  Administrador  → /dashboard  /afiliados  /rutinas  /dietas  /personal (EXCLUSIVO)
 *  Recepcionista  → /afiliados (CRUD)  /pagos   |  lectura interna en afiliados
 *  Entrenador     → /rutinas (home)  /dietas  /afiliados (solo lectura)
 *
 *  Regla: intentar acceder a una ruta no permitida redirige al home del rol.
 *  *      → /login (ruta desconocida sin sesión)
 *
 *  NOTA: AdminDashboard reemplazó al Dashboard anterior. Incluye editor de precio de membresía.
 *
 *  ISO 25010 (eficiencia): code-splitting con React.lazy + Suspense —
 *  el bundle inicial solo carga Login/LandingPage y el chunk compartido.
 */

// Grupos de roles
const ADMIN = ["Administrador"];
const ADMIN_RECEP = ["Administrador", "Recepcionista"];
const ADMIN_TRAIN = ["Administrador", "Entrenador"];
const ALL_ROLES = ["Administrador", "Recepcionista", "Entrenador"];

// Fallback visual mientras se carga una vista diferida (tema oscuro de la app)
function RouteLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 40%, #1a1a2e 0%, #0a0a0f 70%)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid rgba(227,28,37,0.25)",
          borderTopColor: "#e31c25",
          animation: "mfSpin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes mfSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* ── Raíz pública: Landing Page ── */}
            <Route path="/" element={<LandingPage />} />

            {/* ── Ruta pública: Login ── */}
            <Route path="/login" element={<Login />} />

            {/* ── Rutas públicas: Recuperación de contraseña ── */}
            <Route path="/recuperar-password" element={<RecuperarPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ── Alias de HomeRedirect para usuarios autenticados que llegan a /home ── */}
            <Route path="/home" element={<HomeRedirect />} />

            {/* ══════════════════════════════════════════════════════════════
                ADMINISTRADOR — acceso total
            ══════════════════════════════════════════════════════════════ */}
            <Route element={<ProtectedRoute allowedRoles={ADMIN} />}>
              <Route path="/dashboard" element={<AdminDashboard />} />
              {/* 🛡️ RUTA EXCLUSIVA: Gestión de Personal — Solo Administrador */}
              <Route path="/personal" element={<GestionPersonal />} />
              {/* 💰 Panel de Finanzas — Solo Administrador */}
              <Route path="/finanzas" element={<FinanzasView />} />
            </Route>

            {/* ══════════════════════════════════════════════════════════════
                ADMIN + RECEPCIONISTA — Gestión de Pagos (vista REAL)
                ✅ PagosView: semáforo de vencimientos, registro efectivo, historial
                🚫 Entrenador EXCLUIDO (ADMIN_RECEP no lo incluye)
            ══════════════════════════════════════════════════════════════ */}
            <Route element={<ProtectedRoute allowedRoles={ADMIN_RECEP} />}>
              <Route path="/pagos" element={<PagosView />} />
            </Route>

            {/* ══════════════════════════════════════════════════════════════
                ADMIN + ENTRENADOR — rutinas y dietas (vistas REALES implementadas)
                ✅ RutinasView: tabla de afiliados + asignar rutina
                ✅ DietasView:  tabla nutricional + asignar plan + catálogo
                🚫 Recepcionista EXCLUIDA: ProtectedRoute → redirige a /afiliados
            ══════════════════════════════════════════════════════════════ */}
            <Route element={<ProtectedRoute allowedRoles={ADMIN_TRAIN} />}>
              <Route path="/rutinas" element={<RutinasView />} />
              <Route path="/dietas" element={<DietasView />} />
            </Route>

            {/* ══════════════════════════════════════════════════════════════
                TODOS LOS ROLES — afiliados
                (permisos de edición/borrado por rol gestionados en AfiliadosView)
            ══════════════════════════════════════════════════════════════ */}
            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
              <Route path="/afiliados" element={<AfiliadosView />} />
            </Route>

            {/* ── Cualquier ruta desconocida → login ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}