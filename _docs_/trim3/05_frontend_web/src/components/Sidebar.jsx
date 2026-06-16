import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

/** Paleta de colores por rol */
const ROLE_COLOR = {
  Administrador: "#7c3aed",  // violeta profundo
  Recepcionista: "#2563eb",  // azul
  Entrenador:    "#059669",  // verde esmeralda
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

/** Estilos de link activo/inactivo en la nav */
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

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside
      style={{
        width: 248,
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0f0f1a 0%,#14142b 55%,#0d1b3e 100%)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* ── Logo ── */}
      <div
        className="text-center py-4 px-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div style={{ fontSize: "2.1rem", filter: "drop-shadow(0 0 8px rgba(124,58,237,0.6))" }}>
          💪
        </div>
        <div className="text-white fw-bold mt-1" style={{ fontSize: "1.15rem", letterSpacing: "0.05em" }}>
          MetaFit
        </div>
        <small style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Sistema de Gestión
        </small>
      </div>

      {/* ── Perfil del usuario ── */}
      <div
        className="px-3 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="d-flex align-items-center gap-2">
          {/* Avatar dinámico */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
            style={{
              width: 42, height: 42,
              background: gradient,
              fontSize: "1rem",
              boxShadow: `0 0 0 2px rgba(255,255,255,0.12)`,
            }}
          >
            {(user?.email || "?")[0].toUpperCase()}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              className="text-white fw-semibold text-truncate"
              style={{ fontSize: "0.78rem" }}
            >
              {user?.email || "—"}
            </div>
            <span
              className="badge mt-1"
              style={{
                background: gradient,
                fontSize: "0.62rem",
                letterSpacing: "0.04em",
                boxShadow: isAdmin ? `0 2px 8px ${color}55` : "none",
              }}
            >
              {ROLE_ICON[role]} {ROLE_LABEL[role]}
            </span>
          </div>
        </div>

        {/* Banner exclusivo Admin */}
        {isAdmin && (
          <div
            className="mt-2 text-center rounded-2 py-1"
            style={{
              background: "linear-gradient(90deg,rgba(124,58,237,0.25),rgba(79,70,229,0.25))",
              border: "1px solid rgba(124,58,237,0.4)",
              fontSize: "0.63rem",
              color: "#a78bfa",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ✦ Acceso Total al Sistema ✦
          </div>
        )}
      </div>

      {/* ── Sección: Navegación Principal ── */}
      <nav className="py-2" style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "10px 20px 4px",
          }}
        >
          Menú Principal
        </div>

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
            onMouseLeave={(e) => {
              // NavLink resetea el estilo al quitar el hover vía la función style
            }}
          >
            <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}

        {/* ── Sección exclusiva ADMINISTRADOR: Gestión de Personal ── */}
        {isAdmin && (
          <>
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "rgba(167,139,250,0.5)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "14px 20px 4px",
              }}
            >
              🛡️ Administración
            </div>

            {NAV_ADMIN_EXCLUSIVO.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  ...linkStyle(isActive, "#7c3aed"),
                  // Fondo especial para el link de admin
                  background: isActive
                    ? "rgba(124,58,237,0.22)"
                    : "rgba(124,58,237,0.06)",
                  borderLeft: isActive
                    ? "3px solid #a78bfa"
                    : "3px solid rgba(124,58,237,0.3)",
                })}
              >
                <span style={{ fontSize: "1rem", width: 20, textAlign: "center" }}>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* ── Cerrar sesión ── */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          id="btn-sidebar-logout"
          onClick={handleLogout}
          className="btn btn-sm w-100 fw-semibold"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.2s",
            fontSize: "0.8rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(233,69,96,0.2)";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = "rgba(233,69,96,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
