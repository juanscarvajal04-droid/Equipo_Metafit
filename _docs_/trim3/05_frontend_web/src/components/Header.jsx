import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Mapa de rutas → breadcrumb ────────────────────────────────────────────────
const ROUTE_META = {
  "/dashboard": { label: "Panel de Control", icon: "📊", parent: null },
  "/afiliados": { label: "Gestión de Afiliados", icon: "👥", parent: null },
  "/pagos": { label: "Gestión de Pagos", icon: "💳", parent: "Administración" },
  "/rutinas": { label: "Planes de Entrenamiento", icon: "🏋️", parent: "Entrenamiento" },
  "/dietas": { label: "Planes de Dieta", icon: "🥗", parent: "Nutrición" },
  "/personal": { label: "Gestión de Personal", icon: "🛡️", parent: "Administración" },
};

const ROLE_COLOR = {
  Administrador: "#7c3aed",
  Recepcionista: "#2563eb",
  Entrenador: "#059669",
};

/**
 * Obtiene el nombre para mostrar del usuario.
 * Prioridad: nombres+apellidos > name > parte del correo antes del @
 */
const getUserDisplayName = (user) => {
  if (!user) return "Usuario";
  if (user.nombres) {
    const full = [user.nombres, user.apellidos].filter(Boolean).join(" ");
    return full || user.nombres;
  }
  if (user.name) return user.name;
  return user.email?.split("@")[0] || "Usuario";
};

/**
 * Obtiene la inicial del usuario para el avatar (primera letra del nombre).
 */
const getUserInitial = (user) => {
  if (!user) return "U";
  if (user.nombres) return user.nombres[0].toUpperCase();
  if (user.name) return user.name[0].toUpperCase();
  return (user.email || "U")[0].toUpperCase();
};

/** Formatea la fecha en español: "Miércoles, 8 de Abril de 2026" */
const fechaElegante = () =>
  new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ── Componente de campana ─────────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const meta = ROUTE_META[pathname] || { label: "MetaFit", icon: "💪", parent: null };
  const color = ROLE_COLOR[user?.role] || "#6c757d";
  const fecha = fechaElegante();

  // Capitalizar la primera letra de la fecha
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#ffffff",
        borderBottom: "1px solid #e9ecef",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 54,
        minHeight: 54,
        flexShrink: 0,
      }}
    >
      {/* ── Izquierda: Breadcrumb ── */}
      <nav aria-label="breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Sistema */}
        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          MetaFit
        </span>

        {/* Separador > padre (si existe) */}
        {meta.parent && (
          <>
            <span style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>›</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{meta.parent}</span>
          </>
        )}

        {/* Separador > página actual */}
        <span style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>›</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "#1e293b",
            background: `${color}10`,
            border: `1px solid ${color}30`,
            borderRadius: 20,
            padding: "2px 10px 2px 7px",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>{meta.icon}</span>
          {meta.label}
        </span>
      </nav>

      {/* ── Derecha: fecha + notificaciones ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Fecha */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
            {fechaCap.split(",")[0]}
          </div>
          <div style={{ fontSize: "0.68rem", color: "#94a3b8", lineHeight: 1.2 }}>
            {fechaCap.split(",")[1]?.trim()}
          </div>
        </div>

        {/* Divisor */}
        <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />

        {/* Campana de notificaciones */}
        <button
          id="btn-notificaciones"
          title="Notificaciones"
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: 8,
            color: "#64748b",
            display: "flex",
            alignItems: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        >
          <BellIcon />
          {/* Punto rojo de notificación */}
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#e94560",
              border: "2px solid #fff",
              animation: "mf-pulse 2s infinite",
            }}
          />
        </button>

        {/* Divisor */}
        <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />

        {/* ── AVATAR: inicial dinámica — sin imágenes ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Círculo con la primera letra del nombre real */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${color}, ${color}aa)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.9rem",
            flexShrink: 0,
            userSelect: "none",
            boxShadow: `0 0 0 2px ${color}30`,
          }}>
            {/* Prioridad: nombres → email. Nunca una imagen. */}
            {(user?.nombres?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
          </div>

          {/* Nombre y rol */}
          <div style={{ lineHeight: 1.3 }}>
            <div style={{
              fontSize: "0.73rem",
              fontWeight: 700,
              color: "#1e293b",
              maxWidth: 130,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {/* Nombre completo o email sin dominio */}
              {user?.nombres
                ? `${user.nombres} ${user.apellidos || ""}`.trim()
                : user?.email?.split("@")[0] || "Usuario"}
            </div>
            <div style={{ fontSize: "0.62rem", color, fontWeight: 600, textTransform: "capitalize" }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Animación del punto de notificación */}
      <style>{`
        @keyframes mf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </header>
  );
}
