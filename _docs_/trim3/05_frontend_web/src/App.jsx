import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute  from "./components/ProtectedRoute";
import HomeRedirect    from "./components/HomeRedirect";

// ── Vistas ────────────────────────────────────────────────────────────────────
import Login            from "./views/Login";
import LandingPage      from "./views/LandingPage";
import Dashboard        from "./views/Dashboard";
import AfiliadosView    from "./views/AfiliadosView";
import GestionPersonal  from "./views/GestionPersonal";
import RutinasView      from "./views/RutinasView";
import DietasView       from "./views/DietasView";
import PagosView        from "./views/PagosView";

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
 *  NOTA: Dashboard (antiguo) no tiene AppLayout/Sidebar. Solo se usa en /dashboard.
 *        Las rutas placeholder usan PlaceholderView que sí incluye el Sidebar.
 */

// Grupos de roles
const ADMIN        = ["Administrador"];
const ADMIN_RECEP  = ["Administrador", "Recepcionista"];
const ADMIN_TRAIN  = ["Administrador", "Entrenador"];
const ALL_ROLES    = ["Administrador", "Recepcionista", "Entrenador"];


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Raíz pública: Landing Page ── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Ruta pública: Login ── */}
          <Route path="/login" element={<Login />} />

          {/* ── Alias de HomeRedirect para usuarios autenticados que llegan a /home ── */}
          <Route path="/home" element={<HomeRedirect />} />

          {/* ══════════════════════════════════════════════════════════════
              ADMINISTRADOR — acceso total
          ══════════════════════════════════════════════════════════════ */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* 🛡️ RUTA EXCLUSIVA: Gestión de Personal — Solo Administrador */}
            <Route path="/personal"  element={<GestionPersonal />} />
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
            <Route path="/dietas"  element={<DietasView />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
