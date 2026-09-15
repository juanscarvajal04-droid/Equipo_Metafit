// frontend_web/src/components/Sidebar.jsx
// ─── Sidebar de navegación lateral (todos los roles autenticados) ──
// Layout fijo a la izquierda: logo, perfil del usuario (avatar + badge de rol),
// menú principal según el RBAC del rol (NAV_OPERATIVO), sección exclusiva de
// Administrador (Gestión de Personal + Restricciones) y botón de cerrar sesión.
//
// Qué rol lo usa: los tres (Administrador, Recepcionista, Entrenador); los
// enlaces visibles cambian según `user.role`.
// Sin API calls: solo consume el estado de autenticación (useAuth) y navega.
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

// ── Configuración de navegación por rol ───────────────────────────────────────
// Cada rol tiene exactamente los links que le corresponden según el RBAC.
// 'Administrador' es el único con acceso a /personal (Gestión de Personal).
const NAV_OPERATIVO = {
  // ADMINISTRADOR — módulos completos + personal exclusivo
  Administrador: [
    { to: "/dashboard", icon: "📊", label: "Dashboard" },
    { to: "/finanzas",  icon: "💰", label: "Finanzas"  },
    { to: "/afiliados", icon: "👥", label: "Afiliados" },
    { to: "/rutinas",   icon: "🏋️", label: "Rutinas"   },
    { to: "/dietas",    icon: "🥗", label: "Dietas"    },
  ],
  // RECEPCIONISTA — gestión de afiliados (CRUD) + pagos, sin acceso a personal
  Recepcionista: [
    { to: "/afiliados", icon: "👥", label: "Gestión de Afiliados" },
    { to: "/pagos",     icon: "💳", label: "Pagos"                },
  ],
  // ENTRENADOR — rutinas y dietas (CRUD), afiliados solo lectura
  // El orden refleja su home: /rutinas es la primera pantalla al hacer login
  Entrenador: [
    { to: "/rutinas",   icon: "🏋️", label: "Planes de Entreno"  },
    { to: "/dietas",    icon: "🥗", label: "Dietas"             },
    { to: "/afiliados", icon: "👁️", label: "Afiliados (Ver)"    },
  ],
};

/** Links exclusivos del Administrador (sección "Administración" de la barra). */
const NAV_ADMIN_EXCLUSIVO = [
  { to: "/personal", icon: "🛡️", label: "Gestión de Personal" },
  { to: "/admin/restricciones", icon: "🚫", label: "Restricciones" },
];

/** Paleta de colores por rol — permanecen inline por ser dinámicos
 *  (gradiente del avatar y de las badges). Equivale al ROLE_COLOR del Header
 *  y a los colores del theme web. */
const ROLE_GRADIENT = {
  Administrador: "linear-gradient(135deg,#e31c25,#b71c1c)",
  Recepcionista: "linear-gradient(135deg,#2563eb,#0891b2)",
  Entrenador:    "linear-gradient(135deg,#059669,#0d9488)",
};

/** Icono del badge del rol en el perfil de la sidebar. */
const ROLE_ICON = {
  Administrador: "👑",
  Recepcionista: "🗂️",
  Entrenador:    "🏆",
};

/** Etiqueta legible del rol para el badge. */
const ROLE_LABEL = {
  Administrador: "Administrador",
  Recepcionista: "Recepcionista",
  Entrenador:    "Entrenador",
};

/**
 * Sidebar — Barra lateral de navegación dentro de AppLayout.
 *
 * Renderiza el logo, el perfil del usuario (email + avatar con gradiente del
 * rol + badge con icono/label del rol), los enlaces de navegación según
 * `NAV_OPERATIVO[role]`, la subsección de administración solo para Admin y el
 * botón "Cerrar sesión".
 *
 * Estado que maneja: ninguno propio; deriva rol, links, gradiente e isAdmin
 * desde `user` del AuthContext en cada render.
 *
 * API calls: ninguna directa (logout() del contexto no toca la API; solo
 * limpia token/user en memoria + localStorage y regresa a "/").
 *
 * @param {Object} _props - Sin props externas (usa el contexto).
 * @returns {JSX.Element} <aside> con la navegación del rol.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  /** Rol del usuario logueado; fallback "Recepcionista" (mínimo privilegio). */
  const role     = user?.role || "Recepcionista";
  /** Enlaces del rol actual según la config RBAC. */
  const links    = NAV_OPERATIVO[role] || [];
  /** Gradiente del rol para el avatar (fallback color brand si no mapea). */
  const gradient = ROLE_GRADIENT[role] || "#e31c25";
  /** Solo el Administrador ve la sección de administración. */
  const isAdmin  = role === "Administrador";

  /**
   * Cierra la sesión y navega a la raíz. logout() limpia el estado del contexto
   * y localStorage (metafit_token/user/role); la navegación a "/" lleva al
   * Login (el registro de "/" → Login). No requiere llamada API.
   */
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <aside className={styles.sidebar}>

      {/* ── Logo ── */}
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>💪</div>
        <div className={styles.logoTitle}>MetaFit</div>
        <small className={styles.logoSubtitle}>Sistema de Gestión</small>
      </div>

      {/* ── Perfil del usuario ── */}
      <div className={styles.profileSection}>
        <div className={styles.profileRow}>
          {/* Avatar — background es dinámico (por rol) */}
          <div
            className={styles.avatar}
            style={{ background: gradient }}
          >
            {(user?.email || "?")[0].toUpperCase()}
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.profileEmail}>
              {user?.email || "—"}
            </div>
            {/* Badge — fondo/acento definidos por token CSS (-mf-accent) */}
            <span className={`badge mt-1 ${styles.profileBadge}`}>
              {ROLE_ICON[role]} {ROLE_LABEL[role]}
            </span>
          </div>
        </div>
      </div>

      {/* ── Sección: Navegación Principal ── */}
      <nav className={styles.nav}>
        <div className={styles.navSectionLabel}>Menú Principal</div>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
            }
          >
            <span className={styles.navIcon}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        {/* ── Sección exclusiva ADMINISTRADOR: Gestión de Personal ── */}
        {isAdmin && (
          <>
            <div className={styles.navSectionLabelAdmin}>
              🛡️ Administración
            </div>

            {NAV_ADMIN_EXCLUSIVO.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${styles.navLinkAdmin} ${isActive ? styles.navLinkAdminActive : ""}`
                }
              >
                <span className={styles.navIcon}>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* ── Cerrar sesión ── */}
      <div className={styles.logoutSection}>
        <button
          id="btn-sidebar-logout"
          onClick={handleLogout}
          className={styles.logoutButton}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
