import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotificaciones } from "../services/api";
import styles from "./Header.module.css";

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

const fechaElegante = () =>
  new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { user, authAxios } = useAuth();

  const meta  = ROUTE_META[pathname] || { label: "MetaFit", icon: "💪", parent: null };
  const color = ROLE_COLOR[user?.role] || "#6c757d";
  const fecha = fechaElegante();
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  const [notificaciones, setNotificaciones] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const totalNotificaciones = notificaciones.reduce((sum, n) => sum + n.cantidad, 0);
  const hayNotificaciones = totalNotificaciones > 0;

  const cargarNotificaciones = async () => {
    try {
      const { data } = await authAxios.get("/notificaciones");
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch {
      // Silencioso — no mostrar errores de notificaciones al usuario
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>

      <nav aria-label="breadcrumb" className={styles.breadcrumb}>
        <span className={styles.breadcrumbSystem}>MetaFit</span>

        {meta.parent && (
          <>
            <span className={styles.breadcrumbSeparator}>›</span>
            <span className={styles.breadcrumbParent}>{meta.parent}</span>
          </>
        )}

        <span className={styles.breadcrumbSeparator}>›</span>
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

      <div className={styles.rightSection}>

        <div className={styles.dateBlock}>
          <div className={styles.dateDay}>{fechaCap.split(",")[0]}</div>
          <div className={styles.dateRest}>{fechaCap.split(",")[1]?.trim()}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.bellWrapper} ref={dropdownRef}>
          <button
            id="btn-notificaciones"
            title="Notificaciones"
            className={styles.bellButton}
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <BellIcon />
            {hayNotificaciones && (
              <span className={styles.bellBadge}>{totalNotificaciones}</span>
            )}
            {!hayNotificaciones && <span className={styles.bellDot} />}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                Notificaciones
                {hayNotificaciones && (
                  <span className={styles.dropdownCount}>{totalNotificaciones}</span>
                )}
              </div>
              <div className={styles.dropdownList}>
                {notificaciones.length === 0 ? (
                  <div className={styles.dropdownEmpty}>Todo al día ✅</div>
                ) : (
                  notificaciones.map((n) => (
                    <div key={n.tipo} className={styles.dropdownItem}>
                      <span className={styles.dropdownIcon}>{n.icono}</span>
                      <div className={styles.dropdownContent}>
                        <div className={styles.dropdownMsg}>{n.mensaje}</div>
                        <div className={styles.dropdownMeta}>
                          {n.cantidad > 0 ? `${n.cantidad} pendiente(s)` : "Sin novedades"}
                        </div>
                      </div>
                      <span className={`${styles.dropdownCantidad} ${n.cantidad > 0 ? styles.dropdownCantidadActiva : ""}`}>
                        {n.cantidad}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <div className={styles.avatarSection}>
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
            <div className={styles.avatarRole} style={{ color }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
