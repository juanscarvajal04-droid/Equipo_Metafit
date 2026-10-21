import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";
import { ROLE_REDIRECT_MAP } from "../services/authService";
import { getTheme, toggleTheme } from "../utils/theme.js";
import styles from "./Header.module.css";

const resolverFoto = (foto) => {
  if (!foto) return null;
  return /^https?:\/\//.test(foto) ? foto : `${API_BASE_URL}${foto}`;
};

const ROUTE_META = {
  "/dashboard": { label: "Panel de Control",        icon: "📊", parent: null },
  "/finanzas":  { label: "Panel de Finanzas",       icon: "💰", parent: "Administración" },
  "/afiliados": { label: "Gestión de Afiliados",     icon: "👥", parent: null },
  "/pagos":     { label: "Gestión de Pagos",          icon: "💳", parent: "Administración" },
  "/rutinas":   { label: "Planes de Entrenamiento",   icon: "🏋️", parent: "Entrenamiento" },
  "/dietas":    { label: "Planes de Dieta",           icon: "🥗", parent: "Nutrición" },
  "/personal":  { label: "Gestión de Personal",       icon: "🛡️", parent: "Administración" },
};

const ROLE_COLOR = {
  Administrador: "#e31c25",
  Recepcionista: "#2563eb",
  Entrenador:    "#059669",
};

const ROLE_OPTIONS = [
  { value: "Administrador", icon: "👑" },
  { value: "Recepcionista", icon: "🗂️" },
  { value: "Entrenador",    icon: "🏆" },
];

const STAFF_ROLES = new Set(ROLE_OPTIONS.map((rol) => rol.value));

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
  const navigate = useNavigate();
  const { user, authAxios, updateUser, switchRole } = useAuth();

  const meta  = ROUTE_META[pathname] || { label: "MetaFit", icon: "💪", parent: null };
  const color = ROLE_COLOR[user?.role] || "#6c757d";
  const fecha = fechaElegante();
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  const [notificaciones, setNotificaciones] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [estadoTema, setEstadoTema] = useState(getTheme());
  const [fotoModalOpen, setFotoModalOpen] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoSaving, setFotoSaving] = useState(false);
  const [fotoError, setFotoError] = useState("");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [rolDestino, setRolDestino] = useState("");
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [showSwitchPass, setShowSwitchPass] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);
  const roleMenuRef = useRef(null);
  const pollingRef = useRef(null);

  const esStaff = STAFF_ROLES.has(user?.role);

  const totalNotificaciones = notificaciones.reduce((sum, n) => sum + n.cantidad, 0);
  const hayNotificaciones = totalNotificaciones > 0;

  // ── Notificaciones leídas (localStorage por usuario) ─────────────────────
  // Guarda { ts, total } de la última vez que se abrió el dropdown. El badge
  // desaparece temporalmente y vuelve si pasó 1 hora o si el contador cambió.
  const vistasKey = `notif_vistas_${user?.id ?? user?.email ?? "anon"}`;
  const [vistoData, setVistoData] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(vistasKey);
      if (raw) setVistoData(JSON.parse(raw));
    } catch (_) { /* storage no disponible */ }
  }, [vistasKey]);

  const leidasRecientemente = vistoData != null && Date.now() - vistoData.ts < 3600000;
  const contadorCambio = vistoData != null && vistoData.total !== totalNotificaciones;
  const badgeVisible = hayNotificaciones && (vistoData == null || contadorCambio || Date.now() - vistoData.ts >= 3600000);

  const abrirDropdown = () => {
    if (!dropdownOpen) {
      const nuevo = { ts: Date.now(), total: totalNotificaciones };
      try { localStorage.setItem(vistasKey, JSON.stringify(nuevo)); } catch (_) {}
      setVistoData(nuevo);
    }
    setDropdownOpen((prev) => !prev);
  };

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

  useEffect(() => {
    void cargarNotificaciones();
    pollingRef.current = setInterval(cargarNotificaciones, 60000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [cargarNotificaciones]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificacionClick = (ruta) => {
    setDropdownOpen(false);
    if (ruta) {
      void navigate(ruta);
    }
  };

  useEffect(() => () => {
    if (fotoPreview?.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(fotoPreview);
    }
  }, [fotoPreview]);

  const abrirModalFoto = () => {
    setFotoError("");
    setFotoModalOpen(true);
  };

  const cerrarModalFoto = () => {
    setFotoModalOpen(false);
    setFotoFile(null);
    setFotoPreview(null);
    setFotoError("");
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFotoFile(file);
    setFotoError("");

    if (fotoPreview?.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(fotoPreview);
    }

    if (file && typeof URL.createObjectURL === "function") {
      setFotoPreview(URL.createObjectURL(file));
    } else {
      setFotoPreview(null);
    }
  };

  const handleFotoSubmit = async () => {
    if (!fotoFile || fotoSaving) return;
    setFotoSaving(true);
    setFotoError("");
    try {
      const fd = new FormData();
      fd.append("foto", fotoFile);
      const { data } = await authAxios.post("/usuarios/me/foto", fd);
      const foto = data?.foto || data?.url || null;
      if (foto && typeof updateUser === "function") {
        updateUser({ foto });
      }
      cerrarModalFoto();
    } catch (err) {
      setFotoError(err?.response?.data?.error || "No se pudo subir la foto. Intentá nuevamente.");
    } finally {
      setFotoSaving(false);
    }
  };

  const abrirCambioRol = (rol) => {
    setRolDestino(rol);
    setRoleMenuOpen(false);
    setSwitchEmail("");
    setSwitchPassword("");
    setShowSwitchPass(false);
    setSwitchError("");
    setSwitchModalOpen(true);
  };

  const cerrarCambioRol = () => {
    if (switching) return;
    setSwitchModalOpen(false);
    setSwitchEmail("");
    setSwitchPassword("");
    setShowSwitchPass(false);
    setSwitchError("");
    setRolDestino("");
  };

  const mensajeErrorCambioRol = (err) => {
    const status = err?.response?.status;
    if (status === 400 || status === 401) return "Correo o contraseña incorrectos.";
    if (status === 403) return "La cuenta no está activa. Contactá al administrador.";
    if (status >= 500) return "El servidor no está disponible. Intentá nuevamente.";
    if (err?.message) return err.message;
    return "No se pudo cambiar de rol. Intentá nuevamente.";
  };

  const handleSwitchRole = async (e) => {
    e.preventDefault();
    if (switching) return;

    const correo = switchEmail.trim();
    if (!correo || !switchPassword) {
      setSwitchError("Ingresá el correo y la contraseña del nuevo rol.");
      return;
    }

    setSwitching(true);
    setSwitchError("");
    try {
      const userData = await switchRole(correo, switchPassword, rolDestino);
      setSwitchModalOpen(false);
      setSwitchPassword("");
      setSwitchError("");
      navigate(ROLE_REDIRECT_MAP[userData.role] || "/afiliados", { replace: true });
    } catch (err) {
      setSwitchError(mensajeErrorCambioRol(err));
    } finally {
      setSwitching(false);
    }
  };

  const fotoUrl = resolverFoto(user?.foto);
  const nombreUsuario = user?.nombres
    ? `${user.nombres} ${user.apellidos || ""}`.trim()
    : user?.email?.split("@")[0] || "Usuario";
  const inicialUsuario = (user?.nombres?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  return (
    <>
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
            onClick={abrirDropdown}
          >
            <BellIcon />
            {badgeVisible && (
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
                        className={`${styles.dropdownItem} ${clickable ? styles.dropdownItemClickable : ""} ${leidasRecientemente ? styles.dropdownItemVisto : ""}`}
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
          <button
            type="button"
            className={styles.avatarButton}
            onClick={abrirModalFoto}
            aria-label="Cambiar foto de perfil"
            title="Cambiar foto de perfil"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt={`Foto de perfil de ${nombreUsuario}`} className={styles.avatarPhoto} />
            ) : (
              <span
                className={styles.avatar}
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                  boxShadow: `0 0 0 2px ${color}30`,
                }}
              >
                {inicialUsuario}
              </span>
            )}
            <span className={styles.avatarEditBadge} aria-hidden="true">📷</span>
          </button>

          {esStaff ? (
            <div className={styles.userMenuWrapper} ref={roleMenuRef}>
              <button
                type="button"
                className={styles.userMenuButton}
                onClick={() => setRoleMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={roleMenuOpen}
                aria-label={`Cambiar rol (actual: ${user?.role})`}
                title="Cambiar rol"
              >
                <span className={styles.userText}>
                  <span className={styles.avatarName}>{nombreUsuario}</span>
                  <span className={styles.avatarRole} style={{ color }}>
                    {user?.role}
                  </span>
                </span>
                <span className={styles.roleChevron} aria-hidden="true">▾</span>
              </button>

              {roleMenuOpen && (
                <div className={styles.roleMenu} role="menu" aria-label="Cambiar rol">
                  <div className={styles.roleMenuHeader}>Cambiar rol</div>
                  <div className={styles.roleMenuCurrent}>
                    Sesión actual: <strong>{user?.role}</strong>
                  </div>
                  {ROLE_OPTIONS.filter((rol) => rol.value !== user?.role).map((rol) => (
                    <button
                      key={rol.value}
                      type="button"
                      role="menuitem"
                      className={styles.roleMenuItem}
                      onClick={() => abrirCambioRol(rol.value)}
                    >
                      <span className={styles.roleMenuIcon}>{rol.icon}</span>
                      <span>Cambiar a {rol.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className={styles.avatarName}>{nombreUsuario}</div>
              <div className={styles.avatarRole} style={{ color }}>
                {user?.role}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

      {fotoModalOpen && (
        <div
          className={styles.modalOverlay}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de foto"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModalFoto(); }}
          onKeyDown={(e) => {
            if ((e.key === "Escape" || e.key === "Enter") && e.target === e.currentTarget) {
              cerrarModalFoto();
            }
          }}
        >
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="foto-perfil-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="foto-perfil-title" className={styles.modalTitle}>Cambiar foto de perfil</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={cerrarModalFoto}
                aria-label="Cerrar modal de foto"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.photoPreview}>
                {(fotoPreview || fotoUrl) ? (
                  <img
                    src={fotoPreview || fotoUrl}
                    alt="Vista previa de la foto de perfil"
                    className={styles.photoPreviewImg}
                  />
                ) : (
                  <span className={styles.photoPreviewInitials}>{inicialUsuario}</span>
                )}
              </div>

              <label htmlFor="foto-perfil-input" className={styles.btnSecondary}>
                Seleccionar imagen
              </label>
              <input
                id="foto-perfil-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={styles.fileInput}
                onChange={handleFotoChange}
                aria-describedby="foto-perfil-hint"
              />
              <p id="foto-perfil-hint" className={styles.photoHint}>
                PNG, JPG, WEBP o GIF. Tamaño máximo: 5 MB.
              </p>
              {fotoFile && <p className={styles.fileName}>{fotoFile.name}</p>}
              {fotoError && <p className={styles.errorText} role="alert">{fotoError}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={cerrarModalFoto}
                disabled={fotoSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleFotoSubmit}
                disabled={!fotoFile || fotoSaving}
              >
                {fotoSaving ? "Subiendo..." : "Guardar foto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {switchModalOpen && (
        <div
          className={styles.modalOverlay}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de cambio de rol"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarCambioRol(); }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && e.target === e.currentTarget) {
              cerrarCambioRol();
            }
          }}
        >
          <div
            className={`${styles.modalCard} ${styles.switchModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="switch-role-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="switch-role-title" className={styles.modalTitle}>
                Cambiar a {rolDestino}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={cerrarCambioRol}
                aria-label="Cerrar modal de cambio de rol"
                disabled={switching}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSwitchRole} noValidate>
              <div className={styles.modalBody}>
                <p className={styles.switchIntro}>
                  Ingresá las credenciales de una cuenta con rol{" "}
                  <strong style={{ color: ROLE_COLOR[rolDestino] || "var(--mf-text)" }}>
                    {rolDestino}
                  </strong>.
                  La sesión actual de <strong>{user?.role}</strong> se eliminará del navegador.
                </p>

                <div className={styles.switchField}>
                  <label htmlFor="switch-role-email" className={styles.switchLabel}>
                    Correo del nuevo rol
                  </label>
                  <input
                    id="switch-role-email"
                    type="email"
                    className={styles.switchInput}
                    value={switchEmail}
                    onChange={(e) => { setSwitchEmail(e.target.value); setSwitchError(""); }}
                    autoComplete="username"
                    placeholder="correo@metafit.com"
                    disabled={switching}
                    required
                  />
                </div>

                <div className={styles.switchField}>
                  <label htmlFor="switch-role-password" className={styles.switchLabel}>
                    Contraseña del nuevo rol
                  </label>
                  <div className={styles.switchPassWrap}>
                    <input
                      id="switch-role-password"
                      type={showSwitchPass ? "text" : "password"}
                      className={`${styles.switchInput} ${styles.switchPassInput}`}
                      value={switchPassword}
                      onChange={(e) => { setSwitchPassword(e.target.value); setSwitchError(""); }}
                      autoComplete="current-password"
                      placeholder="Contraseña"
                      disabled={switching}
                      required
                    />
                    <button
                      type="button"
                      className={styles.switchPassToggle}
                      onClick={() => setShowSwitchPass((prev) => !prev)}
                      aria-label={showSwitchPass ? "Ocultar contraseña del nuevo rol" : "Mostrar contraseña del nuevo rol"}
                      disabled={switching}
                    >
                      {showSwitchPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {switchError && (
                  <p className={styles.errorText} role="alert">{switchError}</p>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={cerrarCambioRol}
                  disabled={switching}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={switching}
                >
                  {switching ? "Cambiando..." : "Confirmar cambio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
