import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "../components/PublicLayout";
import { resetPasswordRequest } from "../services/authService";
import styles from "./Login.module.css";

/* ── Paleta de marca (coincide con Login.jsx) ────────────────── */
const RED      = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";
const GREEN    = "#059669";
const DARK2    = "#12121e";
const DARK3    = "#1a1a2e";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [showPass,  setShowPass]  = useState(false);
  const [pass,      setPass]      = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");
  const [ok,        setOk]        = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pass.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pass !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPasswordRequest(token, pass);
      setOk(true);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Error de conexión. Intentá de nuevo."
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
            <div className={styles.logoIcon}>🔒</div>
            <h1 className={styles.logoTitle}>MetaFit</h1>
            <p className={styles.logoSubtitle}>Nueva Contraseña</p>
          </div>

          <div className={styles.cardBody}>
            <h2 className={styles.formTitle}>Restablecer Contraseña</h2>

            {error && (
              <div className={styles.errorBox} style={{ border: `1px solid ${RED}50` }}>
                ⚠️ {error}
              </div>
            )}

            {ok ? (
              <div className={styles.successBox} style={{ border: `1px solid ${GREEN}50` }}>
                ✔️ Tu contraseña fue actualizada correctamente.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate autoComplete="off">
                <div className={styles.fieldGroupLast}>
                  <label className={styles.label}>Nueva Contraseña</label>
                  <div className={styles.passWrap}>
                    <input
                      type={showPass ? "text" : "password"}
                      value={pass}
                      onChange={(e) => { setPass(e.target.value); setError(""); }}
                      placeholder="Nueva contraseña"
                      required
                      className={`${styles.input} ${styles.passInput}`}
                      onFocus={e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px ${RED_GLOW}`; }}
                      onBlur={e  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className={styles.eyeBtn}
                      onClick={() => setShowPass(prev => !prev)}
                    >
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroupLast}>
                  <label className={styles.label}>Confirmar Contraseña</label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    placeholder="Repetí la nueva contraseña"
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
                  {loading ? "Guardando..." : "Guardar nueva contraseña"}
                </button>
              </form>
            )}

            <div className={styles.forgotRow}>
              <Link to="/login" className={styles.forgotLink} onClick={() => ok && navigate("/login")}>
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