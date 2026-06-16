import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicLayout from "../components/PublicLayout";

/* ── Paleta exacta de la LandingPage ─────────────────────────────────────── */
const RED = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";
const DARK2 = "#12121e";
const DARK3 = "#1a1a2e";

const ROLES = [
  { value: "Administrador", label: "👑 Administrador" },
  { value: "Entrenador", label: "🏆 Entrenador" },
  { value: "Recepcionista", label: "🗂️ Recepcionista" },
];

const ROLE_COLOR = {
  Administrador: "#7c3aed",
  Entrenador: "#059669",
  Recepcionista: "#2563eb",
};

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    meta_user: "",
    meta_pass: "",
    rol: "Administrador",
  });

  /* ── Táctica anti-autocompletado ── */
  const [passType, setPassType] = useState("text");
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  /* ── Mapa de roles ── */
  const ROLE_MAP = {
    Administrador: "/dashboard",
    Recepcionista: "/afiliados",
    Entrenador:    "/rutinas",
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = await login({
        correo:    form.meta_user,
        contrasena: form.meta_pass,
      });

      // Guardar explícitamente en localStorage
      const role = userData?.role;
      localStorage.setItem("metafit_role", role || "");

      // Redirección infalible: fuerza recarga completa y limpia el estado
      const destino = ROLE_MAP[role] || "/afiliados";
      window.location.href = destino;

    } catch (err) {
      const status = err?.response?.status;
      if (status === 400 || status === 401) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError("Error de conexión. Verifica que el servidor esté activo en el puerto 3001.");
      }
      setLoading(false); // solo reset si falla; en éxito ya navegó
    }
  };

  const roleColor = ROLE_COLOR[form.rol] || RED;

  return (
    <PublicLayout>
      <div style={{ position: "relative" }}>

        {/* ── Glow de fondo elegante ── */}
        <div style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "60%",
          background: `radial-gradient(circle, ${RED_GLOW} 0%, rgba(227,28,37,0.08) 55%, transparent 72%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-60%,-60%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* ── Card de Login ── */}
        <div style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 500,
          background: `linear-gradient(160deg, ${DARK2} 0%, ${DARK3} 100%)`,
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 16,
          boxShadow: `0 20px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px rgba(227,28,37,0.06)`,
          overflow: "hidden",
        }}>

          {/* ── Cabecera roja ── */}
          <div style={{
            background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
            padding: "30px 40px 26px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Círculos decorativos */}
            <div style={{
              position: "absolute", width: 200, height: 200, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", top: -70, right: -50, pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", width: 130, height: 130, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)", bottom: -55, left: -25, pointerEvents: "none",
            }} />

            <div style={{ fontSize: "2.6rem", marginBottom: 10, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.35))" }}>
              💪
            </div>
            <h1 style={{
              margin: "0 0 5px", fontSize: "1.75rem", fontWeight: 900,
              color: "#fff", letterSpacing: "0.05em", textShadow: "0 2px 10px rgba(0,0,0,0.25)",
            }}>
              MetaFit
            </h1>
            <p style={{
              margin: 0, color: "rgba(255,255,255,0.78)",
              fontSize: "0.82rem", letterSpacing: "0.03em", fontWeight: 500,
            }}>
              Sistema de Gestión Deportiva
            </p>
          </div>

          {/* ── Cuerpo del formulario ── */}
          <div style={{ padding: "32px 40px 28px" }}>
            <h2 style={{
              margin: "0 0 24px", fontSize: "1.05rem", fontWeight: 700,
              color: "#fff", textAlign: "center", letterSpacing: "0.02em",
            }}>
              Iniciar Sesión
            </h2>

            {/* Mensaje de error */}
            {error && (
              <div style={{
                background: "rgba(227,28,37,0.12)",
                border: `1px solid ${RED}50`,
                borderRadius: 8,
                padding: "6px 10px",
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.78rem",
                color: "#ff6b6b",
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate autoComplete="off">
              {/* Honeypots anti-autocompletado */}
              <input type="text" name="username_trap" tabIndex={-1} aria-hidden="true" style={{ display: "none" }} autoComplete="username" readOnly />
              <input type="password" name="password_trap" tabIndex={-1} aria-hidden="true" style={{ display: "none" }} autoComplete="current-password" readOnly />

              {/* Selector de Rol */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Tipo de usuario</label>
                <select
                  id="rol"
                  name="rol"
                  value={form.rol}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: `${roleColor}50`,
                    color: "#fff",
                  }}
                  onFocus={e => { e.target.style.borderColor = roleColor; e.target.style.boxShadow = `0 0 0 3px ${roleColor}22`; }}
                  onBlur={e => { e.target.style.borderColor = `${roleColor}50`; e.target.style.boxShadow = "none"; }}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value} style={{ background: DARK2 }}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delayed render: Email + Pass */}
              {!isReady ? (
                <div style={{ minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: `2px solid ${RED}`, borderTopColor: "transparent",
                    animation: "mf-spin 0.7s linear infinite",
                  }} />
                </div>
              ) : (
                <>
                  {/* Email */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Correo Electrónico</label>
                    <input
                      type="text"
                      id="meta_user"
                      name="meta_user"
                      value={form.meta_user}
                      onChange={handleChange}
                      placeholder="Ingresa tu correo electrónico"
                      required
                      autoComplete="new-password"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 26 }}>
                    <label style={labelStyle}>Contraseña</label>
                    <input
                      type={passType}
                      id="meta_pass"
                      name="meta_pass"
                      value={form.meta_pass}
                      onChange={handleChange}
                      placeholder="Ingresa tu contraseña"
                      required
                      autoComplete="new-password"
                      style={inputStyle}
                      onFocus={e => { setPassType("password"); e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </>
              )}

              {/* Botón Submit — sólido y profesional */}
              <button
                id="btn-login"
                type="submit"
                disabled={loading || !isReady}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: loading
                    ? "rgba(255,255,255,0.08)"
                    : `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: "0.97rem",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: loading ? "none" : `0 8px 28px ${RED_GLOW}`,
                  letterSpacing: "0.04em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 12px 36px ${RED_GLOW}`;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 8px 28px ${RED_GLOW}`;
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                      animation: "mf-spin 0.7s linear infinite",
                    }} />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar al Sistema
                    <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Footer del card ── */}
          <div style={{
            padding: "12px 40px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
            fontSize: "0.68rem",
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.03em",
          }}>
            MetaFit v1.0 &nbsp;·&nbsp; {new Date().getFullYear()} &nbsp;·&nbsp; Sport Gym Sede 80
          </div>
        </div>

        {/* Keyframe del spinner */}
        <style>{`@keyframes mf-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PublicLayout>
  );
}

/* ── Estilos compartidos del formulario ─────────────────────────────────────── */
const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.45)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const inputStyle = {
  width: "100%",
  padding: "12px 15px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 9,
  color: "#fff",
  fontSize: "0.93rem",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};