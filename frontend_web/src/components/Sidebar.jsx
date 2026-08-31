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

// Link exclusivo del Administrador
const NAV_ADMIN_EXCLUSIVO = [
  { to: "/personal", icon: "🛡️", label: "Gestión de Personal" },
  { to: "/admin/restricciones", icon: "🚫", label: "Restricciones" },
];

/** Paleta de colores por rol — permanecen inline por ser dinámicos */
const ROLE_GRADIENT = {
  Administrador: "linear-gradient(135deg,#e31c25,#b71c1c)",
  Recepcionista: "linear-gradient(135deg,#2563eb,#0891b2)",
  Entrenador:    "linear-gradient(135deg,#059669,#0d9488)",
};

const ROLE_ICON = {
  Administrador: "👑",
  Recepcionista: "🗂️",
  Entrenador:    "🏆",
};

const ROLE_LABEL = {
  Administrador: "Administrador",
  Recepcionista: "Recepcionista",
  Entrenador:    "Entrenador",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const role     = user?.role || "Recepcionista";
  const links    = NAV_OPERATIVO[role] || [];
  const gradient = ROLE_GRADIENT[role] || "#e31c25";
  const isAdmin  = role === "Administrador";

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
