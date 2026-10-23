import { useState } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperacion } from "../services/authService";
import AuthCard from "../components/common/AuthCard";
import AuthInput from "../components/common/AuthInput";
import AuthSubmitButton from "../components/common/AuthSubmitButton";
import styles from "./Login.module.css";

const RED = "#e31c25";
const GREEN = "#059669";

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
    <AuthCard
      icon="🔑"
      subtitle="Recuperación de Contraseña"
      formTitle="Restablecer Contraseña"
      footerLink={(
        <Link to="/login" className={styles.forgotLink}>
          ← Volver a Iniciar Sesión
        </Link>
      )}
    >
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
              <span style={{ wordBreak: "break-all", color: "#c1121f" }}>{token}</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <AuthInput
            id="recuperar-email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="Ingresa tu correo electrónico"
            required
          />
          <AuthSubmitButton
            loading={loading}
            text="Enviar enlace de recuperación"
            loadingText="Enviando..."
          />
        </form>
      )}
    </AuthCard>
  );
}