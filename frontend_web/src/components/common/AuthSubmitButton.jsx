import React from "react";
import styles from "../../views/Login.module.css";

const RED = "#e31c25";
const RED_DARK = "#b71c1c";
const RED_GLOW = "rgba(227,28,37,0.30)";

// Botón principal de las pantallas de autenticación.
export default function AuthSubmitButton({ loading, text, loadingText }) {
  return (
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
      {loading ? loadingText : text}
    </button>
  );
}
