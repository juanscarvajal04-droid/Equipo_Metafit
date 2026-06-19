import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

// ── Configuración de navegación por rol ───────────────────────────────────────
// Cada rol tiene exactamente los links que le corresponden según el RBAC.
// 'Administrador' es el único con acceso a /personal (Gestión de Personal).
const NAV_OPERATIVO = {
  // ADMINISTRADOR — acceso total + módulo exclusivo de personal
  Administrador: [
    { to: "/dashboard", icon: "📊", label: "Dashboard" },
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

// Link exclusivo del Super Usuario
const NAV_ADMIN_EXCLUSIVO = [
  { to: "/personal", icon: "🛡️", label: "Gestión de Personal" },
];

/** Paleta de colores por rol — permanecen inline por ser dinámicos */
const ROLE_COLOR = {
  Administrador: "#7c3aed",
  Recepcionista: "#2563eb",
  Entrenador:    "#059669",
};

const ROLE_GRADIENT = {
  Administrador: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  Recepcionista: "linear-gradient(135deg,#2563eb,#0891b2)",
  Entrenador:    "linear-gradient(135deg,#059669,#0d9488)",
};

const ROLE_ICON = {
  Administrador: "👑",
  Recepcionista: "🗂️",
  Entrenador:    "🏆",
};

const ROLE_LABEL = {
  Administrador: "Super Usuario",
  Recepcionista: "Recepcionista",
  Entrenador:    "Entrenador",
};

/**
 * Estilos del NavLink: solo los valores DINÁMICOS (que dependen del rol)
 * permanecen inline. Los estáticos están en Sidebar.module.css.
 */
const linkStyle = (isActive, color) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "9px 20px",
  textDecoration: "none",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
  background: isActive ? `${color}28` : "transparent",
  borderLeft: isActive ? `3px solid ${color}` : "3px solid transparent",
  transition: "all 0.18s ease",
  borderRadius: "0 6px 6px 0",
  marginRight: "8px",
});

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const role     = user?.role || "Recepcionista";
  const links    = NAV_OPERATIVO[role] || [];
  const color    = ROLE_COLOR[role]    || "#6c757d";
  const gradient = ROLE_GRADIENT[role] || ROLE_COLOR[role];
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
            {/* Badge — background y boxShadow son dinámicos */}
            <span
              className={`badge mt-1 ${styles.profileBadge}`}
              style={{
                background: gradient,
                boxShadow: isAdmin ? `0 2px 8px ${color}55` : "none",
              }}
            >
              {ROLE_ICON[role]} {ROLE_LABEL[role]}
            </span>
          </div>
        </div>

        {/* Banner exclusivo Admin */}
        {isAdmin && (
          <div className={styles.adminBanner}>
            ✦ Acceso Total al Sistema ✦
          </div>
        )}
      </div>

      {/* ── Sección: Navegación Principal ── */}
      <nav className={styles.nav}>
        <div className={styles.navSectionLabel}>Menú Principal</div>

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => linkStyle(isActive, color)}
            onMouseEnter={(e) => {
              if (!e.currentTarget.style.borderLeft.includes(color.slice(1))) {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }
            }}
            onMouseLeave={() => {/* NavLink resetea el estilo al quitar hover */}}
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
                style={({ isActive }) => ({
                  ...linkStyle(isActive, "#7c3aed"),
                  background: isActive
                    ? "rgba(124,58,237,0.22)"
                    : "rgba(124,58,237,0.06)",
                  borderLeft: isActive
                    ? "3px solid #a78bfa"
                    : "3px solid rgba(124,58,237,0.3)",
                })}
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
