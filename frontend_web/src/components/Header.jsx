// frontend_web/src/components/Header.jsx
// ─── Header sticky (todos los roles autenticados) ────────────
// Barra superior dentro de la columna derecha del AppLayout: breadcrumb
// (sistema → sección → página actual), fecha en español, botón de tema
// (claro/oscuro), campana de notificaciones con popover (polling cada 60s) y
// perfil del usuario (avatar + nombre + rol).
//
// Qué rol lo usa: los tres roles; el breadcrumb se deriva de la ruta activa.
// API calls (vía authAxios): GET /notificaciones cada 60s (y al montar).
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTheme, toggleTheme } from "../utils/theme.js";
import styles from "./Header.module.css";

// Metadatos de cada ruta para el breadcrumb: label de la página actual,
// icono y "sección padre" (el backend consulta notificaciones con su ruta).
const ROUTE_META = {
  "/dashboard": { label: "Panel de Control",        icon: "📊", parent: null },
  "/finanzas":  { label: "Panel de Finanzas",       icon: "💰", parent: "Administración" },
  "/afiliados": { label: "Gestión de Afiliados",     icon: "👥", parent: null },
  "/pagos":     { label: "Gestión de Pagos",          icon: "💳", parent: "Administración" },
  "/rutinas":   { label: "Planes de Entrenamiento",   icon: "🏋️", parent: "Entrenamiento" },
  "/dietas":    { label: "Planes de Dieta",           icon: "🥗", parent: "Nutrición" },
  "/personal":  { label: "Gestión de Personal",       icon: "🛡️", parent: "Administración" },
};

// Color por rol: coincide con ROLE_GRADIENT de la sidebar y el theme web,
// para que avatar/breadcrumb léan el mismo código de color del RBAC.
const ROLE_COLOR = {
  Administrador: "#e31c25",
  Recepcionista: "#2563eb",
  Entrenador:    "#059669",
};

/** Fecha completa de hoy en formato largo español ("domingo, 13 de
 *  septiembre de 2026"); se usa en el bloque de fecha del header. */
const fechaElegante = () =>
  new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Icono de campana inline (SVG) — sin dependencia de librerías de iconos. */
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/**
 * Header — Barra superior del AppLayout con breadcrumb, fecha, tema,
 * notificaciones y perfil.
 *
 * Renderiza: breadcrumb derivado de la ruta activa (ROUTE_META), fecha
 * capitalizada, botón de tema (úsese getTheme/toggleTheme), campana con badge
 * de total y popover con las notificaciones (grupos pendientes + nav si tienen
 * ruta), y el bloque de avatar/nombre/rol del usuario.
 *
 * Estado que maneja: lista de grupos de notificaciones, apertura del popover,
 * tema actual y referencias (dropdownRef para click-outside, pollingRef para
 * limpiar el intervalo).
 *
 * API calls (vía authAxios): cargarNotificaciones → GET /notificaciones al
 * montar y luego cada 60 segundos (polling). Si llega un 401 por sesión
 * expirada, detiene el polling.
 *
 * @param {Object} _props - Sin props externas (usa contexto y router).
 * @returns {JSX.Element} <header> con la barra superior.
 */
export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, authAxios } = useAuth();

  /** Metadatos de la ruta actual (fallback genérico "MetaFit"). */
  const meta  = ROUTE_META[pathname] || { label: "MetaFit", icon: "💪", parent: null };
  /** Color del rol para avatar/breadcrumb (fallback gris neutro). */
  const color = ROLE_COLOR[user?.role] || "#6c757d";
  const fecha = fechaElegante();
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  const [notificaciones, setNotificaciones] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [estadoTema, setEstadoTema] = useState(getTheme());
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  /** Suma de pendientes de todos los grupos (para la badge de la campana). */
  const totalNotificaciones = notificaciones.reduce((sum, n) => sum + n.cantidad, 0);
  const hayNotificaciones = totalNotificaciones > 0;

  /**
   * useCallback: consulta los grupos de notificaciones (GET /notificaciones).
   * El endpoint agrupa por tipo (membresías por vencer/vencidas, metas) y
   * devuelve mensaje, icono, cantidad y una ruta opcional a la que navegar.
   * Si la sesión expiró (401) se cancela el polling para no repetir errores.
   */
  const cargarNotificaciones = useCallback(async () => {
    try {
      const { data } = await authAxios.get("/notificaciones");
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.response?.status === 401 && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [authAxios]);

  /**
   * Monta el polling de notificaciones: carga inmediata y luego cada 60 s.
   * El cleanup (al desmontar) limpia el intervalo para evitar fugas de timers.
   */
  useEffect(() => {
    cargarNotificaciones();
    pollingRef.current = setInterval(cargarNotificaciones, 60000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [cargarNotificaciones]);

  /**
   * Cierra el popover al hacer click fuera de la campana (dropdownRef).
   * Listener global mousedown con cleanup al desmontar.
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Maneja el click en un grupo de notificaciones: cierra el popover y, si la
   * notificación tiene `ruta`, navega a ella (p. ej. /pagos para membresías).
   * @param {string|undefined} ruta - Ruta destino de la notificación.
   */
  const handleNotificacionClick = (ruta) => {
    setDropdownOpen(false);
    if (ruta) navigate(ruta);
  };

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

        <button
          type="button"
          id="btn-tema"
          title="Cambiar tema (claro/oscuro)"
          className={styles.themeBtn}
          onClick={() => setEstadoTema(toggleTheme())}
        >
          {estadoTema === "light" ? "🌙" : "☀️"}
        </button>

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
                  notificaciones.map((n) => {
                    const clickable = !!n.ruta;
                    return (
                      <div
                        key={n.tipo}
                        className={`${styles.dropdownItem} ${clickable ? styles.dropdownItemClickable : ""}`}
                        onClick={() => handleNotificacionClick(n.ruta)}
                        role={clickable ? "button" : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={clickable ? (e) => { if (e.key === "Enter") handleNotificacionClick(n.ruta); } : undefined}
                      >
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
                    );
                  })
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
