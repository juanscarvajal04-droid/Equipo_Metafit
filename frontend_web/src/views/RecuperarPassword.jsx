import { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import { solicitarRecuperacion } from "../services/authService";
import styles from "./Login.module.css";

/* ── Paleta de marca (coincide con Login.jsx) ────────────────── */
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";
const GREEN    = "#059669";
const DARK2    = "#12121e";
const DARK3    = "#1a1a2e";

export default function RecuperarPassword() {
  const [email,      setEmail]     = useState("");
  const [sent,       setSent]      = useState(false);
  const [token,      setToken]     = useState(null);
  const [modoPrueba, setModoPrueba] = useState(false);
  const [error,      setError]     = useState("");
  const [loading,    setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await solicitarRecuperacion(email.trim());
      setSent(true);
      setToken(res?.token || null);
      setModoPrueba(Boolean(res?.modoPrueba));
    } catch (err) {
      setError(
        err?.response?.status === 429
          ? "Demasiadas solicitudes. Intentá de nuevo en 15 minutos."
          : "Error de conexión. Verificá que el servidor esté activo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className={styles.wrapper}>
        <div className={styles.glow} style={{
          background: `radial-gradient(circle, ${RED_GLOW} 0%, rgba(227,28,37,0.08) 55%, transparent 72%)`,
        }} />

        <div className={styles.card}
          style={{ background: `linear-gradient(160deg, ${DARK2} 0%, ${DARK3} 100%)` }}>

          <div className={styles.cardHeader}
            style={{ background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)` }}>
            <div className={styles.deco1} />
            <div className={styles.deco2} />
            <div className={styles.logoIcon}>🔑</div>
            <h1 className={styles.logoTitle}>MetaFit</h1>
            <p className={styles.logoSubtitle}>Recuperación de Contraseña</p>
          </div>

          <div className={styles.cardBody}>
            <h2 className={styles.formTitle}>Restablecer Contraseña</h2>

            {error && (
              <div className={styles.errorBox} style={{ border: `1px solid ${RED}50` }}>
                ⚠️ {error}
              </div>
            )}

            {sent ? (
              <div className={styles.successBox} style={{ border: `1px solid ${GREEN}50` }}>
                ✔️ Si el correo existe, recibirás un enlace para restablecer tu contraseña.
                {modoPrueba && (
                  <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                    <strong>Modo prueba (sin SMTP):</strong> token generado:{" "}
                    <span style={{ wordBreak: "break-all", color: "#8b5cf6" }}>{token}</span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate autoComplete="off">
                <div className={styles.fieldGroupLast}>
                  <label className={styles.label}>Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Ingresa tu correo electrónico"
                    required
                    className={styles.input}
                    onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`; }}
                    onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                  style={{
                    background: loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : `0 8px 28px ${RED_GLOW}`,
                  }}
                >
                  {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                </button>
              </form>
            )}

            <div className={styles.forgotRow}>
              <Link to="/login" className={styles.forgotLink}>
                ← Volver a Iniciar Sesión
              </Link>
            </div>
          </div>

          <div className={styles.cardFooter}>
            MetaFit v1.0 &nbsp;·&nbsp; {new Date().getFullYear()} &nbsp;·&nbsp; Sport Gym Sede 80
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}