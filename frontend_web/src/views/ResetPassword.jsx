import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { resetPasswordRequest } from "../services/authService";
import AuthCard from "../components/common/AuthCard";
import AuthInput from "../components/common/AuthInput";
import AuthSubmitButton from "../components/common/AuthSubmitButton";
import styles from "./Login.module.css";

const RED = "#e31c25";
const GREEN = "#059669";

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
    <AuthCard
      icon="🔒"
      subtitle="Nueva Contraseña"
      formTitle="Restablecer Contraseña"
      footerLink={(
        <Link to="/login" className={styles.forgotLink} onClick={() => ok && navigate("/login")}>
          ← Volver a Iniciar Sesión
        </Link>
      )}
    >
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
          <AuthInput
            id="reset-nueva-password"
            label="Nueva Contraseña"
            type={showPass ? "text" : "password"}
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            placeholder="Nueva contraseña"
            required
            password
            showPass={showPass}
            onTogglePass={() => setShowPass((prev) => !prev)}
          />

          <AuthInput
            id="reset-confirmar-password"
            label="Confirmar Contraseña"
            type={showPass ? "text" : "password"}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            placeholder="Repetí la nueva contraseña"
            required
          />

          <AuthSubmitButton
            loading={loading}
            text="Guardar nueva contraseña"
            loadingText="Guardando..."
          />
        </form>
      )}
    </AuthCard>
  );
}