import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Header.module.css";

// ── Mapa de rutas → breadcrumb ────────────────────────────────────────────────
const ROUTE_META = {
  "/dashboard": { label: "Panel de Control",        icon: "📊", parent: null },
  "/afiliados": { label: "Gestión de Afiliados",     icon: "👥", parent: null },
  "/pagos":     { label: "Gestión de Pagos",          icon: "💳", parent: "Administración" },
  "/rutinas":   { label: "Planes de Entrenamiento",   icon: "🏋️", parent: "Entrenamiento" },
  "/dietas":    { label: "Planes de Dieta",           icon: "🥗", parent: "Nutrición" },
  "/personal":  { label: "Gestión de Personal",       icon: "🛡️", parent: "Administración" },
};

const ROLE_COLOR = {
  Administrador: "#7c3aed",
  Recepcionista: "#2563eb",
  Entrenador:    "#059669",
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

  const meta  = ROUTE_META[pathname] || { label: "MetaFit", icon: "💪", parent: null };
  // color es dinámico (depende del rol) → permanece inline
  const color = ROLE_COLOR[user?.role] || "#6c757d";
  const fecha = fechaElegante();

  // Capitalizar la primera letra de la fecha
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <header className={styles.header}>

      {/* ── Izquierda: Breadcrumb ── */}
      <nav aria-label="breadcrumb" className={styles.breadcrumb}>
        <span className={styles.breadcrumbSystem}>MetaFit</span>

        {/* Separador › padre (si existe) */}
        {meta.parent && (
          <>
            <span className={styles.breadcrumbSeparator}>›</span>
            <span className={styles.breadcrumbParent}>{meta.parent}</span>
          </>
        )}

        {/* Separador › página actual */}
        <span className={styles.breadcrumbSeparator}>›</span>
        {/* background y border son dinámicos (color de rol) → inline */}
        <span
          className={styles.breadcrumbCurrent}
          style={{
            background: `${color}10`,
            border: `1px solid ${color}30`,
          }}
        >
          <span className={styles.breadcrumbIcon}>{meta.icon}</span>
          {meta.label}
        </span>
      </nav>

      {/* ── Derecha: fecha + notificaciones + avatar ── */}
      <div className={styles.rightSection}>

        {/* Fecha */}
        <div className={styles.dateBlock}>
          <div className={styles.dateDay}>{fechaCap.split(",")[0]}</div>
          <div className={styles.dateRest}>{fechaCap.split(",")[1]?.trim()}</div>
        </div>

        <div className={styles.divider} />

        {/* Campana de notificaciones */}
        <button
          id="btn-notificaciones"
          title="Notificaciones"
          className={styles.bellButton}
        >
          <BellIcon />
          <span className={styles.bellDot} />
        </button>

        <div className={styles.divider} />

        {/* ── AVATAR: inicial dinámica ── */}
        <div className={styles.avatarSection}>
          {/* background y boxShadow son dinámicos → inline */}
          <div
            className={styles.avatar}
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}aa)`,
              boxShadow: `0 0 0 2px ${color}30`,
            }}
          >
            {(user?.nombres?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
          </div>

          <div>
            <div className={styles.avatarName}>
              {user?.nombres
                ? `${user.nombres} ${user.apellidos || ""}`.trim()
                : user?.email?.split("@")[0] || "Usuario"}
            </div>
            {/* color es dinámico → inline */}
            <div className={styles.avatarRole} style={{ color }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
