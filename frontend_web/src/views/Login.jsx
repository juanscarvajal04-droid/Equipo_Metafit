import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../components/PublicLayout";
import styles from "./Login.module.css";

/* ── Paleta de marca — constantes de color ───────────────────────────────── */
// Estos permanecen como JS porque son valores de color usados en estilos dinámicos
// (hover handlers, focus handlers, estado loading del botón).
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";
const DARK2    = "#12121e";
const DARK3    = "#1a1a2e";

const ROLES = [
  { value: "Administrador", label: "👑 Administrador" },
  { value: "Entrenador",    label: "🏆 Entrenador"    },
  { value: "Recepcionista", label: "🗂️ Recepcionista" },
];

const ROLE_COLOR = {
  Administrador: "#e31c25",
  Entrenador:    "#059669",
  Recepcionista: "#2563eb",
};

const ROLE_MAP = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",
};

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({ meta_user: "", meta_pass: "", rol: "Administrador" });
  const [showPass, setShowPass] = useState(false);
  const [isReady,  setIsReady]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  /* Táctica anti-autocompletado: delayed render del email/pass */
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userData = await login({ correo: form.meta_user, contrasena: form.meta_pass });
      const role = userData?.role;
      localStorage.setItem("metafit_role", role || "");
      navigate(ROLE_MAP[role] || "/afiliados", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 400 || status === 401
          ? "Correo o contraseña incorrectos."
          : "Error de conexión. Verifica que el servidor esté activo en el puerto 3001."
      );
      setLoading(false);
    }
  };

  // DINÁMICO: color varía según el rol seleccionado en el formulario
  const roleColor = ROLE_COLOR[form.rol] || RED;

  return (
    <PublicLayout>
      <div className={styles.wrapper}>

        {/* ── Glow decorativo — background es dinámico (usa RED_GLOW) ── */}
        <div className={styles.glow} style={{
          background: `radial-gradient(circle, ${RED_GLOW} 0%, rgba(227,28,37,0.08) 55%, transparent 72%)`,
        }} />

        {/* ── Card de Login ── */}
        <div className={styles.card}
          style={{ background: `linear-gradient(160deg, ${DARK2} 0%, ${DARK3} 100%)` }}>

          {/* ── Cabecera — gradient de marca ── */}
          <div className={styles.cardHeader}
            style={{ background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)` }}>
            <div className={styles.deco1} />
            <div className={styles.deco2} />
            <div className={styles.logoIcon}>💪</div>
            <h1 className={styles.logoTitle}>MetaFit</h1>
            <p className={styles.logoSubtitle}>Sistema de Gestión Deportiva</p>
          </div>

          {/* ── Cuerpo del formulario ── */}
          <div className={styles.cardBody}>
            <h2 className={styles.formTitle}>Iniciar Sesión</h2>

            {/* Error */}
            {error && (
              <div className={styles.errorBox}
                style={{ border: `1px solid ${RED}50` }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate autoComplete="off">
              {/* Honeypots anti-autocompletado */}
              <input type="text"     name="username_trap" tabIndex={-1} aria-hidden="true" className={styles.honeypot} autoComplete="username"         readOnly />
              <input type="password" name="password_trap" tabIndex={-1} aria-hidden="true" className={styles.honeypot} autoComplete="current-password" readOnly />

              {/* Selector de Rol — border DINÁMICO según rol */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tipo de usuario</label>
                <select
                  id="rol" name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  className={styles.input}
                  style={{ borderColor: `${roleColor}50`, color: "#fff" }}
                  onFocus={e => { e.target.style.borderColor = roleColor; e.target.style.boxShadow = `0 0 0 3px ${roleColor}22`; }}
                  onBlur={e  => { e.target.style.borderColor = `${roleColor}50`; e.target.style.boxShadow = "none"; }}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value} style={{ background: DARK2 }}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delayed render: Email + Password */}
              {!isReady ? (
                <div className={styles.loadingSlot}>
                  <div className={styles.spinner}
                    style={{ border: `2px solid ${RED}`, borderTopColor: "transparent" }} />
                </div>
              ) : (
                <>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Correo Electrónico</label>
                    <input
                      type="text" id="meta_user" name="meta_user"
                      value={form.meta_user} onChange={handleChange}
                      placeholder="Ingresa tu correo electrónico"
                      required autoComplete="new-password"
                      className={styles.input}
                      onFocus={e => { e.target.style.borderColor = RED;                      e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`; }}
                      onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div className={styles.fieldGroupLast}>
                    <label className={styles.label}>Contraseña</label>
                    <div className={styles.passWrap}>
                      <input
                        type={showPass ? "text" : "password"} id="meta_pass" name="meta_pass"
                        value={form.meta_pass} onChange={handleChange}
                        placeholder="Ingresa tu contraseña"
                        required autoComplete="new-password"
                        className={`${styles.input} ${styles.passInput}`}
                        onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`; }}
                        onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                      />
                      <button
                        type="button"
                        id="btn-toggle-pass"
                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className={styles.eyeBtn}
                        onClick={() => setShowPass(prev => !prev)}
                      >
                        {showPass ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Botón Submit — background/boxShadow/cursor son DINÁMICOS (dependen de `loading`) */}
              <button
                id="btn-login" type="submit"
                disabled={loading || !isReady}
                className={styles.submitBtn}
                style={{
                  background:  loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
                  cursor:      loading ? "not-allowed" : "pointer",
                  boxShadow:   loading ? "none" : `0 8px 28px ${RED_GLOW}`,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform  = "translateY(-1px)";
                    e.currentTarget.style.boxShadow  = `0 12px 36px ${RED_GLOW}`;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 8px 28px ${RED_GLOW}`;
                }}
              >
                {loading ? (
                  <><div className={styles.spinnerSm} /> Ingresando...</>
                ) : (
                  <>Ingresar al Sistema <span className={styles.arrowIcon}>→</span></>
                )}
              </button>

              <div className={styles.forgotRow}>
                <Link to="/recuperar-password" className={styles.forgotLink}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </div>

          {/* ── Footer del card ── */}
          <div className={styles.cardFooter}>
            MetaFit v1.0 &nbsp;·&nbsp; {new Date().getFullYear()} &nbsp;·&nbsp; Sport Gym Sede 80
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}